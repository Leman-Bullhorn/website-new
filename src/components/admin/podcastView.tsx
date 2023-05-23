import { useState } from "react";
import { type RouterOutputs, trpc } from "../../utils/trpc";
import { createColumnHelper, getCoreRowModel } from "@tanstack/table-core";
import Link from "next/link";
import { flexRender, useReactTable } from "@tanstack/react-table";
import Modal from "../../components/modal";
import { MultiSelectContributor } from "../../components/selectContributor";
import { cn } from "../../utils/tw";

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
            <div
              role="tooltip"
              data-tip={props.row.original.title}
              className="link-hover link tooltip tooltip-right before:whitespace-pre-wrap before:content-[attr(data-tip)]"
            >
              {props.row.original.title.substring(0, 47) + "..."}
            </div>
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
        <button
          className="btn-success btn"
          onClick={() => {
            setEditingPodcast(props.row.original);
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
          onClick={() => setConfirmDeletePodcast(props.row.original)}
        >
          Delete
        </button>
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
          <button
            className="btn-sm btn-circle btn absolute right-2 top-2"
            onClick={() => setConfirmDeletePodcast(undefined)}
          >
            ✕
          </button>
          <Modal.Header>Confirm Delete</Modal.Header>
          <Modal.Body>
            <div className="flex flex-col gap-4">
              <p className="text-red-500">
                ARE YOU SURE YOU WANT TO DELETE &quot;
                {confirmDeletePodcast.title}&quot;?
                <br /> THIS IS PERMANENT
              </p>
              <button
                className="btn-error btn"
                onClick={() => confirmDelete(confirmDeletePodcast)}
              >
                Delete
              </button>
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

      <table className="table-zebra table-compact table w-full">
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

    props.onClose?.();
  };

  return (
    <Modal open={props.open} onClose={props.onClose}>
      <button
        className="btn-sm btn-circle btn absolute right-2 top-2"
        onClick={props.onClose}
      >
        ✕
      </button>
      <Modal.Header className="b-gray-300 mb-4 border-b pb-2">
        {`Edit "${props.podcast.title}"`}
      </Modal.Header>
      <Modal.Body>
        <div className="flex flex-col">
          <p>Title</p>
          <input
            className="input-bordered input focus:outline-offset-0"
            type="text"
            placeholder="Enter Title"
            value={title}
            onChange={({ target }) => setTitle(target.value)}
          />
        </div>
        <div className="flex flex-col">
          <p>Description</p>
          <textarea
            placeholder="Enter description of the podcast"
            className="textarea-bordered textarea focus:outline-offset-0"
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
          <button className="btn-error btn w-1/2" onClick={props.onClose}>
            Cancel
          </button>
          <button
            className={cn("btn-success btn w-1/2", isEditing && "loading")}
            onClick={onClickEdit}
          >
            Edit
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
}
