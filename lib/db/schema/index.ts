/**
 * Ponto único de importação do schema. `drizzle.config.ts` e o cliente
 * apontam para cá, então acrescentar uma tabela em qualquer um dos dois
 * schemas basta ser reexportado aqui para entrar nas migrations.
 */
export * from "@/lib/db/schema/academic";
export * from "@/lib/db/schema/vitru";
export * from "@/lib/db/schema/learning-profile";
export * from "@/lib/db/schema/community";
export * from "@/lib/db/schema/risk-score";
