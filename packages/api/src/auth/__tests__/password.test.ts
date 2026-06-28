import { describe, it, expect } from 'vitest';

import { hashPassword, verifyPassword } from '../password.js';

describe('password utilities', () => {
  it('hashPassword returns a bcrypt hash', async () => {
    const hash = await hashPassword('secret-password');

    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(hash).not.toBe('secret-password');
  });

  it('verifyPassword returns true for matching password', async () => {
    const plain = 'my-secure-password';
    const hash = await hashPassword(plain);

    expect(await verifyPassword(plain, hash)).toBe(true);
  });

  it('verifyPassword returns false for wrong password', async () => {
    const hash = await hashPassword('correct-password');

    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });
});
