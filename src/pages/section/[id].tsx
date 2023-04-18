import type {
  GetStaticPaths,
  GetStaticPropsContext,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import NavigationBar from "../../components/navigationBar";
import { sections } from "../../utils/section";
import { prisma } from "../../server/db/client";
import { serializeArticle, useDeserializeArticles } from "../../utils/article";
import ArticleBlock from "../../components/articleBlock";
import { Prisma } from "@prisma/client";
import Head from "next/head";

const articlesSelect = Prisma.validator<Prisma.ArticleSelect>()({
  id: true,
  headline: true,
  focus: true,
  slug: true,
  publicationDate: true,
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
});

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = sections
    .filter((e) => e.dbSection != "Podcasts")
    .map((s) => ({ params: { id: s.id } }));

  return {
    fallback: false,
    paths,
  };
};

export const getStaticProps = async (context: GetStaticPropsContext) => {
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
    select: articlesSelect,
  });

  const serializedArticles = sectionArticles.map(serializeArticle);

  return {
    props: {
      serializedArticles,
      section: section,
    },
    revalidate: 10,
  };
};

const SectionPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  serializedArticles,
  section,
}) => {
  const articles = useDeserializeArticles(serializedArticles);

  return (
    <>
      <Head>
        <title>{`${section.display} - The Bullhorn`}</title>
      </Head>
      <NavigationBar />
      <div className="container mx-auto mt-4 px-2">
        <h1 className="border-b-4 border-leman-blue pb-2 text-center font-section text-5xl">
          {section.display}
        </h1>

        {articles.length === 0 && (
          <p className="text-center text-2xl">No articles here yet...</p>
        )}

        <div className="mx-auto mt-6 border-gray-300 lg:w-5/6 lg:border-x lg:px-6">
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
