import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { prisma } from "../server/db/client";
import ArticleBlock from "../components/articleBlock";
import { serializeArticle, useDeserializeArticles } from "../utils/article";
import NavigationBar from "../components/navigationBar";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const searchQuery = String(context.query.query);

  const matchedArticles = await prisma.article.findMany({
    where: {
      headline: {
        search: searchQuery,
      },
    },
    take: 20,
    select: {
      id: true,
      focus: true,
      headline: true,
      slug: true,
      publicationDate: true,
      thumbnail: {
        include: {
          contributor: true,
        },
      },
      media: {
        include: {
          contributor: true,
        },
      },
      writers: true,
    },
  });

  return {
    props: {
      articles: matchedArticles.map(serializeArticle),
      query: searchQuery,
    },
  };
}

export default function SearchPage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  const articles = useDeserializeArticles(props.articles);
  return (
    <>
      <NavigationBar />
      <div className="container mx-auto mt-4">
        <h1 className="text-xl font-semibold">{`Found ${
          articles.length
        } search result${articles.length === 1 ? "" : "s"} for "${
          props.query
        }"`}</h1>
        {articles.length === 0 ? (
          <p>Ensure your spelling was correct or try a different query.</p>
        ) : null}
        <div className="mx-auto mt-6 border-gray-300  lg:border-x lg:px-6">
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
}
