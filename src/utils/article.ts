import type { Article } from "@prisma/client";
import type { Prisma } from "@prisma/client";
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
    width: z.string(),
    height: z.string(),
  }),
});

const spanContent = z.union([spanText, spanAnchor, spanImage]);

const articleSpan = z.object({
  fontStyle: z.string(),
  textDecoration: z.string(),
  color: z.string(),
  fontWeight: z.string(),
  content: spanContent.array(),
});

const articleBodySchema = z.object({
  paragraphs: z.array(
    z.object({
      marginLeft: z.string(),
      marginRight: z.string(),
      textAlignment: z.string(),
      textIndent: z.string(),
      spans: articleSpan.array(),
    })
  ),
});

export type ArticleBody = z.infer<typeof articleBodySchema>;

export const validateArticleBody = (
  body: Prisma.JsonValue
): ArticleBody | null => {
  const result = articleBodySchema.safeParse(body);

  if (!result.success) return null;

  return result.data;
};
