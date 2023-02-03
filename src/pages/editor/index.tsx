declare let google: any;
import type { InferGetStaticPropsType, NextPage } from "next";
import { Button, Divider, FileInput, Input, Textarea } from "react-daisyui";
import { prisma } from "../../server/db/client";
import NavigationBar from "../../components/navigationBar";
import { env } from "../../env/client.mjs";
import { sections } from "../../utils/section";
import { useEffect, useId, useMemo, useState } from "react";
import Select from "react-select";
import useDrivePicker from "react-google-drive-picker/dist";
import { unzip } from "fflate";
import { trpc } from "../../utils/trpc";
import type { Contributor, Media, Section } from "@prisma/client";
import type {
  authResult,
  PickerConfiguration,
} from "react-google-drive-picker/dist/typeDefs";
import type {
  ArticleParagraph,
  ArticleSpan,
  SpanContent,
} from "../../utils/article";

export const getStaticProps = async () => {
  const writers = await prisma.contributor.findMany({
    select: { firstName: true, lastName: true, id: true },
  });

  return {
    props: {
      writers,
    },
  };
};

const RequiredStar = () => <span className="text-red-500">*</span>;

const sectionOptions = sections.map((s) => ({
  value: s.dbSection,
  label: s.display,
}));

const EditorPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  writers,
}) => {
  const [headline, setHeadline] = useState<string>();
  const [focusSentence, setFocusSentence] = useState<string>();
  const sectionSelectId = useId();
  const [section, setSection] = useState<Section>();
  const writersSelectId = useId();
  const [articleWriters, setArticleWriters] = useState<string[]>([]);
  const [driveData, setDriveData] = useState<{
    images: {
      contributorId?: string;
      altText?: string;
      file: File;
    }[];
    htmlFileText?: string;
  }>();
  // used to reset certain form element's state
  const [resetKey, setResetKey] = useState(1);
  const [thumbnailFile, setThumbnailFile] = useState<File>();
  const [thumbnailContributor, setThumbnailContributor] = useState<string>();
  const [thumbnailAlt, setThumbnailAlt] = useState<string>();
  const thumbnailSelectId = useId();
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

  const { mutateAsync: createSignedUrl } =
    trpc.s3.createSignedUrl.useMutation();
  const { mutateAsync: createMedia } = trpc.media.create.useMutation();

  const uploadAndGenerateMedia = async (image: {
    contributorId?: string;
    altText?: string;
    file: File;
  }) => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();

    const imageExtension = image.file.name.split(".").pop() ?? "jpg";
    const { signedUrl, imagePath } = await createSignedUrl({
      imagePath: `images/${year}/${month}/${day}`,
      extension: imageExtension,
    });

    fetch(signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: image.file,
    });

    return await createMedia({
      contentUrl: `https://cdn.thebullhorn.net/${imagePath}`,
      alt: image.altText!,
      contributorId: image.contributorId!,
    });
  };

  const onSubmit = async () => {
    if (
      headline == null ||
      focusSentence == null ||
      section == null ||
      articleWriters == null ||
      articleWriters.length === 0 ||
      driveData == null ||
      driveData.htmlFileText == null ||
      driveData.images.some(
        ({ altText, contributorId }) => altText == null || contributorId == null
      ) ||
      (thumbnailFile != null && thumbnailContributor == null) ||
      (thumbnailFile != null && thumbnailAlt == null)
    ) {
      // TODO: make this nicer
      alert("missing required fields");
      return;
    }
    setIsSubmitting(true);

    const fileNameToMediaMap = new Map<string, Media>();

    for (const image of driveData.images) {
      const media = await uploadAndGenerateMedia(image);
      fileNameToMediaMap.set(image.file.name, media);
    }

    const html = new DOMParser().parseFromString(
      driveData.htmlFileText,
      "text/html"
    );

    const articleContent = parseHtml(html, fileNameToMediaMap);

    if (thumbnailFile != null) {
      const thumbnail = await uploadAndGenerateMedia({
        file: thumbnailFile,
        contributorId: thumbnailContributor,
        altText: thumbnailAlt,
      });
      await createSubmission({
        headline,
        focusSentence,
        section,
        articleContent,
        contributorIds: articleWriters,
        thumbnailMediaId: thumbnail.id,
      });
    } else {
      await createSubmission({
        headline,
        focusSentence,
        section,
        articleContent,
        contributorIds: articleWriters,
      });
    }
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
    setThumbnailContributor(undefined);
    setThumbnailAlt(undefined);
  };
  return (
    <>
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
            <DrivePicker
              contributorsList={writers}
              onChange={setDriveData}
              key={resetKey}
            />
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
              <div className="mt-4 flex gap-2">
                <Select
                  className="grow"
                  instanceId={thumbnailSelectId}
                  placeholder="Thumbnail Contributor"
                  onChange={(v) => setThumbnailContributor(v?.value)}
                  options={writerOptions}
                />
                <Textarea
                  className="grow"
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

const parseHtml = (
  document: Document,
  fileNameToMediaMap: Map<string, Media>
) => {
  const paragraphs = document.getElementsByTagName("p");

  const articleParagraphs: ArticleParagraph[] = [];
  for (const paragraph of new Array(...paragraphs).slice(1)) {
    let { textAlign, textIndent, marginLeft, marginRight } = paragraph.style;
    if (textAlign.length === 0) textAlign = "left";
    if (textIndent.length === 0) textIndent = "0";
    if (marginLeft.length === 0) marginLeft = "0";
    if (marginRight.length === 0) marginRight = "0";
    const articleSpans: ArticleSpan[] = [];
    for (const span of paragraph.getElementsByTagName("span")) {
      let { fontStyle, textDecoration, color, fontWeight } = span.style;
      if (fontStyle.length === 0) fontStyle = "normal";
      if (textDecoration.length === 0) textDecoration = "none";
      if (color.length === 0) color = "#000000";
      if (fontWeight.length === 0) fontWeight = "400";
      const content: SpanContent[] = [];
      for (const child of span.childNodes) {
        if (child.nodeName === "A") {
          content.push({
            anchor: {
              content: child.textContent ?? "",
              href: (child as HTMLAnchorElement).href,
            },
          });
        } else if (child.nodeName === "IMG") {
          const { width, height, src } = child as HTMLImageElement;
          // can't just do a lookup of the map because
          // `src` gets the absolute path prepended by the DOMParser
          for (const [name, media] of fileNameToMediaMap) {
            if (src.includes(name)) {
              content.push({
                image: {
                  mediaId: media.id,
                  width,
                  height,
                },
              });
              break;
            }
          }
        } else {
          content.push({
            text: { content: child.textContent ?? "" },
          });
        }
      }
      articleSpans.push({
        fontStyle,
        textDecoration,
        color,
        fontWeight,
        content,
      });
    }
    articleParagraphs.push({
      marginLeft,
      marginRight,
      textAlignment: textAlign,
      textIndent,
      spans: articleSpans,
    });
  }
  return { paragraphs: articleParagraphs };
};

const DrivePicker = ({
  contributorsList,
  onChange,
}: {
  contributorsList: Pick<Contributor, "firstName" | "lastName" | "id">[];
  onChange?: (stuff: {
    images: { contributorId?: string; altText?: string; file: File }[];
    htmlFileText?: string;
  }) => void;
}) => {
  const [fileName, setFileName] = useState<string>();
  const [htmlFileText, setHtmlFileText] = useState<string>();
  const [images, setImages] = useState<
    { contributorId?: string; altText?: string; file: File }[]
  >([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [openPicker] = useDrivePicker();
  const selectId = useId();

  useEffect(
    () => onChange?.({ images, htmlFileText }),
    [onChange, images, htmlFileText]
  );

  const handleOpenPicker = () => {
    const config: PickerConfiguration = {
      clientId: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      developerKey: env.NEXT_PUBLIC_GOOGLE_API_KEY,
      viewId: "DOCS",
      viewMimeTypes: "application/vnd.google-apps.document",
      callbackFunction: async (data) => {
        if (data.action === "picked") {
          setFileName(data.docs[0]?.name);
          const ret = await fetch(
            `https://www.googleapis.com/drive/v3/files/${data.docs[0]?.id}/export?mimeType=application/zip`,
            {
              headers: {
                Authorization: `Bearer ${config.token}`,
              },
            }
          );

          unzip(new Uint8Array(await ret.arrayBuffer()), async (_, data) => {
            const files = Object.keys(data)
              .filter((filename) => data[filename]?.length ?? 0 > 0)
              .map((filename) => new File([data[filename]!], filename));

            const htmlFile = files.find((file) => file.name.endsWith("html"));
            if (!htmlFile) {
              throw new Error("Invalid Google Doc");
            }

            const htmlFileText = await htmlFile.text();

            const articleImages = files
              .filter((file) => file.name.startsWith("images"))
              .map((file) => ({ file }));

            // onChange?.(articleImages, htmlFileText);

            setImages(articleImages);
            setImageUrls(
              articleImages.map(({ file }) => URL.createObjectURL(file))
            );
            setHtmlFileText(htmlFileText);
          });
        }
      },
    };

    const client = google.accounts.oauth2.initTokenClient({
      client_id: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      callback: (tokenResponse: authResult) => {
        config.token = tokenResponse.access_token;
        openPicker(config);
      },
    });

    client.requestAccessToken();
  };

  return (
    <div className="flex flex-col">
      <div
        // className={`flex cursor-pointer items-center gap-2 rounded-lg border ${
        //   error ? "border-error" : "border-neutral border-opacity-20"
        // }`}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral border-opacity-20"
        onClick={handleOpenPicker}
      >
        <Button>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="35"
            height="30"
            viewBox="0 0 1443.061 1249.993"
          >
            <path
              fill="#3777e3"
              d="M240.525 1249.993l240.492-416.664h962.044l-240.514 416.664z"
            />
            <path
              fill="#ffcf63"
              d="M962.055 833.329h481.006L962.055 0H481.017z"
            />
            <path
              fill="#11a861"
              d="M0 833.329l240.525 416.664 481.006-833.328L481.017 0z"
            />
          </svg>
        </Button>
        <p>{fileName ?? "No file selected."}</p>
      </div>
      {/* {error && <p className="text-red-500">{error.errorMessage}</p>} */}
      <div className="mt-2 flex flex-col gap-2">
        {imageUrls.map((url, idx) => (
          <div key={url} className="flex items-center gap-2">
            <picture>
              <img alt={`Image ${idx + 1}`} src={url} width={100} />
            </picture>
            <Select
              className="grow"
              instanceId={selectId}
              placeholder="Contributor"
              onChange={(v) =>
                setImages((old) => {
                  const oldCopy = [...old];
                  oldCopy[idx] = {
                    ...old[idx]!,
                    contributorId: v?.value,
                  };
                  return oldCopy;
                })
              }
              options={contributorsList.map((c) => ({
                value: c.id,
                label: `${c.firstName} ${c.lastName}`,
              }))}
            />
            <Textarea
              className="grow"
              placeholder="Alt text - this is a short, 1-2 sentence description of the image."
              onChange={({ target }) =>
                setImages((old) => {
                  const oldCopy = structuredClone(old);
                  oldCopy[idx] = { ...oldCopy[idx]!, altText: target.value };
                  return oldCopy;
                })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};
