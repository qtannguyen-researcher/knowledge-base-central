import { z } from 'zod';
import path from 'path';
import { config as loadEnv } from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');
loadEnv({ path: envPath });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  METRICS_TOKEN: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GIT_REPO_PATH: z.string().min(1, 'GIT_REPO_PATH must be set'),
  GIT_REPO_URL: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
  SYNC_CRON_ENABLED: z.enum(['true', 'false']).default('false'),
  SYNC_CRON: z.string().default('0 * * * *'),
  S3_ENDPOINT: z.string().url('S3_ENDPOINT must be a valid URL').optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  UPLOADS_PATH: z.string().min(1).default('uploads'),
});

/**
 * Parsed and validated environment configuration.
 * Throws at startup if any required variables are missing or invalid.
 */
export type Config = z.infer<typeof envSchema>;

function loadConfig(): Config {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `  ${e.path.join('.')}: ${e.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${errors}`);
  }

  return result.data;
}

export const config: Config = loadConfig();
