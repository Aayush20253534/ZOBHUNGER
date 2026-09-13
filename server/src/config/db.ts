import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "./env.js";

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

export const prisma = new PrismaClient({
  adapter,
  // Interactive transactions default to only 5s in Prisma. That is too
  // aggressive for multi-step workflows when PostgreSQL is remote (for
  // example Neon), where several serialized round trips can legitimately
  // exceed that window. Keep one bounded policy for every service instead of
  // letting individual modules silently inherit Prisma's 5s default.
  transactionOptions: {
    maxWait: 10_000,
    timeout: 30_000,
  },
});

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
