import type {
  PaginatedResponse,
  KnowledgeAsset,
  CategoryNode,
  Tag,
  Concept,
  LearningPath,
} from './api.types';
import { ApiClientError } from './api';

const API_BASE =
  typeof window === 'undefined'
    ? (process.env['API_URL'] ?? process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001')
    : '';

function adminApiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE) {
    return `${API_BASE}/api/v1/admin${normalized}`;
  }
  return `/api/v1/admin${normalized}`;
}

interface FetchAdminOptions extends RequestInit {
  serverCookies?: string;
}

async function fetchAdminJson<T>(path: string, init?: FetchAdminOptions): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.serverCookies ? { Cookie: init.serverCookies } : {}),
    ...init?.headers,
  };
  const response = await fetch(adminApiUrl(path), {
    ...init,
    headers,
    credentials: init?.serverCookies ? 'omit' : 'include',
  });

  if (!response.ok) {
    let errorCode = 'unknown';
    let errorMessage: string | undefined;
    try {
      const body = (await response.json()) as { error?: string; message?: string };
      errorCode = body.error ?? 'unknown';
      errorMessage = body.message;
    } catch {
      // ignore parse errors
    }
    throw new ApiClientError(response.status, errorCode, errorMessage);
  }

  return response.json() as Promise<T>;
}

// Asset endpoints
export interface ListAdminAssetsParams {
  page?: number;
  limit?: number;
  status?: string;
  categoryId?: string;
}

export async function listAdminAssets(
  params: ListAdminAssetsParams = {},
  options?: { serverCookies?: string },
): Promise<PaginatedResponse<KnowledgeAsset>> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.status) search.set('status', params.status);
  if (params.categoryId) search.set('categoryId', params.categoryId);
  const qs = search.toString();
  return fetchAdminJson(`/assets${qs ? `?${qs}` : ''}`, options);
}

export async function getAdminAsset(
  id: string,
  options?: { serverCookies?: string },
): Promise<KnowledgeAsset> {
  return fetchAdminJson(`/assets/${encodeURIComponent(id)}`, options);
}

