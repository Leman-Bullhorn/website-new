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

const Article: React.FC<{
  article: ArticleWithWritersAndMedia;
  className?: string;
}> = ({ article, className }) => {
  const articleUrl = `/article/${article.slug}`;

  return (
    <Card bordered={false} side className={`rounded-none ${className}`}>
      <Card.Body className="grow basis-0 gap-1 p-0 [&>p]:grow-0">
        <h2 className="link-hover font-headline text-xl font-medium hover:text-leman-blue">
          <Link href={articleUrl}>{article.headline}</Link>
        </h2>
        <p className="text-sm">{article.focus}</p>
        <p className="text-xs text-gray-500">
          <ByLine writers={article.writers} />
          <br />
          <TimeStamp timestamp={article.publicationDate} />
        </p>
      </Card.Body>
      {article.thumbnail && (
        <CaptionedImage
          className="grow basis-0 flex-col rounded-none"
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
    </Card>
  );
};

//<div>
//         <div>
//           <h4 className="link-hover font-headline text-2xl font-medium hover:text-leman-blue">
//             <Link href={articleUrl}>{article.headline}</Link>
//           </h4>

//           <p className="text-sm text-gray-500">{article.focus}</p>
//         </div>
//       </div>

//       <div>
//         {/* <span> */}
//         <div>
//           <ByLine writers={article.writers} />
//         </div>
//         {/* </span> */}

//         <div className="text-xs text-gray-500">
//           <TimeStamp timestamp={article.publicationDate} />
//         </div>
//       </div>

export default Article;
