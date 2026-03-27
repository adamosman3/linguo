import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getRequestContext } from "@cloudflare/next-on-pages";

export function getPrisma() {
  const { env } = getRequestContext();
  const adapter = new PrismaD1(env.DB);
  return new PrismaClient({ adapter });
}

// Keep backward compat for local dev — lazily creates a client per request
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    return (client as unknown as Record<string | symbol, unknown>)[prop];
  },
});
