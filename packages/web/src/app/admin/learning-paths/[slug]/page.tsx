'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { LearningPath, KnowledgeAsset } from '@/lib/api.types';
import { getAdminLearningPath, updateLearningPathItems, listAdminAssets } from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';

interface PathItem {
  position: number;
  asset: KnowledgeAsset;
}

function SortableItem({
  item,
  index,
  onRemove,
}: {
  item: PathItem;
  index: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.asset.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-white border-b border-gray-200 last:border-b-0"
      {...attributes}
      {...listeners}
    >
      <span className="text-gray-400 cursor-grab active:cursor-grabbing select-none">⋮⋮</span>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700 shrink-0">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <Link
          href={`/admin/articles/${item.asset.id}/edit`}
          className="font-medium text-gray-900 hover:text-brand-600 truncate block"
        >
          {item.asset.title}
        </Link>
        <p className="text-sm text-gray-500 truncate">{item.asset.summary || 'No summary'}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="text-sm text-red-600 hover:text-red-700 shrink-0"
      >
        Remove
      </button>
    </li>
  );
}

export default function LearningPathDetailPage({ params }: { params: { slug: string } }) {
  const [path, setPath] = useState<(LearningPath & { items: PathItem[] }) | null>(null);
  const [items, setItems] = useState<PathItem[]>([]);
  const [available, setAvailable] = useState<KnowledgeAsset[]>([]);
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, assets] = await Promise.all([
        getAdminLearningPath(params.slug),
        listAdminAssets({ limit: 100 }),
      ]);
      setPath(p as LearningPath & { items: PathItem[] });
      setItems((p as LearningPath & { items: PathItem[] }).items || []);
      setAvailable(assets.items);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) {
        setPath(null);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load learning path');
      }
    } finally {
      setLoading(false);
    }
  }, [params.slug]);

  useEffect(() => {
    load();
    return () => {};
  }, [load]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((current) => {
      const oldIndex = current.findIndex((i) => i.asset.id === active.id);
      const newIndex = current.findIndex((i) => i.asset.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return current;
      return arrayMove(current, oldIndex, newIndex);
    });
  }, []);

  const saveOrder = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateLearningPathItems(
        params.slug,
        items.map((item, index) => ({ assetId: item.asset.id, position: index })),
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to save order');
      setSaving(false);
    }
  };

  const addItem = (asset: KnowledgeAsset) => {
    setItems([...items, { position: items.length, asset }]);
    setShowAdd(false);
    setQuery('');
  };

  const removeItem = (assetId: string) => {
    setItems(items.filter((i) => i.asset.id !== assetId));
  };

  const filtered = available.filter(
    (a) =>
      !items.some((i) => i.asset.id === a.id) &&
      (a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.summary?.toLowerCase().includes(query.toLowerCase())),
  );

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!path) return null;

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/learning-paths" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Learning Paths
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-2xl font-bold text-gray-900">{path.title}</h1>
          <button
            onClick={saveOrder}
            disabled={saving || items.length === 0}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
        {path.description && <p className="mt-1 text-sm text-gray-500">{path.description}</p>}
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="rounded-lg bg-white shadow border border-gray-200">
        <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Path Items ({items.length})</h2>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            Add Article
          </button>
        </div>
        {items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No articles in this path yet.</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.asset.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="divide-y">
                {items.map((item, index) => (
                  <SortableItem
                    key={item.asset.id}
                    item={item}
                    index={index}
                    onRemove={() => removeItem(item.asset.id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Add Article</h3>
              <button
                onClick={() => setShowAdd(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles..."
              className="input-field mb-4 w-full"
            />
            <div className="max-h-96 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-gray-500">No matching articles.</p>
              ) : (
                <ul className="divide-y">
                  {filtered.map((asset) => (
                    <li
                      key={asset.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => addItem(asset)}
                    >
                      <span className="font-medium text-gray-900">{asset.title}</span>
                      <p className="text-sm text-gray-500 truncate">
                        {asset.summary || 'No summary'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
