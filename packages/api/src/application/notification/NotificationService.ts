import type { PrismaClient } from '@prisma/client';

import type { INotificationService } from '../../domain/notification/INotificationService.js';
import { v4 as uuidv4 } from 'uuid';

export class NotificationService implements INotificationService {
  constructor(private readonly db: PrismaClient) {}

  async send(userId: string, type: string, payload: Record<string, unknown>): Promise<void> {
    await this.db.notification.create({
      data: {
        id: uuidv4(),
        userId,
        type,
        payload: payload as object,
        status: 'QUEUED',
      },
    });
  }
}
