#!/usr/bin/env node
import { createInterface } from "node:readline";
import { decideBrowserAction, type BrowserAction } from "@/lib/vitru/browser-action-decision";
import { resolveTarget } from "@/lib/vitru/resolve-target";
import { resolveReference } from "@/lib/vitru/resolve-reference";
import type { VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";
import type { VitruPageId } from "@/lib/vitru/page-context";

type Request = {
  id: string;
  operation?: "decide" | "resolve_target" | "resolve_reference";
  action?: BrowserAction;
  snapshot: VitruSemanticSnapshot;
  page?: { id: VitruPageId; name: string };
  phrase?: string;
};

function destinationHref(id: string, snapshot: VitruSemanticSnapshot): string | undefined {
  const code = snapshot.page.subject?.code;
  if (id === "home") return "/";
  if (id === "study-calendar") return "/calendario-de-estudos";
  if (id === "campus") return "/campus-vitru";
  if (!code) return undefined;
  if (id === "discipline") return `/disciplinas/${code}`;
  if (id === "learning-path") return `/disciplinas/${code}/trilha-de-aprendizagem`;
  if (id === "assessments") return `/disciplinas/${code}/notas-avaliacoes`;
  if (id === "mediator") return `/disciplinas/${code}/fale-com-mediador`;
  return undefined;
}

function hydrateFixture(snapshot: VitruSemanticSnapshot): VitruSemanticSnapshot {
  return {
    ...snapshot,
    destinations: snapshot.destinations.map(destination => ({
      ...destination,
      href: destination.href || destinationHref(destination.id, snapshot) || "",
    })).filter(destination => destination.href),
  };
}

function execute(request: Request): unknown {
  const snapshot = hydrateFixture(request.snapshot);
  if (request.operation === "resolve_target") return resolveTarget(request.phrase || "", snapshot);
  if (request.operation === "resolve_reference") return resolveReference(request.phrase || "", snapshot);
  if (!request.action || !request.page) throw new Error("decide requires action and page");
  return decideBrowserAction(request.action, snapshot, request.page);
}

const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
lines.on("line", line => {
  let id = "unknown";
  try {
    const request = JSON.parse(line) as Request;
    id = request.id;
    process.stdout.write(`${JSON.stringify({ id, ok: true, result: execute(request) })}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.stack || error.message : String(error);
    process.stdout.write(`${JSON.stringify({ id, ok: false, error: message })}\n`);
  }
});
