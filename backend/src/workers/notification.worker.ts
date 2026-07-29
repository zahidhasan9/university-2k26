import { Worker, type Job } from "bullmq";
import nodemailer from "nodemailer";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { env } from "../config/env";
import { createRedisConnection } from "../config/redis";
import { NOTIFICATION_QUEUE } from "../jobs/notification.queue";
import { NotificationModel } from "../modules/communication/notification.model";

interface NotificationJob {
  notificationId: string;
}

const smtp =
  env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
      })
    : undefined;

async function deliver(job: Job<NotificationJob>) {
  const notification = await NotificationModel.findById(job.data.notificationId).select("+recipient");
  if (!notification || ["sent", "read"].includes(notification.status)) return;
  if (!notification.recipient) throw new Error("Notification recipient is missing");

  try {
    if (notification.channel === "email") {
      if (!smtp) throw new Error("SMTP is not configured");
      await smtp.sendMail({
        from: env.SMTP_FROM,
        to: notification.recipient,
        subject: notification.title,
        text: notification.body,
      });
    } else if (notification.channel === "sms") {
      if (!env.SMS_WEBHOOK_URL) throw new Error("SMS webhook is not configured");
      const response = await fetch(env.SMS_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(env.SMS_WEBHOOK_TOKEN
            ? { authorization: `Bearer ${env.SMS_WEBHOOK_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({
          to: notification.recipient,
          message: notification.body,
        }),
      });
      if (!response.ok) throw new Error(`SMS provider returned HTTP ${response.status}`);
    } else {
      throw new Error(`Unsupported worker channel: ${notification.channel}`);
    }
    notification.status = "sent";
    notification.sentAt = new Date();
    notification.attempts = job.attemptsMade + 1;
    notification.lastError = undefined;
    await notification.save();
  } catch (error) {
    notification.attempts = job.attemptsMade + 1;
    notification.lastError = error instanceof Error ? error.message : "Unknown delivery error";
    if (job.attemptsMade + 1 >= Number(job.opts.attempts ?? 1)) notification.status = "failed";
    await notification.save();
    throw error;
  }
}

async function start() {
  await connectDatabase();
  const connection = createRedisConnection();
  const worker = new Worker<NotificationJob>(NOTIFICATION_QUEUE, deliver, {
    connection,
    concurrency: 10,
  });
  worker.on("failed", (job, error) => {
    console.error(`Notification job ${job?.id ?? "unknown"} failed`, error.message);
  });
  console.info("Notification worker started");

  const shutdown = async () => {
    await worker.close();
    await connection.quit();
    await disconnectDatabase();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

void start().catch((error) => {
  console.error("Notification worker failed to start", error);
  process.exit(1);
});
