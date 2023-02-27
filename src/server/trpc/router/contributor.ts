import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../trpc";

export const contributorRouter = router({
  all: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.contributor.findMany();
  }),
  create: adminProcedure
    .input(
      z.object({
        firstName: z.string(),
        lastName: z.string(),
        title: z.string(),
        bio: z.string().optional(),
        headshotUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.contributor.create({
        data: {
          ...input,
          slug: `${input.firstName}-${input.lastName}`,
        },
      });
    }),
  edit: adminProcedure
    .input(
      z.object({
        id: z.string(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        title: z.string().optional(),
        bio: z.string().nullable().optional(),
        headshotUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const contributorToEdit = await ctx.prisma.contributor.findUnique({
        where: { id: input.id },
      });

      if (contributorToEdit == null) throw new TRPCError({ code: "NOT_FOUND" });

      const firstName = input.firstName ?? contributorToEdit.firstName;
      const lastName = input.lastName ?? contributorToEdit.lastName;
      const slug = `${firstName}-${lastName}`;

      await ctx.prisma.contributor.update({
        where: { id: input.id },
        data: { ...input, slug },
      });
    }),
});
