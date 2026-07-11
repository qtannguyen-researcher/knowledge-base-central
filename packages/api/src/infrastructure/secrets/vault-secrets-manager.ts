import type { SecretManagerOptions } from './secret-manager.js';

export class VaultSecretsManager {
  private readonly address: string;
  private readonly authMethod: 'token' | 'aws' | 'kubernetes';
  private readonly role?: string;
  private readonly mountPath: string;
  private readonly secrets: Record<string, string>;
  private cache: Map<string, { value: string; expiresAt: number }> = new Map();
  private token?: string;
  private readonly cacheTtlMs: number;

  constructor(options: SecretManagerOptions) {
    if (options.provider !== 'vault') {
      throw new Error('Invalid provider for VaultSecretsManager');
    }

    this.address = options.vaultConfig?.address ?? 'http://localhost:8200';
    this.authMethod = options.vaultConfig?.authMethod ?? 'token';
    this.role = options.vaultConfig?.role;
    this.mountPath = options.vaultConfig?.mountPath ?? 'secret';
    this.secrets = options.vaultConfig?.secrets ?? {};
    this.cacheTtlMs = 60_000;
  }

  async initialize(): Promise<void> {
    switch (this.authMethod) {
      case 'token':
        this.token = process.env.VAULT_TOKEN;
        break;
      case 'aws':
        await this.authenticateWithAws();
        break;
      case 'kubernetes':
        await this.authenticateWithKubernetes();
        break;
    }

    if (!this.token) {
      throw new Error('Vault authentication failed: no token available');
    }
  }

  async getSecret(secretPath: string): Promise<string> {
    const cached = this.getCached(secretPath);
    if (cached) {
      return cached;
    }

    const secretKey = this.secrets[secretPath] ?? secretPath;
    const secretValue = await this.fetchSecret(secretKey);
    this.setCached(secretPath, secretValue);
    return secretValue;
  }

  async getSecretJson<T>(secretPath: string): Promise<T> {
    const value = await this.getSecret(secretPath);
    return JSON.parse(value) as T;
  }

  async getAllSecrets(): Promise<Record<string, string>> {
    const results: Record<string, string> = {};

    for (const [key, path] of Object.entries(this.secrets)) {
      results[key] = await this.getSecret(path);
    }

    return results;
  }

  async putSecret(secretPath: string, value: string): Promise<void> {
    const secretKey = this.secrets[secretPath] ?? secretPath;
    await this.storeSecret(secretKey, value);
    this.invalidateCache(secretPath);
  }

  async rotateSecret(secretPath: string, newValue: string): Promise<void> {
    await this.putSecret(secretPath, newValue);
  }

  invalidateCache(secretPath: string): void {
    this.cache.delete(secretPath);
  }

  clearCache(): void {
    this.cache.clear();
  }

  private getCached(secretPath: string): string | null {
    const cached = this.cache.get(secretPath);
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(secretPath);
      return null;
    }

    return cached.value;
  }

  private setCached(secretPath: string, value: string): void {
    this.cache.set(secretPath, {
      value,
      expiresAt: Date.now() + this.cacheTtlMs,
    });
  }

  private async authenticateWithAws(): Promise<void> {
    const { execSync } = await import('child_process');
    try {
      const result = execSync(
        `vault login -method=aws header_value="identity-service" role=${this.role}`,
        { encoding: 'utf-8' },
      );
      const match = result.match(/token"\s*=\s*"([^"]+)"/);
      if (match) {
        this.token = match[1];
      }
    } catch {
      throw new Error('AWS authentication with Vault failed');
    }
  }

  private async authenticateWithKubernetes(): Promise<void> {
    const { execSync } = await import('child_process');
    const { readFileSync } = await import('fs');
    try {
      const jwtPath = '/var/run/secrets/kubernetes.io/serviceaccount/token';
      const jwt = readFileSync(jwtPath, 'utf-8');
      const result = execSync(`vault login -method=kubernetes role=${this.role}`, {
        encoding: 'utf-8',
        input: jwt,
      });
      const match = result.match(/token"\s*=\s*"([^"]+)"/);
      if (match) {
        this.token = match[1];
      }
    } catch {
      throw new Error('Kubernetes authentication with Vault failed');
    }
  }

  private async fetchSecret(secretPath: string): Promise<string> {
    if (!this.token) {
      await this.initialize();
    }

    const url = `${this.address}/v1/${this.mountPath}/${secretPath}`;
    const response = await fetch(url, {
      headers: {
        'X-Vault-Token': this.token!,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch secret ${secretPath}: ${response.statusText}`);
    }

    const data = (await response.json()) as { data: { data: { value: string } } };
    return data.data.data.value;
  }

  private async storeSecret(secretPath: string, value: string): Promise<void> {
    if (!this.token) {
      await this.initialize();
    }

    const url = `${this.address}/v1/${this.mountPath}/${secretPath}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Vault-Token': this.token!,
      },
      body: JSON.stringify({ data: { value } }),
    });

    if (!response.ok) {
      throw new Error(`Failed to store secret ${secretPath}: ${response.statusText}`);
    }
  }
}
