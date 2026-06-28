import { Counter, Histogram, Gauge, Registry, collectDefaultMetrics } from 'prom-client';

const register = new Registry();

collectDefaultMetrics({ register });

export const httpRequestsTotal = new Counter({
  name: 'kbc_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'kbc_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

export const searchRequestsTotal = new Counter({
  name: 'kbc_search_requests_total',
  help: 'Total number of search requests',
  registers: [register],
});

export const gitSyncTotal = new Counter({
  name: 'kbc_git_sync_total',
  help: 'Total number of git sync operations',
  labelNames: ['status'],
  registers: [register],
});

export const queueJobsTotal = new Counter({
  name: 'kbc_queue_jobs_total',
  help: 'Total number of queue jobs',
  labelNames: ['queue', 'status'],
  registers: [register],
});

export const publishedAssetsGauge = new Gauge({
  name: 'kbc_published_assets_total',
  help: 'Total number of published assets',
  registers: [register],
});

export const rateLimitHitsTotal = new Counter({
  name: 'kbc_rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['route'],
  registers: [register],
});

export function recordRequest(
  method: string,
  route: string,
  statusCode: number,
  durationSeconds: number,
): void {
  const labels = { method, route, status_code: statusCode.toString() };
  httpRequestsTotal.inc(labels);
  httpRequestDuration.observe(labels, durationSeconds);
}

export function recordSearch(): void {
  searchRequestsTotal.inc();
}

export function recordGitSync(status: 'completed' | 'failed'): void {
  gitSyncTotal.inc({ status });
}

export function recordQueueJob(queue: string, status: 'completed' | 'failed' | 'active'): void {
  queueJobsTotal.inc({ queue, status });
}

export function recordRateLimitHit(route: string): void {
  rateLimitHitsTotal.inc({ route });
}

export function setPublishedAssetsCount(count: number): void {
  publishedAssetsGauge.set(count);
}

export async function getMetrics(): Promise<string> {
  return register.metrics();
}

export function getContentType(): string {
  return register.contentType;
}

export { register };
