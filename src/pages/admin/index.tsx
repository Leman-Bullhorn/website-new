import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import {
  Button,
  FileInput,
  Input,
  Menu,
  Table,
  Textarea,
  Toggle,
} from "react-daisyui";
import NavigationBar from "../../components/navigationBar";
import { getServerAuthSession } from "../../server/common/get-server-auth-session";
import type { Media, Section } from "@prisma/client";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Modal from "../../components/modal";
import { useMemo, useState } from "react";
import Select from "react-select";
import { sections } from "../../utils/section";
import { trpc } from "../../utils/trpc";
import Link from "next/link";
import {
  ArticleBody,
  parseHtml,
  validateArticleBody,
} from "../../utils/article";
import type { RouterOutputs } from "../../utils/trpc";
import SelectSection from "../../components/selectSection";
import {
  MultiSelectContributor,
  SelectContributor,
} from "../../components/selectContributor";
import DrivePicker from "../../components/drivePicker";

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
    "submissions" | "articles" | "frontPage"
  >("articles");

  return (
    <>
      <NavigationBar />
      <div className="flex gap-4 pt-4">
        <Menu className="col-span-1 h-[75vh] min-w-fit rounded-r-2xl bg-base-200 p-2">
          <Menu.Item
            className={`border-b border-gray-300 ${
              activeView === "articles" ? "underline" : ""
            }`}
            onClick={() => setActiveView("articles")}
          >
            <p>Articles</p>
          </Menu.Item>
          <Menu.Item
            className={`border-b border-gray-300 ${
              activeView === "submissions" ? "underline" : ""
            }`}
            onClick={() => setActiveView("submissions")}
          >
            <p>Submissions ({articleSubmissions?.length ?? 0})</p>
          </Menu.Item>
          <Menu.Item
            className={activeView === "frontPage" ? "underline" : ""}
            onClick={() => setActiveView("frontPage")}
          >
            <p>Front Page Layout</p>
          </Menu.Item>
        </Menu>
        <div className="mr-4 w-full overflow-x-auto">
          {activeView === "articles" ? (
            <ArticlesView />
          ) : activeView === "submissions" ? (
            <SubmissionsView />
          ) : activeView === "frontPage" ? (
            <FrontPageLayout />
          ) : null}
        </div>
      </div>
    </>
  );
};

