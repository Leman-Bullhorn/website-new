import { type Contributor } from "@prisma/client";
import Link from "next/link";

interface Props {
  children: React.ReactNode;
  className?: string;
  contributor: Contributor | null;
}

const CaptionedImage: React.FC<Props> = ({
  className,
  children,
  contributor,
}) => {
  return (
    <figure className={className}>
      {children}
      <figcaption className="text-right text-xs text-gray-500">
        {contributor ? (
          <Link href={`/contributor/${contributor.slug}`}>
            {contributor.firstName} {contributor.lastName}
          </Link>
        ) : (
          <p>Public Domain</p>
        )}
      </figcaption>
    </figure>
  );
};

export default CaptionedImage;
