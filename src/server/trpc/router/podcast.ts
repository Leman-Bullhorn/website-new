import { z } from "zod";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "../trpc";
import { slugify } from "../../../utils/article";

export const podcastRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.podcast.findMany({
      include: {
        hosts: true,
      },
      orderBy: {
        publicationDate: "desc",
      },
    });
  }),
  delete: adminProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.prisma.podcast.delete({
        where: {
          id: input.id,
        },
      });
    }),
  edit: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        hostIds: z.string().array().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.prisma.podcast.update({
        where: {
          id: input.id,
        },
        data: {
          title: input.title,
          description: input.description,
          hosts: { set: input.hostIds?.map((id) => ({ id })) },
        },
      });
    }),
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        audioUrl: z.string(),
        hostIds: z.string().array(),
        duration: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.podcast.create({
        data: {
          title: input.title,
          description: input.description,
          audioUrl: input.audioUrl,
          duration: input.duration,
          publicationDate: new Date(),
          slug: slugify(input.title),
          hosts: { connect: input.hostIds.map((id) => ({ id })) },
        },
      });
    }),
});
