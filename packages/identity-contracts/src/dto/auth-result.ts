import type { User } from './user.js';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export { LoginResult as AuthResult };
