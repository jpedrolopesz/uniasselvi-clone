/** Executa manualmente o mesmo seed usado pelo PGlite serverless. */
import { closeDb, getDb } from "@/lib/db/client";
import { seedFixtures } from "@/lib/db/seed-fixtures";

async function main(): Promise<void> {
  const db = await getDb();
  await seedFixtures(db);
}

main()
  .then(() => closeDb())
  .catch(async (error) => {
    console.error(error);
    await closeDb().catch(() => undefined);
    process.exit(1);
  });
