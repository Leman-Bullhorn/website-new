import { router } from "../trpc";
import { articleRouter } from "./article";
import { authRouter } from "./auth";
import { contributorRouter } from "./contributor";
import { mediaRouter } from "./media";
import { s3Router } from "./s3";

export const appRouter = router({
  auth: authRouter,
  article: articleRouter,
  s3: s3Router,
  media: mediaRouter,
  contributor: contributorRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
