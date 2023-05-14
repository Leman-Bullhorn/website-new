import type { MetadataRoute } from "next";
import { prisma } from "../server/db/client";
import { sections } from "../utils/section";

const BASE_URL = "https://www.thebullhorn.net";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articlesSlugs, contributorSlugs] = await Promise.all([
    prisma.article.findMany({
      select: {
        slug: true,
        publicationDate: true,
      },
    }),
    prisma.contributor.findMany({
      select: {
        slug: true,
      },
    }),
  ]);

  const articles = articlesSlugs.map(({ slug, publicationDate }) => ({
    url: `${BASE_URL}/article/${slug}`,
    lastModified: publicationDate,
  }));

  const contributors = contributorSlugs.map(({ slug }) => ({
    url: `${BASE_URL}/contributor/${slug}`,
  }));

  const sectionsMap = sections.map(({ href }) => ({
    url: `${BASE_URL}${href}`,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/staff`,
    },
    {
      url: `${BASE_URL}/privacy`,
    },
    ...articles,
    ...contributors,
    ...sectionsMap,
  ];
}
