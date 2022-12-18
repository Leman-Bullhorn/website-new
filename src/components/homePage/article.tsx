import { Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import ByLine from "../byLine";
import CaptionedImage from "../captionedImage";
import TimeStamp from "../timestamp";

const articleWithWritersAndMediaAndThumbnail =
  Prisma.validator<Prisma.ArticleArgs>()({
    include: {
      writers: true,
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
    },
  });

type ArticleWithWritersAndMedia = Prisma.ArticleGetPayload<
  typeof articleWithWritersAndMediaAndThumbnail
>;

const Article: React.FC<{
  article: ArticleWithWritersAndMedia;
}> = ({ article }) => {
  const articleUrl = `/article/${article.slug}`;

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

      {article.thumbnail && (
        <div className="col-span-8">
          <CaptionedImage contributor={article.thumbnail.contributor}>
            <Link href={articleUrl}>
              {/* Padding makes the element's height 2/3 the width, allowing for 3:2 AR */}
              <div className="relative pb-[66.6667%]">
                <Image
                  className="overflow-hidden object-cover"
                  src={article.thumbnail.contentUrl}
                  alt=""
                  fill
                  sizes="45vw"
                />
              </div>
            </Link>
          </CaptionedImage>
        </div>
      )}
    </div>
  );
};

export default Article;
