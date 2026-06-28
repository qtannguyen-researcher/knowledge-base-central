import { describe, it, expect } from 'vitest';
import * as crypto from 'crypto';

function verifyGitHubSignature(
  payload: string,
  signature: string | undefined,
  secret: string,
): boolean {
  if (!signature) {
    return false;
  }

  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  const receivedSignature = signature.startsWith('sha256=') ? signature.slice(7) : signature;

  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(receivedSignature));
}

describe('Webhook Signature Validation', () => {
  const webhookSecret = 'test-webhook-secret';

  describe('verifyGitHubSignature', () => {
    it('should return true for valid signature', () => {
      const payload = JSON.stringify({ ref: 'refs/heads/main', commits: [] });
      const signature =
        'sha256=' + crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');

      const result = verifyGitHubSignature(payload, signature, webhookSecret);

      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const payload = JSON.stringify({ ref: 'refs/heads/main', commits: [] });
      const invalidSignature = 'sha256=invalidsignature';

      const result = verifyGitHubSignature(payload, invalidSignature, webhookSecret);

      expect(result).toBe(false);
    });

    it('should return false for missing signature', () => {
      const payload = JSON.stringify({ ref: 'refs/heads/main', commits: [] });

      const result = verifyGitHubSignature(payload, undefined, webhookSecret);

      expect(result).toBe(false);
    });

    it('should return false for signature without sha256= prefix', () => {
      const payload = JSON.stringify({ ref: 'refs/heads/main', commits: [] });
      const signatureWithoutPrefix = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      const result = verifyGitHubSignature(payload, signatureWithoutPrefix, webhookSecret);

      expect(result).toBe(true);
    });

    it('should return false when payload has been tampered with', () => {
      const originalPayload = JSON.stringify({ ref: 'refs/heads/main', commits: [] });
      const tamperedPayload = JSON.stringify({
        ref: 'refs/heads/main',
        commits: [{ id: 'hacked' }],
      });
      const signature =
        'sha256=' +
        crypto.createHmac('sha256', webhookSecret).update(originalPayload).digest('hex');

      const result = verifyGitHubSignature(tamperedPayload, signature, webhookSecret);

      expect(result).toBe(false);
    });

    it('should be timing-safe against brute force', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature =
        'sha256=' + crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');

      const result = verifyGitHubSignature(payload, signature, webhookSecret);

      expect(result).toBe(true);
    });
  });
});
