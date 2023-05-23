import type { GetServerSidePropsContext } from "next";
import { getServerAuthSession } from "../../../server/common/get-server-auth-session";
import { useState } from "react";
import Head from "next/head";
import NavigationBar from "../../../components/navigationBar";
import RequiredStar from "../../../components/requiredStar";
import { MultiSelectContributor } from "../../../components/selectContributor";
import { trpc } from "../../../utils/trpc";
import { cn } from "../../../utils/tw";

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const session = await getServerAuthSession(ctx);
  if (session?.user == null) {
    ctx.res.setHeader("set-cookie", "redirect-origin=/editor/podcast");
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
};

export default function PodcastEditorPage() {
  const [title, setTitle] = useState<string>();
  const [description, setDescription] = useState<string>();
  const [hostIds, setHostIds] = useState<string[]>([]);
  const [audioFile, setAudioFile] = useState<File>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [resetKey, setResetKey] = useState(1);

  const { mutateAsync: createPodcast } = trpc.podcast.create.useMutation();

  const trpcContext = trpc.useContext();

  const onSubmit = async () => {
    if (
      title == null ||
      description == null ||
      hostIds.length === 0 ||
      audioFile == null
    ) {
      alert("missing required fields");
      return;
    }
    setIsSubmitting(true);

    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(
      await audioFile.arrayBuffer()
    );

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();

    const imageExtension = audioFile.name.split(".").pop() ?? "mp3";
    const { signedUrl, imagePath } =
      await trpcContext.client.s3.createSignedUrl.mutate({
        imagePath: `images/${year}/${month}/${day}`,
        extension: imageExtension,
      });

    fetch(signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: audioFile,
    });

    try {
      await createPodcast({
        title,
        description,
        hostIds,
        audioUrl: `https://cdn.thebullhorn.net/${imagePath}`,
        duration: Math.floor(audioBuffer.duration),
      });
    } catch (e) {
      setIsSubmitting(false);
      alert(
        "Something went wrong uploading the podcast. Maybe try again or verify that the file you uploaded is valid."
      );
    }
    setIsSubmitting(false);
    resetFields();
    alert("Podcast submitted successfully");
  };

  const resetFields = () => {
    setTitle(undefined);
    setDescription(undefined);
    setHostIds([]);
    setResetKey((v) => -v);
  };

  return (
    <>
      <Head>
        <title>Editor Dashboard</title>
      </Head>
      <NavigationBar />
      <div className="container mx-auto">
        <h1 className="mt-4 text-center text-2xl">Upload podcast</h1>

        <div className="mx-auto mt-4 flex w-1/2 flex-col gap-4">
          <div className="flex flex-col">
            <p>
              Title <RequiredStar />
            </p>
            <input
              placeholder="Enter Title"
              className="input-bordered input focus:outline-offset-0"
              type="text"
              value={title ?? ""}
              onChange={({ target }) => setTitle(target.value)}
            />
          </div>

          <div className="flex flex-col">
            <p>
              Podcast Description <RequiredStar />
            </p>
            <textarea
              placeholder="Description of the podcast."
              className="textarea-bordered textarea focus:outline-offset-0"
              onChange={({ target }) => setDescription(target.value)}
              key={resetKey}
            />
          </div>

          <div className="flex flex-col">
            <p>
              Hosts <RequiredStar />
            </p>
            <MultiSelectContributor
              placeholder="Podcast Hosts"
              selectedWriters={hostIds}
              onChange={setHostIds}
            />
          </div>
          <div className="flex flex-col">
            <p>
              Audio file <RequiredStar />
            </p>
            <input
              accept=".mp3,audio/*"
              className="file-input-bordered file-input cursor-pointer"
              type="file"
              onChange={({ target }) => setAudioFile(target.files?.[0])}
              key={resetKey}
            />
          </div>
          <button
            type="submit"
            className={cn("btn-primary btn", isSubmitting && "loading")}
            onClick={onSubmit}
          >
            Submit Podcast
          </button>
        </div>
      </div>
    </>
  );
}
