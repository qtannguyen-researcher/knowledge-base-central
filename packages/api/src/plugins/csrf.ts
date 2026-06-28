import fastifyCsrf from '@fastify/csrf-protection';
import type { FastifyInstance } from 'fastify';

export async function registerCsrfPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fastifyCsrf, {
    sessionPlugin: '@fastify/session',
  });

  app.get('/auth/csrf-token', async (_request, reply) => {
    const csrfToken = reply.generateCsrf();
    return { csrfToken };
  });

  await app.register(
    async (adminScope) => {
      adminScope.addHook('onRequest', (request, reply, done) => {
        adminScope.csrfProtection(request, reply, done);
      });

      adminScope.get('/health', async () => ({ status: 'ok' }));
    },
    { prefix: '/admin' },
  );
}
