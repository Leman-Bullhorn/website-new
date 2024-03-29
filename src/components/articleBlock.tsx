import { Prisma } from "@prisma/client";
import Link from "next/link";
import ByLine from "./byLine";
import TimeStamp from "./timestamp";
import Image from "next/image";
import CaptionedImage from "./captionedImage";
import Balancer from "react-wrap-balancer";

const articleWithWritersAndMedia = Prisma.validator<Prisma.ArticleArgs>()({
  select: {
    id: true,
    headline: true,
    focus: true,
    slug: true,
    publicationDate: true,
    thumbnail: {
      include: {
        contributor: true,
      },
    },
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
  const articleUrl = `/article/${article.slug}`;

  return (
    <div className="flex">
      <p className="mt-1 hidden min-w-fit text-xs text-gray-500 lg:block">
        <TimeStamp timestamp={article.publicationDate} />
      </p>

      <div className="pl-8">
        <Link href={articleUrl}>
          <h4 className="link-hover font-headline text-2xl font-medium hover:text-leman-blue">
            <Balancer>{article.headline}</Balancer>
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
            contributorText={article.thumbnail.contributorText}
          >
            {/* Padding makes the element's height 2/3 the width, allowing for 3:2 AR */}
            <div className="relative pb-[66.6667%]">
              <Link href={articleUrl}>
                <Image
                  className="overflow-hidden object-cover"
                  src={article.thumbnail.contentUrl}
                  alt={article.thumbnail.alt}
                  fill
                  sizes="45vw"
                />
              </Link>
            </div>
          </CaptionedImage>
        )}
      </div>
    </div>
  );
};

export default ArticleBlock;
