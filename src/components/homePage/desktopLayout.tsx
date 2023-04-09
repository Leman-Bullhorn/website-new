import { BuilderBlocks } from "@builder.io/react";

export default function DesktopLayout(props: any) {
  return (
    <div className="container mx-auto mt-6 grid grid-cols-3 gap-4">
      <div className="col-span-2">
        <div className="grid grid-cols-2 gap-4">
          <BuilderBlocks
            parentElementId={props.builderBlock.id}
            dataPath="component.options.featured"
            blocks={props.featured}
            className="col-span-2 border-b border-gray-300 pb-2"
          />
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
      <div className="relative col-span-1 before:absolute before:-left-2 before:h-full before:border-l before:border-gray-300">
        <BuilderBlocks
          parentElementId={props.builderBlock.id}
          dataPath="component.options.column3"
          blocks={props.column3}
        />
      </div>
    </div>
  );
}
