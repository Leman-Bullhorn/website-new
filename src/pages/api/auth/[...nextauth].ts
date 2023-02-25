import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { env } from "../../../env/server.mjs";

export const authOptions: NextAuthOptions = {
  // Include user.id on session
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }

      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  theme: {
    colorScheme: "light",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { labe: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials?.username === env.ADMIN_USERNAME &&
          credentials.password === env.ADMIN_PASSWORD
        ) {
          return { id: "admin", name: "admin" };
        }

        if (
          credentials?.username === env.EDITOR_USERNAME &&
          credentials.password === env.EDITOR_PASSWORD
        ) {
          return { id: "editor", name: "editor" };
        }

        return null;
      },
    }),
  ],
};

export default NextAuth(authOptions);
