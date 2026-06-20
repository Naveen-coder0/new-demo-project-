import { PrismaClient } from "@prisma/client";

// Ensure DATABASE_URL is loaded from .env in Node-based dev/server environments.
// (Vite only injects VITE_* vars; Prisma needs DATABASE_URL on process.env.)
if (typeof process !== "undefined" && !process.env.DATABASE_URL) {
  try {
    // Dynamically require so this is a no-op in edge runtimes without dotenv.
    const dotenv = require("dotenv");
    dotenv.config();
  } catch {
    // dotenv not available (e.g. edge runtime) — env expected to be preset.
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
