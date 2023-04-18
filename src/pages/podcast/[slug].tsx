import type { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import { prisma } from "../../server/db/client";
import { serializeArticle } from "../../utils/article";
import NavigationBar from "../../components/navigationBar";
import Balancer from "react-wrap-balancer";
import { Player } from "shikwasa";
import "shikwasa/dist/style.css";
import { useState } from "react";
import { useMemo } from "react";

export async function getStaticPaths() {
  const recentPodcasts = await prisma.podcast.findMany({
    select: {
      slug: true,
    },
    take: 50,
    orderBy: {
      publicationDate: "desc",
    },
  });

  const paths = recentPodcasts.map(({ slug }) => ({ params: { slug } }));

  return {
    fallback: "blocking",
    paths,
  };
}

export async function getStaticProps(context: GetStaticPropsContext) {
  const slug = context.params?.slug;

  if (slug == null || typeof slug !== "string")
    return {
      notFound: true,
    };

  const podcast = await prisma.podcast.findUnique({
    where: {
      slug,
    },
    include: {
      hosts: true,
    },
  });

  if (podcast == null)
    return {
      notFound: true,
    };

  return {
    props: {
      podcast: serializeArticle(podcast),
    },
    revalidate: 10,
  };
}

export default function PodcastPage(
  props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const [player, setPlayer] = useState<any>();
  const hostText = useMemo(() => {
    const hosts = props.podcast.hosts;
    return props.podcast.hosts.reduce((acc, host, idx) => {
      let res = acc + `${host.firstName} ${host.lastName}`;
      if (idx !== hosts.length - 1 && hosts.length > 2) {
        res += ", ";
      }
      if (idx === hosts.length - 2) {
        res += " & ";
      }
      return res;
    }, "");
  }, [props.podcast.hosts]);

  return (
    <div className="h-screen">
      <NavigationBar />
      <div className="container mx-auto mt-4 flex flex-col items-center gap-6">
        <div
          className="w-full"
          ref={(node) => {
            if (node == null) {
              player?.pause();
              return;
            }
            if (player == null) {
              setPlayer(
                new Player({
                  container: node,
                  theme: "light",
                  audio: {
                    title: `${props.podcast.title} - ${hostText}`,
                    artist: "The Megaphone",
                    cover: "/android-chrome-144x144.png",
                    src: props.podcast.audioUrl,
                  },
                })
              );
            }
          }}
        />
        <h1 className="max-w-[20ch] text-center font-headline text-4xl font-bold">
          <Balancer>{props.podcast.title}</Balancer>
        </h1>
        <p className="max-w-prose ">{props.podcast.description}</p>
      </div>
    </div>
  );
}
