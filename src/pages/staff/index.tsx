import Head from "next/head";
import NavigationBar from "../../components/navigationBar";
import builder, { BuilderComponent } from "@builder.io/react";
import type { InferGetStaticPropsType } from "next";
import { env } from "../../env/client.mjs";

builder.init(env.NEXT_PUBLIC_BUILDER_KEY);

export const getStaticProps = async () => {
  const page = await builder
    .get("page", {
      userAttributes: {
        urlPath: "/staff",
      },
    })
    .toPromise();

  return {
    props: {
      page: page || null,
    },
    revalidate: 10,
  };
};

export default function StaffPage(
  props: InferGetStaticPropsType<typeof getStaticProps>
) {
  return (
    <>
      <Head>
        <title>The Bullhorn Staff</title>
      </Head>
      <NavigationBar />
      <div className="container mx-auto mt-4">
        <BuilderComponent model="page" content={props.page} />
      </div>
    </>
  );
}
