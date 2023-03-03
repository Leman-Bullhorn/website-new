import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../trpc";

export const mediaRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        contentUrl: z.string(),
        alt: z.string(),
        contributorId: z.string().optional(),
        contributorText: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.media.create({
        data: {
          contentUrl: input.contentUrl,
          alt: input.alt,
          contributor: input.contributorId
            ? { connect: { id: input.contributorId } }
            : undefined,
          contributorText: input.contributorText,
        },
      });
    }),
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.media.findUnique({
        where: {
          id: input.id,
        },
      });
    }),
  editMedia: adminProcedure
    .input(
      z.object({
        id: z.string(),
        contributorId: z.string().nullable().optional(),
        contributorText: z.string().optional(),
        alt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.media.update({
        where: { id: input.id },
        data: {
          alt: input.alt,
          contributorText: input.contributorText,
          contributor: input.contributorId
            ? { connect: { id: input.contributorId } }
            : input.contributorId === null
            ? { disconnect: true }
            : undefined,
        },
      });
    }),
});
