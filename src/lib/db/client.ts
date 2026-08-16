import "server-only";
import fs from "node:fs";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

function sslConfig() {
  const mode = process.env.DATABASE_SSL ?? "disable";
  if (mode === "disable") return false;
  if (mode === "require") return { rejectUnauthorized: false };
  if (mode === "verify-full") {
    const caPath = process.env.DATABASE_SSL_CA_PATH;
    if (!caPath) throw new Error("DATABASE_SSL=verify-full exige DATABASE_SSL_CA_PATH");
    return { rejectUnauthorized: true, ca: fs.readFileSync(caPath, "utf8") };
  }
  throw new Error(`DATABASE_SSL invalido: ${mode}`);
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL nao definida. Copie .env.example para .env.");
  const pool = new Pool({
    connectionString,
    ssl: sslConfig(),
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 10_000,
  });
  pool.on("error", (error) => console.error("[db] erro em conexao ociosa:", error.message));
  return pool;
}

const globalForDb = globalThis as unknown as { __vitruPool?: Pool };
export const pool = globalForDb.__vitruPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.__vitruPool = pool;

export async function query<T extends QueryResultRow>(sql: string, params: readonly unknown[] = []): Promise<T[]> {
  const started = Date.now();
  try {
    const result = await pool.query<T>(sql, params as unknown[]);
    const elapsed = Date.now() - started;
    if (process.env.NODE_ENV !== "production" && elapsed > 200) {
      console.warn(`[db] query lenta (${elapsed}ms): ${sql.slice(0, 120)}`);
    }
    return result.rows;
  } catch (error) {
    console.error("[db] query falhou:", (error as Error).message);
    throw error;
  }
}

export async function queryOne<T extends QueryResultRow>(sql: string, params: readonly unknown[] = []) {
  const rows = await query<T>(sql, params);
  if (rows.length > 1) throw new Error(`queryOne recebeu ${rows.length} linhas: ${sql.slice(0, 80)}`);
  return rows[0] ?? null;
}

export async function transaction<T>(fn: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function checkDatabaseHealth(): Promise<{ status: "healthy"; latencyMs: number } | { status: "unhealthy"; error: string }> {
  const started = Date.now();
  try {
    await pool.query("SELECT 1");
    return { status: "healthy", latencyMs: Date.now() - started };
  } catch {
    return { status: "unhealthy", error: "Banco indisponível." };
  }
}
