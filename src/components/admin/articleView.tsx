import type { Media, Section } from "@prisma/client";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { createColumnHelper, getCoreRowModel } from "@tanstack/table-core";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Button,
  FileInput,
  Input,
  Table,
  Textarea,
  Toggle,
  Tooltip,
} from "react-daisyui";
import { parseHtml, type ArticleBody } from "../../utils/article";
import { useUploadAndGenerateMedia } from "../../utils/media";
import { type RouterOutputs, trpc } from "../../utils/trpc";
import DrivePicker from "../drivePicker";
import Modal from "../modal";
import {
  MultiSelectContributor,
  SelectContributor,
} from "../selectContributor";
import SelectSection from "../selectSection";

type Article = RouterOutputs["article"]["getAll"][0];
export default function ArticlesView() {
  const { data: articles } = trpc.article.getAll.useQuery();
  const { mutateAsync: deleteArticle } = trpc.article.deleteById.useMutation();
  const [confirmDeleteArticle, setConfirmDeleteArticle] = useState<Article>();
  const [editingArticle, setEditingArticle] = useState<Article>();
  const { mutateAsync: editFeatured } = trpc.article.editFeatured.useMutation();

  const trpcContext = trpc.useContext();
  const tableArticles = useMemo(() => {
    if (articles == null) return undefined;
    const sorted = [...articles].sort(
      (a, b) => b.publicationDate.getTime() - a.publicationDate.getTime()
    );

    const featuredArticleIdx = sorted?.findIndex((article) => article.featured);
    if (featuredArticleIdx != null && featuredArticleIdx != -1) {
      const [featured] = sorted.splice(featuredArticleIdx, 1);
      if (featured) {
        return [featured, ...sorted];
      }
    }
    return sorted;
  }, [articles]);

  // TODO
  const onClickEdit = (article: Article) => {
    setEditingArticle(article);
  };

  const toggleFeatured = async (article: Article) => {
    const desiredFeatureState = !article.featured;
    await trpcContext.article.getAll.cancel();
    trpcContext.article.getAll.setData((oldArticles) => {
      if (oldArticles == null) return oldArticles;
      const copy = [...oldArticles];
      const selectedArticle = copy.find(({ id }) => id === article.id);
      if (selectedArticle) selectedArticle.featured = desiredFeatureState;
    });
    try {
      await editFeatured({ id: article.id, featured: desiredFeatureState });
    } catch (e) {
      alert("Only one article can be featured at a time");
    }
    trpcContext.article.invalidate();
  };

  const confirmDelete = async (article: Article) => {
    await trpcContext.article.getAll.cancel();
    trpcContext.article.getAll.setData((oldSubmissions) =>
      oldSubmissions?.filter((s) => s.id != article.id)
    );
    await deleteArticle({ id: article.id });
    trpcContext.article.invalidate();
    setConfirmDeleteArticle(undefined);
  };

  const columnHelper = createColumnHelper<Article>();
  const columns = [
    columnHelper.accessor("headline", {
      cell: (props) => (
        <Link
          className="link-hover link"
          data-tip={props.row.original.headline}
          href={`/article/${props.row.original.slug}`}
        >
          {props.row.original.headline.length > 50 ? (
            <Tooltip
              position="right"
              className="link-hover link before:whitespace-pre-wrap before:content-[attr(data-tip)]"
              message={props.row.original.headline}
            >
              {props.row.original.headline.substring(0, 47) + "..."}
            </Tooltip>
          ) : (
            props.row.original.headline
          )}
        </Link>
      ),
    }),
    columnHelper.accessor("section", {}),

    columnHelper.accessor(
      (article) =>
        new Intl.DateTimeFormat("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "2-digit",
        }).format(article.publicationDate),
      {
        header: "Published",
      }
    ),
    columnHelper.accessor(
      (row) =>
        row.writers.map((w) => `${w.firstName} ${w.lastName}`).join(", "),
      { id: "writers" }
    ),
    columnHelper.display({
      header: "Featured",
      cell: (props) => (
        <Toggle
          color="success"
          checked={props.row.original.featured}
          onChange={() => toggleFeatured(props.row.original)}
        />
      ),
    }),
    columnHelper.display({
      header: "Edit",
      cell: (props) => (
        <Button
          color="success"
          onClick={() => {
            onClickEdit(props.row.original);
          }}
        >
          Edit
        </Button>
      ),
    }),
    columnHelper.display({
      header: "Delete",
      cell: (props) => (
        <Button
          color="error"
          onClick={() => setConfirmDeleteArticle(props.row.original)}
        >
          Delete
        </Button>
      ),
    }),
  ];

  const table = useReactTable({
    data: tableArticles ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      {confirmDeleteArticle ? (
        <Modal
          open={confirmDeleteArticle != null}
          onClose={() => setConfirmDeleteArticle(undefined)}
        >
          <Button
            size="sm"
            shape="circle"
            className="absolute right-2 top-2"
            onClick={() => setConfirmDeleteArticle(undefined)}
          >
            ✕
          </Button>
          <Modal.Header>Confirm Delete</Modal.Header>
          <Modal.Body>
            <div className="flex flex-col gap-4">
              <p className="text-red-500">
                ARE YOU SURE YOU WANT TO DELETE &quot;
                {confirmDeleteArticle.headline}&quot;?
                <br /> THIS IS PERMANENT
              </p>
              <Button
                color="error"
                onClick={() => confirmDelete(confirmDeleteArticle)}
              >
                Delete
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      ) : null}
      {editingArticle ? (
        <ArticleEditModal
          key={editingArticle.id}
          open={editingArticle != null}
          article={editingArticle}
          onClose={() => setEditingArticle(undefined)}
        />
      ) : null}
      <Table zebra className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="!static">
                  {header.isPlaceholder
                    ? ""
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

const ArticleEditModal = ({
  open,
  article,
  onClose,
}: {
  open: boolean;
  article: Article;
  onClose?: () => void;
}) => {
  const [headline, setHeadline] = useState(article.headline);
  const [focusSentence, setFocusSentence] = useState(article.focus);
  const [section, setSection] = useState<Section>(article.section);
  const [articleWriters, setArticleWriters] = useState<string[]>(
    article.writers.map((x) => x.id)
  );
  const [driveData, setDriveData] = useState<{
    images: {
      contributorText: string;
      contributorId?: string;
      altText?: string;
      file: File;
    }[];
    htmlFileText?: string;
  }>();
  const [thumbnailFile, setThumbnailFile] = useState<File>();
  const [thumbnailContributor, setThumbnailContributor] = useState<{
    contributorId?: string;
    contributorText?: string;
  }>({});
  const [thumbnailAlt, setThumbnailAlt] = useState<string>();
  const [thumbnailChanged, setThumbnailChanged] = useState(false);
  const thumbnailUrl = useMemo(
    () => thumbnailFile && URL.createObjectURL(thumbnailFile),
    [thumbnailFile]
  );
  const [editing, setEditing] = useState(false);

  const trpcContext = trpc.useContext();

  trpc.media.byId.useQuery(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    { id: article.thumbnailId! },
    {
      enabled: article.thumbnailId != null,
      onSuccess: async (media) => {
        if (media == null || thumbnailFile != null) return;
        setThumbnailAlt(media.alt);
        setThumbnailContributor({
          contributorId: media.contributorId ?? undefined,
          contributorText: media.contributorText,
        });
        const res = await fetch(media.contentUrl);
        const resData = await res.blob();
        const file = new File([resData], "thumbnail.jpg", {
          type: "image/jpeg",
        });
        setThumbnailFile(file);
      },
    }
  );

  const { mutateAsync: editArticle } = trpc.article.editArticle.useMutation({
    onSuccess: () => trpcContext.article.invalidate(),
  });
  const { mutateAsync: editMedia } = trpc.media.editMedia.useMutation();

  const uploadAndGenerateMedia = useUploadAndGenerateMedia();

  const onClickEdit = async () => {
    if (
      headline === "" ||
      focusSentence === "" ||
      articleWriters.length === 0
    ) {
      alert("Missing required fields!");
      return;
    }

    let articleContent: ArticleBody | undefined;
    const bodyMediaIds: string[] = [];
    if (
      driveData?.htmlFileText != null &&
      driveData.images.every(
        (img) => img.altText != null && img.contributorId != null
      )
    ) {
      const fileNameToMediaMap = new Map<string, Media>();

      for (const image of driveData.images) {
        const media = await uploadAndGenerateMedia({
          file: image.file,
          // Checked already above
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          altText: image.altText!,
          contributorText: image.contributorText,
          contributorId: image.contributorId,
        });
        fileNameToMediaMap.set(image.file.name, media);
      }

      const html = new DOMParser().parseFromString(
        driveData.htmlFileText,
        "text/html"
      );

      articleContent = parseHtml(html, fileNameToMediaMap);

      for (const media of fileNameToMediaMap.values()) {
        bodyMediaIds.push(media.id);
      }
    }

    let thumbnailMediaId: string | undefined;

    if (thumbnailChanged) {
      if (
        thumbnailFile == null ||
        thumbnailContributor?.contributorText == null ||
        thumbnailAlt == null ||
        thumbnailAlt === ""
      ) {
        alert("Missing required fields");
        return;
      }

      const thumbnailMedia = await uploadAndGenerateMedia({
        file: thumbnailFile,
        altText: thumbnailAlt,
        contributorText: thumbnailContributor.contributorText,
        contributorId: thumbnailContributor.contributorId,
      });

      thumbnailMediaId = thumbnailMedia.id;
    } else if (article.thumbnailId != null) {
      await editMedia({
        id: article.thumbnailId,
        alt: thumbnailAlt,
        contributorId: thumbnailContributor.contributorId ?? null,
        contributorText: thumbnailContributor.contributorText,
      });
    }

    await editArticle({
      id: article.id,
      headline,
      focus: focusSentence,
      section,
      writerIds: articleWriters,
      thumbnailId: thumbnailMediaId,
      body: articleContent,
      mediaIds: bodyMediaIds.length > 0 ? bodyMediaIds : undefined,
    });

    onClose?.();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Button
        size="sm"
        shape="circle"
        className="absolute right-2 top-2"
        onClick={onClose}
      >
        ✕
      </Button>
      <Modal.Header className="b-gray-300 mb-4 border-b pb-2">
        Edit &quot;{article.headline}&quot;
      </Modal.Header>
      <Modal.Body>
        <div className="flex flex-col">
          <p>Headline</p>
          <Input
            placeholder="Enter Headline"
            type="text"
            value={headline}
            onChange={({ target }) => setHeadline(target.value)}
          />
        </div>
        <div className="flex flex-col">
          <p>Focus Sentence</p>
          <Textarea
            placeholder="1-2 sentences. This is the preview of the article"
            value={focusSentence}
            onChange={({ target }) => setFocusSentence(target.value)}
          />
        </div>
        <div className="flex flex-col">
          <p>Section</p>
          <SelectSection
            value={section}
            onChange={(section) => section && setSection(section)}
          />
        </div>
        <div className="flex flex-col">
          <p>Writers</p>
          <MultiSelectContributor
            placeholder="Article Writers"
            selectedWriters={articleWriters}
            onChange={(ids) => setArticleWriters(ids)}
          />
        </div>
        <div className="flex flex-col">
          <p>Overwrite article body</p>
          <DrivePicker onChange={setDriveData} />
        </div>
        <div className="flex flex-col">
          {thumbnailUrl == null ? (
            <p>Article thumbnail image</p>
          ) : (
            <>
              <p>Current article thumbnail image</p>
              <picture>
                <img alt="thumbnail" src={thumbnailUrl} width={50} />
              </picture>
              <p>Overwrite current thumbnail: </p>
            </>
          )}

          <FileInput
            accept="image/jpeg"
            bordered
            className="cursor-pointer"
            onChange={({ target }) => {
              setThumbnailChanged(true);
              setThumbnailFile(target.files?.[0]);
              setThumbnailAlt("");
              setThumbnailContributor({});
            }}
          />
          {thumbnailFile ? (
            <div className="mt-4">
              <SelectContributor
                className="float-left w-1/2"
                placeholder="Thumbnail Contributor"
                onChange={(stuff) => {
                  console.log("setting it to", stuff);
                  setThumbnailContributor(stuff);
                }}
                selectedContributorId={thumbnailContributor.contributorId}
                selectedContributorText={thumbnailContributor.contributorText}
              />
              <Textarea
                className="w-1/2"
                placeholder="Thumbnail Alt text."
                onChange={({ target }) => setThumbnailAlt(target.value)}
                value={thumbnailAlt}
              />
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex gap-2">
          <Button className="w-1/2" color="error" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="w-1/2"
            color="success"
            onClick={async () => {
              setEditing(true);
              await onClickEdit();
              setEditing(false);
            }}
            loading={editing}
          >
            Edit
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};
