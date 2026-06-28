import { Category } from './Category.js';

export interface ICategoryRepository {
  findAll(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findSubtree(pathPrefix: string): Promise<Category[]>;
  save(category: Category): Promise<void>;
  delete(id: string): Promise<void>;
}
