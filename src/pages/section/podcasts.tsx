import Head from "next/head";
import NavigationBar from "../../components/navigationBar";
import { useMemo, useState } from "react";
import { prisma } from "../../server/db/client";
import type { InferGetStaticPropsType } from "next";
import { serializeArticle, useDeserializeArticles } from "../../utils/article";
import { Card } from "react-daisyui";
import type { Contributor, Podcast } from "@prisma/client";
import ByLine from "../../components/byLine";
import "shikwasa/dist/style.css";
import Link from "next/link";

export async function getStaticProps() {
  const podcasts = await prisma.podcast.findMany({
    orderBy: {
      publicationDate: "desc",
    },
    include: {
      hosts: true,
    },
  });

  return {
    props: {
      podcasts: podcasts.map(serializeArticle),
    },
  };
}

function formatDuration(timeInSeconds: number) {
  const MINUTE = 60;
  const HOUR = 60 * 60;
  if (timeInSeconds < MINUTE) {
    // If less than 60 seconds, always round up to 1 minute
    return `1min`;
  } else if (timeInSeconds < HOUR) {
    // Round to the nearest minute
    const roundedMinutes = Math.round(timeInSeconds / MINUTE);
    return `${roundedMinutes}min`;
  } else {
    // Calculate hours and minutes separately
    const hours = Math.floor(timeInSeconds / HOUR);
    const minutes = Math.floor((timeInSeconds % HOUR) / MINUTE);
    if (minutes === 0) {
      // If no minutes, just output hours
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  }
}

function formatDate(date: Date) {
  const now = new Date();
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  if (now.getFullYear() === date.getFullYear()) {
    if (
      now.getMonth() === date.getMonth() &&
      now.getDate() - date.getDate() < 7
    ) {
      return daysOfWeek[date.getDay()];
    }
    const month = date.toLocaleString("default", { month: "short" });
    const dayOfMonth = date.getDate();
    return `${month} ${dayOfMonth}`;
  } else {
    const month = date.toLocaleString("default", { month: "short" });
    const dayOfMonth = date.getDate();
    const year = date.getFullYear();
    return `${month} ${dayOfMonth}, ${year}`;
  }
}

function PodcastCard(props: {
  podcast: Podcast & { hosts: Contributor[] };
  expanded: boolean;
  onClick: () => void;
}) {
  const [formattedDuration, formattedDate] = useMemo(
    () => [
      formatDuration(props.podcast.duration),
      formatDate(props.podcast.publicationDate),
    ],
    [props.podcast]
  );

  return (
    <Card
      className="overflow-hidden transition-colors hover:bg-gray-200"
      onClick={props.onClick}
    >
      <Card.Body>
        {/* Have to do weird stuff here to get the nested links from the ByLine component
            to work properly. */}
        <Link
          href={`/podcast/${props.podcast.slug}`}
          className="before:absolute before:bottom-0 before:left-0 before:right-0 before:top-0"
        >
          <p className="text-sm font-bold text-gray-500">{formattedDate}</p>
          <Card.Title>{props.podcast.title}</Card.Title>

          <div className="flex justify-between">
            <span>{props.podcast.description}</span>
            <span className="text-sm text-gray-500">{formattedDuration}</span>
          </div>
        </Link>
        <p className="z-10 text-sm text-gray-500">
          <ByLine writers={props.podcast.hosts} podcast />
        </p>
      </Card.Body>
    </Card>
  );
}

export default function PodcastPage(
  props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const podcasts = useDeserializeArticles(props.podcasts);
  const [activeIdx, setActiveIdx] = useState<number>();

  return (
    <>
      <Head>
        <title>The Bullhorn Podcast</title>
      </Head>
      <NavigationBar />
      <div className="container mx-auto mt-4 flex flex-col gap-4">
        <h1 className="border-b-4 border-leman-blue pb-2 text-center font-section text-5xl">
          Podcasts
        </h1>
        <>
          {podcasts.map((podcast, idx) => (
            <PodcastCard
              key={podcast.id}
              podcast={podcast}
              expanded={idx === activeIdx}
              onClick={() =>
                setActiveIdx((active) => (active === idx ? undefined : idx))
              }
            />
          ))}
        </>
      </div>
    </>
  );
}
