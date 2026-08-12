export type VitruPageId =
  | "home"
  | "campus"
  | "universal-chat"
  | "study-calendar"
  | "discipline"
  | "discipline-calendar"
  | "attendance"
  | "assessments"
  | "assessment"
  | "assessment-scheduling"
  | "learning-path"
  | "lesson"
  | "mediator"
  | "unknown";

export interface VitruPageContext {
  id: VitruPageId;
  name: string;
  pathname: string;
  params: Record<string, string>;
  capabilities: string[];
}

interface PageDefinition {
  id: Exclude<VitruPageId, "unknown">;
  name: string;
  pattern: RegExp;
  paramNames?: string[];
  capabilities: string[];
}

const READ = ["read_page", "list_visible_components", "highlight_component"];
const NAVIGATE = [...READ, "navigate", "go_back", "go_forward"];

// More specific routes must come before their parent routes.
const PAGE_DEFINITIONS: PageDefinition[] = [
  { id: "home", name: "Início", pattern: /^\/$/, capabilities: NAVIGATE },
  { id: "campus", name: "Campus Vitru", pattern: /^\/campus-vitru\/?$/, capabilities: NAVIGATE },
  { id: "universal-chat", name: "Chat com o Vitru", pattern: /^\/chat-ia\/?$/, capabilities: NAVIGATE },
  {
    id: "study-calendar",
    name: "Calendário de Estudos",
    pattern: /^\/calendario-de-estudos\/?$/,
    capabilities: [...NAVIGATE, "show_options", "prepare_calendar_event", "confirm_write"],
  },
  {
    id: "assessment-scheduling",
    name: "Agendamento de avaliação",
    pattern: /^\/disciplinas\/([^/]+)\/notas-avaliacoes\/([^/]+)\/agendamento\/?$/,
    paramNames: ["subjectCode", "testCode"],
    capabilities: [...NAVIGATE, "show_options", "select_option", "confirm_write"],
  },
  {
    id: "assessment",
    name: "Realização de avaliação",
    pattern: /^\/disciplinas\/([^/]+)\/notas-avaliacoes\/([^/]+)\/?$/,
    paramNames: ["subjectCode", "testCode"],
    capabilities: [...READ, "highlight_component"],
  },
  {
    id: "assessments",
    name: "Notas e Avaliações",
    pattern: /^\/disciplinas\/([^/]+)\/notas-avaliacoes\/?$/,
    paramNames: ["subjectCode"],
    capabilities: NAVIGATE,
  },
  {
    id: "lesson",
    name: "Aula da Trilha de Aprendizagem",
    pattern: /^\/disciplinas\/([^/]+)\/trilha-de-aprendizagem\/([^/]+)\/?$/,
    paramNames: ["subjectCode", "lessonCode"],
    capabilities: NAVIGATE,
  },
  {
    id: "learning-path",
    name: "Trilha de Aprendizagem",
    pattern: /^\/disciplinas\/([^/]+)\/trilha-de-aprendizagem\/?$/,
    paramNames: ["subjectCode"],
    capabilities: NAVIGATE,
  },
  {
    id: "discipline-calendar",
    name: "Calendário da Disciplina",
    pattern: /^\/disciplinas\/([^/]+)\/calendario\/?$/,
    paramNames: ["subjectCode"],
    capabilities: NAVIGATE,
  },
  {
    id: "attendance",
    name: "Registro de Frequência",
    pattern: /^\/disciplinas\/([^/]+)\/registro-de-frequencia\/?$/,
    paramNames: ["subjectCode"],
    capabilities: NAVIGATE,
  },
  {
    id: "mediator",
    name: "Fale com o Mediador",
    pattern: /^\/disciplinas\/([^/]+)\/fale-com-mediador\/?$/,
    paramNames: ["subjectCode"],
    capabilities: [...NAVIGATE, "confirm_write"],
  },
  {
    id: "discipline",
    name: "Disciplina",
    pattern: /^\/disciplinas\/([^/]+)\/?$/,
    paramNames: ["subjectCode"],
    capabilities: NAVIGATE,
  },
];

export function resolveVitruPage(pathname: string): VitruPageContext {
  for (const definition of PAGE_DEFINITIONS) {
    const match = definition.pattern.exec(pathname);
    if (!match) continue;

    const params = Object.fromEntries(
      (definition.paramNames ?? []).map((name, index) => [name, decodeURIComponent(match[index + 1] ?? "")])
    );
    return {
      id: definition.id,
      name: definition.name,
      pathname,
      params,
      capabilities: definition.capabilities,
    };
  }

  return { id: "unknown", name: "Página não catalogada", pathname, params: {}, capabilities: READ };
}

export function isSafeInternalHref(href: string): boolean {
  if (!href.startsWith("/") || href.startsWith("//")) return false;
  try {
    const url = new URL(href, "https://vitru.local");
    return url.origin === "https://vitru.local" && !url.pathname.includes("..") && resolveVitruPage(url.pathname).id !== "unknown";
  } catch {
    return false;
  }
}

export const VITRU_NAVIGATION_DESTINATIONS = [
  { id: "home", name: "Início", href: "/" },
  { id: "study-calendar", name: "Calendário de Estudos", href: "/calendario-de-estudos" },
  { id: "campus", name: "Campus Vitru", href: "/campus-vitru" },
  { id: "universal-chat", name: "Chat com o Vitru", href: "/chat-ia" },
] as const;
