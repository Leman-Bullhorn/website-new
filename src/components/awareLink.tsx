import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/router";

type Props = LinkProps & { children: React.ReactNode; className?: string };

const AwareLink: React.FC<Props> = ({
  href,
  children,
  className,
  ...props
}) => {
  const router = useRouter();

  return (
    <Link
      href={href}
      className={router.asPath === href ? `${className} opacity-90` : className}
      {...props}
    >
      {children}
    </Link>
  );
};

export default AwareLink;
