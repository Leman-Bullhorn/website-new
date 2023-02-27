import type { Article } from "@prisma/client";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { createColumnHelper, getCoreRowModel } from "@tanstack/table-core";
import Link from "next/link";
import { useMemo } from "react";
import { Button, Table, Tooltip } from "react-daisyui";
import { trpc } from "../../utils/trpc";

export default function FrontPageLayout() {
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
    columnHelper.accessor("headline", {
      cell: (props) => (
        <Link
          className="link-hover link"
          data-tip={props.row.original.headline}
          href={`/article/${props.row.original.slug}`}
        >
          {props.row.original.headline.length > 50 ? (
            <Tooltip
              position="top"
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
      <div className="col-span-1 overflow-x-scroll">
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
}
