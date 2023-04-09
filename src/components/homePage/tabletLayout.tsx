import { BuilderBlocks } from "@builder.io/react";

export default function TabletLayout(props: any) {
  return (
    <div className="container mx-auto mt-2">
      <BuilderBlocks
        parentElementId={props.builderBlock.id}
        dataPath="component.options.featured"
        blocks={props.featured}
        className="border-b-2 border-gray-300 pb-2"
      />

      <div className="mt-2 grid grid-cols-2 gap-4">
        <div className="col-span-1">
          <BuilderBlocks
            parentElementId={props.builderBlock.id}
            dataPath="component.options.column1"
            blocks={props.column1}
          />
        </div>
        <div className="relative col-span-1 before:absolute before:-left-2 before:h-full before:border-l before:border-gray-300">
          <BuilderBlocks
            parentElementId={props.builderBlock.id}
            dataPath="component.options.column2"
            blocks={props.column2}
          />
        </div>
      </div>
    </div>
  );
}
