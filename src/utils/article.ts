import type { Article } from "@prisma/client";

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
