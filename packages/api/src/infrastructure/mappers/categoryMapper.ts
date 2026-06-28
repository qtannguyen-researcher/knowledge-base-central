import type { Category as PrismaCategory, Prisma } from '@prisma/client';

import { Category } from '../../domain/category/Category.js';

export function toDomainCategory(record: PrismaCategory): Category {
  return new Category({
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: record.description,
    parentId: record.parentId,
    path: record.path,
    depth: record.depth,
    createdAt: record.createdAt,
  });
}

export function toPrismaCategory(category: Category): Prisma.CategoryUncheckedCreateInput {
  const props = category.toProps();
  return {
    id: props.id,
    slug: props.slug,
    name: props.name,
    description: props.description ?? null,
    parentId: props.parentId ?? null,
    path: props.path,
    depth: props.depth,
    createdAt: props.createdAt ?? new Date(),
  };
}
