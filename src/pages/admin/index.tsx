import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import NavigationBar from "../../components/navigationBar";
import { getServerAuthSession } from "../../server/common/get-server-auth-session";
import { useState } from "react";
import { trpc } from "../../utils/trpc";
import ContributorsView from "../../components/admin/contributorView";
import ArticlesView from "../../components/admin/articleView";
import SubmissionsView from "../../components/admin/submissionsView";
import Head from "next/head";
import { cn } from "../../utils/tw";
import PodcastsView from "../../components/admin/podcastView";

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const session = await getServerAuthSession(ctx);
  // TODO: Think about what happens if the user is signed in as editor
  if (session?.user?.name !== "admin") {
    ctx.res.setHeader("set-cookie", "redirect-origin=/admin");
    return {
      redirect: {
        permanent: false,
        destination: "/api/auth/signin",
      },
    };
  }
  return {
    props: {},
  };
}

const SectionPage: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = () => {
  const { data: articleSubmissions } = trpc.article.allSubmissions.useQuery();
  const [activeView, setActiveView] = useState<
    "submissions" | "articles" | "contributors" | "podcasts"
  >("articles");

  return (
    <>
      <Head>
        <title>Admin Dashboard</title>
      </Head>
      <NavigationBar />
      <div className="flex gap-4 pt-4">
        <ul
          role="menu"
          className="menu col-span-1 h-[75vh] min-w-fit rounded-r-2xl bg-base-200 p-2"
        >
          <li
            role="menuitem"
            className={`border-b border-gray-300 ${
              activeView === "articles" ? "underline" : ""
            }`}
            onClick={() => setActiveView("articles")}
          >
            <p>Articles</p>
          </li>
          <li
            role="menuitem"
            className={`border-b border-gray-300 ${
              activeView === "submissions" ? "underline" : ""
            }`}
            onClick={() => setActiveView("submissions")}
          >
            <p>Submissions ({articleSubmissions?.length ?? 0})</p>
          </li>
          <li
            role="menuitem"
            className={cn(
              "border-b border-gray-300",
              activeView === "podcasts" ? "underline" : null
            )}
            onClick={() => setActiveView("podcasts")}
          >
            <p>Podcasts</p>
          </li>
          <li
            role="menuitem"
            className={cn(
              "border-b border-gray-300",
              activeView === "contributors" ? "underline" : ""
            )}
            onClick={() => setActiveView("contributors")}
          >
            <p>Contributors</p>
          </li>
          <li role="menuitem">
            <a
              className="link"
              href="https://builder.io/content"
              rel="noreferrer"
              target="_blank"
            >
              Builder.io
            </a>
          </li>
        </ul>
        <div className="mr-4 w-full overflow-x-auto">
          {activeView === "articles" ? (
            <ArticlesView />
          ) : activeView === "submissions" ? (
            <SubmissionsView />
          ) : activeView === "podcasts" ? (
            <PodcastsView />
          ) : activeView === "contributors" ? (
            <ContributorsView />
          ) : null}
        </div>
      </div>
    </>
  );
};

export default SectionPage;
