import type { InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";
import { prisma } from "../server/db/client";
import {
  serializeArticle,
  useDeserializeArticle,
  useDeserializeArticles,
} from "../utils/article";
import { Media } from "../utils/media";
import MobileLayout from "../components/homePage/mobileLayout";
import TabletLayout from "../components/homePage/tabletLayout";
import DesktopLayout from "../components/homePage/desktopLayout";

export const getStaticProps = async () => {
  const articlesPromise = prisma.article.findMany({
    where: {
      frontPageIndex: {
        not: null,
      },
      featured: false,
    },
    orderBy: {
      frontPageIndex: "asc",
    },
    select: {
      id: true,
      headline: true,
      focus: true,
      frontPageIndex: true,
      slug: true,
      section: true,
      publicationDate: true,
      thumbnail: {
        include: {
          contributor: true,
        },
      },
      writers: true,
      media: {
        include: {
          contributor: true,
        },
      },
    },
  });

  const featuredArticlePromise = prisma.article.findFirst({
    where: {
      featured: true,
    },
    select: {
      id: true,
      headline: true,
      focus: true,
      frontPageIndex: true,
      slug: true,
      publicationDate: true,
      thumbnail: {
        include: {
          contributor: true,
        },
      },
      writers: true,
      media: {
        include: {
          contributor: true,
        },
      },
    },
  });

  const [articles, featuredArticle] = await Promise.all([
    articlesPromise,
    featuredArticlePromise,
  ]);

  // This should never be the case
  if (featuredArticle == null) {
    return {
      notFound: true,
    };
  }

  // necessary until app directory is stable since `Date`
  // isn't serializable.
  const frontPageArticles = articles.map(serializeArticle);

  return {
    props: {
      featuredArticle: serializeArticle(featuredArticle),
      frontPageArticles: frontPageArticles,
    },
    revalidate: 10,
  };
};

const Home: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = (
  props
) => {
  const featuredArticle = useDeserializeArticle(props.featuredArticle);
  const frontPageArticles = useDeserializeArticles(props.frontPageArticles);

  return (
    <>
      <Head>
        <title>The Bullhorn</title>
      </Head>
      <Media lessThan="md">
        <MobileLayout
          featuredArticle={featuredArticle}
          articles={frontPageArticles}
        />
      </Media>
      <Media between={["md", "lg"]}>
        <TabletLayout
          featuredArticle={featuredArticle}
          articles={frontPageArticles}
        />
      </Media>
      <Media greaterThanOrEqual="lg">
        <DesktopLayout
          featuredArticle={featuredArticle}
          articles={frontPageArticles}
        />
      </Media>
    </>
  );
};

export default Home;
