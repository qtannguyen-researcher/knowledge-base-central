import type { SecretManagerOptions } from './secret-manager.js';

export class KubernetesSecretManager {
  private readonly secrets: Map<string, string> = new Map();
  private cache: Map<string, { value: string; expiresAt: number }> = new Map();
  private readonly cacheTtlMs: number;

  constructor(_options: SecretManagerOptions) {
    this.cacheTtlMs = 60_000;
    this.loadSecretsFromEnvironment();
  }

  private loadSecretsFromEnvironment(): void {
    const secretNames = [
      'IDENTITY_SERVICE_DATABASE_URL',
      'IDENTITY_SERVICE_PRIVATE_KEY',
      'IDENTITY_SERVICE_PUBLIC_KEY',
      'IDENTITY_SERVICE_JWT_LEGACY_PUBLIC_KEY',
    ];

    for (const name of secretNames) {
      const value = process.env[name];
      if (value) {
        this.secrets.set(name, value);
      }
    }
  }

  async getSecret(secretName: string): Promise<string> {
    const cached = this.getCached(secretName);
    if (cached) {
      return cached;
    }

    const secret = this.secrets.get(secretName);
    if (!secret) {
      const envKey = this.toEnvKey(secretName);
      const envValue = process.env[envKey];
      if (envValue) {
        this.secrets.set(secretName, envValue);
        this.setCached(secretName, envValue);
        return envValue;
      }
      throw new Error(`Secret ${secretName} not found`);
    }

    this.setCached(secretName, secret);
    return secret;
  }

  async getSecretJson<T>(secretName: string): Promise<T> {
    const value = await this.getSecret(secretName);
    return JSON.parse(value) as T;
  }

  async getAllSecrets(): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    for (const [key, value] of this.secrets) {
      results[key] = value;
    }
    return results;
  }

  async putSecret(_secretName: string, _value: string): Promise<void> {
    throw new Error('Cannot write secrets to Kubernetes secrets at runtime');
  }

  async rotateSecret(_secretName: string, _newValue: string): Promise<void> {
    throw new Error('Cannot rotate secrets in Kubernetes secrets at runtime');
  }

  invalidateCache(secretName: string): void {
    this.cache.delete(secretName);
  }

  clearCache(): void {
    this.cache.clear();
  }

  private getCached(secretName: string): string | null {
    const cached = this.cache.get(secretName);
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(secretName);
      return null;
    }

    return cached.value;
  }

  private setCached(secretName: string, value: string): void {
    this.cache.set(secretName, {
      value,
      expiresAt: Date.now() + this.cacheTtlMs,
    });
  }

  private toEnvKey(secretName: string): string {
    return secretName.toUpperCase().replace(/-/g, '_').replace(/\//g, '_');
  }
}

export class EnvSecretManager {
  private readonly prefix: string;
  private cache: Map<string, { value: string; expiresAt: number }> = new Map();
  private readonly cacheTtlMs: number;

  constructor(prefix: string = '') {
    this.prefix = prefix;
    this.cacheTtlMs = 60_000;
  }

  async getSecret(secretName: string): Promise<string> {
    const cached = this.getCached(secretName);
    if (cached) {
      return cached;
    }

    const envKey = this.toEnvKey(secretName);
    const value = process.env[envKey];

    if (!value) {
      throw new Error(`Environment variable ${envKey} not found`);
    }

    this.setCached(secretName, value);
    return value;
  }

  async getSecretJson<T>(secretName: string): Promise<T> {
    const value = await this.getSecret(secretName);
    return JSON.parse(value) as T;
  }

  async getAllSecrets(): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    const prefix = this.prefix ? `${this.prefix}_` : '';

    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefix) && value) {
        results[key.slice(prefix.length)] = value;
      }
    }

    return results;
  }

  invalidateCache(secretName: string): void {
    this.cache.delete(secretName);
  }

  clearCache(): void {
    this.cache.clear();
  }

  private getCached(secretName: string): string | null {
    const cached = this.cache.get(secretName);
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(secretName);
      return null;
    }

    return cached.value;
  }

  private setCached(secretName: string, value: string): void {
    this.cache.set(secretName, {
      value,
      expiresAt: Date.now() + this.cacheTtlMs,
    });
  }

  private toEnvKey(secretName: string): string {
    const fullKey = this.prefix ? `${this.prefix}_${secretName}` : secretName;
    return fullKey.toUpperCase().replace(/-/g, '_').replace(/\//g, '_');
  }
}
