import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import { Menu } from "react-daisyui";
import NavigationBar from "../../components/navigationBar";
import { getServerAuthSession } from "../../server/common/get-server-auth-session";
import { useState } from "react";
import { trpc } from "../../utils/trpc";
import FrontPageLayout from "../../components/admin/frontPageLayout";
import ContributorsView from "../../components/admin/contributorView";
import ArticlesView from "../../components/admin/articleView";
import SubmissionsView from "../../components/admin/submissionsView";
import Head from "next/head";

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
    "submissions" | "articles" | "frontPage" | "Contributors"
  >("articles");

  return (
    <>
      <Head>
        <title>Admin Dashboard</title>
      </Head>
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
            className={`border-b border-gray-300 ${
              activeView === "frontPage" ? "underline" : ""
            }`}
            onClick={() => setActiveView("frontPage")}
          >
            <p>Front Page Layout</p>
          </Menu.Item>
          <Menu.Item
            className={activeView === "Contributors" ? "underline" : ""}
            onClick={() => setActiveView("Contributors")}
          >
            <p>Contributors</p>
          </Menu.Item>
        </Menu>
        <div className="mr-4 w-full overflow-x-auto">
          {activeView === "articles" ? (
            <ArticlesView />
          ) : activeView === "submissions" ? (
            <SubmissionsView />
          ) : activeView === "frontPage" ? (
            <FrontPageLayout />
          ) : activeView === "Contributors" ? (
            <ContributorsView />
          ) : null}
        </div>
      </div>
    </>
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
