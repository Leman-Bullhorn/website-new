import type { InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";
import builder, { Builder, BuilderComponent } from "@builder.io/react";
import { prisma } from "../server/db/client";
import { serializeArticle } from "../utils/article";
import { Media } from "../utils/media";
import { env } from "../env/client.mjs";
import Masthead from "../components/homePage/masthead";
import NavigationBar from "../components/navigationBar";
import { useState } from "react";
import {
  SideImageArticle,
  TopImageArticle,
} from "../components/homePage/article";

import { getAsyncProps } from "@builder.io/utils";
import FeaturedArticle from "../components/homePage/featuredArticle";
import dynamic from "next/dynamic";

builder.init(env.NEXT_PUBLIC_BUILDER_KEY);

const articleSelect = {
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
};

export const getStaticProps = async () => {
  const page = await builder
    .get("page", {
      userAttributes: {
        urlPath: "/",
      },
    })
    .toPromise();

  const fetchBuilderArticle = async (props: any) => {
    const article = await prisma.article.findUnique({
      where: {
        id: props.articleReference.value.data.id,
      },
      select: articleSelect,
    });
    if (article == null) return;

    return {
      article: serializeArticle(article),
    };
  };

  await getAsyncProps(page, {
    SideImageArticle: fetchBuilderArticle,
    TopImageArticle: fetchBuilderArticle,
    FeaturedArticle: fetchBuilderArticle,
  });

  return {
    props: {
      page: page || null,
    },
    revalidate: 10,
  };
};

const Home: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = (
  props
) => {
  const [mastheadVisible, setMastheadVisible] = useState(true);

  return (
    <>
      <Head>
        <title>The Bullhorn</title>
      </Head>
      <Media lessThan="md">
        <NavigationBar buffer />
      </Media>

      <Media greaterThanOrEqual="md">
        <Masthead onChangeVisibility={setMastheadVisible} />
        <NavigationBar visible={!mastheadVisible} buffer={false} />
      </Media>

      <BuilderComponent model="page" content={props.page} />
    </>
  );
};

export default Home;

Builder.registerComponent(
  dynamic(() => import("../components/homePage/desktopLayout")),
  {
    name: "DesktopLayout",
    inputs: [
      {
        name: "featured",
        type: "uiBlocks",
        defaultValue: [],
      },
      {
        name: "column1",
        type: "uiBlocks",
        defaultValue: [],
      },
      {
        name: "column2",
        type: "uiBlocks",
        defaultValue: [],
      },
      {
        name: "column3",
        type: "uiBlocks",
        defaultValue: [],
      },
    ],
    defaultStyles: {
      marginTop: "0px",
    },
  }
);

Builder.registerComponent(
  dynamic(() => import("../components/homePage/tabletLayout")),
  {
    name: "TabletLayout",
    inputs: [
      {
        name: "featured",
        type: "uiBlocks",
        defaultValue: [],
      },
      {
        name: "column1",
        type: "uiBlocks",
        defaultValue: [],
      },
      {
        name: "column2",
        type: "uiBlocks",
        defaultValue: [],
      },
    ],
    defaultStyles: {
      marginTop: "0px",
    },
  }
);

Builder.registerComponent(
  dynamic(() => import("../components/homePage/mobileLayout")),
  {
    name: "MobileLayout",
    inputs: [
      {
        name: "featured",
        type: "uiBlocks",
        defaultValue: [],
      },
      {
        name: "column1",
        type: "uiBlocks",
        defaultValue: [],
      },
    ],
    defaultStyles: {
      marginTop: "0px",
    },
  }
);

Builder.registerComponent(SideImageArticle, {
  name: "SideImageArticle",
  inputs: [
    {
      name: "articleReference",
      type: "reference",
    },
  ],
  defaultStyles: {
    marginTop: "0px",
  },
  noWrap: true,
});

Builder.registerComponent(TopImageArticle, {
  name: "TopImageArticle",
  inputs: [{ name: "articleReference", type: "reference" }],
  defaultStyles: {
    marginTop: "0px",
  },
  noWrap: true,
});

Builder.registerComponent(FeaturedArticle, {
  name: "FeaturedArticle",
  inputs: [{ name: "articleReference", type: "reference" }],
  defaultStyles: {
    marginTop: "0px",
    marginLeft: "0px",
    flexDirection: "row",
  },
  noWrap: true,
});
