import type {
  Article as PrismaArticle,
  Contributor,
  Media,
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import Balancer from "react-wrap-balancer";
import ByLine from "../byLine";
import CaptionedImage from "../captionedImage";
import TimeStamp from "../timestamp";
import { Builder } from "@builder.io/react";
import {
  deserializeArticle,
  useBuilderPreviewArticle,
  type SerializableArticle,
} from "../../utils/article";
import { cn } from "../../utils/tw";

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

export function FeaturedArticle(props: {
  article: SerializableArticle<InputArticle>;
  articleReference: { model: string; id: string };
  className?: string;
  attributes: React.HTMLAttributes<HTMLDivElement> & { key: string };
}) {
  const { key: _, ...attributes } = props.attributes;
  const previewArticle = useBuilderPreviewArticle(props.articleReference);
  if (
    (Builder.isPreviewing || Builder.isEditing) &&
    props.articleReference == null
  ) {
    return (
      <p
        {...attributes}
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
  if (article == null)
    return (
      <p
        {...attributes}
        className={cn(
          "border border-red-500 font-bold text-red-500",
          props.attributes.className
        )}
      >
        Loading...
      </p>
    );

  const articleUrl = `/article/${article.slug}`;

  return (
    <div
      aria-label="Card"
      {...attributes}
      className={cn("card rounded-none md:card-side", props.className)}
    >
      <div className="card-body grow-[2] basis-0 gap-1 p-0 [&>p]:grow-0">
        <h2 className="link-hover font-headline text-2xl font-medium hover:text-leman-blue">
          <Link href={articleUrl}>
            <Balancer>{article.headline}</Balancer>
          </Link>
        </h2>
        <p className="text-sm">{article.focus}</p>
        <p className="pb-2 text-xs text-gray-500">
          <ByLine writers={article.writers} /> &bull;{" "}
          <TimeStamp timestamp={article.publicationDate} />
        </p>
      </div>
      {article.thumbnail && (
        <CaptionedImage
          className="!block grow-[3] rounded-none md:basis-0"
          contributor={article.thumbnail.contributor}
          contributorText={article.thumbnail.contributorText}
        >
          <Link href={articleUrl}>
            <div className="relative h-0 pb-[66.6667%]">
              <Image
                priority
                className="object-cover"
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
    </div>
  );
}

export default FeaturedArticle;
