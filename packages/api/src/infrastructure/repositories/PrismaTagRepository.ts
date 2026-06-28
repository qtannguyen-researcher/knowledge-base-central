import type { PrismaClient } from '@prisma/client';

import type { ITagRepository, Tag } from '../../domain/tag/ITagRepository.js';

function toTag(record: { id: string; slug: string; name: string }): Tag {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
  };
}

export class PrismaTagRepository implements ITagRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<Tag | null> {
    const record = await this.db.tag.findUnique({ where: { id } });
    return record ? toTag(record) : null;
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    const record = await this.db.tag.findUnique({ where: { slug } });
    return record ? toTag(record) : null;
  }

  async findOrCreate(slug: string, name: string): Promise<Tag> {
    const existing = await this.findBySlug(slug);
    if (existing) {
      return existing;
    }

    const record = await this.db.tag.create({
      data: { slug, name },
    });
    return toTag(record);
  }

  async findAll(): Promise<Tag[]> {
    const records = await this.db.tag.findMany({
      orderBy: { name: 'asc' },
    });
    return records.map(toTag);
  }
}
