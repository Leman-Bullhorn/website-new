import type { AppType } from "next/app";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import localFont from "@next/font/local";
import { Nunito, Bodoni_Moda, Libre_Franklin } from "@next/font/google";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/react";

import { trpc } from "../utils/trpc";
import "../styles/globals.css";

const primaryFont = Libre_Franklin({
  subsets: ["latin"],
  variable: "--font-primary",
});

const brandFont = localFont({
  src: "./amador.woff2",
  weight: "400",
  variable: "--font-brand",
});

const sectionFont = localFont({
  src: "./helvetica-neue.woff2",
  weight: "400",
  variable: "--font-section",
});

const headlineFont = Bodoni_Moda({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-headline",
});

const schoolFont = Nunito({
  subsets: ["latin"],
  variable: "--font-school",
});

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <>
      <Analytics />
      <Head>
        <link
          rel="apple-touch-icon"
          sizes="144x144"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="description" content="The Leman Bullhorn newspaper" />
      </Head>
      <main
        className={`${primaryFont.variable} ${primaryFont.className} ${brandFont.variable} ${sectionFont.variable} ${schoolFont.variable} ${headlineFont.variable}`}
      >
        <SessionProvider session={session}>
          <Component {...pageProps} />
        </SessionProvider>
      </main>
    </>
  );
};

export default trpc.withTRPC(MyApp);
