import { Section } from "@prisma/client";
import { z } from "zod";
import { articleBodySchema } from "../../../utils/article";

import { router, publicProcedure, protectedProcedure } from "../trpc";

export const articleRouter = router({
  hello: publicProcedure
    .input(z.object({ text: z.string().nullish() }).nullish())
    .query(({ input }) => {
      return {
        greeting: `Hello ${input?.text ?? "world"}`,
      };
    }),
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
});
