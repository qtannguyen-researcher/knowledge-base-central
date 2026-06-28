import { randomUUID } from 'node:crypto';

import { UserRole } from '@knowledge-base-central/shared';

import type { Container } from '../container.js';
import { User } from '../domain/user/User.js';

export interface OAuthProfile {
  email?: string;
  username?: string;
  displayName?: string;
}

function sanitizeUsername(value: string): string {
  const sanitized = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 30);
  return sanitized.length >= 3 ? sanitized : `user${sanitized}`.slice(0, 30).padEnd(3, '0');
}

async function resolveUniqueUsername(base: string, container: Container): Promise<string> {
  let candidate = sanitizeUsername(base);
  let suffix = 0;

  while (await container.userRepository.findByUsername(candidate)) {
    suffix += 1;
    const suffixText = String(suffix);
    candidate = sanitizeUsername(`${base.slice(0, 30 - suffixText.length)}${suffixText}`);
  }

  return candidate;
}

export async function findOrCreateOAuthUser(
  provider: string,
  providerId: string,
  profile: OAuthProfile,
  container: Container,
): Promise<User> {
  const existing = await container.oauthAccountRepository.findByProvider(provider, providerId);
  if (existing) {
    const user = await container.userRepository.findById(existing.userId);
    if (!user) {
      throw new Error(`OAuth account ${provider}:${providerId} references missing user`);
    }
    return user;
  }

  const email = profile.email;
  if (!email) {
    throw new Error('OAuth profile is missing an email address');
  }

  const existingUser = await container.userRepository.findByEmail(email);
  if (existingUser) {
    await container.oauthAccountRepository.create({
      userId: existingUser.id,
      provider,
      providerId,
    });
    return existingUser;
  }

  const username = await resolveUniqueUsername(
    profile.username ?? email.split('@')[0] ?? 'user',
    container,
  );
  const user = new User({
    id: randomUUID(),
    email,
    username,
    displayName: profile.displayName ?? null,
    passwordHash: null,
    role: UserRole.CONTRIBUTOR,
    status: 'ACTIVE',
  });

  await container.userRepository.save(user);
  await container.oauthAccountRepository.create({
    userId: user.id,
    provider,
    providerId,
  });

  return user;
}
