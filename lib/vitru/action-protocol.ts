export type VitruActionEventType =
  | "action_proposed"
  | "action_started"
  | "page_loading"
  | "page_ready"
  | "action_completed"
  | "action_failed";

export interface VitruActionEvent {
  type: VitruActionEventType;
  actionId: string;
  version: number;
  ok?: boolean;
  message?: string;
}

/** Eventos atrasados nunca podem regredir o estado já observado pelo receptor. */
export function acceptsEventVersion(appliedVersion: number, eventVersion: number): boolean {
  return eventVersion >= appliedVersion;
}

export function navigationCanComplete(event: VitruActionEvent): boolean {
  return event.type === "page_ready";
}
