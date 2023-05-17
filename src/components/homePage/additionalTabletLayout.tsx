import { BuilderBlocks } from "@builder.io/react";
import { cn } from "../../utils/tw";
import { Media } from "../../utils/media";

export default function AdditionalTabletLayout(props: any) {
  return (
    <Media between={["sm", "lg"]}>
      <div
        {...props.attributes}
        key={props.attributes.key}
        className={cn(
          "container mx-auto grid grid-cols-2 gap-4",
          props.attributes.className
        )}
      >
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
    </Media>
  );
}
