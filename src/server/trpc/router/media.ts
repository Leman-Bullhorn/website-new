import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../trpc";

export const mediaRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        contentUrl: z.string(),
        alt: z.string(),
        contributorId: z.string().nullable(),
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
        alt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.media.update({
        where: { id: input.id },
        data: {
          alt: input.alt,
          contributor: input.contributorId
            ? { connect: { id: input.contributorId } }
            : undefined,
        },
      });
    }),
});
