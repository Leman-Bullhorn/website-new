import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import { Button, Divider, FileInput, Input, Textarea } from "react-daisyui";
import { prisma } from "../../server/db/client";
import NavigationBar from "../../components/navigationBar";
import { sections } from "../../utils/section";
import { useId, useMemo, useState } from "react";
import Select from "react-select";
import { trpc } from "../../utils/trpc";
import type { Media, Section } from "@prisma/client";
import { parseHtml } from "../../utils/article";
import { getServerAuthSession } from "../../server/common/get-server-auth-session";
import DrivePicker from "../../components/drivePicker";
import RequiredStar from "../../components/requiredStar";
import Head from "next/head";
import { SelectContributor } from "../../components/selectContributor";
import { useUploadAndGenerateMedia } from "../../utils/media";

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

  const writers = await prisma.contributor.findMany({
    select: { firstName: true, lastName: true, id: true },
  });

  return {
    props: {
      writers,
    },
  };
};

const sectionOptions = sections.map((s) => ({
  value: s.dbSection,
  label: s.display,
}));

const EditorPage: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ writers }) => {
  const [headline, setHeadline] = useState<string>();
  const [focusSentence, setFocusSentence] = useState<string>();
  const sectionSelectId = useId();
  const [section, setSection] = useState<Section>();
  const writersSelectId = useId();
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
  const writerOptions = useMemo(
    () =>
      writers.map((w) => ({
        value: w.id,
        label: `${w.firstName} ${w.lastName}`,
      })),
    [writers]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutateAsync: createSubmission } =
    trpc.article.createSubmission.useMutation();

  const uploadAndGenerateMedia = useUploadAndGenerateMedia();

  const onSubmit = async () => {
    if (
      headline == null ||
      focusSentence == null ||
      section == null ||
      articleWriters == null ||
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
      headline,
      focusSentence,
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
        <div className="mx-auto mt-4 flex w-1/2 flex-col gap-4">
          <div className="flex flex-col">
            <p>
              Headline <RequiredStar />
            </p>
            <Input
              placeholder="Enter Headline"
              type="text"
              // color={error ? "error" : "ghost"}
              value={headline ?? ""}
              onChange={({ target }) => setHeadline(target.value)}
            />
          </div>

          <div className="flex flex-col">
            <p>
              Focus Sentence <RequiredStar />
            </p>
            <Textarea
              placeholder="1-2 sentences. This is the preview of the article"
              /*color={error ? "error" : "ghost"}*/ value={focusSentence ?? ""}
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
            <Select
              key={`writers-select-${articleWriters == null}`}
              instanceId={writersSelectId}
              placeholder="Article writers"
              isMulti
              closeMenuOnSelect={false}
              // styles={{
              //   control: (baseStyles) => {
              //     if (error) {
              //       return { ...baseStyles, borderColor: "red" };
              //     }
              //     return baseStyles;
              //   },
              // }}
              options={writerOptions}
              value={articleWriters.map((v) =>
                writerOptions.find((o) => o.value === v)
              )}
              onChange={(it) => setArticleWriters(it.map((v) => v!.value))}
            />
          </div>
          <div>
            <p>
              Article Drive document <RequiredStar />
            </p>
            <DrivePicker onChange={setDriveData} key={resetKey} />
          </div>
          <Divider className="m-0" />
          <div className="flex flex-col">
            <p>Article thumbnail image</p>
            <FileInput
              accept="image/jpeg"
              bordered
              className="cursor-pointer"
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
                <Textarea
                  className="w-1/2"
                  placeholder="Thumbnail Alt text."
                  onChange={({ target }) => setThumbnailAlt(target.value)}
                />
              </div>
            )}
          </div>
          <Button
            type="submit"
            color="primary"
            onClick={onSubmit}
            loading={isSubmitting}
          >
            Submit Article
          </Button>
        </div>
      </div>
    </>
  );
};

export default EditorPage;
