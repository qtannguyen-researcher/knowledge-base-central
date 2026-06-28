import {
  ContentType,
  Difficulty,
  KnowledgeAssetStatus,
  UserRole,
} from '@knowledge-base-central/shared';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const ownerPassword = process.env['SEED_OWNER_PASSWORD'] ?? 'change-me-in-production';
  const passwordHash = await bcrypt.hash(ownerPassword, 12);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@knowledge-base.local' },
    create: {
      email: 'owner@knowledge-base.local',
      username: 'owner',
      displayName: 'Platform Owner',
      passwordHash,
      role: UserRole.OWNER,
      status: 'ACTIVE',
    },
    update: {
      passwordHash,
      role: UserRole.OWNER,
      status: 'ACTIVE',
    },
  });

  const categoryTree = [
    { slug: 'computer-science', name: 'Computer Science', parentSlug: null, depth: 0 },
    { slug: 'algorithms', name: 'Algorithms', parentSlug: 'computer-science', depth: 1 },
    { slug: 'data-structures', name: 'Data Structures', parentSlug: 'computer-science', depth: 1 },
    {
      slug: 'machine-learning',
      name: 'Machine Learning',
      parentSlug: 'computer-science',
      depth: 1,
    },
    { slug: 'deep-learning', name: 'Deep Learning', parentSlug: 'machine-learning', depth: 2 },
    { slug: 'systems', name: 'Systems', parentSlug: 'computer-science', depth: 1 },
    { slug: 'networking', name: 'Networking', parentSlug: 'systems', depth: 2 },
  ] as const;

  const categoryIds = new Map<string, string>();

  const categoryPaths = new Map<string, string>();

  for (const node of categoryTree) {
    const parentId = node.parentSlug ? categoryIds.get(node.parentSlug) : undefined;
    const parentPath = node.parentSlug ? categoryPaths.get(node.parentSlug) : undefined;
    const materializedPath = parentPath ? `${parentPath}/${node.slug}` : node.slug;

    const category = await prisma.category.upsert({
      where: { slug: node.slug },
      create: {
        slug: node.slug,
        name: node.name,
        path: materializedPath,
        depth: node.depth,
        parentId: parentId ?? null,
        description: `${node.name} category`,
      },
      update: {
        name: node.name,
        path: materializedPath,
        depth: node.depth,
        parentId: parentId ?? null,
      },
    });

    categoryIds.set(node.slug, category.id);
    categoryPaths.set(node.slug, materializedPath);
  }

  const csCategoryId = categoryIds.get('computer-science')!;
  const mlCategoryId = categoryIds.get('machine-learning')!;

  const tagData = [
    { slug: 'fundamentals', name: 'Fundamentals' },
    { slug: 'tutorial', name: 'Tutorial' },
    { slug: 'research', name: 'Research' },
    { slug: 'best-practices', name: 'Best Practices' },
    { slug: 'reference', name: 'Reference' },
  ];

  const tagIds = new Map<string, string>();
  for (const tag of tagData) {
    const record = await prisma.tag.upsert({
      where: { slug: tag.slug },
      create: tag,
      update: { name: tag.name },
    });
    tagIds.set(tag.slug, record.id);
  }

  const conceptData = [
    {
      slug: 'binary-search',
      name: 'Binary Search',
      description: 'Divide-and-conquer search on sorted arrays',
    },
    {
      slug: 'neural-networks',
      name: 'Neural Networks',
      description: 'Computational graphs for learning representations',
    },
    {
      slug: 'tcp-ip',
      name: 'TCP/IP',
      description: 'Internet protocol suite fundamentals',
    },
    {
      slug: 'big-o-notation',
      name: 'Big O Notation',
      description: 'Asymptotic complexity analysis',
    },
    {
      slug: 'gradient-descent',
      name: 'Gradient Descent',
      description: 'Iterative optimization for model training',
    },
  ];

  const conceptIds = new Map<string, string>();
  for (const concept of conceptData) {
    const record = await prisma.concept.upsert({
      where: { slug: concept.slug },
      create: concept,
      update: {
        name: concept.name,
        description: concept.description,
      },
    });
    conceptIds.set(concept.slug, record.id);
  }

  const assets = [
    {
      slug: 'intro-to-algorithms',
      title: 'Introduction to Algorithms',
      summary: 'Overview of algorithm design and analysis.',
      content: 'Algorithms are step-by-step procedures for solving problems.',
      contentType: ContentType.TUTORIAL,
      difficulty: Difficulty.BEGINNER,
      categoryId: csCategoryId,
      tagSlugs: ['fundamentals', 'tutorial'],
      conceptSlugs: ['big-o-notation', 'binary-search'],
    },
    {
      slug: 'binary-search-deep-dive',
      title: 'Binary Search Deep Dive',
      summary: 'Master binary search variants and complexity.',
      content: 'Binary search halves the search space each iteration.',
      contentType: ContentType.CONCEPT,
      difficulty: Difficulty.INTERMEDIATE,
      categoryId: categoryIds.get('algorithms')!,
      tagSlugs: ['fundamentals', 'reference'],
      conceptSlugs: ['binary-search'],
    },
    {
      slug: 'neural-networks-primer',
      title: 'Neural Networks Primer',
      summary: 'Foundations of feedforward neural networks.',
      content: 'Neural networks learn hierarchical feature representations.',
      contentType: ContentType.TUTORIAL,
      difficulty: Difficulty.INTERMEDIATE,
      categoryId: mlCategoryId,
      tagSlugs: ['tutorial', 'research'],
      conceptSlugs: ['neural-networks', 'gradient-descent'],
    },
    {
      slug: 'tcp-ip-fundamentals',
      title: 'TCP/IP Fundamentals',
      summary: 'Core concepts of the TCP/IP protocol stack.',
      content: 'TCP provides reliable byte-stream delivery over IP.',
      contentType: ContentType.REFERENCE_MATERIAL,
      difficulty: Difficulty.BEGINNER,
      categoryId: categoryIds.get('networking')!,
      tagSlugs: ['reference', 'fundamentals'],
      conceptSlugs: ['tcp-ip'],
    },
    {
      slug: 'gradient-descent-notes',
      title: 'Gradient Descent Research Notes',
      summary: 'Notes on optimization dynamics and learning rates.',
      content: 'Gradient descent iteratively updates parameters along the loss gradient.',
      contentType: ContentType.RESEARCH_NOTE,
      difficulty: Difficulty.ADVANCED,
      categoryId: categoryIds.get('deep-learning')!,
      tagSlugs: ['research', 'best-practices'],
      conceptSlugs: ['gradient-descent', 'neural-networks'],
    },
  ] as const;

  for (const asset of assets) {
    const publishedAt = new Date();

    const record = await prisma.knowledgeAsset.upsert({
      where: { slug: asset.slug },
      create: {
        slug: asset.slug,
        title: asset.title,
        summary: asset.summary,
        content: asset.content,
        rawContent: `# ${asset.title}\n\n${asset.content}`,
        status: KnowledgeAssetStatus.PUBLISHED,
        contentType: asset.contentType,
        difficulty: asset.difficulty,
        authorId: owner.id,
        categoryId: asset.categoryId,
        publishedAt,
      },
      update: {
        title: asset.title,
        summary: asset.summary,
        content: asset.content,
        status: KnowledgeAssetStatus.PUBLISHED,
        publishedAt,
      },
    });

    for (const tagSlug of asset.tagSlugs) {
      const tagId = tagIds.get(tagSlug)!;
      await prisma.knowledgeAssetTag.upsert({
        where: { assetId_tagId: { assetId: record.id, tagId } },
        create: { assetId: record.id, tagId },
        update: {},
      });
    }

    for (const conceptSlug of asset.conceptSlugs) {
      const conceptId = conceptIds.get(conceptSlug)!;
      await prisma.knowledgeAssetConcept.upsert({
        where: { assetId_conceptId: { assetId: record.id, conceptId } },
        create: { assetId: record.id, conceptId },
        update: {},
      });
    }
  }

  console.log('Seed completed successfully.');
  console.log(`  Owner user: ${owner.email}`);
  console.log(`  Categories: ${categoryTree.length}`);
  console.log(`  Assets: ${assets.length}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
