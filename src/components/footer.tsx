import Image from "next/image";
import Link from "next/link";
import logoImage from "../logo.png";
import { sections } from "../utils/section";

export default function Footer() {
  return (
    <footer className="footer mt-12 bg-gray-100 p-10">
      <div>
        <Link href="/" aria-label="Go to home page">
          <Image
            alt="Bullhorn logo"
            src={logoImage}
            width={50}
            height={50}
            className="h-[50px] w-[50px]"
          />
        </Link>
        <p>
          &copy; {new Date().getFullYear()} The Bullhorn
          <br />
          Proudly serving Léman since 2016
        </p>
        <div className="flex gap-4">
          <a
            href="https://www.instagram.com/lemanbullhorn/"
            rel="noreferrer"
            target="_blank"
            aria-label="Go to the Bullhorn instagram"
          >
            <InstagramIcon />
          </a>
          <a
            href="https://github.com/Leman-Bullhorn/website-new"
            rel="noreferrer"
            target="_blank"
            aria-label="Check out the official Github repository for this website"
          >
            <GithubIcon />
          </a>
        </div>
      </div>
      <div>
        <span className="footer-title">Sections</span>
        {sections.map((section) => (
          <Link key={section.id} href={section.href}>
            {section.display}
          </Link>
        ))}
      </div>
      <div>
        <span className="footer-title">About</span>
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSc13tr2WnpnlHdH88S3kwveNed-g178mZN8W6377T5vZXMVTQ/viewform"
          rel="noreferrer"
          target="_blank"
          className="link-hover link"
        >
          Suggestions
        </a>
        <a
          href="https://forms.gle/Vk1wBTRvKeKd9gUb6"
          rel="noreferrer"
          target="_blank"
          className="link-hover link"
        >
          Join
        </a>
        <Link href="/staff" className="link-hover link">
          Staff
        </Link>
        <Link href="/privacy" className="link-hover link">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg
      className="h-10 w-10 text-black"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 512"
    >
      <path
        fill="currentColor"
        d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg
      className="h-10 w-10 text-black"
      role="img"
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path>
    </svg>
  );
}
