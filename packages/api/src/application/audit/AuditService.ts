import type { PrismaClient } from '@prisma/client';

export interface AuditLogInput {
  actorId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  payload?: Record<string, unknown> | null;
}

export class AuditService {
  constructor(private readonly db: PrismaClient) {}

  async log(
    actorId: string | null | undefined,
    action: string,
    resource: string,
    resourceId?: string | null,
    payload?: Record<string, unknown> | null,
  ): Promise<void> {
    await this.db.auditEvent.create({
      data: {
        actorId: actorId ?? null,
        action,
        resource,
        resourceId: resourceId ?? null,
        ...(payload !== undefined && payload !== null ? { payload: payload as object } : {}),
      },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.db.auditEvent.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, email: true, username: true },
          },
        },
      }),
      this.db.auditEvent.count(),
    ]);

    return { items, total, page, pageSize: limit };
  }
}
