import Link from "next/link";
import Image from "next/image";
import logoImage from "../logo.png";
import { sections } from "../utils/section";

const NavigationBar: React.FC<{ visible?: boolean; buffer?: boolean }> = ({
  visible = true,
  buffer = true,
}) => {
  return (
    <>
      <div
        className={`navbar fixed top-0 z-[9999] bg-slate-50 shadow-md transition-transform ${
          visible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="navbar-start self-start">
          <Link href="/">
            <Image alt="" src={logoImage} width={40} />
          </Link>
        </div>
        <div className="navbar-center">
          <div className="flex flex-col items-center">
            <Link href="/" className="mb-2 font-brand text-3xl">
              The Bullhorn
            </Link>
            <div className="flex gap-4 text-base">
              {sections.map((section) => (
                <Link
                  href={section.href}
                  className="link-hover link font-section opacity-60 hover:opacity-75"
                  key={section.id}
                >
                  {section.display}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="navbar-end" />
      </div>
      {/* hardcoded value to correctly pad the navigation bar's height*/}
      {buffer && <div style={{ height: "84px" }} />}
    </>
  );
};
export default NavigationBar;
