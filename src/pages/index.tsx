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

// This uses highly specific "selects" to reduce bundle size to a minimum
const articleSelect = {
  id: true,
  headline: true,
  focus: true,
  slug: true,
  section: true,
  publicationDate: true,
  thumbnail: {
    select: {
      contentUrl: true,
      alt: true,
      contributorText: true,
      contributor: {
        select: {
          slug: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  },
  writers: {
    select: {
      id: true,
      slug: true,
      firstName: true,
      lastName: true,
    },
  },
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
        <meta
          name="description"
          content="The Leman Bullhorn newspaper. Bi-trimestral student articles covering a range of topics in news, opinions, features, science, sports, arts, and humor. "
        />
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
  dynamic(() => import("../components/homePage/additionalDesktopLayout")),
  {
    name: "AdditionalDesktopLayout",
    inputs: [
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
      borderColor: "rgba(77, 168, 223, 0.4)",
      borderStyle: "solid",
      borderTopWidth: "1px",
      marginTop: "0.25rem",
      paddingTop: "0.5rem",
    },
    noWrap: true,
  }
);

Builder.registerComponent(
  dynamic(() => import("../components/homePage/additionalTabletLayout")),
  {
    name: "AdditionalTabletLayout",
    inputs: [
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
      borderColor: "rgba(77, 168, 223, 0.4)",
      borderStyle: "solid",
      borderTopWidth: "1px",
      marginTop: "0.25rem",
      paddingTop: "0.5rem",
    },
    noWrap: true,
  }
);

Builder.registerComponent(
  dynamic(() => import("../components/homePage/additionalMobileLayout")),
  {
    name: "AdditionalMobileLayout",
    inputs: [
      {
        name: "column1",
        type: "uiBlocks",
        defaultValue: [],
      },
    ],
    defaultStyles: {
      borderColor: "rgba(77, 168, 223, 0.4)",
      borderStyle: "solid",
      borderTopWidth: "1px",
      marginTop: "0.25rem",
      paddingTop: "0.5rem",
    },
    noWrap: true,
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
      model: "articles",
    },
  ],
  defaultStyles: {
    marginTop: "0px",
  },
  noWrap: true,
});

Builder.registerComponent(TopImageArticle, {
  name: "TopImageArticle",
  inputs: [{ name: "articleReference", type: "reference", model: "articles" }],
  defaultStyles: {
    marginTop: "0px",
  },
  noWrap: true,
});

Builder.registerComponent(FeaturedArticle, {
  name: "FeaturedArticle",
  inputs: [{ name: "articleReference", type: "reference", model: "articles" }],
  defaultStyles: {
    marginTop: "0px",
    marginLeft: "0px",
    flexDirection: "row",
  },
  noWrap: true,
});
