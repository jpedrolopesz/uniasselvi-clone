/** Gera um id legível a partir de um título (usado ao criar novas seções/lições no editor). */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Anexa um sufixo numérico até o id não colidir com `existingIds`. */
export function uniqueSlug(base: string, existingIds: Set<string>): string {
  const root = slugify(base) || "item";
  if (!existingIds.has(root)) return root;

  let n = 2;
  while (existingIds.has(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}
