import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../server/db/client";

// This cron is for keeping the PlanetScale DB awake since it goes to sleep after 7 days of no activity

export default function handler(_: NextApiRequest, res: NextApiResponse) {
  void prisma.article.count();
  res.status(200).end();
}
