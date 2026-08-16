import path from "node:path";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@/lib/db/schema";

/**
 * Cliente de banco. Só deve ser importado de código de servidor (Server
 * Components, Route Handlers, Server Actions e scripts) — nunca de um
 * componente com "use client".
 *
 * Três backends, escolhidos por `DATABASE_DRIVER`:
 *
 *   pglite       Postgres real compilado para WASM, rodando no processo.
 *                Padrão em desenvolvimento e teste: não exige daemon, o que
 *                importa numa máquina onde subir o Docker Desktop custa
 *                memória que faz falta.
 *   postgres     Conexão TCP comum via `DATABASE_URL`. Use com o
 *                docker-compose quando quiser paridade total com produção.
 *   aws-data-api Aurora Serverless v2 pela Data API — sem pool de conexões,
 *                que é o que torna viável rodar em runtime serverless fora
 *                da VPC do cluster.
 *
 * O tipo exportado é o do driver node-postgres para todos os casos: a API de
 * consulta do Drizzle é idêntica entre os três, e unir os tipos só
 * propagaria ruído para cada call site.
 */
export type Database = NodePgDatabase<typeof schema>;

export type DatabaseDriver = "pglite" | "postgres" | "aws-data-api";

function resolveDriver(): DatabaseDriver {
  const configured = process.env.DATABASE_DRIVER;
  if (configured === "pglite" || configured === "postgres" || configured === "aws-data-api") {
    return configured;
  }
  if (configured) {
    throw new Error(
      `DATABASE_DRIVER inválido: "${configured}". Use pglite, postgres ou aws-data-api.`
    );
  }
  return process.env.DATABASE_URL ? "postgres" : "pglite";
}

/** Diretório do banco embarcado. `:memory:` isola cada execução de teste. */
function pgliteLocation(): string {
  // Na Vercel durante build, não há filesystem persistente — usa memória
  if (process.env.VERCEL || process.env.NEXT_PHASE === "phase-production-build") {
    return ":memory:";
  }
  return (
    process.env.PGLITE_PATH ?? path.join(process.cwd(), ".vitru", "pglite")
  );
}

/**
 * O cliente vem acompanhado de como desligá-lo. PGlite e o pool do
 * node-postgres seguram o event loop do Node enquanto estiverem abertos —
 * sem isso um script termina o trabalho e mesmo assim não sai.
 */
interface Connection {
  db: Database;
  close: () => Promise<void>;
}

async function createConnection(): Promise<Connection> {
  const driver = resolveDriver();

  if (driver === "pglite") {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    // Só exponha o Drizzle depois que o Postgres WASM estiver completamente
    // inicializado. No App Router, layout e página podem consultar o banco em
    // paralelo; devolver a instância criada com `new PGlite()` antes de
    // `waitReady` pode fazer as primeiras queries disputarem o boot do WASM.
    const client = await PGlite.create(pgliteLocation());
    return {
      db: drizzle(client, { schema }) as unknown as Database,
      close: () => client.close(),
    };
  }

  if (driver === "postgres") {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL é obrigatório quando DATABASE_DRIVER=postgres.");
    }
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const pool = new Pool({ connectionString });
    return { db: drizzle(pool, { schema }), close: () => pool.end() };
  }

  const { RDSDataClient } = await import("@aws-sdk/client-rds-data");
  const { drizzle } = await import("drizzle-orm/aws-data-api/pg");
  const resourceArn = requireEnv("AURORA_CLUSTER_ARN");
  const secretArn = requireEnv("AURORA_SECRET_ARN");
  const database = requireEnv("AURORA_DATABASE");
  const client = new RDSDataClient({ region: process.env.AWS_REGION ?? "us-east-1" });
  return {
    // A Data API é HTTP: não há conexão persistente para encerrar.
    db: drizzle(client, { schema, database, resourceArn, secretArn }) as unknown as Database,
    close: async () => client.destroy(),
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} é obrigatório quando DATABASE_DRIVER=aws-data-api.`);
  return value;
}

/**
 * Cache no globalThis para que o hot reload do Next não abra uma conexão (ou
 * uma instância do PGlite) por recompilação.
 */
const globalForDb = globalThis as unknown as { __vitruDb?: Promise<Connection> };

export function getDb(): Promise<Database> {
  globalForDb.__vitruDb ??= createConnection();
  return globalForDb.__vitruDb.then((connection) => connection.db);
}

/**
 * Encerra a conexão. Obrigatório ao final de qualquer script de linha de
 * comando: sem isso o processo conclui o trabalho e continua vivo, segurado
 * pelo cliente aberto.
 */
export async function closeDb(): Promise<void> {
  const pending = globalForDb.__vitruDb;
  if (!pending) return;
  globalForDb.__vitruDb = undefined;
  const connection = await pending;
  await connection.close();
}
