import cron from 'node-cron';
import { enqueueGitSyncJob } from '../queue/QueueClient.js';

const DEFAULT_SCHEDULE = '0 * * * *'; // Every hour

interface SyncCronJobOptions {
  schedule?: string;
  enabled?: boolean;
  repository?: string;
}

let scheduledTask: cron.ScheduledTask | null = null;

export function registerSyncCronJob(options: SyncCronJobOptions = {}): void {
  const {
    schedule = DEFAULT_SCHEDULE,
    enabled = process.env.SYNC_CRON_ENABLED === 'true',
    repository = process.env.GIT_REPO_URL || 'local',
  } = options;

  if (!enabled) {
    console.log('[SyncCronJob] Cron job disabled (SYNC_CRON_ENABLED is not true)');
    return;
  }

  if (!cron.validate(schedule)) {
    console.error(`[SyncCronJob] Invalid cron schedule: ${schedule}`);
    return;
  }

  scheduledTask = cron.schedule(schedule, async () => {
    console.log('[SyncCronJob] Triggering scheduled sync');

    try {
      const jobId = crypto.randomUUID();
      await enqueueGitSyncJob({
        jobId,
        trigger: 'SCHEDULED',
        repository,
      });
      console.log(`[SyncCronJob] Enqueued scheduled sync job: ${jobId}`);
    } catch (error) {
      console.error('[SyncCronJob] Failed to enqueue sync job:', error);
    }
  });

  console.log(`[SyncCronJob] Scheduled sync job registered with cron: ${schedule}`);
}

export function stopSyncCronJob(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[SyncCronJob] Stopped sync cron job');
  }
}

export function getSyncCronSchedule(): string {
  return process.env.SYNC_CRON || DEFAULT_SCHEDULE;
}
