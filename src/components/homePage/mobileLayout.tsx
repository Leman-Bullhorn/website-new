import type {
  Article as PrismaArticle,
  Contributor,
  Media,
} from "@prisma/client";
import NavigationBar from "../navigationBar";
import { SideImageArticle } from "./article";
import FeaturedArticle from "./featuredArticle";

type InputArticle = Omit<
  PrismaArticle,
  "body" | "featured" | "thumbnailId" | "section"
> & {
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
  featuredArticle: InputArticle;
  articles: InputArticle[];
}> = ({ featuredArticle, articles }) => {
  return (
    <>
      <NavigationBar buffer />
      <FeaturedArticle
        article={featuredArticle}
        className="mx-5 mt-2 border-b-2 border-gray-300 pb-2"
      />

      {articles.map((article) => (
        <SideImageArticle
          article={article}
          className="mx-5 border-b border-gray-300 py-2"
          key={article.id}
        />
      ))}
    </>
  );
};

export default MobileLayout;
