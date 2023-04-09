import { BuilderBlocks } from "@builder.io/react";

export default function MobileLayout(props: any) {
  return (
    <div className="container mx-auto mt-2">
      <BuilderBlocks
        parentElementId={props.builderBlock.id}
        dataPath="component.options.featured"
        blocks={props.featured}
        className="border-b-2 border-gray-300 pb-2"
      />
      <BuilderBlocks
        parentElementId={props.builderBlock.id}
        dataPath="component.options.column1"
        blocks={props.column1}
      />
    </div>
  );
}
