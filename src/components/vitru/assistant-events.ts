export const VITRU_OPEN_ASSISTANT_EVENT = "vitru-open-assistant";

export function openVitruAssistant() {
  window.dispatchEvent(new Event(VITRU_OPEN_ASSISTANT_EVENT));
}
