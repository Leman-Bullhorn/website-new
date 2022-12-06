import { router } from "../trpc";
import { articleRouter } from "./article";
import { authRouter } from "./auth";

export const appRouter = router({
  auth: authRouter,
  article: articleRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
