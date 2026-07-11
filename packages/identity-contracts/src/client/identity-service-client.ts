export interface IdentityServiceClientOptions {
  baseUrl: string;
  correlationId?: string;
  timeoutMs?: number;
  retryAttempts?: number;
  circuitBreakerOptions?: {
    failureThreshold: number;
    resetTimeoutMs: number;
    halfOpenMaxCalls: number;
  };
}

export interface RequestOptions {
  headers?: Record<string, string>;
  body?: unknown;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

export class IdentityServiceClient {
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryAttempts: number;
  private readonly correlationId: string;
  private readonly circuitBreaker: {
    execute: <T>(fn: () => Promise<T>) => Promise<T>;
    getState: () => string;
  };

  constructor(private readonly options: IdentityServiceClientOptions) {
    this.defaultTimeoutMs = options.timeoutMs ?? 500;
    this.defaultRetryAttempts = options.retryAttempts ?? 2;
    this.correlationId = options.correlationId ?? `req-${crypto.randomUUID().slice(0, 8)}`;
    this.circuitBreaker = this.createCircuitBreaker(options.circuitBreakerOptions);
  }

  private createCircuitBreaker(
    circuitOptions?: IdentityServiceClientOptions['circuitBreakerOptions'],
  ) {
    const options = circuitOptions ?? {
      failureThreshold: 5,
      resetTimeoutMs: 30_000,
      halfOpenMaxCalls: 1,
    };

    let failureCount = 0;
    let lastFailureTime = 0;
    let state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    let halfOpenCalls = 0;

    const execute = async <T>(fn: () => Promise<T>): Promise<T> => {
      if (state === 'OPEN') {
        if (Date.now() - lastFailureTime >= options.resetTimeoutMs) {
          state = 'HALF_OPEN';
          halfOpenCalls = 0;
        } else {
          throw new Error('Circuit breaker is open');
        }
      }

      try {
        const result = await fn();
        failureCount = 0;
        halfOpenCalls = 0;
        state = 'CLOSED';
        return result;
      } catch (error) {
        failureCount += 1;
        lastFailureTime = Date.now();

        if (state === 'HALF_OPEN' && halfOpenCalls >= options.halfOpenMaxCalls) {
          state = 'OPEN';
        } else if (failureCount >= options.failureThreshold) {
          state = 'OPEN';
        }

        halfOpenCalls += 1;
        throw error;
      }
    };

    const getState = () => state;

    return { execute, getState };
  }

  private async request<T>(path: string, requestOptions: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Correlation-ID': this.correlationId,
      ...requestOptions.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeoutMs);

