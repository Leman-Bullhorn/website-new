import { type Article, Prisma } from "@prisma/client";
import type { Contributor } from "@prisma/client";
import {
  type GetStaticProps,
  type GetStaticPaths,
  type NextPage,
  type InferGetStaticPropsType,
} from "next";
import { type ParsedUrlQuery } from "querystring";
import Image from "next/image";
import { prisma } from "../../server/db/client";
import NavigationBar from "../../components/navigationBar";
import ArticleBlock from "../../components/articleBlock";
import {
  serializeArticle,
  useDeserializeArticles,
  type SerializableArticle,
} from "../../utils/article";
import Head from "next/head";

interface StaticParams extends ParsedUrlQuery {
  slug: string;
}

export const getStaticPaths: GetStaticPaths<StaticParams> = async () => {
  const contributors = await prisma.contributor.findMany({
    select: {
      slug: true,
    },
  });

  const paths = contributors.map((c) => ({ params: { slug: c.slug } }));

  return {
    fallback: "blocking",
    paths,
  };
};

const contributorArticles = Prisma.validator<Prisma.ContributorInclude>()({
  articles: {
    include: {
      thumbnail: {
        include: {
          contributor: true,
        },
      },
      writers: true,
      media: {
        include: {
          contributor: true,
        },
      },
    },
    take: 50,
  },
});

type FullContributor = Prisma.ContributorGetPayload<{
  include: typeof contributorArticles;
}>;

type SerializableContributor = {
  contributor: Contributor & {
    articles: (SerializableArticle &
      Omit<FullContributor["articles"][0], keyof Article>)[];
  };
};

export const getStaticProps: GetStaticProps<
  SerializableContributor,
  StaticParams
> = async (context) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { slug } = context.params!;

  const contributor = await prisma.contributor.findUnique({
    where: {
      slug,
    },
    include: contributorArticles,
  });

  if (contributor == null) {
    return {
      notFound: true,
    };
  }

  const serializedContributor = {
    ...contributor,
    articles: contributor.articles.map(serializeArticle),
  };

  return {
    props: {
      contributor: serializedContributor,
    },
  };
};

const ContributorPage: NextPage<
  InferGetStaticPropsType<typeof getStaticProps>
> = ({ contributor }) => {
  const articles = useDeserializeArticles(contributor.articles);

  return (
    <>
      <Head>
        <title>
          {contributor.firstName} {contributor.lastName} - The Bullhorn
        </title>
      </Head>
      <NavigationBar />
      <div className="container mx-auto mt-8 px-4">
        <div className="border-b-4 border-leman-blue pb-4">
          <p className="font-headline">{contributor.title}</p>
          <div className="flex">
            <h1 className="font-headline text-3xl font-bold">
              {contributor.firstName} {contributor.lastName}
            </h1>
            {contributor.headshotUrl && (
              <Image
                className="ml-3 rounded-full"
                src={contributor.headshotUrl}
                width={40}
                height={40}
                alt=""
              />
            )}
          </div>
          <p className="text-muted mt-2 max-w-prose text-sm tracking-wide text-gray-500">
            {contributor.bio}
          </p>
        </div>

        <p className="mt-6 font-medium">Recent Articles</p>
        <div className="border-gray-300 lg:w-4/5 lg:border-r lg:pr-12">
          {articles.map((article) => (
            <div
              className="border-t border-gray-300 py-6 first:border-t-2"
              key={article.id}
            >
              <ArticleBlock key={article.id} article={article} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ContributorPage;
