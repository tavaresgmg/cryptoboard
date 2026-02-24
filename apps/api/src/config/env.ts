import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3000),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
  WEB_APP_URL: z.url().default("http://localhost:5173"),
  MONGODB_URI: z.string().default("mongodb://localhost:27017/erictel"),
  COINPAPRIKA_BASE_URL: z.url().default("https://api.coinpaprika.com/v1"),
  S3_ENDPOINT: z.url().default("http://localhost:9000"),
  S3_PUBLIC_ENDPOINT: z.url().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY: z.string().default("minioadmin"),
  S3_SECRET_KEY: z.string().default("minioadmin"),
  S3_BUCKET: z.string().default("avatars"),
  AVATAR_MAX_BYTES: z.coerce.number().int().positive().default(2 * 1024 * 1024),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.email().optional(),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_TIME_WINDOW: z.string().default("1 minute"),
  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must be at least 16 characters")
    .default("dev-secret-change-me-please")
    .refine(
      (val) => process.env.NODE_ENV !== "production" || val !== "dev-secret-change-me-please",
      "JWT_SECRET must be explicitly set in production"
    ),
  JWT_ACCESS_EXPIRATION: z.string().default("15m"),
  JWT_REFRESH_EXPIRATION: z.string().default("7d")
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(source);
}
