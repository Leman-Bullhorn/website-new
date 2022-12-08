import { Prisma } from "@prisma/client";
import Link from "next/link";
import ByLine from "./byLine";
import TimeStamp from "./timestamp";
import Image from "next/image";

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

const ArticleBlock: React.FC<{
  article: ArticleWithWritersAndMedia;
}> = ({ article }) => {
  const articleUrl = `/article/${article.section.toLowerCase()}/${
    article.slug
  }`;

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
        {article.media[0] && (
          <figure className="w-full">
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
                <Link
                  href={`/contributor/${article.media[0].contributor.slug}`}
                >
                  {article.media[0].contributor.firstName}{" "}
                  {article.media[0].contributor.lastName}
                </Link>
              ) : (
                <p>Public Domain</p>
              )}
            </figcaption>
          </figure>
        )}
      </div>
    </div>
  );
};

export default ArticleBlock;
