import { BuilderBlocks } from "@builder.io/react";
import { cn } from "../../utils/tw";
import { Media } from "../../utils/media";

export default function AdditionalTabletLayout(props: any) {
  const { key: _, ...attributes } = props.attributes;
  return (
    <Media lessThan={"sm"}>
      <div
        {...attributes}
        className={cn("container mx-auto", props.attributes.className)}
      >
        <BuilderBlocks
          parentElementId={props.builderBlock.id}
          dataPath="component.options.column1"
          blocks={props.column1}
        />
      </div>
    </Media>
  );
}
