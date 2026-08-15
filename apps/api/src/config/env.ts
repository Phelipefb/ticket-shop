import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(64),
  TMDB_ACCESS_TOKEN: z.string().min(1),
  PORT: z.coerce.number().int().min(1).max(65535).default(3333),
  WEB_URL: z.string().url().default("http://localhost:3000"),
});

export const env = environmentSchema.parse(process.env);
