import Link from "next/link";
import Image from "next/image";
import logoImage from "../logo.png";
import { sections } from "../utils/section";
import AwareLink from "./awareLink";
import { type RefObject, useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Search } from "./search";

const NavigationBar: React.FC<{ visible?: boolean; buffer?: boolean }> = ({
  visible = true,
  buffer = true,
}) => {
  const [showDrawer, setShowDrawer] = useState(false);
  const drawerButtonRef = useRef<HTMLLabelElement>(null);

  const session = useSession();

  const toggleDrawer = () => {
    setShowDrawer((s) => !s);
  };

  return (
    <>
      <div
        className={`navbar fixed top-0 z-20 bg-slate-50 shadow-md transition-transform ${
          visible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="navbar-start self-start">
          <Link href="/" aria-label="Go to home page">
            <Image
              alt="Bullhorn logo"
              src={logoImage}
              width={40}
              height={40}
              className="h-10 w-10"
            />
          </Link>
        </div>
        <div className="navbar-center flex flex-col items-center">
          <Link href="/" className="mb-2 font-brand text-3xl">
            The Bullhorn
          </Link>
          <div className="hidden gap-4 text-base sm:flex">
            {sections.map((section) => (
              <AwareLink
                href={section.href}
                key={section.id}
                className="link-hover link font-section opacity-60 hover:opacity-75"
              >
                {section.display}
              </AwareLink>
            ))}
          </div>
        </div>
        <div className="navbar-end self-start">
          {session.data?.user?.name === "admin" ? (
            <Link href="/admin">
              <button className="btn">admin</button>
            </Link>
          ) : null}
          {session.data?.user?.name === "editor" ||
          session.data?.user?.name === "admin" ? (
            <Link href="/editor">
              <button className="btn">editor</button>
            </Link>
          ) : null}
          {session.status === "authenticated" && (
            <button className="btn-error btn" onClick={() => signOut()}>
              Sign out
            </button>
          )}
          <Search />
          <div className="flex-none sm:hidden">
            <label
              className="swap-rotate swap btn-ghost btn-square btn h-10 min-h-min w-10"
              ref={drawerButtonRef}
              onClick={toggleDrawer}
            >
              <input type="checkbox" onClick={toggleDrawer} />
              <svg
                className="swap-off fill-current"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 512 512"
              >
                <path d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z" />
              </svg>
              <svg
                className="swap-on fill-current"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 512 512"
              >
                <polygon points="400 145.49 366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49" />
              </svg>
            </label>
          </div>
          <Drawer
            // overflow-hidden to cover the highlight effect on the rounded corners
            open={showDrawer}
            toggleButtonRef={drawerButtonRef}
            onClickEscape={() => setShowDrawer(false)}
          >
            <ul className="menu" role="menu">
              {sections.map((section) => (
                <li key={section.id} role="menuitem">
                  <AwareLink
                    href={section.href}
                    className="link-hover link font-section opacity-60 hover:opacity-75"
                  >
                    {section.display}
                  </AwareLink>
                </li>
              ))}
            </ul>
          </Drawer>
        </div>
      </div>

      {/* hardcoded value to correctly pad the navigation bar's height*/}
      {buffer && <div style={{ height: "84px" }} />}
    </>
  );
};
export default NavigationBar;

const Drawer: React.FC<{
  open: boolean;
  onClickEscape?: () => void;
  children: React.ReactNode;
  toggleButtonRef?: RefObject<HTMLLabelElement>;
}> = ({ onClickEscape, children, open = true, toggleButtonRef }) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const escapeFunc = (e: KeyboardEvent) => {
      if (open && e.key === "Escape") onClickEscape?.();
    };
    const clickFunc = ({ target }: MouseEvent) => {
      if (
        open &&
        !drawerRef.current?.contains(target as Node) &&
        !toggleButtonRef?.current?.contains(target as Node)
      )
        onClickEscape?.();
    };
    window.addEventListener("keydown", escapeFunc);
    window.addEventListener("click", clickFunc, true);

    return () => {
      window.removeEventListener("keydown", escapeFunc);
      window.removeEventListener("click", clickFunc, true);
    };
  }, [onClickEscape, open, toggleButtonRef]);

  return (
    <div
      ref={drawerRef}
      className={`fixed right-0 top-[64px] z-10 overflow-hidden rounded-bl-md bg-slate-50 shadow-md transition-transform sm:hidden ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {children}
    </div>
  );
};
