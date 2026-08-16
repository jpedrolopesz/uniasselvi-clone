import { afterEach, describe, expect, it, vi } from "vitest";
import { waitForSocketOpen } from "@/lib/vitru/nova-sonic-connection";

class WebSocketStub extends EventTarget {
  readyState: number = WebSocket.CONNECTING;
  open() {
    this.readyState = WebSocket.OPEN;
    this.dispatchEvent(new Event("open"));
  }
  fail() {
    this.dispatchEvent(new Event("error"));
  }
}

describe("waitForSocketOpen", () => {
  afterEach(() => vi.useRealTimers());

  it("resolve quando o socket abre", async () => {
    const ws = new WebSocketStub();
    const ready = waitForSocketOpen(ws as unknown as WebSocket, 1000);
    ws.open();
    await expect(ready).resolves.toBeUndefined();
  });

  it("resolve na hora se o socket já estiver aberto", async () => {
    const ws = new WebSocketStub();
    ws.readyState = WebSocket.OPEN;
    await expect(waitForSocketOpen(ws as unknown as WebSocket, 1000)).resolves.toBeUndefined();
  });

  it("rejeita quando o socket emite erro", async () => {
    const ws = new WebSocketStub();
    const ready = waitForSocketOpen(ws as unknown as WebSocket, 1000);
    ws.fail();
    await expect(ready).rejects.toThrow("Não foi possível conectar ao serviço de voz.");
  });

  it("rejeita deterministicamente se o socket nunca abrir", async () => {
    vi.useFakeTimers();
    const ws = new WebSocketStub();
    const ready = waitForSocketOpen(ws as unknown as WebSocket, 1000);
    const assertion = expect(ready).rejects.toThrow("não concluiu a conexão a tempo");
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
  });
});
