import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AssistantPanel } from "@/components/study-planner/AssistantPanel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AssistantPanel", () => {
  it("renderiza na superfície trilha sem código específico de tela", () => {
    render(
      <AssistantPanel
        surface="trilha"
        objectId="MAT24"
        focus={{ kind: "trilha", lessonId: "u1-fatorial", markCount: 0, lastMarkAt: null }}
      />
    );
    expect(screen.queryByText("Vitru")).toBeTruthy();
  });

  it("renderiza na superfície calendario sem código específico de tela", () => {
    render(<AssistantPanel surface="calendario" objectId="usuario-ficticio-em-dia" />);
    expect(screen.queryByText("Vitru · Calendário")).toBeTruthy();
  });

  it("descarta ações de tipo desconhecido vindas do backend, sem renderizar nada para elas", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          conversationId: "conv-1",
          reply: "Aqui está minha resposta.",
          resolution: "faq",
          confidence: 0.9,
          actions: [
            { type: "self_destruct", label: "Ação desconhecida" },
            { type: "dismiss", label: "Fechar" },
          ],
        })
      )
    );

    render(
      <AssistantPanel
        surface="trilha"
        objectId="MAT24"
        focus={{ kind: "trilha", lessonId: "u1-fatorial", markCount: 0, lastMarkAt: null }}
      />
    );

    fireEvent.change(screen.getByLabelText("Mensagem para o Vitru"), {
      target: { value: "pergunta qualquer" },
    });
    fireEvent.click(screen.getByLabelText("Enviar mensagem"));

    await waitFor(() => expect(screen.queryByText("Aqui está minha resposta.")).toBeTruthy());

    expect(screen.queryByText("Ação desconhecida")).toBeNull();
    expect(screen.queryByText("Fechar")).toBeTruthy();
  });
});
