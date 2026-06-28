import { createWriteStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';

import { config } from '../../config.js';

export class FileStorage {
  private readonly basePath: string;

  constructor(basePath = config.UPLOADS_PATH) {
    this.basePath = basePath;
  }

  async save(filename: string, stream: Readable): Promise<string> {
    const safeName = `${randomUUID()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storagePath = join(this.basePath, safeName);
    await mkdir(dirname(storagePath), { recursive: true });
    await pipeline(stream, createWriteStream(storagePath));
    return storagePath;
  }

  async delete(storagePath: string): Promise<void> {
    try {
      await unlink(storagePath);
    } catch {
      // File may already be removed.
    }
  }
}
