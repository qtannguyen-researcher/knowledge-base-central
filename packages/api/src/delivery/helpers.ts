import { randomBytes } from 'node:crypto';

import type { FastifyReply } from 'fastify';

import type { KnowledgeAsset } from '../domain/knowledge-asset/KnowledgeAsset.js';
import { DomainError } from '../domain/errors/DomainError.js';

export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return `${base || 'asset'}-${randomBytes(4).toString('hex')}`;
}

export function toAssetJson(asset: KnowledgeAsset) {
  const props = asset.toProps();
  return {
    id: props.id,
    slug: props.slug,
    title: props.title,
    summary: props.summary,
    content: props.content,
    rawContent: props.rawContent,
    status: props.status,
    contentType: props.contentType,
    difficulty: props.difficulty,
    authorId: props.authorId,
    categoryId: props.categoryId,
    gitSha: props.gitSha,
    version: props.version,
    metadata: props.metadata,
    publishedAt: props.publishedAt?.toISOString() ?? null,
    createdAt: props.createdAt?.toISOString(),
    updatedAt: props.updatedAt?.toISOString(),
    deletedAt: props.deletedAt?.toISOString() ?? null,
  };
}

export function handleDomainError(error: unknown, reply: FastifyReply) {
  if (error instanceof DomainError) {
    if (error.message.includes('Invalid status transition')) {
      return reply.status(409).send({ error: 'conflict', message: error.message });
    }
    return reply.status(400).send({ error: 'domain_error', message: error.message });
  }
  throw error;
}

export interface CategoryTreeNode {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  path: string;
  depth: number;
  children: CategoryTreeNode[];
}

export function buildCategoryTree<
  T extends {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    parentId: string | null;
    path: string;
    depth: number;
  },
>(categories: T[]): CategoryTreeNode[] {
  const nodes = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  for (const cat of categories) {
    nodes.set(cat.id, {
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      path: cat.path,
      depth: cat.depth,
      children: [],
    });
  }

  for (const cat of categories) {
    const node = nodes.get(cat.id)!;
    if (cat.parentId && nodes.has(cat.parentId)) {
      nodes.get(cat.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
