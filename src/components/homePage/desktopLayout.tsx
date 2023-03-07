import type {
  Article as PrismaArticle,
  Contributor,
  Media,
} from "@prisma/client";
import { useState } from "react";
import NavigationBar from "../navigationBar";
import { SideImageArticle, TopImageArticle } from "./article";
import FeaturedArticle from "./featuredArticle";
import Masthead from "./masthead";

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

const DesktopLayout: React.FC<{
  featuredArticle: FullArticle;
  articles: FullArticle[];
}> = ({ featuredArticle, articles }) => {
  const [mastheadVisible, setMastheadVisible] = useState(true);

  return (
    <>
      <Masthead onChangeVisibility={setMastheadVisible} />
      <NavigationBar visible={!mastheadVisible} buffer={false} />

      <div className="container mx-auto mt-4">
        <div className="mt-2 grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="grid grid-cols-2 gap-4">
              <FeaturedArticle
                article={featuredArticle}
                className="col-span-2 border-b border-gray-300 pb-2"
              />
              <div className="col-span-1">
                {articles
                  .filter(
                    (article) =>
                      article.frontPageIndex != null &&
                      article.frontPageIndex % 3 === 2
                  )
                  .map((article, idx) => {
                    return idx === 0 ? (
                      <TopImageArticle
                        key={article.id}
                        article={article}
                        className="border-b border-gray-300 py-2 last:border-none"
                      />
                    ) : (
                      <SideImageArticle
                        key={article.id}
                        article={article}
                        className="border-b border-gray-300 py-2 last:border-none"
                      />
                    );
                  })}
              </div>
              <div className="relative col-span-1 before:absolute before:-left-2 before:h-full before:border-l before:border-gray-300">
                {articles
                  .filter(
                    (article) =>
                      article.frontPageIndex != null &&
                      article.frontPageIndex % 3 === 1
                  )
                  .map((article, idx) => {
                    return idx === 0 ? (
                      <TopImageArticle
                        key={article.id}
                        article={article}
                        className="border-b border-gray-300 py-2 last:border-none"
                      />
                    ) : (
                      <SideImageArticle
                        key={article.id}
                        article={article}
                        className="border-b border-gray-300 py-2 last:border-none"
                      />
                    );
                  })}
              </div>
            </div>
          </div>
          <div className="relative col-span-1 before:absolute before:-left-2 before:h-full before:border-l before:border-gray-300">
            {articles
              .filter(
                (article) =>
                  article.frontPageIndex != null &&
                  article.frontPageIndex % 3 == 0
              )
              .map((article) => (
                <SideImageArticle
                  key={article.id}
                  article={article}
                  className="border-b border-gray-300 py-2 last:border-none"
                />
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default DesktopLayout;
