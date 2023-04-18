import { Button, Input, Table, Textarea, Tooltip } from "react-daisyui";
import { useState } from "react";
import { type RouterOutputs, trpc } from "../../utils/trpc";
import { createColumnHelper, getCoreRowModel } from "@tanstack/table-core";
import Link from "next/link";
import { flexRender, useReactTable } from "@tanstack/react-table";
import Modal from "../../components/modal";
import { MultiSelectContributor } from "../../components/selectContributor";

type Podcast = RouterOutputs["podcast"]["getAll"][0];
export default function PodcastsView() {
  const [editingPodcast, setEditingPodcast] = useState<Podcast>();
  const [confirmDeletePodcast, setConfirmDeletePodcast] = useState<Podcast>();

  const { data: podcasts } = trpc.podcast.getAll.useQuery();
  const { mutateAsync: deletePodcast } = trpc.podcast.delete.useMutation();

  const columnHelper = createColumnHelper<Podcast>();
  const columns = [
    columnHelper.accessor("title", {
      cell: (props) => (
        <Link
          className="link-hover link"
          data-tip={props.row.original.title}
          href={`/podcast/${props.row.original.slug}`}
        >
          {props.row.original.title.length > 50 ? (
            <Tooltip
              position="right"
              className="link-hover link before:whitespace-pre-wrap before:content-[attr(data-tip)]"
              message={props.row.original.title}
            >
              {props.row.original.title.substring(0, 47) + "..."}
            </Tooltip>
          ) : (
            props.row.original.title
          )}
        </Link>
      ),
    }),

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
      (row) => row.hosts.map((w) => `${w.firstName} ${w.lastName}`).join(", "),
      { id: "writers" }
    ),
    columnHelper.display({
      header: "Edit",
      cell: (props) => (
        <Button
          color="success"
          onClick={() => {
            setEditingPodcast(props.row.original);
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
          onClick={() => setConfirmDeletePodcast(props.row.original)}
        >
          Delete
        </Button>
      ),
    }),
  ];

  const table = useReactTable({
    data: podcasts ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const trpcContext = trpc.useContext();

  const confirmDelete = async (podcast: Podcast) => {
    await trpcContext.article.getAll.cancel();
    trpcContext.article.getAll.setData((oldSubmissions) =>
      oldSubmissions?.filter((s) => s.id != podcast.id)
    );
    await deletePodcast({ id: podcast.id });
    trpcContext.podcast.invalidate();
    setConfirmDeletePodcast(undefined);
  };

  return (
    <>
      {confirmDeletePodcast ? (
        <Modal
          open={confirmDeletePodcast != null}
          onClose={() => setConfirmDeletePodcast(undefined)}
        >
          <Button
            size="sm"
            shape="circle"
            className="absolute right-2 top-2"
            onClick={() => setConfirmDeletePodcast(undefined)}
          >
            ✕
          </Button>
          <Modal.Header>Confirm Delete</Modal.Header>
          <Modal.Body>
            <div className="flex flex-col gap-4">
              <p className="text-red-500">
                ARE YOU SURE YOU WANT TO DELETE &quot;
                {confirmDeletePodcast.title}&quot;?
                <br /> THIS IS PERMANENT
              </p>
              <Button
                color="error"
                onClick={() => confirmDelete(confirmDeletePodcast)}
              >
                Delete
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      ) : null}

      {editingPodcast ? (
        <PodcastEditModal
          key={editingPodcast.id}
          open={editingPodcast != null}
          podcast={editingPodcast}
          onClose={() => setEditingPodcast(undefined)}
        />
      ) : null}

      <Table compact zebra className="w-full">
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

function PodcastEditModal(props: {
  open: boolean;
  podcast: Podcast;
  onClose?: () => void;
}) {
  const [title, setTitle] = useState(props.podcast.title);
  const [description, setDescription] = useState(props.podcast.description);
  const [hostIds, setHostIds] = useState(
    props.podcast.hosts.map(({ id }) => id)
  );

  const trpcContext = trpc.useContext();

  const { mutateAsync: editPodcast, isLoading: isEditing } =
    trpc.podcast.edit.useMutation({
      onSuccess: () => trpcContext.podcast.invalidate(),
    });

  const onClickEdit = async () => {
    if (title === "" || description === "" || hostIds.length === 0) {
      alert("Missing required fields!");
      return;
    }

    await editPodcast({ id: props.podcast.id, title, description, hostIds });

    // let articleContent: ArticleBody | undefined;
    // const bodyMediaIds: string[] = [];
    // if (
    //   driveData?.htmlFileText != null &&
    //   driveData.images.every(
    //     (img) => img.altText != null && img.contributorId != null
    //   )
    // ) {
    //   const fileNameToMediaMap = new Map<string, Media>();

    //   for (const image of driveData.images) {
    //     const media = await uploadAndGenerateMedia({
    //       file: image.file,
    //       // Checked already above
    //       // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    //       altText: image.altText!,
    //       contributorText: image.contributorText,
    //       contributorId: image.contributorId,
    //     });
    //     fileNameToMediaMap.set(image.file.name, media);
    //   }

    //   const html = new DOMParser().parseFromString(
    //     driveData.htmlFileText,
    //     "text/html"
    //   );

    //   articleContent = parseHtml(html, fileNameToMediaMap);

    //   for (const media of fileNameToMediaMap.values()) {
    //     bodyMediaIds.push(media.id);
    //   }
    // }

    // let thumbnailMediaId: string | undefined;

    // if (thumbnailChanged) {
    //   if (
    //     thumbnailFile == null ||
    //     thumbnailContributor?.contributorText == null ||
    //     thumbnailAlt == null ||
    //     thumbnailAlt === ""
    //   ) {
    //     alert("Missing required fields");
    //     return;
    //   }

    //   const thumbnailMedia = await uploadAndGenerateMedia({
    //     file: thumbnailFile,
    //     altText: thumbnailAlt,
    //     contributorText: thumbnailContributor.contributorText,
    //     contributorId: thumbnailContributor.contributorId,
    //   });

    //   thumbnailMediaId = thumbnailMedia.id;
    // } else if (article.thumbnailId != null) {
    //   await editMedia({
    //     id: article.thumbnailId,
    //     alt: thumbnailAlt,
    //     contributorId: thumbnailContributor.contributorId ?? null,
    //     contributorText: thumbnailContributor.contributorText,
    //   });
    // }

    // await editArticle({
    //   id: article.id,
    //   headline,
    //   focus: focusSentence,
    //   section,
    //   writerIds: articleWriters,
    //   thumbnailId: thumbnailMediaId,
    //   body: articleContent,
    //   mediaIds: bodyMediaIds.length > 0 ? bodyMediaIds : undefined,
    // });

    props.onClose?.();
  };

  return (
    <Modal open={props.open} onClose={props.onClose}>
      <Button
        size="sm"
        shape="circle"
        className="absolute right-2 top-2"
        onClick={props.onClose}
      >
        ✕
      </Button>
      <Modal.Header className="b-gray-300 mb-4 border-b pb-2">
        {`Edit "${props.podcast.title}"`}
      </Modal.Header>
      <Modal.Body>
        <div className="flex flex-col">
          <p>Title</p>
          <Input
            placeholder="Enter Title"
            type="text"
            value={title}
            onChange={({ target }) => setTitle(target.value)}
          />
        </div>
        <div className="flex flex-col">
          <p>Description</p>
          <Textarea
            placeholder="Enter description of the podcast"
            value={description}
            onChange={({ target }) => setDescription(target.value)}
          />
        </div>
        <div className="flex flex-col">
          <p>Hosts</p>
          <MultiSelectContributor
            placeholder="Podcast Hosts"
            selectedWriters={hostIds}
            onChange={(ids) => setHostIds(ids)}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Button className="w-1/2" color="error" onClick={props.onClose}>
            Cancel
          </Button>
          <Button
            className="w-1/2"
            color="success"
            onClick={onClickEdit}
            loading={isEditing}
          >
            Edit
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}
