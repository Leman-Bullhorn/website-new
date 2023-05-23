import { signIn } from "next-auth/react";
import Head from "next/head";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
} from "next/types";
import { type FormEvent, useState } from "react";
import NavigationBar from "../../components/navigationBar";

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const redirectOrigin = ctx.req.cookies["redirect-origin"];
  return { props: { redirectOrigin } };
};
const SignInPage: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ redirectOrigin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();

    signIn("credentials", {
      callbackUrl: redirectOrigin,
      username,
      password,
    });
  };

  return (
    <>
      <Head>
        <title>Sign In</title>
      </Head>
      <NavigationBar buffer={false} />
      <div className="flex h-screen items-center justify-center">
        <form
          onSubmit={onSubmit}
          className="b-gray-500 flex w-1/2 flex-col gap-4 rounded border p-8"
        >
          <h1 className="text-center text-lg">Sign In</h1>
          <input
            type="text"
            placeholder="username"
            className="input-bordered input focus:outline-offset-0"
            onChange={({ target }) => setUsername(target.value)}
          />
          <input
            type="password"
            placeholder="password"
            className="input-bordered input focus:outline-offset-0"
            onChange={({ target }) => setPassword(target.value)}
          />
          <button
            className="btn-primary btn disabled:disabled"
            disabled={username === "" || password === ""}
          >
            Sign In
          </button>
        </form>
      </div>
    </>
  );
};

export default SignInPage;
