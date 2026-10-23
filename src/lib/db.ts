import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { audited, shouldAudit } from "./audit";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const adapter = new PrismaNeonHttp(connectionString, {});
  const base = new PrismaClient({ adapter });
  // Every write is recorded in the change history (see ./audit.ts).
  return base.$extends({
    query: {
      $allModels: {
        $allOperations({ model, operation, args, query }) {
          if (!shouldAudit(model, operation)) return query(args);
          return audited(base, model, operation, args as Record<string, unknown>, query as (a: unknown) => Promise<unknown>);
        },
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
