import type { Media } from "@prisma/client";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { createColumnHelper, getCoreRowModel } from "@tanstack/table-core";
import Link from "next/link";
import { useMemo, useState } from "react";
import { parseHtml, type ArticleBody } from "../../utils/article";
import { useUploadAndGenerateMedia } from "../../utils/media";
import { type RouterOutputs, trpc } from "../../utils/trpc";
import { cn } from "../../utils/tw";
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

  const trpcContext = trpc.useContext();
  const tableArticles = useMemo(() => {
    if (articles == null) return undefined;
    const sorted = [...articles].sort(
      (a, b) => b.publicationDate.getTime() - a.publicationDate.getTime()
    );

    return sorted;
  }, [articles]);

  // TODO
  const onClickEdit = (article: Article) => {
    setEditingArticle(article);
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
            <div
              role="tooltip"
              data-tip={props.row.original.headline}
              className="link-hover link tooltip tooltip-right before:whitespace-pre-wrap before:content-[attr(data-tip)]"
            >
              {props.row.original.headline.substring(0, 47) + "..."}
            </div>
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
      (row) => {
        const str = row.writers
          .map((w) => `${w.firstName} ${w.lastName}`)
          .join(", ");
        if (str.length <= 25) {
          return str;
        } else {
          return str.slice(0, 22) + "...";
        }
      },
      { id: "writers" }
    ),
    columnHelper.display({
      header: "Edit",
      cell: (props) => (
        <button
          className="btn-success btn"
          onClick={() => {
            onClickEdit(props.row.original);
          }}
        >
          Edit
        </button>
      ),
    }),
    columnHelper.display({
      header: "Delete",
      cell: (props) => (
        <button
          className="btn-error btn"
          onClick={() => setConfirmDeleteArticle(props.row.original)}
        >
          Delete
        </button>
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
          <button
            className="btn-sm btn-circle btn absolute right-2 top-2"
            onClick={() => setConfirmDeleteArticle(undefined)}
          >
            ✕
          </button>
          <Modal.Header>Confirm Delete</Modal.Header>
          <Modal.Body>
            <div className="flex flex-col gap-4">
              <p className="text-red-500">
                ARE YOU SURE YOU WANT TO DELETE &quot;
                {confirmDeleteArticle.headline}&quot;?
                <br /> THIS IS PERMANENT
              </p>
              <button
                className="btn-error btn"
                onClick={() => confirmDelete(confirmDeleteArticle)}
              >
                Delete
              </button>
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
      <table className="table-zebra table w-full">
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
      </table>
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
  const [section, setSection] = useState<string>(article.section);
  const [articleWriters, setArticleWriters] = useState<string[]>(
    article.writers.map((x) => x.id)
  );
  const [publicationDate, setPublicationDate] = useState(() =>
    // convert to yyyy:mm:ddThh:mm:ss for "datetime-local" input
    new Date(
      article.publicationDate.getTime() -
        new Date().getTimezoneOffset() * 60 * 1000
    )
      .toISOString()
      .slice(0, 19)
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
  }>({
    contributorId: article.thumbnail?.contributorId ?? undefined,
    contributorText: article.thumbnail?.contributorText,
  });
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
      publicationDate: new Date(publicationDate),
      writerIds: articleWriters,
      thumbnailId: thumbnailMediaId,
      body: articleContent,
      mediaIds: bodyMediaIds.length > 0 ? bodyMediaIds : undefined,
    });

    onClose?.();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <button
        className="btn-sm btn-circle btn absolute right-2 top-2"
        onClick={onClose}
      >
        ✕
      </button>
      <Modal.Header className="b-gray-300 mb-4 border-b pb-2">
        Edit &quot;{article.headline}&quot;
      </Modal.Header>
      <Modal.Body>
        <div className="flex flex-col">
          <p>Headline</p>
          <input
            className="input-bordered input focus:outline-offset-0"
            type="text"
            placeholder="Enter Headline"
            value={headline}
            onChange={({ target }) => setHeadline(target.value)}
          />
        </div>
        <div className="flex flex-col">
          <p>Focus Sentence</p>
          <textarea
            placeholder="1-2 sentences. This is the preview of the article"
            className="textarea-bordered textarea focus:outline-offset-0"
            onChange={({ target }) => setFocusSentence(target.value)}
            value={focusSentence}
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
          <p>Publication Date</p>
          <input
            type="datetime-local"
            className="input-bordered input focus:outline-offset-0"
            value={publicationDate}
            onChange={({ target }) =>
              target.value.length > 0 && setPublicationDate(target.value)
            }
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

          <input
            accept="image/jpeg"
            className="file-input-bordered file-input cursor-pointer"
            type="file"
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
                onChange={setThumbnailContributor}
                selectedContributorId={thumbnailContributor.contributorId}
                selectedContributorText={thumbnailContributor.contributorText}
              />
              <textarea
                className="textarea-bordered textarea w-1/2 focus:outline-offset-0"
                placeholder="Thumbnail Alt text."
                onChange={({ target }) => setThumbnailAlt(target.value)}
                value={thumbnailAlt}
              />
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex gap-2">
          <button className="btn-error btn w-1/2" onClick={onClose}>
            Cancel
          </button>
          <button
            className={cn("btn-success btn w-1/2", editing && "loading")}
            onClick={async () => {
              setEditing(true);
              await onClickEdit();
              setEditing(false);
            }}
          >
            Edit
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};
