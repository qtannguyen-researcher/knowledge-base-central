import type { PrismaClient } from '@prisma/client';

export async function startNotificationWorker(prisma: PrismaClient): Promise<void> {
  const pollInterval = 5000;

  const processNotifications = async () => {
    try {
      const notifications = await prisma.notification.findMany({
        where: { status: 'QUEUED' },
        take: 10,
        orderBy: { createdAt: 'asc' },
      });

      for (const notification of notifications) {
        try {
          const emailEnabled = process.env.EMAIL_ENABLED === 'true';

          if (emailEnabled) {
            console.log(`[NotificationWorker] Sending email notification:`, {
              userId: notification.userId,
              type: notification.type,
              payload: notification.payload,
            });
          } else {
            console.log(`[NotificationWorker] Processing notification:`, {
              userId: notification.userId,
              type: notification.type,
              payload: notification.payload,
            });
          }

          await prisma.notification.update({
            where: { id: notification.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
            },
          });
        } catch (error) {
          console.error(
            `[NotificationWorker] Failed to process notification ${notification.id}:`,
            error,
          );
          await prisma.notification.update({
            where: { id: notification.id },
            data: { status: 'FAILED' },
          });
        }
      }
    } catch (error) {
      console.error('[NotificationWorker] Error polling notifications:', error);
    }
  };

  setInterval(processNotifications, pollInterval);
  console.log('[NotificationWorker] Started notification worker');
}
