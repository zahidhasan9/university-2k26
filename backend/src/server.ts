import { createServer } from "node:http";
import { app } from "./app";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { env } from "./config/env";
import { closeRedisConnection } from "./config/redis";
import { closeNotificationQueue } from "./jobs/notification.queue";

const httpServer = createServer(app);
let shuttingDown = false;

async function start(): Promise<void> {
  await connectDatabase();
  httpServer.listen(env.PORT, () => {
    console.info(`UniSphere API listening on port ${env.PORT}`);
  });
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(`${signal} received; shutting down`);

  httpServer.close(async () => {
    await closeNotificationQueue();
    await closeRedisConnection();
    await disconnectDatabase();
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection", error);
  void shutdown("unhandledRejection");
});

void start().catch((error) => {
  console.error("Unable to start server", error);
  process.exit(1);
});
