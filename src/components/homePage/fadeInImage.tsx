import { useState } from "react";
import Image from "next/image";
import { cn } from "../../utils/tw";

export function FadeInImage(props: React.ComponentProps<typeof Image>) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      // Padding makes the element's height 2/3 the width, allowing for 3:2 AR
      className={cn(
        "relative h-0 pb-[66.6667%] transition-colors duration-300 ease-in",
        imageLoaded ? "bg-transparent" : "bg-[#EBEBEB]"
      )}
    >
      <Image
        {...props}
        className={cn(
          "transition-opacity duration-300",
          props.className,
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setImageLoaded(true)}
        // Avoids linter warning, otherwise unnecessary since its included in the prop spread
        alt={props.alt}
      />
    </div>
  );
}
