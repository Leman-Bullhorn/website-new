import { signIn } from "next-auth/react";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
} from "next/types";
import { type FormEvent, useState } from "react";
import { Button, Input } from "react-daisyui";
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
      <NavigationBar buffer={false} />
      <div className="flex h-screen items-center justify-center">
        <form
          onSubmit={onSubmit}
          className="b-gray-500 flex w-1/2 flex-col gap-4 rounded border p-8"
        >
          <h1 className="text-center text-lg">Sign In</h1>

          <Input
            type="text"
            placeholder="username"
            onChange={({ target }) => setUsername(target.value)}
          />
          <Input
            type="password"
            placeholder="password"
            onChange={({ target }) => setPassword(target.value)}
          />
          <Button color="primary" disabled={username === "" || password === ""}>
            Sign In
          </Button>
        </form>
      </div>
    </>
  );
};

export default SignInPage;
