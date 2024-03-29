import { type Contributor } from "@prisma/client";
import Link from "next/link";

interface Props {
  children: React.ReactNode;
  className?: string;
  contributor: Contributor | null;
  contributorText: string;
  alt?: string;
  width?: number;
}

const CaptionedImage: React.FC<Props> = ({
  className,
  children,
  contributor,
  contributorText,
  alt,
  width,
}) => {
  return (
    <figure className={className} style={{ width }}>
      {children}
      {alt ? (
        <figcaption className="ml-1 text-left text-xs leading-none text-gray-500 md:text-[0.6rem]">
          <span className="text-sm">{alt}</span>
          {contributor ? (
            <Link href={`/contributor/${contributor.slug}`}>
              &ensp;{contributor.firstName} {contributor.lastName}
            </Link>
          ) : (
            <span>&ensp;{contributorText}</span>
          )}
        </figcaption>
      ) : (
        <figcaption className="text-right text-xs leading-none text-gray-500 md:text-[0.6rem]">
          {contributor ? (
            <Link href={`/contributor/${contributor.slug}`}>
              {contributor.firstName} {contributor.lastName}
            </Link>
          ) : (
            <p>
              &ensp;
              {contributorText}
            </p>
          )}
        </figcaption>
      )}
    </figure>
  );
};

export default CaptionedImage;
