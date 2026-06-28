import type { PrismaClient } from '@prisma/client';

import type {
  IOAuthAccountRepository,
  OAuthAccountLink,
} from '../../domain/user/IOAuthAccountRepository.js';

export class PrismaOAuthAccountRepository implements IOAuthAccountRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByProvider(provider: string, providerId: string): Promise<OAuthAccountLink | null> {
    const record = await this.db.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
    });

    if (!record) {
      return null;
    }

    return {
      userId: record.userId,
      provider: record.provider,
      providerId: record.providerId,
    };
  }

  async create(params: { userId: string; provider: string; providerId: string }): Promise<void> {
    await this.db.oAuthAccount.create({
      data: {
        userId: params.userId,
        provider: params.provider,
        providerId: params.providerId,
      },
    });
  }
}
