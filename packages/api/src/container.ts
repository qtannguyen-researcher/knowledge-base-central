import type { PrismaClient } from '@prisma/client';

import { AssetVersionService } from './application/assets/AssetVersionService.js';
import { AuditService } from './application/audit/AuditService.js';
import type { ICommentRepository } from './domain/community/ICommentRepository.js';
import type { ICorrectionRepository } from './domain/community/ICorrectionRepository.js';
import type { INotificationService } from './domain/notification/INotificationService.js';
import type { ICategoryRepository } from './domain/category/ICategoryRepository.js';
import type { IGitSyncRepository } from './domain/git-sync/IGitSyncRepository.js';
import type { IGitAdapter } from './domain/git-sync/IGitAdapter.js';
import type { ITagRepository } from './domain/tag/ITagRepository.js';
import type { IKnowledgeAssetRepository } from './domain/knowledge-asset/IKnowledgeAssetRepository.js';
import type { ISearchRepository } from './domain/search/ISearchRepository.js';

import { prisma } from './infrastructure/db/prisma.js';
import { PrismaCategoryRepository } from './infrastructure/repositories/PrismaCategoryRepository.js';
import { PrismaCommentRepository } from './infrastructure/repositories/PrismaCommentRepository.js';
import { PrismaCorrectionRepository } from './infrastructure/repositories/PrismaCorrectionRepository.js';
import { PrismaGitSyncRepository } from './infrastructure/repositories/PrismaGitSyncRepository.js';
import { PrismaKnowledgeAssetRepository } from './infrastructure/repositories/PrismaKnowledgeAssetRepository.js';
import { PostgresFTSRepository } from './infrastructure/search/PostgresFTSRepository.js';
import { TypesenseSearchRepository } from './infrastructure/search/TypesenseSearchRepository.js';
import { PrismaTagRepository } from './infrastructure/repositories/PrismaTagRepository.js';
import { IsomorphicGitAdapter } from './infrastructure/git/IsomorphicGitAdapter.js';
import { FileStorage } from './infrastructure/storage/FileStorage.js';
import { NotificationService } from './application/notification/NotificationService.js';
import { IdentityServiceClient } from '@identity-service/contracts';

export interface Container {
  prisma: PrismaClient;
  knowledgeAssetRepository: IKnowledgeAssetRepository;
  categoryRepository: ICategoryRepository;
  searchRepository: ISearchRepository;
  gitSyncRepository: IGitSyncRepository;
  gitAdapter: IGitAdapter;
  tagRepository: ITagRepository;
  auditService: AuditService;
  assetVersionService: AssetVersionService;
  fileStorage: FileStorage;
  commentRepository: ICommentRepository;
  correctionRepository: ICorrectionRepository;
  notificationService: INotificationService;
  identityServiceClient: IdentityServiceClient;
  identityPublicKey: string;
}

function buildSearchRepository(db: PrismaClient): ISearchRepository {
  const backend = process.env['SEARCH_BACKEND'] ?? 'postgres';
  if (backend === 'typesense') {
    return new TypesenseSearchRepository();
  }
  return new PostgresFTSRepository(db);
}

let containerInstance: Container | null = null;
let containerOptions: { identityServiceUrl?: string; identityPublicKey?: string } = {};

export function configureContainer(options: {
  identityServiceUrl?: string;
  identityPublicKey?: string;
}): void {
  containerOptions = options;
}

export function createContainer(db: PrismaClient = prisma): Container {
  const identityServiceUrl =
    containerOptions.identityServiceUrl ?? process.env['IDENTITY_SERVICE_URL'];
  const identityPublicKey =
    containerOptions.identityPublicKey ?? process.env['IDENTITY_PUBLIC_KEY'] ?? '';

  const identityServiceClient = identityServiceUrl
    ? new IdentityServiceClient({
        baseUrl: identityServiceUrl,
        timeoutMs: 5000,
        retryAttempts: 5,
      })
    : new IdentityServiceClient({ baseUrl: 'http://localhost:3000' });

  return {
    prisma: db,
    knowledgeAssetRepository: new PrismaKnowledgeAssetRepository(db),
    categoryRepository: new PrismaCategoryRepository(db),
    searchRepository: buildSearchRepository(db),
    gitSyncRepository: new PrismaGitSyncRepository(db),
    gitAdapter: new IsomorphicGitAdapter(),
    tagRepository: new PrismaTagRepository(db),
    auditService: new AuditService(db),
    assetVersionService: new AssetVersionService(db),
    fileStorage: new FileStorage(),
    commentRepository: new PrismaCommentRepository(db),
    correctionRepository: new PrismaCorrectionRepository(db),
    notificationService: new NotificationService(db),
    identityServiceClient,
    identityPublicKey,
  };
}

export function getContainer(): Container {
  if (!containerInstance) {
    containerInstance = createContainer();
  }
  return containerInstance;
}

export function resetContainer(): void {
  containerInstance = null;
}
