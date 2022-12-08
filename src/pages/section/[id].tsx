import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import type { ParsedUrlQuery } from "querystring";
import NavigationBar from "../../components/navigationBar";
import { sections } from "../../utils/section";
import { prisma } from "../../server/db/client";
import {
  type SerializableArticle,
  deserializeArticle,
  serializeArticle,
} from "../../utils/article";
import { useMemo } from "react";
import ArticleBlock from "../../components/articleBlock";
import type { Contributor, Media } from "@prisma/client";

interface StaticParams extends ParsedUrlQuery {
  id: string;
}

export const getStaticPaths: GetStaticPaths<StaticParams> = async () => {
  const paths = sections.map((s) => ({ params: { id: s.id } }));

  return {
    fallback: false,
    paths,
  };
};

export const getStaticProps: GetStaticProps<
  {
    serializedArticles: (SerializableArticle & {
      media: (Media & {
        contributor: Contributor | null;
      })[];
      writers: Contributor[];
    })[];
    section: typeof sections[0];
  },
  StaticParams
> = async (context) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { id } = context.params!;

  const section = sections.find((s) => s.id === id);
  if (section == null)
    return {
      notFound: true,
    };

  const sectionArticles = await prisma.article.findMany({
    where: {
      section: section.dbSection,
    },
    include: {
      media: {
        include: {
          contributor: true,
        },
      },
      writers: true,
    },
  });

  const serializedArticles = sectionArticles.map(serializeArticle);

  return {
    props: {
      serializedArticles,
      section: section,
    },
  };
};

const SectionPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  serializedArticles,
  section,
}) => {
  const articles = useMemo(() => {
    return serializedArticles.map(deserializeArticle);
  }, [serializedArticles]);

  return (
    <>
      <NavigationBar />
      <div className="container mx-auto mt-4 px-2">
        <h1 className="border-b-4 border-leman-blue pb-2 text-center font-section text-5xl">
          {section.display}
        </h1>

        {articles.length === 0 && (
          <p className="text-center text-2xl">No articles here yet...</p>
        )}

        <div className="mx-auto mt-6 border-gray-300 lg:w-2/3 lg:border-x lg:px-6">
          {articles.map((article) => (
            <div
              className="border-b border-gray-300 py-4 first:pt-0"
              key={article.id}
            >
              <ArticleBlock article={article} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default SectionPage;
