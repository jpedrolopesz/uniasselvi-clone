import type { VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";

/** Fatos acadêmicos permitidos no snapshot enviado ao orquestrador. */
export const VITRU_DISCLOSED_SNAPSHOT_FACTS = new Set([
  "periodo", "avaliacoes", "aulasGravadas", "frequencia", "nota",
  "peso", "resultadoPublicado", "duracao",
  "inicio", "fim", "categoria", "disciplina",
]);

export interface RedactedSemanticSnapshot {
  snapshot: VitruSemanticSnapshot;
  removedFields: string[];
}

/**
 * `item.name`, `section.name`, `action.label` e `page.subject.name` são
 * rótulos acadêmicos da página do próprio aluno (disciplina, atividade e
 * controle), necessários para resolver referências. Os adaptadores não
 * aceitam dados de outro aluno, contato, credencial ou identificador civil.
 * Campos extensíveis continuam restritos pela allowlist de `facts` abaixo.
 */
export function redactSemanticSnapshot(snapshot: VitruSemanticSnapshot): RedactedSemanticSnapshot {
  const removedFields = new Set<string>();
  return {
    snapshot: {
      ...snapshot,
      state: {
        now: snapshot.state.now,
        timezone: snapshot.state.timezone,
        focus: snapshot.state.focus,
        temporal: snapshot.state.temporal,
        filters: snapshot.state.filters,
        permissions: snapshot.state.permissions,
      },
      sections: snapshot.sections.map((section) => ({
        ...section,
        items: section.items.map(({ referenceCodes: _referenceCodes, ...item }) => ({
          ...item,
          ...(item.facts ? {
            facts: Object.fromEntries(Object.entries(item.facts).filter(([key]) => {
              const allowed = VITRU_DISCLOSED_SNAPSHOT_FACTS.has(key);
              if (!allowed) removedFields.add(key);
              return allowed;
            })),
          } : {}),
        })),
      })),
    },
    removedFields: [...removedFields].sort(),
  };
}
