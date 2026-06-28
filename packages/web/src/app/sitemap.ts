import type { MetadataRoute } from 'next';

import { getAllAssetSlugs, getAllCategorySlugs } from '@/lib/api';
import { SITE_URL } from '@/lib/metadata';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    {
      url: `${SITE_URL}/articles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    { url: `${SITE_URL}/tags`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    {
      url: `${SITE_URL}/learning-paths`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    const [articleSlugs, categorySlugs] = await Promise.all([
      getAllAssetSlugs(),
      getAllCategorySlugs(),
    ]);

    const articleRoutes: MetadataRoute.Sitemap = articleSlugs.map((slug) => ({
      url: `${SITE_URL}/articles/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const categoryRoutes: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
      url: `${SITE_URL}/categories/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    return [...staticRoutes, ...articleRoutes, ...categoryRoutes];
  } catch {
    return staticRoutes;
  }
}
