import type { ZodFastify } from '../../types.js';

import { requirePermission } from '../../../auth/middleware.js';
import type { Container } from '../../../container.js';
import { idParamSchema } from '../../schemas/common.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_PREFIXES = ['image/', 'application/pdf', 'text/plain'];

function isAllowedMime(mime: string): boolean {
  return ALLOWED_MIME_PREFIXES.some(
    (prefix) => mime === prefix.replace(/\/$/, '') || mime.startsWith(prefix),
  );
}

export async function registerAdminAttachmentRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  app.post(
    '/assets/:id/attachments',
    {
      preHandler: requirePermission('attachment:create', container),
      schema: { params: idParamSchema },
    },
    async (request, reply) => {
      const asset = await container.knowledgeAssetRepository.findById(request.params.id);
      if (!asset) {
        return reply.status(404).send({ error: 'not_found' });
      }

      const file = await request.file();
      if (!file) {
        return reply.status(400).send({ error: 'file_required' });
      }

      if (!isAllowedMime(file.mimetype)) {
        return reply.status(400).send({ error: 'invalid_mime_type' });
      }

      const buffer = await file.toBuffer();
      if (buffer.length > MAX_FILE_SIZE) {
        return reply.status(413).send({ error: 'file_too_large' });
      }

      const { Readable } = await import('node:stream');
      const storagePath = await container.fileStorage.save(file.filename, Readable.from(buffer));

      const attachment = await container.prisma.attachment.create({
        data: {
          assetId: asset.id,
          filename: file.filename,
          storagePath,
          mimeType: file.mimetype,
          sizeBytes: BigInt(buffer.length),
        },
      });

      return reply.status(201).send({
        id: attachment.id,
        assetId: attachment.assetId,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        sizeBytes: Number(attachment.sizeBytes),
        uploadedAt: attachment.uploadedAt.toISOString(),
      });
    },
  );

  app.delete(
    '/attachments/:id',
    {
      preHandler: requirePermission('attachment:delete', container),
      schema: { params: idParamSchema },
    },
    async (request, reply) => {
      const attachment = await container.prisma.attachment.findUnique({
        where: { id: request.params.id },
      });
      if (!attachment) {
        return reply.status(404).send({ error: 'not_found' });
      }

      await container.fileStorage.delete(attachment.storagePath);
      await container.prisma.attachment.delete({ where: { id: attachment.id } });
      await container.auditService.log(
        request.session.userId,
        'delete',
        'attachment',
        attachment.id,
      );

      return reply.status(200).send({ ok: true });
    },
  );
}
