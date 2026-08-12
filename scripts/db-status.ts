/**
 * Mostra o estado do banco: tabelas por schema e contagem de linhas.
 * Serve para confirmar uma migração ou conferir o resultado do seed.
 *
 *   npm run db:status
 */
import { closeDb, getDb } from "@/lib/db/client";
import { sql } from "drizzle-orm";

type TableRow = { schema: string; table: string };

async function main(): Promise<void> {
  const db = await getDb();

  const tables = await db.execute<TableRow>(sql`
    select table_schema as "schema", table_name as "table"
    from information_schema.tables
    where table_schema in ('academic', 'vitru')
    order by table_schema, table_name
  `);

  const rows = Array.isArray(tables) ? tables : tables.rows;
  if (rows.length === 0) {
    console.log("Nenhuma tabela encontrada. Rode `npm run db:migrate` primeiro.");
    return;
  }

  const report: { tabela: string; linhas: number }[] = [];
  for (const { schema, table } of rows) {
    const counted = await db.execute<{ n: number }>(
      sql`select count(*)::int as n from ${sql.identifier(schema)}.${sql.identifier(table)}`
    );
    const countRows = Array.isArray(counted) ? counted : counted.rows;
    report.push({ tabela: `${schema}.${table}`, linhas: Number(countRows[0]?.n ?? 0) });
  }

  // `--json` existe para comparar dois estados do banco de forma confiável;
  // extrair números da saída de console.table é frágil.
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(Object.fromEntries(report.map((r) => [r.tabela, r.linhas]))));
    return;
  }

  console.table(report);
  console.log(`${report.length} tabelas · ${report.reduce((sum, r) => sum + r.linhas, 0)} linhas`);
}

main()
  .then(() => closeDb())
  .catch(async (error) => {
    console.error(error);
    await closeDb().catch(() => undefined);
    process.exit(1);
  });
