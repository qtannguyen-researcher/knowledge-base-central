export const SyncStatus = {
  IDLE: 'IDLE',
  SYNCING: 'SYNCING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus];
