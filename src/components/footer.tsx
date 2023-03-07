import { faInstagram } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Footer as DaisyFooter, Link } from "react-daisyui";
import Image from "next/image";
import logoImage from "../logo.png";
import { sections } from "../utils/section";

export default function Footer() {
  return (
    <DaisyFooter className="mt-12 bg-gray-100 p-10">
      <div>
        <Link href="/">
          <Image
            alt=""
            src={logoImage}
            width={50}
            height={50}
            style={{ height: "50px", width: "50px" }}
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
        >
          <FontAwesomeIcon
            icon={faInstagram}
            className="h-10 w-10 text-black"
          />
        </a>
      </div>
      <div>
        <DaisyFooter.Title>Sections</DaisyFooter.Title>
        {sections.map((section) => (
          <Link key={section.id} href={section.href}>
            {section.display}
          </Link>
        ))}
      </div>
      <div>
        <DaisyFooter.Title>About</DaisyFooter.Title>
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
    </DaisyFooter>
  );
}
