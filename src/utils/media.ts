import { createMedia } from "@artsy/fresnel";
import { trpc } from "./trpc";

const ExampleAppMedia = createMedia({
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  },
});

// Make styles for injection into the header of the page
export const mediaStyles = ExampleAppMedia.createMediaStyle();

export const { Media, MediaContextProvider } = ExampleAppMedia;

export function useUploadAndGenerateMedia() {
  const trpcContext = trpc.useContext();

  return async (image: {
    contributorText: string;
    contributorId?: string;
    altText: string;
    file: File;
  }) => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();

    const imageExtension = image.file.name.split(".").pop() ?? "jpg";
    const { signedUrl, imagePath } =
      await trpcContext.client.s3.createSignedUrl.mutate({
        imagePath: `images/${year}/${month}/${day}`,
        extension: imageExtension,
      });

    fetch(signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: image.file,
    });

    return await trpcContext.client.media.create.mutate({
      contributorText: image.contributorText,
      contributorId: image.contributorId,
      contentUrl: `https://cdn.thebullhorn.net/${imagePath}`,
      alt: image.altText,
    });
  };
}
