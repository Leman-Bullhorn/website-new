import type { Article } from "@prisma/client";

export type SerializableArticle = Omit<Article, "publicationDate"> & {
  publicationDate: string;
};

export const serializeArticle = (article: Article): SerializableArticle => {
  return {
    ...article,
    publicationDate: article.publicationDate.toString(),
  };
};

export const deserializeArticle = (article: SerializableArticle): Article => {
  return {
    ...article,
    publicationDate: new Date(article.publicationDate),
  };
};
