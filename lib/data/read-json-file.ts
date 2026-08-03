import { readFile } from "node:fs/promises";
import path from "node:path";
import { DataInvalidError, DataNotFoundError } from "@/lib/data/errors";

const USER_DATA_ROOT = path.join(process.cwd(), "public", "data", "user");

/** Lê e faz parse de um JSON dentro de public/data/user/. `segments` é relativo a essa raiz. */
export async function readUserJsonFile<T>(...segments: string[]): Promise<T> {
  const filePath = path.join(USER_DATA_ROOT, ...segments);
  const relativePath = path.join("public/data/user", ...segments);

  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch {
    throw new DataNotFoundError(relativePath);
  }

  try {
    return JSON.parse(raw) as T;
  } catch (cause) {
    throw new DataInvalidError(relativePath, cause);
  }
}

/** Como readUserJsonFile, mas retorna null em vez de lançar quando o arquivo não existe. */
export async function readUserJsonFileOptional<T>(
  ...segments: string[]
): Promise<T | null> {
  try {
    return await readUserJsonFile<T>(...segments);
  } catch (error) {
    if (error instanceof DataNotFoundError) return null;
    throw error;
  }
}
