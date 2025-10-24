import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { useMemo, useState } from "react";
import Select from "react-select";
import { validateArticleBody } from "../../utils/article";
import { sections } from "../../utils/section";
import { trpc, type RouterOutputs } from "../../utils/trpc";
import { cn } from "../../utils/tw";
import Modal from "../modal";

const sectionOptions = sections.map((s) => ({
  value: s.id,
  label: s.display,
}));

type Submission = RouterOutputs["article"]["allSubmissions"][0];
export default function SubmissionsView() {
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
        <button
          className="btn-primary btn"
          onClick={() => onClickPublish(props.row.original)}
        >
          Publish
        </button>
      ),
    }),
    columnHelper.display({
      header: "Delete",
      cell: (props) => (
        <button
          className="btn-error btn"
          onClick={() => onClickDelete(props.row.original)}
        >
          Delete
        </button>
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

function PublishModal({
  open,
  onClose,
  submission,
}: {
  open: boolean;
  submission: Submission;
  onClose: () => void;
}) {
  const [headline, setHeadline] = useState(submission.headline);
  const [focusSentence, setFocusSentence] = useState(submission.focus);
  const [section, setSection] = useState<string>(submission.section);
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
      <button
        className="btn-ghost btn-sm btn-circle btn absolute right-2 top-2 text-xl"
        onClick={onClose}
      >
        ✕
      </button>
      <Modal.Header className="mb-4">
        <h2>Confirm Publish</h2>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-2">
        <div>
          <p>Headline</p>
          <input
            className="input-bordered input w-full focus:outline-offset-0"
            type="text"
            value={headline}
            onChange={({ target }) => setHeadline(target.value)}
          />
        </div>
        <div>
          <p>Focus Sentence</p>
          <textarea
            className="textarea-bordered textarea w-full"
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
          <button className="btn">View Article Preview</button>
        </Link>
        <button
          className={cn(
            "btn-primary btn w-full",
            (isUploading || isDeletingSubmission) && "loading"
          )}
          onClick={onClickPublish}
        >
          Publish
        </button>
      </Modal.Body>
    </Modal>
  );
}
