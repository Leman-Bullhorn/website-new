import { Section } from "@prisma/client";

export const sections = [
  {
    id: "news",
    display: "News",
    dbSection: Section.News,
    href: "/section/news",
  },
  {
    id: "opinions",
    display: "Opinions",
    dbSection: Section.Opinions,
    href: "/section/opinions",
  },
  {
    id: "features",
    display: "Features",
    dbSection: Section.Features,
    href: "/section/features",
  },
  {
    id: "science",
    display: "Science",
    dbSection: Section.Science,
    href: "/section/science",
  },
  {
    id: "sports",
    display: "Sports",
    dbSection: Section.Sports,
    href: "/section/sports",
  },
  {
    id: "arts",
    display: "Arts & Entertainment",
    dbSection: Section.Arts,
    href: "/section/arts",
  },
  {
    id: "humor",
    display: "Humor",
    dbSection: Section.Humor,
    href: "/section/humor",
  },
];
