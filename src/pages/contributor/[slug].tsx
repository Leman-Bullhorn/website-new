import type {
  GetStaticPaths,
  NextPage,
  InferGetStaticPropsType,
  GetStaticPropsContext,
} from "next";
import Image from "next/image";
import { prisma } from "../../server/db/client";
import NavigationBar from "../../components/navigationBar";
import ArticleBlock from "../../components/articleBlock";
import { serializeArticle, useDeserializeArticles } from "../../utils/article";
import Head from "next/head";

export const getStaticPaths: GetStaticPaths = async () => {
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

export const getStaticProps = async (context: GetStaticPropsContext) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { slug } = context.params!;
  if (typeof slug !== "string")
    return {
      notFound: true,
    };

  const contributor = await prisma.contributor.findUnique({
    where: {
      slug,
    },
    include: {
      articles: {
        select: {
          id: true,
          headline: true,
          publicationDate: true,
          slug: true,
          focus: true,
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
        orderBy: {
          publicationDate: "desc",
        },
        take: 50,
      },
    },
  });

  if (contributor == null)
    return {
      notFound: true,
    };

  const serializedContributor = {
    ...contributor,
    articles: contributor.articles.map(serializeArticle),
  };

  return {
    props: {
      contributor: serializedContributor,
    },
    revalidate: 10,
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
          {`${contributor.firstName} ${contributor.lastName} - The Bullhorn`}
        </title>
        <meta
          name="description"
          content={`Media and articles by ${contributor.firstName} ${contributor.lastName}.`}
        />
        <meta
          property="og:url"
          content={`https://thebullhorn.net/contributor/${contributor.slug}`}
        />
        <meta property="og:type" content="profile" />
        <meta
          property="og:title"
          content={`${contributor.firstName} ${contributor.lastName}`}
        />
        <meta
          property="og:description"
          content={`Media and articles by ${contributor.firstName} ${contributor.lastName}.`}
        />
        <meta
          name="twitter:url"
          content={`https://thebullhorn.net/contributor/${contributor.slug}`}
        />
        <meta
          name="twitter:title"
          content={`${contributor.firstName} ${contributor.lastName}`}
        />
        <meta
          name="twitter:description"
          content={`Media and articles by ${contributor.firstName} ${contributor.lastName}.`}
        />
        <link
          rel="canonical"
          href={`https://thebullhorn.net/contributor/${contributor.slug}`}
        />
        {contributor.headshotUrl ? (
          <>
            <meta property="og:image" content={contributor.headshotUrl} />
            <meta
              property="og:image:alt"
              content={`Portrait of ${contributor.firstName} ${contributor.lastName}`}
            />
            <meta property="twitter:image" content={contributor.headshotUrl} />
            <meta
              property="twitter:image:alt"
              content={`Portrait of ${contributor.firstName} ${contributor.lastName}`}
            />
            <meta property="twitter:card" content="summary_large_card" />
          </>
        ) : null}
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
