import { type Contributor, Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import ByLine from "../byLine";
import TimeStamp from "../timestamp";

const articleWithWritersAndMedia = Prisma.validator<Prisma.ArticleArgs>()({
  include: {
    writers: true,
    media: {
      include: {
        contributor: true,
      },
    },
  },
});

type ArticleWithWritersAndMedia = Prisma.ArticleGetPayload<
  typeof articleWithWritersAndMedia
>;

const Article: React.FC<{
  article: ArticleWithWritersAndMedia;
}> = ({ article }) => {
  const articleUrl = `/article/${article.section.toLowerCase()}/${
    article.slug
  }`;

  const contributorUrl = (contributor: Contributor) =>
    `/contributor/${contributor.slug}`;

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-4">
        <div>
          <h4 className="link-hover font-headline text-2xl font-medium hover:text-leman-blue">
            <Link href={articleUrl}>{article.headline}</Link>
          </h4>

          <p className="text-gray-500">{article.focus}</p>
        </div>

        <ByLine writers={article.writers} />

        <p className="text-sm text-gray-500">
          <TimeStamp timestamp={article.publicationDate} />
        </p>
      </div>

      {article.media[0] && (
        <div className="col-span-8">
          <figure>
            <Link href={articleUrl}>
              {/* Padding makes the element's height 2/3 the width, allowing for 3:2 AR */}
              <div className="relative pb-[66.6667%]">
                <Image
                  className="overflow-hidden object-cover"
                  src={article.media[0].contentUrl}
                  alt=""
                  fill
                  sizes="45vw"
                />
              </div>
            </Link>
            <figcaption className="text-right text-xs text-gray-500">
              {article.media[0].contributor ? (
                <Link href={contributorUrl(article.media[0].contributor)}>
                  {article.media[0].contributor.firstName}{" "}
                  {article.media[0].contributor.lastName}
                </Link>
              ) : (
                <p>Public Domain</p>
              )}
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
};

export default Article;
