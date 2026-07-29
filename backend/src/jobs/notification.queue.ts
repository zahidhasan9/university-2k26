import { Queue } from "bullmq";
import { getRedisConnection } from "../config/redis";

export const NOTIFICATION_QUEUE = "notification-delivery";
let queue: Queue | undefined;

function getQueue(): Queue | undefined {
  const connection = getRedisConnection();
  if (!connection) return undefined;
  queue ??= new Queue(NOTIFICATION_QUEUE, {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  });
  return queue;
}

export async function enqueueNotification(notificationId: string): Promise<boolean> {
  const notificationQueue = getQueue();
  if (!notificationQueue) return false;
  await notificationQueue.add(
    "deliver",
    { notificationId },
    { jobId: `notification-${notificationId}` },
  );
  return true;
}

export async function closeNotificationQueue(): Promise<void> {
  if (queue) {
    await queue.close();
    queue = undefined;
  }
}
