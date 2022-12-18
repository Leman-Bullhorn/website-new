import { Prisma } from "@prisma/client";
import Link from "next/link";
import ByLine from "./byLine";
import TimeStamp from "./timestamp";
import Image from "next/image";
import CaptionedImage from "./captionedImage";

const articleWithWritersAndMedia = Prisma.validator<Prisma.ArticleArgs>()({
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
  typeof articleWithWritersAndMedia
>;

const ArticleBlock: React.FC<{
  article: ArticleWithWritersAndMedia;
}> = ({ article }) => {
  const articleUrl = `/article/${article.slug}`;

  return (
    <div className="flex">
      <p className="mt-1 hidden min-w-fit text-xs text-gray-500 lg:block">
        <TimeStamp timestamp={article.publicationDate} />
      </p>

      <div className="pl-8">
        <Link href={articleUrl}>
          <h4 className="link-hover font-headline text-2xl font-medium hover:text-leman-blue">
            {article.headline}
          </h4>
        </Link>

        <p className="mr-6 pb-2 text-sm">{article.focus}</p>

        <p className="text-xs text-gray-500">
          <ByLine writers={article.writers} />
          <span className="lg:hidden">
            {" "}
            &bull; <TimeStamp timestamp={article.publicationDate} />
          </span>
        </p>
      </div>

      <div className="ml-auto min-w-[9rem] sm:min-w-[13rem]">
        {article.thumbnail && (
          <CaptionedImage
            className="w-full"
            contributor={article.thumbnail.contributor}
          >
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
        )}
      </div>
    </div>
  );
};

export default ArticleBlock;
