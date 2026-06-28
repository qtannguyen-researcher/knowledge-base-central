import type { ZodFastify } from '../../types.js';

import type { Container } from '../../../container.js';

export async function registerPublicTagRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  app.get('/tags', async () => {
    const tags = await container.prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { assets: true } },
      },
    });

    return tags.map((tag) => ({
      id: tag.id,
      slug: tag.slug,
      name: tag.name,
      assetCount: tag._count.assets,
      createdAt: tag.createdAt.toISOString(),
    }));
  });
}
