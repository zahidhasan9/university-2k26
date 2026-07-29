import IORedis from "ioredis";
import { env } from "./env";

let sharedConnection: IORedis | undefined;

export function createRedisConnection(): IORedis {
  if (!env.REDIS_URL) throw new Error("REDIS_URL is required for background jobs");
  return new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true,
  });
}

export function getRedisConnection(): IORedis | undefined {
  if (!env.REDIS_URL) return undefined;
  sharedConnection ??= createRedisConnection();
  return sharedConnection;
}

export async function closeRedisConnection(): Promise<void> {
  if (sharedConnection) {
    await sharedConnection.quit();
    sharedConnection = undefined;
  }
}
