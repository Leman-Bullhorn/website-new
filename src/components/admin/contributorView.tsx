import type { Contributor } from "@prisma/client";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { trpc } from "../../utils/trpc";
import Modal from "../modal";
import RequiredStar from "../requiredStar";
import Image from "next/image";
import { cn } from "../../utils/tw";

export default function ContributorsView() {
  const [firstName, setFirstName] = useState<string>();
  const [lastName, setLastName] = useState<string>();
  const [title, setTitle] = useState<string>();
  const [bio, setBio] = useState<string>();
  const headshotRef = useRef<HTMLInputElement>(null);
  const [activeContributor, setActiveContributor] = useState<Contributor>();

  const { data: contributors } = trpc.contributor.all.useQuery();

  const tableData = useMemo(
    () =>
      contributors?.sort((a, b) =>
        a.lastName < b.lastName ? -1 : a.lastName > b.lastName ? 1 : 0
      ),
    [contributors]
  );

  const columnHelper = createColumnHelper<Contributor>();
  const columns = [
    columnHelper.display({
      header: "Name",
      cell: ({ row }) => (
        <Link
          className="flex items-center gap-1"
          href={`/contributor/${row.original.slug}`}
        >
          {row.original.headshotUrl && (
            <Image
              className="rounded-full"
              src={row.original.headshotUrl}
              width={25}
              height={25}
              alt=""
            />
          )}
          <span className="link-hover link">
            {row.original.lastName}, {row.original.firstName}
          </span>
        </Link>
      ),
    }),
    columnHelper.display({
      header: "Edit",
      cell: ({ row }) => (
        <div>
          <button
            className="btn-success btn"
            onClick={() => setActiveContributor(row.original)}
          >
            Edit
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: tableData ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { mutateAsync: createSignedUrl } =
    trpc.s3.createSignedUrl.useMutation();
  const { mutateAsync: createContributor } =
    trpc.contributor.create.useMutation();
  const trpcContext = trpc.useContext();

  const uploadHeadshot = async (file: File) => {
    const imageExtension = file.name.split(".").pop() ?? "jpg";
    const { signedUrl, imagePath } = await createSignedUrl({
      imagePath: `headshots`,
      extension: imageExtension,
    });

    fetch(signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: file,
    });

    return `https://cdn.thebullhorn.net/${imagePath}`;
  };

  const onClickCreate = async () => {
    if (
      firstName === "" ||
      firstName == null ||
      lastName === "" ||
      lastName == null ||
      title == null ||
      title === ""
    ) {
      alert("Missing required fields");
      return;
    }

    let headshotUrl: string | undefined;
    if (headshotRef.current?.files?.[0]) {
      headshotUrl = await uploadHeadshot(headshotRef.current.files?.[0]);
    }
    try {
      await createContributor({ firstName, lastName, title, bio, headshotUrl });
      alert("contributor created successfully");
    } catch (e) {
      alert("Something went wrong creating the contributor");
    }

    setFirstName(undefined);
    setLastName(undefined);
    setTitle(undefined);
    setBio(undefined);
    if (headshotRef.current) headshotRef.current.value = "";
    trpcContext.contributor.invalidate();
  };

  return (
    <>
      {activeContributor ? (
        <ContributorsEditModal
          key={activeContributor.id}
          contributor={activeContributor}
          open={activeContributor != null}
          onClose={() => setActiveContributor(undefined)}
        />
      ) : null}
      <div className="flex gap-2">
        <div className="h-[70vh] grow basis-0 overflow-x-auto">
          <table className="table-zebra table-compact table w-full">
            <thead className="sticky top-0">
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="relative col-span-1 grow basis-0 before:absolute before:-left-1 before:h-full before:border-l before:border-gray-300">
          <div className="card-bordered card" aria-label="Card">
            <div className="card-title">Create Contributor</div>
            <div className="card-body pb-0">
              <p>
                First Name <RequiredStar />
              </p>
              <input
                placeholder="Enter First Name"
                className="input-bordered input focus:outline-offset-0"
                type="text"
                value={firstName ?? ""}
                onChange={({ target }) => setFirstName(target.value)}
              />
              <p>
                Last Name <RequiredStar />
              </p>
              <input
                placeholder="Enter Last Name"
                className="input-bordered input focus:outline-offset-0"
                type="text"
                value={lastName ?? ""}
                onChange={({ target }) => setLastName(target.value)}
              />
              <p>
                Title <RequiredStar />
              </p>
              <input
                placeholder="Enter Contributor Title"
                className="input-bordered input focus:outline-offset-0"
                value={title ?? ""}
                onChange={({ target }) => setTitle(target.value)}
              />
              <p>Bio</p>
              <textarea
                placeholder="Enter Bio"
                className="textarea-bordered textarea focus:outline-offset-0"
                value={bio ?? ""}
                onChange={({ target }) => setBio(target.value)}
              />
              <p>Headshot</p>
              <input
                ref={headshotRef}
                accept="image/jpeg"
                className="file-input-bordered file-input cursor-pointer"
                type="file"
              />
            </div>
            <div className="card-actions my-2 justify-center">
              <button
                className="btn-success btn w-1/2 disabled:disabled"
                onClick={onClickCreate}
                disabled={!firstName || !lastName || !title}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const ContributorsEditModal = ({
  open,
  contributor,
  onClose,
}: {
  open: boolean;
  contributor: Contributor;
  onClose?: () => void;
}) => {
  const [firstName, setFirstName] = useState<string>(contributor.firstName);
  const [lastName, setLastName] = useState<string>(contributor.lastName);
  const [title, setTitle] = useState<string>(contributor.title);
  const [bio, setBio] = useState<string | null>(contributor.bio);
  const headshotRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);

  const { mutateAsync: createSignedUrl } =
    trpc.s3.createSignedUrl.useMutation();
  const { mutateAsync: editContributor } = trpc.contributor.edit.useMutation();
  const trpcContext = trpc.useContext();

  const uploadHeadshot = async (file: File) => {
    const imageExtension = file.name.split(".").pop() ?? "jpg";
    const { signedUrl, imagePath } = await createSignedUrl({
      imagePath: `headshots`,
      extension: imageExtension,
    });

    fetch(signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: file,
    });

    return `https://cdn.thebullhorn.net/${imagePath}`;
  };

  const onClickEdit = async () => {
    setEditing(true);
    let headshotUrl: string | undefined;
    if (headshotRef.current?.files?.[0]) {
      headshotUrl = await uploadHeadshot(headshotRef.current.files?.[0]);
    }
    try {
      await editContributor({
        id: contributor.id,
        firstName,
        lastName,
        title,
        bio,
        headshotUrl,
      });
      alert("contributor edited successfully");
    } catch (e) {
      alert("Something went wrong editing the contributor");
    }

    trpcContext.contributor.invalidate();
    setEditing(false);
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
        Edit &quot;{contributor.firstName} {contributor.lastName}&quot;
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-2">
        <div className="flex flex-col">
          <p>First Name</p>
          <input
            placeholder="Enter First Name"
            className="input-bordered input focus:outline-offset-0"
            type="text"
            value={firstName ?? ""}
            onChange={({ target }) => setFirstName(target.value)}
          />
        </div>
        <div className="flex flex-col">
          <p>Last Name</p>
          <input
            placeholder="Enter Last Name"
            className="input-bordered input focus:outline-offset-0"
            type="text"
            value={lastName ?? ""}
            onChange={({ target }) => setLastName(target.value)}
          />
        </div>
        <div className="flex flex-col">
          <p>Title</p>
          <input
            placeholder="Enter Contributor Title"
            className="input-bordered input focus:outline-offset-0"
            type="text"
            value={title ?? ""}
            onChange={({ target }) => setTitle(target.value)}
          />
        </div>
        <div className="flex flex-col">
          <p>Bio</p>
          <textarea
            placeholder="Enter Bio"
            className="textarea-bordered textarea focus:outline-offset-0"
            value={bio ?? ""}
            onChange={({ target }) => setBio(target.value)}
          />
        </div>
        {contributor.headshotUrl ? (
          <div>
            <p>Current Headshot:</p>
            <picture>
              <img alt="headshot" src={contributor.headshotUrl} width={50} />
            </picture>
          </div>
        ) : null}
        <div className="flex flex-col">
          <p>{contributor.headshotUrl ? "Change " : ""}Headshot</p>
          <input
            ref={headshotRef}
            accept="image/jpeg"
            className="file-input-bordered file-input cursor-pointer"
            type="file"
          />
        </div>
      </Modal.Body>
      <Modal.Actions>
        <button
          className={cn("btn-success btn w-full", editing && "loading")}
          onClick={onClickEdit}
        >
          Edit
        </button>
      </Modal.Actions>
    </Modal>
  );
};
