import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/unisphere"),
  CLIENT_ORIGINS: z.string().default("http://localhost:3000"),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  COOKIE_NAME: z.string().default("unisphere_refresh"),
  BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(12).optional(),
  REDIS_URL: z.string().url().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.string().transform((value) => value === "true").default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default("UniSphere <no-reply@unisphere.local>"),
  SMS_WEBHOOK_URL: z.string().url().optional(),
  SMS_WEBHOOK_TOKEN: z.string().optional(),
  UPLOAD_DRIVER: z.enum(["local", "cloudinary"]).default("local"),
  UPLOAD_MAX_MB: z.coerce.number().positive().max(20).default(5),
  UPLOAD_BASE_URL: z.string().url().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
}).superRefine((value, context) => {
  if (
    value.UPLOAD_DRIVER === "cloudinary" &&
    (!value.CLOUDINARY_CLOUD_NAME || !value.CLOUDINARY_API_KEY || !value.CLOUDINARY_API_SECRET)
  ) {
    context.addIssue({
      code: "custom",
      path: ["CLOUDINARY_CLOUD_NAME"],
      message: "Cloudinary cloud name, API key, and API secret are required",
    });
  }
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
  throw new Error("Environment configuration validation failed");
}

export const env = {
  ...parsed.data,
  clientOrigins: parsed.data.CLIENT_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
