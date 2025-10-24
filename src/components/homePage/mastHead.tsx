import Image from "next/image";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { sections } from "../../utils/section";
import logoImage from "../../logo.png";
import { useEffect } from "react";
import { Search } from "../search";

const Masthead: React.FC<{
  onChangeVisibility?: (visible: boolean) => void;
}> = ({ onChangeVisibility }) => {
  const { ref, inView } = useInView();

  useEffect(() => {
    onChangeVisibility?.(inView);
  }, [inView, onChangeVisibility]);

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className="navbar">
        <div className="navbar-start self-start">
          <Link href="/">
            <Image src={logoImage} alt="" width={40} />
          </Link>
        </div>
        <div className="navbar-center">
          <Link
            href="/"
            style={{ WebkitTextStroke: "2px #4DA9DF" }}
            className="font-brand text-8xl"
          >
            The Bullhorn
          </Link>
        </div>
        <div className="navbar-end self-start">
          <Search />
        </div>
      </div>
      <a
        href="https://www.lemanmanhattan.org/"
        target="_blank"
        rel="noreferrer"
        className="link-hover link font-school text-slate-500"
      >
        Léman Manhattan Preparatory School
      </a>
      <div className="mt-2 flex w-11/12 justify-center shadow-[0_5px_5px_-5px_rgba(0,0,0,0.3)]">
        {sections
          .filter((section) => !section.hidden)
          .map((section) => (
            <Link
              href={section.href}
              className="link-hover link px-4 pb-1 font-section text-lg font-medium transition-colors duration-200 hover:bg-leman-blue/50"
              key={section.href}
            >
              {section.display}
            </Link>
          ))}
      </div>
    </div>
  );
};

export default Masthead;
