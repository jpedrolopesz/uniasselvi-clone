import { defineConfig } from "drizzle-kit";

/**
 * Só descreve como gerar e aplicar migrations. A escolha de driver em tempo
 * de execução (pglite / postgres / aws-data-api) fica em lib/db/client.ts —
 * as migrations em si são SQL puro e valem para os três.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema/index.ts",
  out: "./lib/db/migrations",
  /** Sem isto o drizzle-kit tenta remover schemas que não conhece. */
  schemaFilter: ["academic", "vitru"],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://localhost:5432/vitru",
  },
  verbose: true,
  strict: true,
});
