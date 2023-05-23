import { faInstagram } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
        <a
          href="https://www.instagram.com/lemanbullhorn/"
          rel="noreferrer"
          target="_blank"
          aria-label="Go to the Bullhorn instagram"
        >
          <FontAwesomeIcon
            icon={faInstagram}
            className="h-10 w-10 text-black"
          />
        </a>
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
