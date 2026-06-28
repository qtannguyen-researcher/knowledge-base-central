import type { PrismaClient } from '@prisma/client';

import { execSync } from 'node:child_process';

export interface AssetVersionSummary {
  id: string;
  assetId: string;
  gitSha: string | null;
  authorId: string | null;
  createdAt: Date;
}

export class AssetVersionService {
  constructor(private readonly db: PrismaClient) {}

  static getCurrentGitSha(): string | null {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return process.env['GIT_SHA'] ?? null;
    }
  }

  async createSnapshot(
    assetId: string,
    rawContent: string | null,
    metadata: Record<string, unknown> | null,
    authorId?: string | null,
  ): Promise<AssetVersionSummary> {
    const version = await this.db.assetVersion.create({
      data: {
        assetId,
        rawContent,
        ...(metadata !== null && metadata !== undefined ? { metadata: metadata as object } : {}),
        gitSha: AssetVersionService.getCurrentGitSha(),
        authorId: authorId ?? null,
      },
    });

    return {
      id: version.id,
      assetId: version.assetId,
      gitSha: version.gitSha,
      authorId: version.authorId,
      createdAt: version.createdAt,
    };
  }

  async listVersions(assetId: string) {
    return this.db.assetVersion.findMany({
      where: { assetId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        assetId: true,
        gitSha: true,
        authorId: true,
        createdAt: true,
      },
    });
  }

  async getVersion(assetId: string, versionId: string) {
    return this.db.assetVersion.findFirst({
      where: { id: versionId, assetId },
    });
  }
}
