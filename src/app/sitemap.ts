import type { MetadataRoute } from "next";
import { prisma } from "../server/db/client";
import { sections } from "../utils/section";

const BASE_URL = "https://thebullhorn.net";

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

// import type { GetServerSidePropsContext } from "next";
// import { prisma } from "../server/db/client";
// import { sections } from "../utils/section";

// function generateSiteMap(
//   articleSlugs: { slug: string }[],
//   contributorSlugs: { slug: string }[]
// ) {
//   return `<?xml version="1.0" encoding="UTF-8"?>
//    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
//      <!--We manually set the two URLs we know already-->
//      <url>
//        <loc>${BASE_URL}/</loc>
//      </url>
//      <url>
//        <loc>${BASE_URL}/staff/</loc>
//      </url>
//      <url>
//        <loc>${BASE_URL}/privacy/</loc>
//      </url>
//      ${sections
//        .map(({ href }) => {
//          return `
//       <url>
//           <loc>${BASE_URL}${href}/</loc>
//       </url>`;
//        })
//        .join("")}
//      ${articleSlugs
//        .map(({ slug }) => {
//          return `
//        <url>
//            <loc>${BASE_URL}/articles/${slug}/</loc>
//        </url>
//      `;
//        })
//        .join("")}
//        ${contributorSlugs
//          .map(({ slug }) => {
//            return `
//         <url>
//             <loc>${BASE_URL}/contributor/${slug}/</loc>
//         </url>
//       `;
//          })
//          .join("")}
//    </urlset>
//  `;
// }

// function SiteMap() {
//   // getServerSideProps will do the heavy lifting
// }

// export async function getServerSideProps({ res }: GetServerSidePropsContext) {
//   // We make an API call to gather the URLs for our site
//   const [articlesSlugs, contributorSlugs] = await Promise.all([
//     prisma.article.findMany({
//       select: {
//         slug: true,
//       },
//     }),
//     prisma.contributor.findMany({
//       select: {
//         slug: true,
//       },
//     }),
//   ]);

//   const sitemap = generateSiteMap(articlesSlugs, contributorSlugs);

//   res.setHeader("Content-Type", "text/xml");
//   res.write(sitemap);
//   res.end();

//   return {
//     props: {},
//   };
// }

// export default SiteMap;
