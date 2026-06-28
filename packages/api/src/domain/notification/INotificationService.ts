export interface NotificationPayload {
  type: string;
  userId: string;
  data?: Record<string, unknown>;
}

export interface INotificationService {
  send(userId: string, type: string, payload: Record<string, unknown>): Promise<void>;
}
