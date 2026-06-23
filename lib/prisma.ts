/* eslint-disable @typescript-eslint/no-explicit-any */
// Prisma client must be generated before use: npx prisma generate
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PrismaClientModule = require("@prisma/client");
const PrismaClient = PrismaClientModule.PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var _prisma: any;
}

export const prisma: any =
  global._prisma ?? new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["error"] : [] });

if (process.env.NODE_ENV !== "production") global._prisma = prisma;
