import { BuilderBlocks } from "@builder.io/react";
import { cn } from "../../utils/tw";
import { Media } from "../../utils/media";

export default function AdditionalTabletLayout(props: any) {
  return (
    <Media lessThan={"sm"}>
      <div
        {...props.attributes}
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
