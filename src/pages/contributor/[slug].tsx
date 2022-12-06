import { Prisma } from "@prisma/client";
import type { Section, Contributor, Media } from "@prisma/client";
import {
  type GetStaticProps,
  type GetStaticPaths,
  type NextPage,
  type InferGetStaticPropsType,
} from "next";
import { type ParsedUrlQuery } from "querystring";
import Image from "next/image";
import { prisma } from "../../server/db/client";

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

const contributorQuery = (slug: string) =>
  Prisma.validator<Prisma.ContributorFindUniqueArgs>()({
    where: {
      slug,
    },
    include: {
      articles: {
        include: {
          writers: true,
          media: {
            include: {
              contributor: true,
            },
          },
        },
        take: 50,
      },
    },
  });

type SerializableContributor = {
  contributor: Contributor & {
    articles: {
      id: string;
      slug: string;
      headline: string;
      focus: string;
      body: Prisma.JsonValue;
      published: boolean;
      publicationDate: string;
      featured: boolean;
      section: Section;
      writers: Contributor[];
      media: (Media & { contributor: Contributor | null })[];
    }[];
  };
};

export const getStaticProps: GetStaticProps<
  SerializableContributor,
  StaticParams
> = async (context) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { slug } = context.params!;

  const contributor = await prisma.contributor.findUnique(
    contributorQuery(slug)
  );

  if (contributor == null) {
    return {
      notFound: true,
    };
  }

  const serializedContributor = {
    ...contributor,
    articles: contributor.articles.map((article) => ({
      ...article,
      publicationDate: article.publicationDate.toString(),
    })),
  };

  return {
    props: {
      contributor: serializedContributor,
    },
  };
};

import { useMemo } from "react";
import NavigationBar from "../../components/navigationBar";
import ArticleBlock from "../../components/articleBlock";
import { articleRouter } from "../../server/trpc/router/article";

// const BioContainer = styled(Container)`
//   margin-top: 50px;
//   border-bottom: 1px solid
//     rgba(${({ theme }) => theme.lemanColorComponents}, 0.4);
// `;

// const BorderedDiv = styled.div`
//   border-right: 1px solid #dddddd;
//   padding-right: 50px;
// `;

const ContributorPage: NextPage<
  InferGetStaticPropsType<typeof getStaticProps>
> = ({ contributor }) => {
  const articles = useMemo(
    () =>
      contributor.articles.map((article) => ({
        ...article,
        publicationDate: new Date(article.publicationDate),
      })),
    [contributor]
  );

  return (
    <>
      <NavigationBar />
      <div className="container mx-auto mt-8">
        <div className="border-b border-leman-blue pb-4">
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

        <p className="-mb-1 ml-1 mt-2 font-medium">Recent Articles</p>
        <div className="border-r border-gray-300 pr-12 lg:w-3/5">
          {articles.map((article) => (
            <div className=" border-t border-gray-300 py-6" key={article.id}>
              <ArticleBlock key={article.id} article={article} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ContributorPage;
