import type { AppType } from "next/app";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import localFont from "@next/font/local";
import { Nunito } from "@next/font/google";

import { trpc } from "../utils/trpc";
import "../styles/globals.css";

const headlineFont = localFont({
  src: "./amador.woff2",
  weight: "400",
  variable: "--font-headline",
});

const brandFont = Nunito({
  subsets: ["latin"],
  variable: "--font-brand",
});

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <main className={`${headlineFont.variable} ${brandFont.variable}`}>
      <SessionProvider session={session}>
        <Component {...pageProps} />
      </SessionProvider>
    </main>
  );
};

export default trpc.withTRPC(MyApp);
