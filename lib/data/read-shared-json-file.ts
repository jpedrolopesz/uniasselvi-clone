import { readFile } from "node:fs/promises";
import path from "node:path";
import { DataInvalidError } from "@/lib/data/errors";

/**
 * Espelha read-json-file.ts, mas para dados que não pertencem a um único
 * usuário (ex.: fixture de colegas de turma). Fica fora de
 * public/data/user/ de propósito, para deixar claro que não é dado "de
 * sessão" de ninguém.
 */
const SHARED_DATA_ROOT = path.join(process.cwd(), "public", "data", "shared");

export async function readSharedJsonFileOptional<T>(...segments: string[]): Promise<T | null> {
  const filePath = path.join(SHARED_DATA_ROOT, ...segments);
  const relativePath = path.join("public/data/shared", ...segments);

  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch (cause) {
    throw new DataInvalidError(relativePath, cause);
  }
}
