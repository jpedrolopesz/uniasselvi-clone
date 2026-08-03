import { cookies } from "next/headers";
import { loadUserIndex } from "@/lib/data/load-user-index";
import { ACTIVE_USER_COOKIE } from "@/lib/data/active-user-cookie";

export { ACTIVE_USER_COOKIE };

/**
 * Resolve o usuário ativo nesta ordem: (1) parâmetro `?u=` na URL,
 * (2) cookie `active_user_id` (persistido pelo UserSwitcher em dev),
 * (3) `defaultUserId` do index.json. Nunca escreve no JSON — apenas decide
 * de qual pasta ler.
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

  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(ACTIVE_USER_COOKIE)?.value;
  if (fromCookie && validIds.has(fromCookie)) return fromCookie;

  return index.defaultUserId;
}
