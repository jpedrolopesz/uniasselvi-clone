/**
 * Aplica as migrations no driver configurado.
 *
 *   npm run db:migrate                       # PGlite em .vitru/pglite
 *   DATABASE_DRIVER=postgres npm run db:migrate
 *
 * O migrator é específico de cada driver, mas o SQL gerado é o mesmo — as
 * migrations não sabem em qual dos três backends estão sendo aplicadas.
 */
import path from "node:path";

const MIGRATIONS_FOLDER = path.join(process.cwd(), "lib", "db", "migrations");

async function main(): Promise<void> {
  const driver = process.env.DATABASE_DRIVER ?? (process.env.DATABASE_URL ? "postgres" : "pglite");

  if (driver === "pglite") {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const location = process.env.PGLITE_PATH ?? path.join(process.cwd(), ".vitru", "pglite");
    const client = new PGlite(location);
    await migrate(drizzle(client), { migrationsFolder: MIGRATIONS_FOLDER });
    await client.close();
    console.log(`Migrations aplicadas no PGlite em ${location}`);
    return;
  }

  if (driver === "postgres") {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL é obrigatório com DATABASE_DRIVER=postgres.");
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const pool = new Pool({ connectionString });
    await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS_FOLDER });
    await pool.end();
    console.log("Migrations aplicadas no Postgres.");
    return;
  }

  if (driver === "aws-data-api") {
    const { RDSDataClient } = await import("@aws-sdk/client-rds-data");
    const { drizzle } = await import("drizzle-orm/aws-data-api/pg");
    const { migrate } = await import("drizzle-orm/aws-data-api/pg/migrator");
    const required = (name: string) => {
      const value = process.env[name];
      if (!value) throw new Error(`${name} é obrigatório com DATABASE_DRIVER=aws-data-api.`);
      return value;
    };
    const db = drizzle(new RDSDataClient({ region: process.env.AWS_REGION ?? "us-east-1" }), {
      database: required("AURORA_DATABASE"),
      resourceArn: required("AURORA_CLUSTER_ARN"),
      secretArn: required("AURORA_SECRET_ARN"),
    });
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    console.log("Migrations aplicadas no Aurora via Data API.");
    return;
  }

  throw new Error(`DATABASE_DRIVER inválido: "${driver}".`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
