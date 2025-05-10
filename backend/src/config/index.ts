import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("3000"),
  MONGODB_URI: z.string(),
  REDIS_URI: z.string(),
  JWT_SECRET: z.string(),
  GITHUB_API_TOKEN: z.string(),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
});

const env = envSchema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  port: parseInt(env.PORT, 10),
  mongodbUri: env.MONGODB_URI,
  redisUri: env.REDIS_URI,
  jwtSecret: env.JWT_SECRET,
  githubApiToken: env.GITHUB_API_TOKEN,
  frontendUrl: env.FRONTEND_URL,
} as const;
