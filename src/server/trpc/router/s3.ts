import { router, publicProcedure, protectedProcedure } from "../trpc";
import S3 from "aws-sdk/clients/s3";
import { env } from "../../../env/server.mjs";
import { randomBytes } from "crypto";
import { z } from "zod";

const region = "us-east-1";
const bucketName = "cdn.thebullhorn.net";
const accessKeyId = env.AWS_ACCESS_KEY_ID;
const secretAccessKey = env.AWS_SECRET_ACCESS_KEY;

const s3 = new S3({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  signatureVersion: "v4",
});

export const s3Router = router({
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
  createSignedUrl: protectedProcedure
    .input(
      z.object({
        imagePath: z.string().optional(),
        extension: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const rawBytes = randomBytes(16);
      const imageName =
        (input.imagePath ? input.imagePath + "/" : "") +
        rawBytes.toString("hex") +
        (input.extension ? "." + input.extension : "");

      const signedUrl = await s3.getSignedUrlPromise("putObject", {
        Bucket: bucketName,
        Key: imageName,
        Expires: 60, // seconds
      });

      return { signedUrl, imagePath: imageName };
    }),
});
