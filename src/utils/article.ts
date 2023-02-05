import type { Prisma, Article } from "@prisma/client";
import { useMemo } from "react";
import { z } from "zod";

export type SerializableArticle = Omit<Article, "publicationDate"> & {
  publicationDate: string;
};

export const serializeArticle = <T>(
  article: Article & T
): SerializableArticle & T => {
  return {
    ...article,
    publicationDate: article.publicationDate.toString(),
  };
};

export const deserializeArticle = <T>(
  article: SerializableArticle & T
): Article & T => {
  return {
    ...article,
    publicationDate: new Date(article.publicationDate),
  };
};

export const useDeserializeArticle = <T>(
  article: SerializableArticle & T
): Article & T => {
  return useMemo(() => deserializeArticle(article), [article]);
};

export const useDeserializeArticles = <T>(
  articles: (SerializableArticle & T)[]
): (Article & T)[] => {
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
