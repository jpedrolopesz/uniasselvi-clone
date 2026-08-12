import type { VitruPageContext } from "@/lib/vitru/page-context";

export interface VitruVisibleComponent {
  target: string;
  role: string;
  name: string;
  disabled: boolean;
}

export interface VitruBrowserContext {
  page: VitruPageContext;
  title: string;
  visibleComponents: VitruVisibleComponent[];
}

function isVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
}

function componentName(element: HTMLElement): string {
  return (
    element.getAttribute("aria-label") ||
    element.getAttribute("title") ||
    (element instanceof HTMLInputElement ? element.placeholder : "") ||
    element.innerText ||
    element.textContent ||
    ""
  ).replace(/\s+/g, " ").trim().slice(0, 120);
}

function componentRole(element: HTMLElement): string {
  return element.getAttribute("role") || element.tagName.toLowerCase();
}

export function collectVisibleComponents(): VitruVisibleComponent[] {
  const candidates = document.querySelectorAll<HTMLElement>(
    "[data-vitru-id], button, a[href], input, select, textarea, [role='button'], [role='dialog'], [role='region']"
  );
  const seen = new Set<string>();
  const result: VitruVisibleComponent[] = [];

  for (const element of candidates) {
    if (!isVisible(element)) continue;
    const name = componentName(element);
    if (!name) continue;
    const role = componentRole(element);
    const explicitId = element.dataset.vitruId;
    const target = explicitId ? `id:${explicitId}` : `accessible:${role}:${name}`;
    if (seen.has(target)) continue;
    seen.add(target);
    result.push({
      target,
      role,
      name,
      disabled:
        ("disabled" in element && Boolean((element as HTMLButtonElement).disabled)) ||
        element.getAttribute("aria-disabled") === "true",
    });
    if (result.length >= 40) break;
  }
  return result;
}

export function buildBrowserContext(page: VitruPageContext): VitruBrowserContext {
  return { page, title: document.title, visibleComponents: collectVisibleComponents() };
}

function findTarget(target: string): HTMLElement | null {
  if (target.startsWith("id:")) {
    const id = target.slice(3);
    return Array.from(document.querySelectorAll<HTMLElement>("[data-vitru-id]")).find(
      (element) => element.dataset.vitruId === id
    ) ?? null;
  }
  if (!target.startsWith("accessible:")) return null;
  return collectVisibleComponents().find((component) => component.target === target)
    ? Array.from(
        document.querySelectorAll<HTMLElement>(
          "button, a[href], input, select, textarea, [role='button'], [role='dialog'], [role='region']"
        )
      ).find((element) => {
        const role = componentRole(element);
        const name = componentName(element);
        return `accessible:${role}:${name}` === target && isVisible(element);
      }) ?? null
    : null;
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
  const container = findTarget(target);
  if (!container) return false;
  const closeButton = Array.from(container.querySelectorAll<HTMLElement>("button")).find((element) =>
    /^(fechar|cancelar|voltar)$/i.test(componentName(element))
  );
  if (!closeButton) return false;
  closeButton.click();
  return true;
}
