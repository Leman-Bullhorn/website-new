import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const mediaRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        contentUrl: z.string(),
        alt: z.string(),
        contributorId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.media.create({
        data: {
          contentUrl: input.contentUrl,
          alt: input.alt,
          contributor: { connect: { id: input.contributorId } },
        },
      });
    }),
});
