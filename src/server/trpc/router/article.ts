import { Section } from "@prisma/client";
import { TRPCError } from "@trpc/server";
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
  deleteById: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.article.delete({ where: { id: input.id } });
    }),
  editFeatured: adminProcedure
    .input(z.object({ id: z.string(), featured: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (input.featured) {
        const featuredArticlesCount = await ctx.prisma.article.count({
          where: { featured: true },
        });
        if (featuredArticlesCount > 0)
          throw new TRPCError({ code: "CONFLICT" });
      }

      return await ctx.prisma.article.update({
        where: { id: input.id },
        data: { featured: input.featured },
      });
    }),
  setArticleFrontPagePosition: adminProcedure
    .input(z.object({ index: z.number().nullable(), id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const selectedArticle = await ctx.prisma.article.findUnique({
        where: { id: input.id },
      });

      if (selectedArticle == null) return new TRPCError({ code: "NOT_FOUND" });

      if (input.index == null) {
        if (selectedArticle.frontPageIndex == null) return selectedArticle;

        const [, editedArticle] = await ctx.prisma.$transaction([
          ctx.prisma.article.updateMany({
            where: {
              frontPageIndex: {
                gt: selectedArticle.frontPageIndex,
              },
            },
            data: { frontPageIndex: { decrement: 1 } },
          }),
          ctx.prisma.article.update({
            where: { id: input.id },
            data: { frontPageIndex: null },
          }),
        ]);
        return editedArticle;
      }

      if (
        selectedArticle.frontPageIndex == null ||
        input.index <= selectedArticle.frontPageIndex
      ) {
        const [, editedArticle] = await ctx.prisma.$transaction([
          ctx.prisma.article.updateMany({
            where: {
              frontPageIndex: {
                gte: input.index,
                lt: selectedArticle.frontPageIndex ?? undefined,
              },
            },
            data: {
              frontPageIndex: { increment: 1 },
            },
          }),
          ctx.prisma.article.update({
            where: { id: input.id },
            data: { frontPageIndex: input.index },
          }),
        ]);

        return editedArticle;
      }

      const [, editedArticle] = await ctx.prisma.$transaction([
        ctx.prisma.article.updateMany({
          where: {
            frontPageIndex: {
              gt: selectedArticle.frontPageIndex,
              lte: input.index,
            },
          },
          data: {
            frontPageIndex: { decrement: 1 },
          },
        }),
        ctx.prisma.article.update({
          where: {
            id: input.id,
          },
          data: { frontPageIndex: input.index },
        }),
      ]);

      return editedArticle;
    }),
  editArticle: adminProcedure
    .input(
      z.object({
        id: z.string(),
        headline: z.string().optional(),
        focus: z.string().optional(),
        section: z.nativeEnum(Section).optional(),
        writerIds: z.string().array().optional(),
        thumbnailId: z.string().optional(),
        body: articleBodySchema.optional(),
        mediaIds: z.string().array().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.article.update({
        where: {
          id: input.id,
        },
        data: {
          headline: input.headline,
          focus: input.focus,
          section: input.section,
          writers: { set: input.writerIds?.map((id) => ({ id })) },
          thumbnail: input.thumbnailId
            ? { connect: { id: input.thumbnailId } }
            : undefined,
          media: input.mediaIds
            ? { set: input.mediaIds.map((id) => ({ id })) }
            : undefined,
          body: input.body,
        },
      });
    }),
});
