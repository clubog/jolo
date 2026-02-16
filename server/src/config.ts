import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  ANTHROPIC_API_KEY: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(1),
  PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  COOKIE_SECRET: z.string().min(1).default("dev-secret"),
});

export const config = envSchema.parse(process.env);
