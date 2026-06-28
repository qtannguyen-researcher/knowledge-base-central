import { KnowledgeAsset } from './KnowledgeAsset.js';
import { AssetFilter, PaginatedResult } from '../common/types.js';

export interface IKnowledgeAssetRepository {
  findById(id: string): Promise<KnowledgeAsset | null>;
  findBySlug(slug: string): Promise<KnowledgeAsset | null>;
  findAll(filter: AssetFilter): Promise<PaginatedResult<KnowledgeAsset>>;
  save(asset: KnowledgeAsset): Promise<void>;
  delete(id: string): Promise<void>;
}
