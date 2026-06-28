import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import * as crypto from 'crypto';
import type { Container } from '../../../container.js';
import { enqueueGitSyncJob } from '../../infrastructure/queue/QueueClient.js';

interface GitHubWebhookPayload {
  ref: string;
  repository: {
    full_name: string;
    clone_url: string;
  };
  commits: Array<{
    id: string;
    message: string;
    added?: string[];
    modified?: string[];
    removed?: string[];
  }>;
}

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

export async function registerWebhookRoutes(
  app: FastifyInstance,
  _container: Container,
): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  // POST /api/v1/webhooks/github - GitHub webhook endpoint
  typed.post(
    '/github',
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute',
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.warn(
          '[Webhook] GITHUB_WEBHOOK_SECRET not configured, skipping signature verification',
        );
      } else {
        const signature = request.headers['x-hub-signature-256'] as string | undefined;
        const rawBody = JSON.stringify(request.body);

        if (!verifyGitHubSignature(rawBody, signature, webhookSecret)) {
          console.warn('[Webhook] Invalid signature received');
          return reply.status(401).send({ error: 'Invalid signature' });
        }
      }

      const payload = request.body as GitHubWebhookPayload;

      if (request.headers['x-github-event'] !== 'push') {
        return reply.send({ received: true, skipped: 'not a push event' });
      }

      const configuredBranch = process.env.GITHUB_WEBHOOK_BRANCH || 'main';
      const branch = payload.ref?.replace('refs/heads/', '');

      if (branch !== configuredBranch) {
        console.log(
          `[Webhook] Push to branch '${branch}', expected '${configuredBranch}', skipping sync`,
        );
        return reply.send({ received: true, skipped: `not watching branch '${branch}'` });
      }

      const jobId = crypto.randomUUID();
      const repository = payload.repository?.clone_url || process.env.GIT_REPO_URL || 'local';

      try {
        await enqueueGitSyncJob({
          jobId,
          trigger: 'WEBHOOK',
          repository,
        });

        console.log(`[Webhook] Enqueued webhook-triggered sync job: ${jobId}`);
        return reply.send({ received: true, jobId });
      } catch (error) {
        console.error('[Webhook] Failed to enqueue sync job:', error);
        return reply.status(500).send({ error: 'Failed to enqueue sync job' });
      }
    },
  );
}

export async function registerWebhooks(app: FastifyInstance, container: Container): Promise<void> {
  await app.register(
    async (webhookApp) => {
      await registerWebhookRoutes(webhookApp, container);
    },
    { prefix: '/api/v1/webhooks' },
  );
}
