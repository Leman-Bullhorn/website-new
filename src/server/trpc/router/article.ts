import { Section } from "@prisma/client";
import { z } from "zod";
import { articleBodySchema, slugify } from "../../../utils/article";

import {
  router,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "../trpc";

export const articleRouter = router({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.article.findMany({
      include: {
        media: true,
        writers: true,
      },
    });
  }),
  createSubmission: protectedProcedure
    .input(
      z.object({
        headline: z.string(),
        focusSentence: z.string(),
        section: z.nativeEnum(Section),
        contributorIds: z.string().array(),
        articleContent: articleBodySchema,
        thumbnailMediaId: z.string().optional(),
        bodyMediaIds: z.string().array(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.articleSubmission.create({
        data: {
          headline: input.headline,
          focus: input.focusSentence,
          section: input.section,
          body: input.articleContent,
          writers: { connect: input.contributorIds.map((id) => ({ id })) },
          thumbnail: input.thumbnailMediaId
            ? { connect: { id: input.thumbnailMediaId } }
            : undefined,
          media: { connect: input.bodyMediaIds.map((id) => ({ id })) },
        },
      });
    }),
  getFrontPageArticles: publicProcedure.query(async ({ ctx }) => {
    const featuredArticle = await ctx.prisma.article.findFirst({
      where: {
        featured: true,
      },
      include: {
        media: true,
        thumbnail: true,
        writers: true,
      },
    });

    return {
      featured: featuredArticle,
    };
  }),
  create: adminProcedure
    .input(
      z.object({
        headline: z.string(),
        focus: z.string(),
        section: z.nativeEnum(Section),
        body: articleBodySchema,
        featured: z.boolean().default(false),
        frontPageIndex: z.number().optional(),
        mediaIds: z.string().array(),
        thumbnailId: z.string().optional(),
        writerIds: z.string().array(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const {
        headline,
        focus,
        section,
        body,
        featured,
        frontPageIndex,
        mediaIds,
        thumbnailId,
        writerIds,
      } = input;
      return await ctx.prisma.article.create({
        data: {
          headline,
          focus,
          publicationDate: new Date(),
          slug: slugify(headline),
          section,
          body,
          featured,
          frontPageIndex,
          media: { connect: mediaIds.map((id) => ({ id })) },
          thumbnail: thumbnailId ? { connect: { id: thumbnailId } } : undefined,
          writers: { connect: writerIds.map((id) => ({ id })) },
        },
      });
    }),
  allSubmissions: adminProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.articleSubmission.findMany({
      include: {
        media: { include: { contributor: true } },
        thumbnail: { include: { contributor: true } },
        writers: true,
      },
    });
  }),
  deleteSubmission: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.articleSubmission.delete({ where: { id: input.id } });
    }),
});
