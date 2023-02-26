import { Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
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

export function TopImageArticle({
  article,
  className,
}: {
  article: ArticleWithWritersAndMedia;
  className?: string;
}) {
  const articleUrl = `/article/${article.slug}`;

  return (
    <Card bordered={false} side className={`rounded-none ${className}`}>
      <Card.Body className="gap-0 p-0 [&>p]:grow-0">
        <h2 className="link-hover font-headline text-lg font-medium leading-5 hover:text-leman-blue">
          <Link href={articleUrl}>{article.headline}</Link>
        </h2>

        {article.thumbnail && (
          <CaptionedImage
            className="flex-col rounded-none"
            contributor={article.thumbnail.contributor}
          >
            {/* Padding makes the element's height 2/3 the width, allowing for 3:2 AR */}
            <div className="relative h-0 pb-[66.6667%]">
              <Link href={articleUrl}>
                <Image
                  className=" object-cover"
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
        <p className="text-sm">{article.focus}</p>
        <p className="text-xs text-gray-500">
          <ByLine writers={article.writers} />
          <br />
          <TimeStamp timestamp={article.publicationDate} />
        </p>
      </Card.Body>
    </Card>
  );
}

export function SideImageArticle({
  article,
  className,
}: {
  article: ArticleWithWritersAndMedia;
  className?: string;
}) {
  const articleUrl = `/article/${article.slug}`;

  return (
    <Card bordered={false} side className={`rounded-none ${className}`}>
      <Card.Body className="gap-0 p-0 [&>p]:grow-0">
        <div>
          {article.thumbnail && (
            <CaptionedImage
              className="float-right w-2/5 flex-col rounded-none"
              contributor={article.thumbnail.contributor}
            >
              {/* Padding makes the element's height 2/3 the width, allowing for 3:2 AR */}
              <div className="relative h-0 pb-[66.6667%]">
                <Link href={articleUrl}>
                  <Image
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

          <div className="grow-[3] basis-0">
            <h2 className="link-hover font-headline text-lg font-medium leading-5 hover:text-leman-blue">
              <Link href={articleUrl}>{article.headline}</Link>
            </h2>
            <p className="mt-1 text-sm">{article.focus}</p>
          </div>

          <p className="text-xs text-gray-500">
            <ByLine writers={article.writers} />
            <br />
            <TimeStamp timestamp={article.publicationDate} />
          </p>
        </div>
      </Card.Body>
    </Card>
  );
}
