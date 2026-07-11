import type { SecretConfig, SecretValue, SecretManagerOptions } from './secret-manager.js';

export class AwsSecretsManager {
  private readonly region: string;
  private readonly secrets: Record<string, SecretConfig>;
  private cache: Map<string, { value: string; expiresAt: number }> = new Map();
  private readonly cacheTtlMs: number;

  constructor(options: SecretManagerOptions) {
    if (options.provider !== 'aws-secrets-manager') {
      throw new Error('Invalid provider for AwsSecretsManager');
    }

    this.region = options.awsConfig?.region ?? 'us-east-1';
    this.secrets = options.awsConfig?.secrets ?? {};
    this.cacheTtlMs = 60_000;
  }

  async getSecret(secretName: string): Promise<string> {
    const cached = this.getCached(secretName);
    if (cached) {
      return cached;
    }

    const secretConfig = this.secrets[secretName];
    if (!secretConfig) {
      throw new Error(`Secret ${secretName} not found in configuration`);
    }

    const secretValue = await this.fetchSecret(secretConfig.secretName);
    this.setCached(secretName, secretValue.value);
    return secretValue.value;
  }

  async getSecretJson<T>(secretName: string): Promise<T> {
    const value = await this.getSecret(secretName);
    return JSON.parse(value) as T;
  }

  async getAllSecrets(): Promise<Record<string, string>> {
    const results: Record<string, string> = {};

    for (const [key] of Object.entries(this.secrets)) {
      results[key] = await this.getSecret(key);
    }

    return results;
  }

  async putSecret(secretName: string, value: string): Promise<void> {
    const secretConfig = this.secrets[secretName];
    if (!secretConfig) {
      throw new Error(`Secret ${secretName} not found in configuration`);
    }

    await this.storeSecret(secretConfig.secretName, value);
    this.invalidateCache(secretName);
  }

  async rotateSecret(secretName: string, newValue: string): Promise<void> {
    await this.putSecret(secretName, newValue);
    this.invalidateCache(secretName);
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

  private async fetchSecret(fullSecretName: string): Promise<SecretValue> {
    const command = `aws secretsmanager get-secret-value --secret-id ${fullSecretName} --region ${this.region} --query SecretString --output text`;

    const { execSync } = await import('child_process');
    try {
      const result = execSync(command, { encoding: 'utf-8' });
      const secretData = JSON.parse(result);

      return {
        value: secretData,
        version: 'latest',
        lastUpdated: new Date(),
      };
    } catch {
      throw new Error(`Failed to fetch secret ${fullSecretName}`);
    }
  }

  private async storeSecret(fullSecretName: string, value: string): Promise<void> {
    const command = `aws secretsmanager put-secret-value --secret-id ${fullSecretName} --secret-string '${value}' --region ${this.region}`;

    const { execSync } = await import('child_process');
    try {
      execSync(command, { encoding: 'utf-8' });
    } catch {
      throw new Error(`Failed to store secret ${fullSecretName}`);
    }
  }
}
