import { Pool } from "pg";

// Reuse a single pool across hot-reloads / lambda invocations.
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

export const pool =
  global._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.PG_POOL_MAX ?? 5),
  });

if (process.env.NODE_ENV !== "production") global._pgPool = pool;
