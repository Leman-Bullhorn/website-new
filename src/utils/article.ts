import type { Prisma, Media } from "@prisma/client";
import { useMemo } from "react";
import { z } from "zod";
import { trpc } from "./trpc";
import { Builder } from "@builder.io/react";
import { useQuery } from "@tanstack/react-query";
import { env } from "../env/client.mjs";

export type SerializableArticle<T extends { publicationDate: Date }> = Omit<
  T,
  "publicationDate"
> & {
  publicationDate: string;
};

export const serializeArticle = <T>(
  article: { publicationDate: Date } & T
): { publicationDate: string } & T => {
  return {
    ...article,
    publicationDate: article.publicationDate.toString(),
  };
};

export const deserializeArticle = <T>(
  article: { publicationDate: string } & T
): { publicationDate: Date } & T => {
  return {
    ...article,
    publicationDate: new Date(article.publicationDate),
  };
};

export const useDeserializeArticle = <T>(
  article: { publicationDate: string } & T
): { publicationDate: Date } & T => {
  return useMemo(() => deserializeArticle(article), [article]);
};

export const useDeserializeArticles = <T>(
  articles: ({ publicationDate: string } & T)[]
): ({ publicationDate: Date } & T)[] => {
  return useMemo(() => articles.map(deserializeArticle), [articles]);
};

const spanText = z.object({
  text: z.object({
    content: z.string(),
  }),
});

const spanAnchor = z.object({
  anchor: z.object({
    href: z.string(),
    content: z.string(),
  }),
});

const spanImage = z.object({
  image: z.object({
    mediaId: z.string(),
    width: z.number(),
    height: z.number(),
  }),
});

const spanContent = z.union([spanText, spanAnchor, spanImage]);
export type SpanContent = z.infer<typeof spanContent>;

const articleSpan = z.object({
  fontStyle: z.string(),
  textDecoration: z.string(),
  color: z.string(),
  fontWeight: z.string(),
  content: spanContent.array(),
});
export type ArticleSpan = z.infer<typeof articleSpan>;

const articleParagraph = z.object({
  marginLeft: z.string(),
  marginRight: z.string(),
  textAlignment: z.string(),
  textIndent: z.string(),
  spans: articleSpan.array(),
});
export type ArticleParagraph = z.infer<typeof articleParagraph>;

export const articleBodySchema = z.object({
  paragraphs: articleParagraph.array(),
});
export type ArticleBody = z.infer<typeof articleBodySchema>;

export const validateArticleBody = (
  body: Prisma.JsonValue
): ArticleBody | null => {
  const result = articleBodySchema.safeParse(body);

  if (!result.success) return null;

  return result.data;
};

export const slugify = (headline: string) =>
  headline
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const parseHtml = (
  document: Document,
  fileNameToMediaMap: Map<string, Media>
) => {
  const paragraphs = document.getElementsByTagName("p");

  const articleParagraphs: ArticleParagraph[] = [];
  for (const paragraph of new Array(...paragraphs).slice(1)) {
    let { textAlign, textIndent, marginLeft, marginRight } = paragraph.style;
    if (textAlign.length === 0) textAlign = "left";
    if (textIndent.length === 0) textIndent = "0";
    if (marginLeft.length === 0) marginLeft = "0";
    if (marginRight.length === 0) marginRight = "0";
    const articleSpans: ArticleSpan[] = [];
    for (const span of paragraph.getElementsByTagName("span")) {
      let { fontStyle, textDecoration, color, fontWeight } = span.style;
      if (fontStyle.length === 0) fontStyle = "normal";
      if (textDecoration.length === 0) textDecoration = "none";
      if (color.length === 0) color = "#000000";
      if (fontWeight.length === 0) fontWeight = "400";
      const content: SpanContent[] = [];
      for (const child of span.childNodes) {
        if (child.nodeName === "A") {
          content.push({
            anchor: {
              content: child.textContent ?? "",
              href: (child as HTMLAnchorElement).href,
            },
          });
        } else if (child.nodeName === "IMG") {
          const { width, height } = (child as HTMLImageElement).style;
          let imageWidth = parseFloat(width.split("px")[0] ?? "");
          let imageHeight = parseFloat(height.split("px")[0] ?? "");
          if (isNaN(imageWidth) || isNaN(imageHeight)) {
            // Random defaults — this case should never happen
            imageWidth = 300;
            imageHeight = 200;
          }
          const { src } = child as HTMLImageElement;
          // can't just do a lookup of the map because
          // `src` gets the absolute path prepended by the DOMParser
          for (const [name, media] of fileNameToMediaMap) {
            if (src.includes(name)) {
              content.push({
                image: {
                  mediaId: media.id,
                  width: imageWidth,
                  height: imageHeight,
                },
              });
              break;
            }
          }
        } else {
          content.push({
            text: { content: child.textContent ?? "" },
          });
        }
      }
      articleSpans.push({
        fontStyle,
        textDecoration,
        color,
        fontWeight,
        content,
      });
    }
    articleParagraphs.push({
      marginLeft,
      marginRight,
      textAlignment: textAlign,
      textIndent,
      spans: articleSpans,
    });
  }
  return { paragraphs: articleParagraphs };
};

export function useBuilderPreviewArticle(articleReference: {
  model: string;
  id: string;
}) {
  const { data } = useQuery({
    queryFn: async () => {
      const data = await fetch(
        `https://cdn.builder.io/api/v2/content/articles?apiKey=${env.NEXT_PUBLIC_BUILDER_KEY}&query.id=${articleReference.id}`
      );

      return await data.json();
    },
    queryKey: ["builderArticle", articleReference],
    enabled:
      articleReference != null && (Builder.isPreviewing || Builder.isEditing),
  });

  const { data: article } = trpc.article.getById.useQuery(
    { id: data?.results?.[0]?.data?.id },
    { enabled: data != null }
  );

  return article;
}
