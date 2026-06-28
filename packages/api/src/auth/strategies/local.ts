import { z } from 'zod';

import type { IUserRepository } from '../../domain/user/IUserRepository.js';
import type { User } from '../../domain/user/User.js';
import { AuthError } from '../AuthError.js';
import { verifyPassword } from '../password.js';

export const localLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authenticateLocal(
  input: unknown,
  userRepository: IUserRepository,
): Promise<User> {
  const parsed = localLoginSchema.safeParse(input);
  if (!parsed.success) {
    throw new AuthError('invalid_credentials');
  }

  const { email, password } = parsed.data;
  const user = await userRepository.findByEmail(email);

  if (!user?.passwordHash || user.status !== 'ACTIVE') {
    throw new AuthError('invalid_credentials');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new AuthError('invalid_credentials');
  }

  return user;
}
