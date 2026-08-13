import { loadUserIndex } from "@/lib/data/load-user-index";

/**
 * Resolve o usuário ativo nesta ordem: (1) parâmetro `?u=` na URL,
 * (2) `defaultUserId` persistido no PGlite. O navegador não é fonte de dados.
 */
export async function resolveActiveUserId(
  searchParamUserId: string | string[] | undefined
): Promise<string> {
  const index = await loadUserIndex();
  const validIds = new Set(index.users.map((user) => user.id));

  const fromQuery = Array.isArray(searchParamUserId)
    ? searchParamUserId[0]
    : searchParamUserId;
  if (fromQuery && validIds.has(fromQuery)) return fromQuery;

  return index.defaultUserId;
}
