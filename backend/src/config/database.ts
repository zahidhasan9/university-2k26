import mongoose from "mongoose";
import { env } from "./env";

function atlasNonSrvFallback(uri: string): string | undefined {
  const parsed = new URL(uri);

  if (
    parsed.protocol !== "mongodb+srv:" ||
    parsed.hostname !== "cluster0.fupn4x8.mongodb.net"
  ) {
    return undefined;
  }

  const hosts = [
    "ac-od2yh2n-shard-00-00.fupn4x8.mongodb.net:27017",
    "ac-od2yh2n-shard-00-01.fupn4x8.mongodb.net:27017",
    "ac-od2yh2n-shard-00-02.fupn4x8.mongodb.net:27017",
  ].join(",");
  const database = parsed.pathname || "/";
  const params = new URLSearchParams(parsed.search);

  params.set("tls", "true");
  params.set("authSource", "admin");
  params.set("replicaSet", "atlas-ajml5d-shard-0");

  return `mongodb://${parsed.username}:${parsed.password}@${hosts}${database}?${params}`;
}

export async function connectDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(env.MONGODB_URI);
  } catch (error) {
    const isSrvDnsFailure =
      error instanceof Error &&
      "code" in error &&
      ["ECONNREFUSED", "ETIMEOUT", "ENOTFOUND", "ESERVFAIL"].includes(String(error.code)) &&
      error.message.includes("querySrv");
    const fallbackUri = isSrvDnsFailure
      ? atlasNonSrvFallback(env.MONGODB_URI)
      : undefined;

    if (!fallbackUri) throw error;

    console.warn("MongoDB SRV lookup failed; trying the Atlas seed hosts");
    await mongoose.connect(fallbackUri);
  }

  console.info("MongoDB connected");
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