export interface CreateAssetBody {
  title: string;
  summary?: string;
  content?: string;
  rawContent?: string;
  contentType?: string;
  categoryId?: string;
  difficulty?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export async function createAdminAsset(
  data: CreateAssetBody,
  options?: { serverCookies?: string },
): Promise<KnowledgeAsset> {
  return fetchAdminJson('/assets', { ...options, method: 'POST', body: JSON.stringify(data) });
}

export interface UpdateAssetBody {
  title?: string;
  summary?: string;
  content?: string;
  rawContent?: string;
  contentType?: string;
  categoryId?: string;
  difficulty?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export async function updateAdminAsset(
  id: string,
  data: UpdateAssetBody,
  options?: { serverCookies?: string },
): Promise<KnowledgeAsset> {
  return fetchAdminJson(`/assets/${encodeURIComponent(id)}`, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminAsset(
  id: string,
  options?: { serverCookies?: string },
): Promise<KnowledgeAsset> {
  return fetchAdminJson(`/assets/${encodeURIComponent(id)}`, { ...options, method: 'DELETE' });
}

export async function submitAssetForReview(
  id: string,
  options?: { serverCookies?: string },
): Promise<KnowledgeAsset> {
  return fetchAdminJson(`/assets/${encodeURIComponent(id)}/submit-review`, {
    ...options,
    method: 'POST',
  });
}

export async function approveAsset(
  id: string,
  options?: { serverCookies?: string },
): Promise<KnowledgeAsset> {
  return fetchAdminJson(`/assets/${encodeURIComponent(id)}/approve`, {
    ...options,
    method: 'POST',
  });
}

export async function publishAsset(
  id: string,
  options?: { serverCookies?: string },
): Promise<KnowledgeAsset> {
  return fetchAdminJson(`/assets/${encodeURIComponent(id)}/publish`, {
    ...options,
    method: 'POST',
  });
}

export async function archiveAsset(
  id: string,
  options?: { serverCookies?: string },
): Promise<KnowledgeAsset> {
  return fetchAdminJson(`/assets/${encodeURIComponent(id)}/archive`, {
    ...options,
    method: 'POST',
  });
}

export async function restoreAsset(
  id: string,
  options?: { serverCookies?: string },
): Promise<KnowledgeAsset> {
  return fetchAdminJson(`/assets/${encodeURIComponent(id)}/restore`, {
    ...options,
    method: 'POST',
  });
}

export interface AssetVersion {
  id: string;
  assetId: string;
  gitSha: string | null;
  authorId: string | null;
  createdAt: string;
  rawContent?: string;
  metadata?: Record<string, unknown>;
}

export async function listAssetVersions(
  assetId: string,
  options?: { serverCookies?: string },
): Promise<AssetVersion[]> {
  return fetchAdminJson(`/assets/${encodeURIComponent(assetId)}/versions`, options);
}

export async function getAssetVersion(
  assetId: string,
  versionId: string,
  options?: { serverCookies?: string },
): Promise<AssetVersion> {
  return fetchAdminJson(
    `/assets/${encodeURIComponent(assetId)}/versions/${encodeURIComponent(versionId)}`,
    options,
  );
}

export async function restoreAssetVersion(
  assetId: string,
  versionId: string,
  options?: { serverCookies?: string },
): Promise<KnowledgeAsset> {
  return fetchAdminJson(
    `/assets/${encodeURIComponent(assetId)}/versions/${encodeURIComponent(versionId)}/restore`,
    { ...options, method: 'POST' },
  );
}

// Category endpoints
export async function listAdminCategories(options?: {
  serverCookies?: string;
}): Promise<CategoryNode[]> {
  return fetchAdminJson('/categories', options);
}

export interface CreateCategoryBody {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
}

export async function createAdminCategory(
  data: CreateCategoryBody,
  options?: { serverCookies?: string },
): Promise<CategoryNode> {
  return fetchAdminJson('/categories', { ...options, method: 'POST', body: JSON.stringify(data) });
}

export interface UpdateCategoryBody {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string;
}

export async function updateAdminCategory(
  id: string,
  data: UpdateCategoryBody,
  options?: { serverCookies?: string },
): Promise<CategoryNode> {
  return fetchAdminJson(`/categories/${encodeURIComponent(id)}`, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminCategory(
  id: string,
  options?: { serverCookies?: string },
): Promise<void> {
  await fetchAdminJson(`/categories/${encodeURIComponent(id)}`, { ...options, method: 'DELETE' });
}

// Tag endpoints
export async function listAdminTags(options?: { serverCookies?: string }): Promise<Tag[]> {
  return fetchAdminJson('/tags', options);
}

export interface CreateTagBody {
  name: string;
  slug?: string;
}

export async function createAdminTag(
  data: CreateTagBody,
  options?: { serverCookies?: string },
): Promise<Tag> {
  return fetchAdminJson('/tags', { ...options, method: 'POST', body: JSON.stringify(data) });
}

export interface UpdateTagBody {
  name?: string;
  slug?: string;
}

export async function updateAdminTag(
  id: string,
  data: UpdateTagBody,
  options?: { serverCookies?: string },
): Promise<Tag> {
  return fetchAdminJson(`/tags/${encodeURIComponent(id)}`, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminTag(
  id: string,
  options?: { serverCookies?: string },
): Promise<void> {
  await fetchAdminJson(`/tags/${encodeURIComponent(id)}`, { ...options, method: 'DELETE' });
}

// Concept endpoints
export async function listAdminConcepts(
  page = 1,
  limit = 50,
  options?: { serverCookies?: string },
): Promise<PaginatedResponse<Concept>> {
  return fetchAdminJson(`/concepts?page=${page}&limit=${limit}`, options);
}

export interface CreateConceptBody {
  name: string;
  slug?: string;
  aliases?: string[];
  description?: string;
  domain?: string;
}

export async function createAdminConcept(
  data: CreateConceptBody,
  options?: { serverCookies?: string },
): Promise<Concept> {
  return fetchAdminJson('/concepts', { ...options, method: 'POST', body: JSON.stringify(data) });
}

export interface UpdateConceptBody {
  name?: string;
  slug?: string;
  aliases?: string[];
  description?: string;
  domain?: string;
}

export async function updateAdminConcept(
  id: string,
  data: UpdateConceptBody,
  options?: { serverCookies?: string },
): Promise<Concept> {
  return fetchAdminJson(`/concepts/${encodeURIComponent(id)}`, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminConcept(
  id: string,
  options?: { serverCookies?: string },
): Promise<void> {
  await fetchAdminJson(`/concepts/${encodeURIComponent(id)}`, { ...options, method: 'DELETE' });
}

// Reference endpoints
export interface Reference {
  id: string;
  slug: string;
  title: string;
  authors: string[];
  year: number | null;
  url: string | null;
  doi: string | null;
  type: string | null;
  createdAt: string;
}

export async function listAdminReferences(
  page = 1,
  limit = 20,
  options?: { serverCookies?: string },
): Promise<PaginatedResponse<Reference>> {
  return fetchAdminJson(`/references?page=${page}&limit=${limit}`, options);
}

export interface CreateReferenceBody {
  title: string;
  slug?: string;
  authors?: string[];
  year?: number;
  url?: string;
  doi?: string;
  type?: string;
}

export async function createAdminReference(
  data: CreateReferenceBody,
  options?: { serverCookies?: string },
): Promise<Reference> {
  return fetchAdminJson('/references', { ...options, method: 'POST', body: JSON.stringify(data) });
}

export interface UpdateReferenceBody {
  title?: string;
  slug?: string;
  authors?: string[];
  year?: number;
  url?: string;
  doi?: string;
  type?: string;
}

export async function updateAdminReference(
  id: string,
  data: UpdateReferenceBody,
  options?: { serverCookies?: string },
): Promise<Reference> {
  return fetchAdminJson(`/references/${encodeURIComponent(id)}`, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminReference(
  id: string,
  options?: { serverCookies?: string },
): Promise<void> {
  await fetchAdminJson(`/references/${encodeURIComponent(id)}`, { ...options, method: 'DELETE' });
}

// Learning Path endpoints
export async function listAdminLearningPaths(options?: {
  serverCookies?: string;
}): Promise<LearningPath[]> {
  return fetchAdminJson('/learning-paths', options);
}

export async function getAdminLearningPath(
  id: string,
  options?: { serverCookies?: string },
): Promise<LearningPath & { items: Array<{ position: number; asset: KnowledgeAsset }> }> {
  return fetchAdminJson(`/learning-paths/${encodeURIComponent(id)}`, options);
}

export interface CreateLearningPathBody {
  title: string;
  slug?: string;
  description?: string;
  difficulty?: string;
  estimatedDuration?: number;
}

export async function createAdminLearningPath(
  data: CreateLearningPathBody,
  options?: { serverCookies?: string },
): Promise<LearningPath> {
  return fetchAdminJson('/learning-paths', {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface UpdateLearningPathBody {
  title?: string;
  slug?: string;
  description?: string;
  difficulty?: string;
  estimatedDuration?: number;
  status?: string;
}

export async function updateAdminLearningPath(
  id: string,
  data: UpdateLearningPathBody,
  options?: { serverCookies?: string },
): Promise<LearningPath> {
  return fetchAdminJson(`/learning-paths/${encodeURIComponent(id)}`, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminLearningPath(
  id: string,
  options?: { serverCookies?: string },
): Promise<void> {
  await fetchAdminJson(`/learning-paths/${encodeURIComponent(id)}`, {
    ...options,
    method: 'DELETE',
  });
}

export async function updateLearningPathItems(
  id: string,
  items: Array<{ assetId: string; position: number }>,
  options?: { serverCookies?: string },
): Promise<void> {
  await fetchAdminJson(`/learning-paths/${encodeURIComponent(id)}/items`, {
    ...options,
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
}

// Git Sync endpoints
export interface GitSyncJob {
  id: string;
  status: string;
  trigger: string;
  repository: string | null;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  syncedCount: number | null;
  createdAt: string;
}

export async function listGitSyncJobs(
  page = 1,
  limit = 10,
  options?: { serverCookies?: string },
): Promise<PaginatedResponse<GitSyncJob>> {
  return fetchAdminJson(`/git-sync/jobs?page=${page}&limit=${limit}`, options);
}

export async function getGitSyncJob(
  id: string,
  options?: { serverCookies?: string },
): Promise<GitSyncJob> {
  return fetchAdminJson(`/git-sync/jobs/${encodeURIComponent(id)}`, options);
}

export async function triggerGitSync(options?: {
  serverCookies?: string;
}): Promise<{ jobId: string }> {
  return fetchAdminJson('/git-sync/trigger', { ...options, method: 'POST' });
}

// Comment moderation endpoints
export interface Comment {
  id: string;
  assetId: string;
  authorId: string;
  content: string;
  status: string;
  createdAt: string;
  asset?: { id: string; slug: string; title: string };
  author?: { id: string; username: string; displayName?: string };
}

export async function listPendingComments(
  page = 1,
  limit = 20,
  assetId?: string,
  options?: { serverCookies?: string },
): Promise<PaginatedResponse<Comment>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (assetId) params.set('assetId', assetId);
  return fetchAdminJson(`/comments/pending?${params.toString()}`, options);
}

export async function approveComment(
  id: string,
  options?: { serverCookies?: string },
): Promise<{ id: string; status: string }> {
  return fetchAdminJson(`/comments/${encodeURIComponent(id)}/approve`, {
    ...options,
    method: 'POST',
  });
}

export async function rejectComment(
  id: string,
  options?: { serverCookies?: string },
): Promise<{ id: string; status: string }> {
  return fetchAdminJson(`/comments/${encodeURIComponent(id)}/reject`, {
    ...options,
    method: 'POST',
  });
}

// Correction request endpoints
export interface CorrectionRequest {
  id: string;
  description: string;
  suggestion: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  asset?: { id: string; slug: string; title: string };
  submitter?: { id: string; username: string; displayName?: string };
  reviewedBy?: { id: string; username: string; displayName?: string } | null;
}

export async function listCorrections(
  page = 1,
  limit = 20,
  status?: string,
  assetId?: string,
  options?: { serverCookies?: string },
): Promise<PaginatedResponse<CorrectionRequest>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);
  if (assetId) params.set('assetId', assetId);
  return fetchAdminJson(`/corrections?${params.toString()}`, options);
}

export async function getCorrection(
  id: string,
  options?: { serverCookies?: string },
): Promise<CorrectionRequest> {
  return fetchAdminJson(`/corrections/${encodeURIComponent(id)}`, options);
}

export async function startReviewCorrection(
  id: string,
  options?: { serverCookies?: string },
): Promise<{ id: string; status: string }> {
  return fetchAdminJson(`/corrections/${encodeURIComponent(id)}/review`, {
    ...options,
    method: 'POST',
  });
}

export async function acceptCorrection(
  id: string,
  options?: { serverCookies?: string },
): Promise<{ id: string; status: string }> {
  return fetchAdminJson(`/corrections/${encodeURIComponent(id)}/accept`, {
    ...options,
    method: 'POST',
  });
}

export async function rejectCorrection(
  id: string,
  reason?: string,
  options?: { serverCookies?: string },
): Promise<{ id: string; status: string }> {
  return fetchAdminJson(`/corrections/${encodeURIComponent(id)}/reject`, {
    ...options,
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function implementCorrection(
  id: string,
  options?: { serverCookies?: string },
): Promise<{ id: string; status: string }> {
  return fetchAdminJson(`/corrections/${encodeURIComponent(id)}/implement`, {
    ...options,
    method: 'POST',
  });
}

// Audit log endpoints
export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actor?: { id: string; username: string } | null;
  action: string;
  resource: string;
  resourceId: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

export async function listAuditLogs(
  page = 1,
  limit = 50,
  action?: string,
  resource?: string,
  actorId?: string,
  options?: { serverCookies?: string },
): Promise<PaginatedResponse<AuditLogEntry>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (action) params.set('action', action);
  if (resource) params.set('resource', resource);
  if (actorId) params.set('actorId', actorId);
  return fetchAdminJson(`/audit?${params.toString()}`, options);
}

// User management endpoints
export interface AdminUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  role: string;
  status: string;
  createdAt: string;
}

export async function listAdminUsers(options?: { serverCookies?: string }): Promise<AdminUser[]> {
  return fetchAdminJson('/users', options);
}

export interface UpdateUserRoleBody {
  role: string;
}

export async function updateUserRole(
  id: string,
  role: string,
  options?: { serverCookies?: string },
): Promise<AdminUser> {
  return fetchAdminJson(`/users/${encodeURIComponent(id)}/role`, {
    ...options,
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

export interface UpdateUserStatusBody {
  status: string;
}

export async function updateUserStatus(
  id: string,
  status: string,
  options?: { serverCookies?: string },
): Promise<AdminUser> {
  return fetchAdminJson(`/users/${encodeURIComponent(id)}/status`, {
    ...options,
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

// Dashboard stats
export interface DashboardStats {
  totalArticles: number;
  published: number;
  inReview: number;
  drafts: number;
  totalCategories: number;
  pendingComments: number;
  openCorrections: number;
}

export async function getDashboardStats(options?: {
  serverCookies?: string;
}): Promise<DashboardStats> {
  return fetchAdminJson('/stats', options);
}
