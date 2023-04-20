import type {
  Article as PrismaArticle,
  Contributor,
  Media,
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { Card } from "react-daisyui";
import Balancer from "react-wrap-balancer";
import { cn } from "../../utils/tw";
import ByLine from "../byLine";
import CaptionedImage from "../captionedImage";
import TimeStamp from "../timestamp";
import {
  deserializeArticle,
  useBuilderPreviewArticle,
  type SerializableArticle,
} from "../../utils/article";
import { Builder } from "@builder.io/react";

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
};

export function TopImageArticle(props: {
  article: SerializableArticle<InputArticle>;
  articleReference: { model: string; id: string };
  className?: string;
  attributes: React.HTMLAttributes<HTMLDivElement>;
}) {
  const previewArticle = useBuilderPreviewArticle(props.articleReference);
  if (
    (Builder.isPreviewing || Builder.isEditing) &&
    props.articleReference == null
  ) {
    return (
      <p
        {...props.attributes}
        className={cn(
          "border border-red-500 font-bold text-red-500",
          props.attributes.className
        )}
      >
        Click this text. Go to Options, and under Article Reference press choose
        entry to select what article goes here
      </p>
    );
  }
  const article =
    Builder.isPreviewing || Builder.isEditing
      ? previewArticle
      : deserializeArticle(props.article);
  if (article == null) return <p>Loading...</p>;

  const articleUrl = `/article/${article.slug}`;

  return (
    <Card
      {...props.attributes}
      bordered={false}
      side
      className={cn(
        "rounded-none border-b border-gray-300 py-2 last:border-none",
        props.attributes.className,
        props.className
      )}
    >
      <Card.Body className="gap-0 p-0 [&>p]:grow-0">
        <h2 className="link-hover font-headline text-lg font-medium leading-5 hover:text-leman-blue">
          <Link href={articleUrl}>
            <Balancer>{article.headline}</Balancer>
          </Link>
        </h2>

        {article.thumbnail && (
          <CaptionedImage
            className="flex-col rounded-none"
            contributor={article.thumbnail.contributor}
            contributorText={article.thumbnail.contributorText}
          >
            <Link href={articleUrl}>
              {/* Padding makes the element's height 2/3 the width, allowing for 3:2 AR */}
              <div className="relative h-0 pb-[66.6667%]">
                <Image
                  className=" object-cover"
                  src={article.thumbnail.contentUrl}
                  alt={article.thumbnail.alt}
                  fill
                  sizes="(max-width: 768px) 100vw,
                       50vw"
                />
              </div>
            </Link>
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

export function SideImageArticle(props: {
  article: SerializableArticle<InputArticle>;
  articleReference: { model: string; id: string };
  className?: string;
  attributes: React.HTMLAttributes<HTMLDivElement>;
}) {
  const previewArticle = useBuilderPreviewArticle(props.articleReference);
  if (
    (Builder.isPreviewing || Builder.isEditing) &&
    props.articleReference == null
  ) {
    return (
      <p
        {...props.attributes}
        className={cn(
          "border border-red-500 font-bold text-red-500",
          props.attributes.className
        )}
      >
        Click this text. Go to Options, and under Article Reference press choose
        entry to select what article goes here
      </p>
    );
  }
  const article =
    Builder.isPreviewing || Builder.isEditing
      ? previewArticle
      : deserializeArticle(props.article);
  if (article == null) return <p>Loading...</p>;

  const articleUrl = `/article/${article.slug}`;

  return (
    <Card
      {...props.attributes}
      bordered={false}
      side
      className={cn(
        "rounded-none border-b border-gray-300 py-2 last:border-none",
        props.attributes.className,
        props.className
      )}
    >
      <Card.Body className="gap-0 p-0">
        <div>
          {article.thumbnail && (
            <CaptionedImage
              className="float-right w-2/5 flex-col rounded-none"
              contributor={article.thumbnail.contributor}
              contributorText={article.thumbnail.contributorText}
            >
              <Link href={articleUrl}>
                <div className="relative h-0 pb-[66.6667%]">
                  <Image
                    className="object-cover"
                    src={article.thumbnail.contentUrl}
                    alt={article.thumbnail.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </Link>
            </CaptionedImage>
          )}

          <h2 className="link-hover font-headline text-lg font-medium leading-5 hover:text-leman-blue">
            <Link href={articleUrl}>{article.headline}</Link>
          </h2>
          <p className="mt-1 text-sm">{article.focus}</p>

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
