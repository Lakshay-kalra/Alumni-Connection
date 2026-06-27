import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  // @ts-expect-error seed is not in PrismaConfig yet
  seed: "tsx prisma/seed.ts",
});