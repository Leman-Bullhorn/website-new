import { publicProcedure, router } from "../trpc";

export const contributorRouter = router({
  all: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.contributor.findMany();
  }),
});