    try {
      const response = await this.retry(() =>
        fetch(`${this.options.baseUrl}${path}`, {
          method: requestOptions.method ?? (requestOptions.body ? 'POST' : 'GET'),
          headers,
          body: requestOptions.body ? JSON.stringify(requestOptions.body) : undefined,
          signal: controller.signal,
        }),
      );

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({}))) as {
          error?: { code?: string; message?: string };
        };
        throw new Error(
          `HTTP ${response.status}: ${errorBody.error?.message ?? response.statusText}`,
        );
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async retry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.defaultRetryAttempts; attempt += 1) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    throw lastError;
  }

  // Health endpoints
  async health(): Promise<{ status: string }> {
    return this.request('/health');
  }

  async healthReady(): Promise<{ status: string }> {
    return this.request('/health/ready');
  }

  // Auth endpoints
  async login(payload: {
    email: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      isActive: boolean;
    };
  }> {
    return this.request('/auth/login', { body: payload });
  }

  async refreshToken(payload: { refreshToken: string }): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      isActive: boolean;
    };
  }> {
    return this.request('/auth/refresh', { body: payload });
  }

  async logout(payload: { refreshToken: string }): Promise<void> {
    await this.request('/auth/logout', { body: payload });
  }

  async register(payload: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      isActive: boolean;
    };
  }> {
    return this.request('/auth/register', { body: payload });
  }

  // User endpoints
  async getUsers(): Promise<unknown> {
    return this.request('/users');
  }

  async createUser(payload: unknown): Promise<unknown> {
    return this.request('/users', { body: payload });
  }

  async getUserById(id: string): Promise<unknown> {
    return this.request(`/users/${encodeURIComponent(id)}`);
  }

  async getUserByEmail(email: string): Promise<unknown> {
    return this.request(`/users/by-email/${encodeURIComponent(email)}`);
  }

  async updateUser(id: string, payload: unknown): Promise<unknown> {
    return this.request(`/users/${encodeURIComponent(id)}`, { body: payload, method: 'PUT' });
  }

  async deleteUser(id: string): Promise<unknown> {
    return this.request(`/users/${encodeURIComponent(id)}`, {
      headers: { 'Content-Type': 'application/json' },
      body: {},
      method: 'DELETE',
    });
  }

  // Role endpoints
  async getRoles(): Promise<unknown> {
    return this.request('/roles');
  }

  async createRole(payload: unknown): Promise<unknown> {
    return this.request('/roles', { body: payload });
  }

  async getRoleById(id: string): Promise<unknown> {
    return this.request(`/roles/${encodeURIComponent(id)}`);
  }

  async updateRole(id: string, payload: unknown): Promise<unknown> {
    return this.request(`/roles/${encodeURIComponent(id)}`, { body: payload, method: 'PUT' });
  }

  async deleteRole(id: string): Promise<unknown> {
    return this.request(`/roles/${encodeURIComponent(id)}`, {
      headers: { 'Content-Type': 'application/json' },
      body: {},
      method: 'DELETE',
    });
  }

  // Permission endpoints
  async getPermissions(): Promise<unknown> {
    return this.request('/permissions');
  }

  async createPermission(payload: unknown): Promise<unknown> {
    return this.request('/permissions', { body: payload });
  }

  async getPermissionById(id: string): Promise<unknown> {
    return this.request(`/permissions/${encodeURIComponent(id)}`);
  }

  async updatePermission(id: string, payload: unknown): Promise<unknown> {
    return this.request(`/permissions/${encodeURIComponent(id)}`, { body: payload, method: 'PUT' });
  }

  async deletePermission(id: string): Promise<unknown> {
    return this.request(`/permissions/${encodeURIComponent(id)}`, {
      headers: { 'Content-Type': 'application/json' },
      body: {},
      method: 'DELETE',
    });
  }

  async assignRolePermission(roleId: string, permissionId: string): Promise<unknown> {
    return this.request(`/roles/${encodeURIComponent(roleId)}/permissions`, {
      body: { permissionId },
    });
  }

  async removeRolePermission(roleId: string, permissionId: string): Promise<unknown> {
    return this.request(
      `/roles/${encodeURIComponent(roleId)}/permissions/${encodeURIComponent(permissionId)}`,
      {
        headers: { 'Content-Type': 'application/json' },
        body: {},
        method: 'DELETE',
      },
    );
  }

  // Authorization endpoints
  async getUserRoles(userId: string, contextResourceId?: string): Promise<unknown> {
    const query = contextResourceId ? `?context=${encodeURIComponent(contextResourceId)}` : '';
    return this.request(`/users/${encodeURIComponent(userId)}/roles${query}`);
  }

  async getUserPermissions(userId: string, contextResourceId?: string): Promise<unknown> {
    const query = contextResourceId ? `?context=${encodeURIComponent(contextResourceId)}` : '';
    return this.request(`/users/${encodeURIComponent(userId)}/permissions${query}`);
  }

  async authorize(payload: {
    userId: string;
    resourceId: string;
    requiredPermission: string;
  }): Promise<unknown> {
    return this.request('/authorize', { body: payload });
  }

  // Audit endpoints
  async getAuditEvents(): Promise<unknown> {
    return this.request('/audit-events');
  }

  async createAuditEvent(payload: unknown): Promise<unknown> {
    return this.request('/audit-events', { body: payload });
  }
}
