import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ArticleContent } from '@/components/articles/ArticleContent';
import { ArticleMetadata } from '@/components/articles/ArticleMetadata';
import { Breadcrumb } from '@/components/articles/Breadcrumb';
import { ReferencesList } from '@/components/articles/ReferencesList';
import { RelatedArticles } from '@/components/articles/RelatedArticles';
import {
  ApiClientError,
  getAllAssetSlugs,
  getAsset,
  getCategory,
  getLearningPath,
  listAssets,
  listCategories,
} from '@/lib/api';
import type { CategoryNode } from '@/lib/api.types';
import { buildMetadata, SITE_URL } from '@/lib/metadata';

export const revalidate = 300;

interface ArticlePageProps {
  params: { slug: string };
  searchParams: { path?: string };
}

function findCategoryById(nodes: CategoryNode[], id: string): CategoryNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findCategoryById(node.children, id);
    if (found) return found;
  }
  return undefined;
}

function buildCategoryBreadcrumbs(path: string): Array<{ label: string; href: string }> {
  const segments = path.split('/').filter(Boolean);
  return segments.map((segment, index) => ({
    label: segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    href: `/categories/${segments.slice(0, index + 1).join('/')}`,
  }));
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllAssetSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  try {
    const article = await getAsset(params.slug);
    return buildMetadata({
      title: article.title,
      description: article.summary ?? `Read ${article.title} on Knowledge Base Central.`,
      path: `/articles/${params.slug}`,
      image: `${SITE_URL}/og-default.png`,
    });
  } catch {
    return buildMetadata({
      title: 'Article not found',
      description: 'The requested article could not be found.',
      path: `/articles/${params.slug}`,
    });
  }
}

export default async function ArticlePage({ params, searchParams }: ArticlePageProps) {
  let article;
  try {
    article = await getAsset(params.slug);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const [categories, allSlugsResult, relatedResult] = await Promise.all([
    listCategories(),
    listAssets({ limit: 100 }),
    listAssets({ limit: 6 }),
  ]);

  const categoryNode = article.categoryId
    ? findCategoryById(categories, article.categoryId)
    : undefined;

  const relatedByCategory = categoryNode
    ? await listAssets({ categorySlug: categoryNode.slug, limit: 6 })
    : relatedResult;

  let categoryDetail;
  if (categoryNode) {
    try {
      categoryDetail = await getCategory(categoryNode.slug);
    } catch {
      categoryDetail = undefined;
    }
  }

  const validSlugs = allSlugsResult.items.map((a) => a.slug);
  const titleToSlug = new Map(allSlugsResult.items.map((a) => [a.title.toLowerCase(), a.slug]));

  const relatedArticles =
    categoryDetail?.assets.filter((a) => a.slug !== article.slug).slice(0, 4) ??
    relatedByCategory.items.filter((a) => a.slug !== article.slug).slice(0, 4);

  const metadataRefs = article.metadata?.['references'];
  const references = Array.isArray(metadataRefs)
    ? (metadataRefs as Array<{
        id: string;
        title: string;
        authors?: string[];
        year?: number;
        url?: string;
      }>)
    : [];

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    ...(categoryNode
      ? buildCategoryBreadcrumbs(categoryNode.path).map((b) => ({
          label: b.label,
          href: b.href,
        }))
      : []),
    { label: article.title },
  ];

  const content = article.rawContent ?? article.content ?? '';

  let pathNav: {
    prev: { slug: string; title: string } | null;
    next: { slug: string; title: string } | null;
    pathTitle: string;
  } | null = null;
  if (searchParams.path) {
    try {
      const learningPath = await getLearningPath(searchParams.path);
      const index = learningPath.items.findIndex((item) => item.asset.slug === params.slug);
      if (index >= 0) {
        pathNav = {
          pathTitle: learningPath.title,
          prev:
            index > 0
              ? {
                  slug: learningPath.items[index - 1]!.asset.slug,
                  title: learningPath.items[index - 1]!.asset.title,
                }
              : null,
          next:
            index < learningPath.items.length - 1
              ? {
                  slug: learningPath.items[index + 1]!.asset.slug,
                  title: learningPath.items[index + 1]!.asset.title,
                }
              : null,
        };
      }
    } catch {
      pathNav = null;
    }
  }

  return (
    <article>
      <Breadcrumb items={breadcrumbItems} />
      {pathNav && (
        <p className="mb-4 text-sm text-gray-600">
          Part of learning path:{' '}
          <Link
            href={`/learning-paths/${searchParams.path}`}
            className="text-brand-600 hover:underline"
          >
            {pathNav.pathTitle}
          </Link>
        </p>
      )}
      <ArticleMetadata
        article={article}
        {...(categoryNode
          ? { categoryName: categoryNode.name, categorySlug: categoryNode.slug }
          : {})}
      />
      <ArticleContent content={content} validSlugs={validSlugs} titleToSlug={titleToSlug} />
      {pathNav && (pathNav.prev || pathNav.next) && (
        <nav
          className="mt-8 flex justify-between border-t border-gray-200 pt-6"
          aria-label="Learning path navigation"
        >
          {pathNav.prev ? (
            <Link
              href={`/articles/${pathNav.prev.slug}?path=${searchParams.path}`}
              className="btn-secondary"
            >
              ← Previous: {pathNav.prev.title}
            </Link>
          ) : (
            <span />
          )}
          {pathNav.next && (
            <Link
              href={`/articles/${pathNav.next.slug}?path=${searchParams.path}`}
              className="btn-secondary"
            >
              Next: {pathNav.next.title} →
            </Link>
          )}
        </nav>
      )}
      <ReferencesList references={references} />
      <RelatedArticles articles={relatedArticles} />
    </article>
  );
}
