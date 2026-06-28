'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAdminAsset, listAdminCategories, listAssetVersions } from '@/lib/admin-api';
import { listTags, listConcepts } from '@/lib/api';
import type { KnowledgeAsset, CategoryNode, Tag, Concept } from '@/lib/api.types';
import type { AssetVersion } from '@/lib/admin-api';
import { EditArticleForm } from './EditArticleForm';
import { ApiClientError } from '@/lib/api';

export default function EditArticlePage({ params }: { params: { slug: string } }) {
  const [asset, setAsset] = useState<KnowledgeAsset | null>(null);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [versions, setVersions] = useState<AssetVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getAdminAsset(params.slug),
      listAdminCategories(),
      listTags(),
      listConcepts(1, 50),
      listAssetVersions(params.slug),
    ])
      .then(([a, c, t, co, v]) => {
        if (cancelled) return;
        setAsset(a);
        setCategories(c);
        setTags(t);
        setConcepts(co.items);
        setVersions(v);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiClientError && err.status === 404) notFound();
        setError(err instanceof Error ? err.message : 'Failed to load article');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  if (loading) return <div className="text-gray-500">Loading article...</div>;
  if (error) return <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  if (!asset) return notFound();

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/articles" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Articles
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Edit Article</h1>
      </div>
      <EditArticleForm
        assetId={asset.id}
        initialAsset={asset}
        categories={categories}
        tags={tags}
        concepts={{ items: concepts, total: concepts.length, page: 1, limit: 50 }}
        versions={versions}
      />
    </div>
  );
}
