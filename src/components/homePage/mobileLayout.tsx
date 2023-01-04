import type {
  Article as PrismaArticle,
  Contributor,
  Media,
} from "@prisma/client";
import NavigationBar from "../navigationBar";
import Article from "./article";
import FeaturedArticle from "./featuredArticle";

type FullArticle = PrismaArticle & {
  writers: Contributor[];
  thumbnail:
    | (Media & {
        contributor: Contributor | null;
      })
    | null;
  media: (Media & {
    contributor: Contributor | null;
  })[];
};

const MobileLayout: React.FC<{
  featuredArticle: FullArticle;
  articles: FullArticle[];
}> = ({ featuredArticle, articles }) => {
  return (
    <>
      <NavigationBar buffer />
      <FeaturedArticle
        article={featuredArticle}
        className="mx-5 mt-2 border-b-2 border-black pb-2"
      />
      {articles.map((article) => (
        <Article
          article={article}
          className="mx-5 border-b border-gray-300 py-2"
          key={article.id}
        />
      ))}
      {articles.map((article) => (
        <Article
          article={article}
          className="mx-5 border-b border-gray-300 py-2"
          key={article.id}
        />
      ))}
    </>
  );
};

export default MobileLayout;
