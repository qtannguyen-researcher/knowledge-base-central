export interface SecretConfig {
  region: string;
  secretName: string;
}

export interface SecretValue {
  value: string;
  version: string;
  lastUpdated: Date;
}

export interface SecretRotationConfig {
  enabled: boolean;
  rotationDays: number;
  secretId: string;
}

export interface AwsSecretsManagerConfig {
  region: string;
  secrets: Record<string, SecretConfig>;
}

export interface VaultConfig {
  address: string;
  authMethod: 'token' | 'aws' | 'kubernetes';
  role?: string;
  mountPath: string;
  secrets: Record<string, string>;
}

export interface SecretManagerOptions {
  provider: 'aws-secrets-manager' | 'vault' | 'env';
  awsConfig?: AwsSecretsManagerConfig;
  vaultConfig?: VaultConfig;
}

export const IDENTITY_SERVICE_SECRETS = {
  DATABASE_URL: 'identity-service/database-url',
  IDENTITY_PRIVATE_KEY: 'identity-service/identity-private-key',
  IDENTITY_PUBLIC_KEY: 'identity-service/identity-public-key',
  JWT_LEGACY_PUBLIC_KEY: 'identity-service/jwt-legacy-public-key',
} as const;

export const MONOLITH_SECRETS = {
  DATABASE_URL: 'monolith/database-url',
  REDIS_URL: 'monolith/redis-url',
  JWT_PUBLIC_KEY: 'monolith/jwt-public-key',
  OAUTH_GITHUB_CLIENT_ID: 'monolith/oauth-github-client-id',
  OAUTH_GITHUB_CLIENT_SECRET: 'monolith/oauth-github-client-secret',
  OAUTH_GOOGLE_CLIENT_ID: 'monolith/oauth-google-client-id',
  OAUTH_GOOGLE_CLIENT_SECRET: 'monolith/oauth-google-client-secret',
} as const;
