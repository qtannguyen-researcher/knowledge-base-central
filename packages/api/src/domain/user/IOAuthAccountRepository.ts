export interface OAuthAccountLink {
  userId: string;
  provider: string;
  providerId: string;
}

export interface IOAuthAccountRepository {
  findByProvider(provider: string, providerId: string): Promise<OAuthAccountLink | null>;
  create(params: { userId: string; provider: string; providerId: string }): Promise<void>;
}
