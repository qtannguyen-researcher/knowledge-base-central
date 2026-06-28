import type {
  ApiError,
  CategoryDetail,
  CategoryNode,
  Concept,
  KnowledgeAsset,
  LearningPath,
  LearningPathDetail,
  PaginatedResponse,
  PublicUser,
  Relationship,
  SearchResponse,
  Tag,
} from './api.types';

const API_BASE =
  typeof window === 'undefined'
    ? (process.env['API_URL'] ?? process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001')
    : '';

function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE) {
    return `${API_BASE}/api/v1${normalized}`;
  }
  return `/api/v1${normalized}`;
}

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'ApiClientError';
  }
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(apiUrl(path), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      ...(typeof window === 'undefined' ? { next: { revalidate: 60 } } : {}),
    });

    if (!response.ok) {
      let errorCode = 'unknown';
      let errorMessage: string | undefined;
      try {
        const body = (await response.json()) as ApiError;
        errorCode = body.error ?? 'unknown';
        errorMessage = body.message;
      } catch {
        // ignore parse errors
      }
      throw new ApiClientError(response.status, errorCode, errorMessage);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError(503, 'service_unavailable', 'API is unavailable');
  }
}

export interface ListAssetsParams {
  page?: number;
  limit?: number;
  categorySlug?: string;
  tag?: string;
}

export async function listAssets(
  params: ListAssetsParams = {},
): Promise<PaginatedResponse<KnowledgeAsset>> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.categorySlug) search.set('categorySlug', params.categorySlug);
  if (params.tag) search.set('tag', params.tag);
  const qs = search.toString();
  return fetchJson(`/assets${qs ? `?${qs}` : ''}`);
}

export async function getAsset(slug: string): Promise<KnowledgeAsset> {
  return fetchJson(`/assets/${encodeURIComponent(slug)}`);
}

export async function getAssetRelationships(slug: string): Promise<Relationship[]> {
  return fetchJson(`/assets/${encodeURIComponent(slug)}/relationships`);
}

export async function listCategories(): Promise<CategoryNode[]> {
  return fetchJson('/categories');
}

export async function getCategory(slug: string): Promise<CategoryDetail> {
  return fetchJson(`/categories/${encodeURIComponent(slug)}`);
}

export async function listTags(): Promise<Tag[]> {
  return fetchJson('/tags');
}

export async function getConcept(slug: string): Promise<Concept> {
  return fetchJson(`/concepts/${encodeURIComponent(slug)}`);
}

export async function listConcepts(page = 1, limit = 50): Promise<PaginatedResponse<Concept>> {
  return fetchJson(`/concepts?page=${page}&limit=${limit}`);
}

export async function listLearningPaths(): Promise<LearningPath[]> {
  return fetchJson('/learning-paths');
}

export async function getLearningPath(slug: string): Promise<LearningPathDetail> {
  return fetchJson(`/learning-paths/${encodeURIComponent(slug)}`);
}

export interface SearchParams {
  q: string;
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  difficulty?: string;
  contentType?: string;
}

export async function search(params: SearchParams): Promise<SearchResponse> {
  const searchParams = new URLSearchParams({ q: params.q });
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.category) searchParams.set('category', params.category);
  if (params.tag) searchParams.set('tag', params.tag);
  if (params.difficulty) searchParams.set('difficulty', params.difficulty);
  if (params.contentType) searchParams.set('contentType', params.contentType);
  return fetchJson(`/search?${searchParams.toString()}`);
}

function authUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE) {
    return `${API_BASE}${normalized}`;
  }
  return normalized;
}

interface FetchAuthOptions extends RequestInit {
  serverCookies?: string;
}

async function fetchAuthJson<T>(path: string, init?: FetchAuthOptions): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.serverCookies ? { Cookie: init.serverCookies } : {}),
    ...init?.headers,
  };
  const response = await fetch(authUrl(path), {
    ...init,
    headers,
    credentials: init?.serverCookies ? 'omit' : 'include',
  });

  if (!response.ok) {
    let errorCode = 'unknown';
    let errorMessage: string | undefined;
    try {
      const body = (await response.json()) as ApiError;
      errorCode = body.error ?? 'unknown';
      errorMessage = body.message;
    } catch {
      // ignore parse errors
    }
    throw new ApiClientError(response.status, errorCode, errorMessage);
  }

  return response.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<{ user: PublicUser }> {
  return fetchAuthJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(
  email: string,
  username: string,
  password: string,
): Promise<{ id: string; email: string; username: string }> {
  return fetchAuthJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, username, password }),
  });
}

export async function getCurrentUser(options?: { serverCookies?: string }): Promise<PublicUser> {
  return fetchAuthJson('/auth/me', options);
}

export async function getAllAssetSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  let page = 1;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const result = await listAssets({ page, limit });
    slugs.push(...result.items.map((a) => a.slug));
    hasMore = page * limit < result.total;
    page += 1;
  }

  return slugs;
}

export async function getAllCategorySlugs(): Promise<string[]> {
  const categories = await listCategories();
  const slugs: string[] = [];

  function walk(nodes: CategoryNode[]) {
    for (const node of nodes) {
      slugs.push(node.slug);
      walk(node.children);
    }
  }

  walk(categories);
  return slugs;
}

export function estimateReadTime(content: string | null | undefined): number {
  if (!content) return 1;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}
