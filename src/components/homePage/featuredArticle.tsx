import { Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Card } from "react-daisyui";
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

const FeaturedArticle: React.FC<{
  article: ArticleWithWritersAndMedia;
  className?: string;
}> = ({ article, className }) => {
  const articleUrl = `/article/${article.slug}`;

  return (
    <Card bordered={false} side="md" className={`rounded-none ${className}`}>
      <Card.Body className="grow-[2] basis-0 gap-1 p-0 [&>p]:grow-0">
        <h2 className="link-hover font-headline text-2xl font-semibold hover:text-leman-blue">
          <Link href={articleUrl}>{article.headline}</Link>
        </h2>
        <p className="text-sm">{article.focus}</p>
        <p className="pb-2 text-xs text-gray-500">
          <ByLine writers={article.writers} /> &bull;{" "}
          <TimeStamp timestamp={article.publicationDate} />
        </p>
      </Card.Body>
      {article.thumbnail && (
        <CaptionedImage
          contributor={article.thumbnail.contributor}
          className="!block grow-[3] flex-col rounded-none md:basis-0"
        >
          <div className="relative h-0 pb-[66.6667%]">
            <Link href={articleUrl}>
              <Image
                priority
                className="object-cover"
                src={article.thumbnail.contentUrl}
                alt={article.thumbnail.alt}
                fill
                sizes="(max-width: 768px) 100vw,
                       50vw"
              />
            </Link>
          </div>
        </CaptionedImage>
      )}
    </Card>
  );
};

export default FeaturedArticle;
