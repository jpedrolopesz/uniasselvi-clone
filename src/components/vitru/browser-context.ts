export const VITRU_ASSISTANT_ROOT_ATTRIBUTE = "data-vitru-assistant-root";

function isVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
}

function controlName(element: HTMLElement): string {
  return (element.getAttribute("aria-label") || element.textContent || "").replace(/\s+/g, " ").trim();
}


export function stableContextHash(context: unknown): string {
  const serialized = JSON.stringify(context);
  let hash = 2166136261;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function findTarget(target: string): HTMLElement | null {
  if (!target.startsWith("id:")) return null;
  const id = target.slice(3);
  return Array.from(document.querySelectorAll<HTMLElement>("[data-vitru-id]")).find(
    (element) => element.dataset.vitruId === id && isVisible(element)
  ) ?? null;
}

export function highlightVitruTarget(target: string): boolean {
  const element = findTarget(target);
  if (!element) return false;
  element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  element.dataset.vitruHighlight = "true";
  element.focus({ preventScroll: true });
  window.setTimeout(() => delete element.dataset.vitruHighlight, 5_000);
  return true;
}

export function closeVitruTarget(target: string): boolean {
  const containers = target.startsWith("id:")
    ? Array.from(document.querySelectorAll<HTMLElement>("[data-vitru-id]")).filter(
        (element) => element.dataset.vitruId === target.slice(3) && isVisible(element)
      )
    : [findTarget(target)].filter((element): element is HTMLElement => Boolean(element));
  const closeButton = containers.flatMap((container) =>
    Array.from(container.querySelectorAll<HTMLElement>("button"))
  ).find((element) => /^(fechar|cancelar|voltar)$/i.test(controlName(element)));
  if (!closeButton) return false;
  closeButton.click();
  return true;
}
