import type { GetServerSidePropsContext, NextPage } from "next";
import NavigationBar from "../../components/navigationBar";
import { sections } from "../../utils/section";
import { useId, useState } from "react";
import Select from "react-select";
import { trpc } from "../../utils/trpc";
import type { Media } from "@prisma/client";
import { parseHtml } from "../../utils/article";
import { getServerAuthSession } from "../../server/common/get-server-auth-session";
import DrivePicker from "../../components/drivePicker";
import RequiredStar from "../../components/requiredStar";
import Head from "next/head";
import {
  MultiSelectContributor,
  SelectContributor,
} from "../../components/selectContributor";
import { useUploadAndGenerateMedia } from "../../utils/media";
import Link from "next/link";
import { cn } from "../../utils/tw";

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const session = await getServerAuthSession(ctx);
  if (session?.user == null) {
    ctx.res.setHeader("set-cookie", "redirect-origin=/editor");
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

const sectionOptions = sections
  .filter((s) => !s.hidden)
  .map((s) => ({
    value: s.id,
    label: s.display,
  }));

const EditorPage: NextPage = () => {
  const [headline, setHeadline] = useState<string>();
  const [focusSentence, setFocusSentence] = useState<string>();
  const sectionSelectId = useId();
  const [section, setSection] = useState<string>();
  const [articleWriters, setArticleWriters] = useState<string[]>([]);
  const [driveData, setDriveData] = useState<{
    images: {
      contributorId?: string;
      contributorText: string;
      altText?: string;
      file: File;
    }[];
    htmlFileText?: string;
  }>();
  // used to reset certain form element's state
  const [resetKey, setResetKey] = useState(1);
  const [thumbnailFile, setThumbnailFile] = useState<File>();
  const [thumbnailContributor, setThumbnailContributor] = useState<{
    contributorId?: string;
    contributorText?: string;
  }>({});
  const [thumbnailAlt, setThumbnailAlt] = useState<string>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutateAsync: createSubmission } =
    trpc.article.createSubmission.useMutation();

  const uploadAndGenerateMedia = useUploadAndGenerateMedia();

  const onSubmit = async () => {
    if (
      headline == null ||
      focusSentence == null ||
      section == null ||
      articleWriters.length === 0 ||
      driveData == null ||
      driveData.htmlFileText == null ||
      driveData.images.some(({ altText }) => altText == null) ||
      (thumbnailFile != null &&
        (thumbnailAlt == null || thumbnailContributor.contributorText == null))
    ) {
      // TODO: make this nicer
      alert("missing required fields");
      return;
    }
    setIsSubmitting(true);

    const fileNameToMediaMap = new Map<string, Media>();

    for (const {
      file,
      contributorText,
      altText,
      contributorId,
    } of driveData.images) {
      const media = await uploadAndGenerateMedia({
        file,
        contributorId,
        contributorText,
        // Checked already above
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        altText: altText!,
      });
      fileNameToMediaMap.set(file.name, media);
    }

    const html = new DOMParser().parseFromString(
      driveData.htmlFileText,
      "text/html"
    );

    const articleContent = parseHtml(html, fileNameToMediaMap);

    const bodyMediaIds: string[] = [];
    for (const media of fileNameToMediaMap.values()) {
      bodyMediaIds.push(media.id);
    }

    const submissionArguments: Parameters<typeof createSubmission>[0] = {
      // Double spaces break things
      headline: headline.replaceAll("  ", " "),
      focusSentence: focusSentence.replaceAll("  ", " "),
      section,
      articleContent,
      contributorIds: articleWriters,
      bodyMediaIds,
    };

    if (thumbnailFile != null) {
      const thumbnail = await uploadAndGenerateMedia({
        file: thumbnailFile,
        contributorId: thumbnailContributor.contributorId,
        // Checked already above
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        contributorText: thumbnailContributor.contributorText!,
        // Checked already above
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        altText: thumbnailAlt!,
      });
      submissionArguments.thumbnailMediaId = thumbnail.id;
    }
    await createSubmission(submissionArguments);

    setIsSubmitting(false);
    resetFields();
    alert("Article submitted successfully");
  };

  const resetFields = () => {
    setHeadline(undefined);
    setFocusSentence(undefined);
    setSection(undefined);
    setArticleWriters([]);
    setDriveData(undefined);
    setResetKey((v) => -v);
    setThumbnailFile(undefined);
    setThumbnailContributor({
      contributorId: undefined,
      contributorText: undefined,
    });
    setThumbnailAlt(undefined);
  };
  return (
    <>
      <Head>
        <title>Editor Dashboard</title>
      </Head>
      <NavigationBar />
      <div className="container mx-auto">
        <h1 className="mt-4 text-center text-2xl">
          Mark article as ready for publishing
        </h1>
        <p className="text-center text-gray-500">
          Note: Hitting submit does not publish the article right away, it is
          still reviewed.
        </p>
        <p className="text-center">
          Uploading a podcast instead? Go{" "}
          <Link href="/editor/podcast" className="link">
            here
          </Link>
        </p>
        <div className="mx-auto mt-4 flex w-1/2 flex-col gap-4">
          <div className="flex flex-col">
            <p>
              Headline <RequiredStar />
            </p>
            <input
              placeholder="Enter Headline"
              className="input-bordered input focus:outline-offset-0"
              type="text"
              value={headline ?? ""}
              onChange={({ target }) => setHeadline(target.value)}
            />
          </div>

          <div className="flex flex-col">
            <p>
              Focus Sentence <RequiredStar />
            </p>
            <textarea
              placeholder="1-2 sentences. This is the preview of the article"
              className="textarea-bordered textarea focus:outline-offset-0"
              value={focusSentence ?? ""}
              onChange={({ target }) => setFocusSentence(target.value)}
            />
          </div>

          <div className="flex flex-col">
            <p>
              Section <RequiredStar />
            </p>
            <Select
              // forces a re-render when `section` changes
              key={`section-select-${section == null}`}
              instanceId={sectionSelectId}
              placeholder="Article Section"
              options={sectionOptions}
              value={sectionOptions.find((v) => v.value === section)}
              onChange={(it) => setSection(it?.value)}
              // styles={{
              //   control: (baseStyles) =>
              //     error ? { ...baseStyles, borderColor: "red" } : baseStyles,
              // }}
            />
          </div>
          <div className="flex flex-col">
            <p>
              Writers <RequiredStar />
            </p>
            <MultiSelectContributor
              placeholder="Article Writers"
              selectedWriters={articleWriters}
              onChange={setArticleWriters}
            />
          </div>
          <div>
            <p>
              Article Drive document <RequiredStar />
            </p>
            <DrivePicker onChange={setDriveData} key={resetKey} />
          </div>
          <div role="separator" className="divider m-0" />
          <div className="flex flex-col">
            <p>Article thumbnail image</p>
            <input
              accept="image/jpeg"
              className="file-input-bordered file-input cursor-pointer"
              type="file"
              onChange={({ target }) => setThumbnailFile(target.files?.[0])}
              key={resetKey}
            />
            {thumbnailFile && (
              <div className="mt-4">
                <SelectContributor
                  className="float-left w-1/2"
                  placeholder="Thumbnail Contributor"
                  onChange={setThumbnailContributor}
                  selectedContributorId={thumbnailContributor.contributorId}
                  selectedContributorText={thumbnailContributor.contributorText}
                />
                <textarea
                  placeholder="Thumbnail Alt text."
                  className="textarea-bordered textarea w-1/2 focus:outline-offset-0"
                  onChange={({ target }) => setThumbnailAlt(target.value)}
                />
              </div>
            )}
          </div>
          <button
            type="submit"
            className={cn("btn-primary btn", isSubmitting && "loading")}
            onClick={onSubmit}
          >
            Submit Article
          </button>
        </div>
      </div>
    </>
  );
};

export default EditorPage;
