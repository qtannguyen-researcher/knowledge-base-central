import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const setupDir = dirname(fileURLToPath(import.meta.url));

function loadRootEnv(): void {
  try {
    const envPath = resolve(setupDir, '../../../../.env');
    const content = readFileSync(envPath, 'utf8');

    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // Optional for unit tests that do not require a database.
  }
}

loadRootEnv();

process.env['NODE_ENV'] = 'test';
process.env['DATABASE_URL'] =
  process.env['DATABASE_URL'] ??
  'postgresql://kbc:kbc_dev_password@localhost:5432/knowledge_base_central';
process.env['REDIS_URL'] = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
process.env['IDENTITY_PUBLIC_KEY'] =
  process.env['IDENTITY_PUBLIC_KEY'] ??
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAue3uajeojGrLU2KpFzR00IRW4N8TU0VZOwlDGO9aobC+hXEh6gSX24BXWNHr9zCwchvJ8UqYpzggY1RBcZGx0xdPgrtw6CaURz0r0KyKmo5raU+VVZhwa64MDmh2EFcMqfivSr1M4t7CQtfLa2ITfOtPDw+sOaLQa3OPOY/5Tzpk03NP0nghSWVqIYK8QB5Uk5gi1kVqxGYcaQVvFDIatHoWSYirsIQugaxXvik+6dvzA0LXjbcR8aJbmZQbA18+Q64MIRG/Ehs5VH8msi95ApB/8QuI6KJ01aQQ8d8pALRchFaI4i9PgxguFk0PF3Y9pxSUAvoHonXenyJvN8VzXQIDAQAB';
process.env['GIT_REPO_PATH'] = process.env['GIT_REPO_PATH'] ?? '/tmp/kbc-test-repos';
process.env['UPLOADS_PATH'] = process.env['UPLOADS_PATH'] ?? '/tmp/kbc-test-uploads';