const FrontPageLayout = () => {
  const trpcContext = trpc.useContext();
  const { data: allArticles } = trpc.article.getAll.useQuery();
  const {
    mutateAsync: setArticleFrontPagePosition,
    isLoading: isUpdatingIndex,
  } = trpc.article.setArticleFrontPagePosition.useMutation();
  const columnHelper = createColumnHelper<Article>();

  const onClickUp = async (article: Article) => {
    await trpcContext.article.getAll.cancel();

    const clickedArticleFrontPageIndex = allArticles?.find(
      ({ id }) => id === article.id
    )?.frontPageIndex;
    if (clickedArticleFrontPageIndex == null) return;

    trpcContext.article.getAll.setData((articles) => {
      if (articles == null) return articles;
      const articlesCopy = structuredClone(articles);
      const clickedArticle = articlesCopy.find(({ id }) => id === article.id);
      if (clickedArticle == null) return articlesCopy;
      const aboveArticle = articlesCopy.find(
        ({ frontPageIndex }) =>
          frontPageIndex === clickedArticle.frontPageIndex! - 1
      );
      if (aboveArticle == null) return articlesCopy;

      aboveArticle.frontPageIndex!++;
      clickedArticle.frontPageIndex!--;

      return articlesCopy;
    });

    await setArticleFrontPagePosition({
      id: article.id,
      index: clickedArticleFrontPageIndex - 1,
    });
    trpcContext.article.invalidate();
  };

  const onClickDown = async (article: Article) => {
    await trpcContext.article.getAll.cancel();

    const clickedArticleFrontPageIndex = allArticles?.find(
      ({ id }) => id === article.id
    )?.frontPageIndex;
    if (clickedArticleFrontPageIndex == null) return;

    trpcContext.article.getAll.setData((articles) => {
      if (articles == null) return articles;

      const articlesCopy = structuredClone(articles);
      const clickedArticle = articlesCopy.find(({ id }) => id === article.id);
      if (clickedArticle == null) return articlesCopy;

      const belowArticle = articlesCopy.find(
        ({ frontPageIndex }) =>
          frontPageIndex === clickedArticle.frontPageIndex! + 1
      );
      if (belowArticle == null) return articlesCopy;

      belowArticle.frontPageIndex!--;
      clickedArticle.frontPageIndex!++;

      return articlesCopy;
    });

    await setArticleFrontPagePosition({
      id: article.id,
      index: clickedArticleFrontPageIndex + 1,
    });
    trpcContext.article.invalidate();
  };

  const onClickRight = async (article: Article) => {
    await trpcContext.article.getAll.cancel();
    trpcContext.article.getAll.setData((articles) => {
      if (articles == null) return articles;
      const articlesCopy = structuredClone(articles);
      const clickedArticle = articlesCopy.find(({ id }) => id === article.id);
      if (clickedArticle == null) return articlesCopy;
      clickedArticle.frontPageIndex = null;
      return articlesCopy;
    });
    await setArticleFrontPagePosition({
      id: article.id,
      index: null,
    });
    trpcContext.article.invalidate();
  };

  const onClickLeft = async (article: Article) => {
    // TODO: optimistic update
    await setArticleFrontPagePosition({ id: article.id, index: 0 });
    trpcContext.article.invalidate();
  };

  const frontPageTableColumns = [
    columnHelper.accessor("headline", {}),
    columnHelper.accessor("focus", {}),
    columnHelper.display({
      header: "Move",
      cell: (props) =>
        props.row.original.featured ? (
          <p className="text-orange-400">Featured</p>
        ) : (
          <div>
            <Button
              size="sm"
              color="accent"
              disabled={props.row.index === 1 || isUpdatingIndex}
              onClick={() => onClickUp(props.row.original)}
            >
              &#x2191;
            </Button>
            <Button
              size="sm"
              color="info"
              disabled={
                (frontPageArticles &&
                  frontPageArticles.length - 1 === props.row.index) ||
                isUpdatingIndex
              }
              onClick={() => onClickDown(props.row.original)}
            >
              &#x2193;
            </Button>
            <Button
              disabled={isUpdatingIndex}
              color="error"
              size="sm"
              onClick={() => onClickRight(props.row.original)}
            >
              &#x2192;
            </Button>
          </div>
        ),
    }),
  ];
  const notFrontPageTableColumns = [
    columnHelper.accessor("headline", {}),
    columnHelper.accessor("focus", {}),
    columnHelper.display({
      header: "Move",
      cell: (props) => (
        <Button
          size="sm"
          color="success"
          disabled={isUpdatingIndex}
          onClick={() => onClickLeft(props.row.original)}
        >
          &#x2190;
        </Button>
      ),
    }),
  ];

  const frontPageArticles = useMemo(() => {
    const filteredArticles = allArticles?.filter(
      (article) => article.frontPageIndex != null || article.featured
    );

    return filteredArticles?.sort((a, b) =>
      a.featured ? -1 : b.featured ? 1 : a.frontPageIndex! - b.frontPageIndex!
    );
  }, [allArticles]);

  const notFrontPageArticles = useMemo(() => {
    const filteredArticles = allArticles?.filter(
      (article) => article.frontPageIndex == null && !article.featured
    );
    // sort by most recently published
    return filteredArticles?.sort(
      (a, b) => b.publicationDate.getTime() - a.publicationDate.getTime()
    );
  }, [allArticles]);

  const frontPageTable = useReactTable({
    data: frontPageArticles ?? [],
    columns: frontPageTableColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  const notFrontPageTable = useReactTable({
    data: notFrontPageArticles ?? [],
    columns: notFrontPageTableColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <div className="grid h-[80vh] grid-cols-2 gap-2">
      <div className="col-span-1">
        <p>Front page articles order</p>
        <Table zebra className="w-full">
          <thead>
            {frontPageTable.getHeaderGroups().map((headerGroup) => (
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
            {frontPageTable.getRowModel().rows.map((row) => (
              <tr
                className={`hover ${
                  row.original.featured
                    ? "rounded-full border border-orange-400"
                    : ""
                }`}
                key={row.id}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      <div className="relative col-span-1 before:absolute before:-left-1 before:h-full before:border-l before:border-gray-300">
        <p>Articles not on front page</p>
        <Table zebra className="w-full">
          <thead>
            {notFrontPageTable.getHeaderGroups().map((headerGroup) => (
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
            {notFrontPageTable.getRowModel().rows.map((row) => (
              <tr className="hover" key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

type Article = RouterOutputs["article"]["getAll"][0];
const ArticlesView = () => {
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
    columnHelper.accessor("headline", {}),
    columnHelper.accessor("section", {}),
    columnHelper.accessor((article) => article.publicationDate.toDateString(), {
      header: "Publication Date",
    }),
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
};

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
      contributorId?: string;
      altText?: string;
      file: File;
    }[];
    htmlFileText?: string;
  }>();
  const [thumbnailFile, setThumbnailFile] = useState<File>();
  const [thumbnailContributor, setThumbnailContributor] = useState<
    string | null
  >();
  const [thumbnailAlt, setThumbnailAlt] = useState<string>();
  const [thumbnailChanged, setThumbnailChanged] = useState(false);
  const thumbnailUrl = useMemo(
    () => thumbnailFile && URL.createObjectURL(thumbnailFile),
    [thumbnailFile]
  );
  const [editing, setEditing] = useState(false);

  const trpcContext = trpc.useContext();

  trpc.media.byId.useQuery(
    { id: article.thumbnailId! },
    {
      enabled: article.thumbnailId != null,
      onSuccess: async (data) => {
        if (data == null || thumbnailFile != null) return;
        setThumbnailAlt(data.alt);
        setThumbnailContributor(data.contributorId);
        const res = await fetch(data.contentUrl);
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
        const media = await uploadAndGenerateMedia(image);
        fileNameToMediaMap.set(image.file.name, media);
      }

      const html = new DOMParser().parseFromString(
        driveData.htmlFileText,
        "text/html"
      );

      articleContent = parseHtml(html, fileNameToMediaMap);

      // const bodyMediaIds: string[] = [];
      for (const media of fileNameToMediaMap.values()) {
        bodyMediaIds.push(media.id);
      }
    }

    let thumbnailMediaId: string | undefined;

    if (thumbnailChanged) {
      if (
        thumbnailFile == null ||
        thumbnailContributor == null ||
        thumbnailAlt == null ||
        thumbnailAlt === ""
      ) {
        alert("Missing required fields");
        return;
      }

      const thumbnailMedia = await uploadAndGenerateMedia({
        file: thumbnailFile,
        altText: thumbnailAlt,
        contributorId: thumbnailContributor,
      });

      thumbnailMediaId = thumbnailMedia.id;
    } else if (article.thumbnailId != null) {
      await editMedia({
        id: article.thumbnailId,
        alt: thumbnailAlt,
        contributorId: thumbnailContributor,
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
      <Modal.Body className="">
        <div className="flex flex-col">
          <p>Headline</p>
          <Input
            placeholder="Enter Headline"
            type="text"
            value={headline}
            onChange={({ target }) => setHeadline(target.value)}
          />
          <div className="flex flex-col">
            <p>Focus Sentence</p>
            <Textarea
              placeholder="1-2 sentences. This is the preview of the article"
              value={focusSentence}
              onChange={({ target }) => setFocusSentence(target.value)}
            />
          </div>
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
              setThumbnailContributor(undefined);
            }}
          />
          {thumbnailFile ? (
            <div className="mt-4">
              <SelectContributor
                className="float-left w-1/2"
                placeholder="Thumbnail Contributor"
                onChange={setThumbnailContributor}
                selectedContributor={thumbnailContributor}
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

type Submission = RouterOutputs["article"]["allSubmissions"][0];
const SubmissionsView = () => {
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<Submission>();

  const { data: submissions } = trpc.article.allSubmissions.useQuery();
  const { mutateAsync: deleteSubmission } =
    trpc.article.deleteSubmission.useMutation();

  const trpcContext = trpc.useContext();

  const onClickPublish = (row: Submission) => {
    setPublishModalOpen(true);
    setActiveRow(row);
  };

  const onClickDelete = async (row: Submission) => {
    trpcContext.article.allSubmissions.setData((oldSubmissions) =>
      oldSubmissions?.filter((s) => s.id != row.id)
    );
    await deleteSubmission({ id: row.id });
    trpcContext.article.allSubmissions.invalidate();
  };

  const columnHelper = createColumnHelper<Submission>();
  const columns = [
    columnHelper.accessor("headline", {}),
    columnHelper.accessor("section", {}),
    columnHelper.accessor(
      (row) =>
        row.writers.map((w) => `${w.firstName} ${w.lastName}`).join(", "),
      { id: "writers" }
    ),
    columnHelper.display({
      header: "Publish",
      cell: (props) => (
        <Button
          color="primary"
          onClick={() => onClickPublish(props.row.original)}
        >
          Publish
        </Button>
      ),
    }),
    columnHelper.display({
      header: "Delete",
      cell: (props) => (
        <Button color="error" onClick={() => onClickDelete(props.row.original)}>
          Delete
        </Button>
      ),
    }),
  ];

  const table = useReactTable({
    data: submissions ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <>
      {activeRow && (
        <PublishModal
          key={activeRow.id}
          open={publishModalOpen}
          submission={activeRow}
          onClose={() => setPublishModalOpen(false)}
        />
      )}
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
};

const sectionOptions = sections.map((s) => ({
  value: s.dbSection,
  label: s.display,
}));

const PublishModal = ({
  open,
  onClose,
  submission,
}: {
  open: boolean;
  submission: Submission;
  onClose: () => void;
}) => {
  const [headline, setHeadline] = useState(submission.headline);
  const [focusSentence, setFocusSentence] = useState(submission.focus);
  const [section, setSection] = useState<Section>(submission.section);
  const [writers, setWriters] = useState(submission.writers);

  const { data: contributors } = trpc.contributor.all.useQuery();
  const { mutateAsync: createArticle, isLoading: isUploading } =
    trpc.article.create.useMutation();
  const { mutateAsync: deleteSubmission, isLoading: isDeletingSubmission } =
    trpc.article.deleteSubmission.useMutation();

  const trpcContext = trpc.useContext();

  const writerOptions = useMemo(
    () =>
      contributors?.map((w) => ({
        value: w,
        label: `${w.firstName} ${w.lastName}`,
      })),
    [contributors]
  );

  const onClickPublish = async () => {
    const articleBody = validateArticleBody(submission.body);
    if (articleBody == null) return;
    await createArticle({
      headline,
      focus: focusSentence,
      section,
      body: articleBody,
      writerIds: writers.map((w) => w.id),
      mediaIds: submission.media.map((m) => m.id),
      thumbnailId: submission.thumbnailId ?? undefined,
    });
    trpcContext.article.allSubmissions.setData((oldSubmissions) =>
      oldSubmissions?.filter((s) => s.id != submission.id)
    );
    await deleteSubmission({ id: submission.id });
    trpcContext.article.allSubmissions.invalidate();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Button
        color="ghost"
        size="sm"
        shape="circle"
        className="absolute right-2 top-2 text-xl"
        onClick={onClose}
      >
        ✕
      </Button>
      <Modal.Header className="mb-4">
        <h2>Confirm Publish</h2>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-2">
        <div>
          <p>Headline</p>
          <Input
            className="w-full"
            type="text"
            value={headline}
            onChange={({ target }) => setHeadline(target.value)}
          />
        </div>
        <div>
          <p>Focus Sentence</p>
          <Textarea
            className="w-full"
            value={focusSentence}
            onChange={({ target }) => setFocusSentence(target.value)}
          />
        </div>
        <div>
          <p>Section</p>
          <Select
            options={sectionOptions}
            value={sectionOptions.find((v) => v.value === section)}
            onChange={(it) => it && setSection(it.value)}
          />
        </div>
        <div>
          <p>Writers</p>
          <Select
            isLoading={contributors == null}
            isMulti
            closeMenuOnSelect={false}
            options={writerOptions}
            value={writers.map((v) =>
              writerOptions?.find((o) => o.value.id === v.id)
            )}
            onChange={(it) => setWriters(it.map((v) => v!.value))}
          />
        </div>
        <Link
          href={{
            pathname: `/admin/preview/${submission.id}`,
            query: {
              headline,
              section,
              writers: writers.map((w) => w.id),
            },
          }}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Button>View Article Preview</Button>
        </Link>
        <Button
          className="w-full"
          color="primary"
          onClick={onClickPublish}
          loading={isUploading || isDeletingSubmission}
        >
          Publish
        </Button>
      </Modal.Body>
    </Modal>
  );
};

export default SectionPage;

// const FrontPageLayout = () => {
//   const trpcContext = trpc.useContext();
//   const { data: allArticles } = trpc.article.getAll.useQuery();
//   const { mutateAsync: setArticleFrontPagePosition } =
//     trpc.article.setArticleFrontPagePosition.useMutation();
//   const columnHelper = createColumnHelper<Article>();
//   const columns = [
//     columnHelper.accessor("headline", {}),
//     columnHelper.accessor("focus", {}),
//   ];

//   const frontPageArticles = useMemo(() => {
//     const filteredArticles = allArticles?.filter(
//       (article) => article.frontPageIndex != null
//     );

//     return filteredArticles?.sort(
//       (a, b) => a.frontPageIndex! - b.frontPageIndex!
//     );
//   }, [allArticles]);

//   const notFrontPageArticles = useMemo(() => {
//     const filteredArticles = allArticles?.filter(
//       (article) => article.frontPageIndex == null && !article.featured
//     );
//     // sort by most recently published
//     return filteredArticles?.sort(
//       (a, b) => b.publicationDate.getTime() - a.publicationDate.getTime()
//     );
//   }, [allArticles]);

//   // const [frontPageArticles, setFrontPageArticles] = useState<Article[]>();
//   // const [notFrontPageArticles, setNotFrontPageArticles] = useState<Article[]>();

//   // useEffect(() => {
//   //   setFrontPageArticles(
//   //     allArticles?.filter(
//   //       (article) => article.frontPageIndex != null || article.featured
//   //     )
//   //   );
//   //   setNotFrontPageArticles(
//   //     allArticles?.filter(
//   //       (article) => article.frontPageIndex == null && !article.featured
//   //     )
//   //   );
//   // }, [allArticles]);

//   // const frontPageArticles = useMemo(
//   //   () =>
//   //     allArticles?.filter(
//   //       (article) => article.frontPageIndex != null || article.featured
//   //     ),
//   //   [allArticles]
//   // );

//   // const notFrontPageArticles = useMemo(
//   //   () =>
//   //     allArticles?.filter(
//   //       (article) => article.frontPageIndex == null && !article.featured
//   //     ),
//   //   [allArticles]
//   // );

//   // const [frontPageArticlesCopy, setFrontPageArticlesCopy] =
//   //   useState<Article[]>();
//   // const [notFrontPageArticlesCopy, setNotFrontPageArticlesCopy] =
//   //   useState<Article[]>();

//   const frontPageTable = useReactTable({
//     data: frontPageArticles ?? [],
//     columns,
//     getCoreRowModel: getCoreRowModel(),
//     getRowId: (row) => row.id,
//   });
//   const notFrontPageTable = useReactTable({
//     data: notFrontPageArticles ?? [],
//     columns,
//     getCoreRowModel: getCoreRowModel(),
//     getRowId: (row) => row.id,
//   });

//   const sensors = useSensors(useSensor(PointerSensor));

//   const [activeId, setActiveId] = useState<string>();
//   const activeArticle = useMemo(() => {
//     const frontPageArticle = frontPageTable
//       .getRowModel()
//       .rows.find(({ id }) => id === activeId);
//     if (frontPageArticle != null) return frontPageArticle;
//     return notFrontPageTable
//       .getRowModel()
//       .rows.find(({ id }) => id === activeId);
//   }, [activeId, frontPageTable, notFrontPageTable]);

//   const findContainer = (id: UniqueIdentifier) => {
//     if (id === "frontPageSortable" || id === "notFrontPageSortable") {
//       return id;
//     }

//     if (
//       frontPageTable
//         .getRowModel()
//         .rows.find(({ original }) => original.id === id) != null
//     )
//       return "frontPageSortable";
//     if (
//       notFrontPageTable
//         .getRowModel()
//         .rows.find(({ original }) => original.id === id) != null
//     )
//       return "notFrontPageSortable";
//   };

//   const getContainerItems = (
//     containerId: "frontPageSortable" | "notFrontPageSortable"
//   ) => {
//     if (containerId === "frontPageSortable") {
//       return frontPageTable.getRowModel().rows.map(({ original }) => original);
//     } else {
//       return notFrontPageTable
//         .getRowModel()
//         .rows.map(({ original }) => original);
//     }
//   };

//   return (
//     <DndContext
//       collisionDetection={closestCenter}
//       measuring={{
//         droppable: {
//           strategy: MeasuringStrategy.Always,
//         },
//       }}
//       sensors={sensors}
//       onDragStart={(e) => {
//         setActiveId(e.active.id as string);
//       }}
//       onDragEnd={async ({ over, active }) => {
//         const overId = over?.id;

//         if (overId == null) {
//           setActiveId(undefined);
//           return;
//         }

//         const overContainer = findContainer(overId);
//         if (overContainer == null) {
//           setActiveId(undefined);
//           return;
//         }
//         // const overContainerItems = getContainerItems(overContainer);

//         // const activeIndex = overContainerItems.findIndex(
//         //   (article) => article.id === active.id
//         // );
//         // const overIndex = overContainerItems.findIndex(
//         //   (article) => article.id === overId
//         // );
//         // if (activeIndex !== overIndex && activeIndex !== -1) {
//         if (overContainer === "frontPageSortable") {
//           await trpcContext.article.getAll.cancel();
//           trpcContext.article.getAll.setData((oldArticles) => {
//             const articlesCopy = structuredClone(oldArticles);
//             const activeArticle = articlesCopy?.find(
//               (article) => article.id === active.id
//             );
//             const overArticle = articlesCopy?.find(
//               (article) => article.id === overId
//             );
//             if (
//               activeArticle == null ||
//               overArticle == null ||
//               articlesCopy == null
//             )
//               return articlesCopy;
//             const overArticleIndex = overArticle.frontPageIndex;
//             if (overArticleIndex == null) return articlesCopy;
//             activeArticle.frontPageIndex = overArticleIndex;
//             for (const article of articlesCopy) {
//               if (
//                 article.frontPageIndex &&
//                 article.frontPageIndex > overArticleIndex
//               ) {
//                 article.frontPageIndex++;
//               }
//             }
//             overArticle.frontPageIndex = overArticleIndex + 1;
//             return articlesCopy;
//           });
//           await setArticleFrontPagePosition({
//             id: active.id.toString(),
//             index: overArticleIndex,
//           });
//           trpcContext.article.invalidate();
//         } else {
//           setArticleFrontPagePosition({
//             id: active.id.toString(),
//             index: null,
//           });
//           setNotFrontPageArticles(
//             arrayMove(overContainerItems, activeIndex, overIndex)
//           );
//         }
//         // }

//         setActiveId(undefined);
//       }}
//       onDragOver={({ active, over }) => {
//         const overId = over?.id;
//         if (overId == null) return;
//         console.log("dragover", { active, over });

//         const activeContainerId = findContainer(active.id);
//         const overContainerId = findContainer(overId);

//         if (
//           activeContainerId == null ||
//           overContainerId == null ||
//           activeContainerId === overContainerId
//         )
//           return;

//         const activeContainerItems = getContainerItems(activeContainerId);
//         const overContainerItems = getContainerItems(overContainerId);

//         const overIndex = overContainerItems.findIndex(
//           (article) => article.id === overId
//         );
//         const activeIndex = activeContainerItems.findIndex(
//           (article) => article.id === active.id
//         );

//         let newIndex: number;
//         if (
//           overId === "frontPageSortable" ||
//           overId === "notFrontPageSortable"
//         ) {
//           newIndex = overContainerItems.length;
//         } else {
//           const isBelowOverItem =
//             over &&
//             active.rect.current.translated &&
//             active.rect.current.translated.top >
//               over.rect.top + over.rect.height;

//           const modifier = isBelowOverItem ? 1 : 0;
//           newIndex =
//             overIndex >= 0
//               ? overIndex + modifier
//               : overContainerItems.length + 1;
//         }
//         console.log("move to index", newIndex);
//         if (overContainerId === "frontPageSortable") {
//           const newFrontPageArticles = [
//             ...overContainerItems.slice(0, newIndex),
//             activeContainerItems[activeIndex]!,
//             ...overContainerItems.slice(newIndex),
//           ];
//           setFrontPageArticles(newFrontPageArticles);
//           const newNotFrontPageArticles = activeContainerItems.filter(
//             (article) => article.id !== active.id
//           );
//           setNotFrontPageArticles(newNotFrontPageArticles);
//         } else {
//           const newNotFrontPageArticles = [
//             ...overContainerItems.slice(0, newIndex),
//             activeContainerItems[activeIndex]!,
//             ...overContainerItems.slice(newIndex),
//           ];
//           setNotFrontPageArticles(newNotFrontPageArticles);
//           const newFrontPageArticles = activeContainerItems.filter(
//             (article) => article.id !== active.id
//           );
//           setFrontPageArticles(newFrontPageArticles);
//         }
//       }}
//     >
//       <div className="grid h-[80vh] grid-cols-2 gap-2">
//         <SortableColumn id="frontPageSortable" table={frontPageTable}>
//           <p>Front page articles order</p>
//           <Table zebra className=" w-full">
//             <thead>
//               {frontPageTable.getHeaderGroups().map((headerGroup) => (
//                 <tr key={headerGroup.id}>
//                   {headerGroup.headers.map((header) => (
//                     <th key={header.id} className="!static">
//                       {header.isPlaceholder
//                         ? ""
//                         : flexRender(
//                             header.column.columnDef.header,
//                             header.getContext()
//                           )}
//                     </th>
//                   ))}
//                 </tr>
//               ))}
//             </thead>
//             <tbody>
//               {frontPageTable.getRowModel().rows.map((row) => (
//                 <DraggableRow key={row.id} row={row} />
//               ))}
//             </tbody>
//           </Table>
//         </SortableColumn>
//         <DroppableColumn
//           id="notFrontPageSortable"
//           className="relative before:absolute before:-left-1 before:h-full before:border-l before:border-gray-300"
//         >
//           <p>Articles not on front page</p>
//           <Table zebra className="w-full">
//             <thead>
//               {notFrontPageTable.getHeaderGroups().map((headerGroup) => (
//                 <tr key={headerGroup.id}>
//                   {headerGroup.headers.map((header) => (
//                     <th key={header.id} className="!static">
//                       {header.isPlaceholder
//                         ? ""
//                         : flexRender(
//                             header.column.columnDef.header,
//                             header.getContext()
//                           )}
//                     </th>
//                   ))}
//                 </tr>
//               ))}
//             </thead>
//             <tbody>
//               {notFrontPageTable.getRowModel().rows.map((row) => (
//                 <DraggableRow key={row.id} row={row} />
//               ))}
//             </tbody>
//           </Table>
//         </DroppableColumn>
//       </div>
//       <DragOverlay>
//         {activeId ? (
//           <Table className="w-full">
//             <tbody>
//               <tr>
//                 {activeArticle?.getVisibleCells().map((cell) => (
//                   <td key={cell.id} className="bg-base-300">
//                     {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                   </td>
//                 ))}
//               </tr>
//             </tbody>
//           </Table>
//         ) : null}
//       </DragOverlay>
//     </DndContext>
//   );
// };

// function DroppableColumn({
//   id,
//   children,
//   className,
// }: {
//   id: string;
//   children: JSX.Element[];
//   className?: string;
// }) {
//   const { setNodeRef } = useDroppable({ id });
//   return (
//     <div className={`col-span-1 ${className ?? ""}`} ref={setNodeRef}>
//       {children}
//     </div>
//   );
// }

// function SortableColumn({
//   table,
//   id,
//   children,
//   className,
// }: {
//   id: string;
//   table: TableType<Article>;
//   children: JSX.Element[];
//   className?: string;
// }) {
//   return (
//     <SortableContext
//       items={table.getRowModel().rows.map((row) => row.id)}
//       strategy={verticalListSortingStrategy}
//     >
//       <DroppableColumn id={id} className={className}>
//         {children}
//       </DroppableColumn>
//     </SortableContext>
//   );
// }

// function DraggableRow<T>({ row }: { row: Row<T> }) {
//   const {
//     attributes,
//     listeners,
//     setNodeRef,
//     transform,
//     transition,
//     isDragging,
//   } = useSortable({ id: row.id });

//   return (
//     <tr
//       className={`hover ${isDragging ? "opacity-50" : ""}`}
//       ref={setNodeRef}
//       style={{ transform: CSS.Transform.toString(transform), transition }}
//       {...attributes}
//       {...listeners}
//     >
//       {row.getVisibleCells().map((cell) => (
//         <td key={cell.id}>
//           {flexRender(cell.column.columnDef.cell, cell.getContext())}
//         </td>
//       ))}
//     </tr>
//   );
// }
