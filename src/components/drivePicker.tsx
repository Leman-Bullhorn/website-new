// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let google: any;

import { unzip } from "fflate";
import { useEffect, useState } from "react";
import useDrivePicker from "react-google-drive-picker/dist";
import type {
  authResult,
  PickerConfiguration,
} from "react-google-drive-picker/dist/typeDefs";
import { env } from "../env/client.mjs";
import { SelectContributor } from "./selectContributor";

export default function DrivePicker({
  onChange,
}: {
  onChange?: (stuff: {
    images: {
      contributorId?: string;
      contributorText: string;
      altText?: string;
      file: File;
    }[];
    htmlFileText?: string;
  }) => void;
}) {
  const [fileName, setFileName] = useState<string>();
  const [htmlFileText, setHtmlFileText] = useState<string>();
  const [images, setImages] = useState<
    {
      contributorId?: string;
      contributorText: string;
      altText?: string;
      file: File;
    }[]
  >([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [openPicker] = useDrivePicker();

  useEffect(
    () => onChange?.({ images, htmlFileText }),
    [onChange, images, htmlFileText]
  );

  const handleOpenPicker = () => {
    const config: PickerConfiguration = {
      clientId: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      developerKey: env.NEXT_PUBLIC_GOOGLE_API_KEY,
      setIncludeFolders: true,
      viewMimeTypes:
        "application/vnd.google-apps.document,application/vnd.google-apps.folder",

      callbackFunction: async (data) => {
        if (data.action === "picked") {
          setFileName(data.docs[0]?.name);
          const ret = await fetch(
            `https://www.googleapis.com/drive/v3/files/${data.docs[0]?.id}/export?mimeType=application/zip`,
            {
              headers: {
                Authorization: `Bearer ${config.token}`,
              },
            }
          );

          unzip(new Uint8Array(await ret.arrayBuffer()), async (_, data) => {
            const files = Object.keys(data)
              .filter((filename) => data[filename]?.length ?? 0 > 0)
              .map((filename) => new File([data[filename]!], filename));

            const htmlFile = files.find((file) => file.name.endsWith("html"));
            if (!htmlFile) {
              throw new Error("Invalid Google Doc");
            }

            const htmlFileText = await htmlFile.text();

            const articleImages = files
              .filter((file) => file.name.startsWith("images"))
              .map((file) => ({ file, contributorText: "" }));

            // onChange?.(articleImages, htmlFileText);

            setImages(articleImages);
            setImageUrls(
              articleImages.map(({ file }) => URL.createObjectURL(file))
            );
            setHtmlFileText(htmlFileText);
          });
        }
      },
    };

    const client = google.accounts.oauth2.initTokenClient({
      client_id: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      callback: (tokenResponse: authResult) => {
        config.token = tokenResponse.access_token;
        openPicker(config);
      },
    });

    client.requestAccessToken();
  };

  return (
    <div className="flex flex-col">
      <div
        // className={`flex cursor-pointer items-center gap-2 rounded-lg border ${
        //   error ? "border-error" : "border-neutral border-opacity-20"
        // }`}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral border-opacity-20"
        onClick={handleOpenPicker}
      >
        <button className="btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="35"
            height="30"
            viewBox="0 0 1443.061 1249.993"
          >
            <path
              fill="#3777e3"
              d="M240.525 1249.993l240.492-416.664h962.044l-240.514 416.664z"
            />
            <path
              fill="#ffcf63"
              d="M962.055 833.329h481.006L962.055 0H481.017z"
            />
            <path
              fill="#11a861"
              d="M0 833.329l240.525 416.664 481.006-833.328L481.017 0z"
            />
          </svg>
        </button>
        <p>{fileName ?? "No file selected."}</p>
      </div>
      {/* {error && <p className="text-red-500">{error.errorMessage}</p>} */}
      <div className="mt-2 flex flex-col gap-2">
        {imageUrls.map((url, idx) => (
          <div key={url} className="flex items-center gap-2">
            <picture>
              <img alt={`Image ${idx + 1}`} src={url} width={100} />
            </picture>
            <SelectContributor
              className="grow"
              placeholder="Contributor"
              selectedContributorId={images[idx]?.contributorId}
              selectedContributorText={images[idx]?.contributorText}
              onChange={(contributorInfo) =>
                setImages((old) => {
                  const oldCopy = [...old];
                  const oldImage = old[idx];
                  if (oldImage == null) return oldCopy;

                  oldCopy[idx] = {
                    ...oldImage,
                    ...contributorInfo,
                  };
                  return oldCopy;
                })
              }
            />
            <textarea
              className="textarea-bordered textarea grow"
              placeholder="Alt text - this is a short, 1-2 sentence description of the image."
              onChange={({ target }) =>
                setImages((old) => {
                  const oldCopy = structuredClone(old);
                  oldCopy[idx] = { ...oldCopy[idx]!, altText: target.value };
                  return oldCopy;
                })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
