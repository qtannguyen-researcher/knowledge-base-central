import type { PrismaClient } from '@prisma/client';

import type { ICategoryRepository } from '../../domain/category/ICategoryRepository.js';
import type { Category } from '../../domain/category/Category.js';

import { toDomainCategory, toPrismaCategory } from '../mappers/categoryMapper.js';

export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAll() {
    const records = await this.db.category.findMany({
      orderBy: [{ depth: 'asc' }, { path: 'asc' }],
    });
    return records.map(toDomainCategory);
  }

  async findById(id: string) {
    const record = await this.db.category.findUnique({ where: { id } });
    return record ? toDomainCategory(record) : null;
  }

  async findBySlug(slug: string) {
    const record = await this.db.category.findUnique({ where: { slug } });
    return record ? toDomainCategory(record) : null;
  }

  async findSubtree(pathPrefix: string) {
    const records = await this.db.category.findMany({
      where: {
        path: { startsWith: pathPrefix },
      },
      orderBy: [{ depth: 'asc' }, { path: 'asc' }],
    });
    return records.map(toDomainCategory);
  }

  async save(category: Category) {
    const data = toPrismaCategory(category);
    await this.db.category.upsert({
      where: { id: category.id },
      create: data,
      update: data,
    });
  }

  async delete(id: string) {
    await this.db.category.delete({ where: { id } });
  }
}
