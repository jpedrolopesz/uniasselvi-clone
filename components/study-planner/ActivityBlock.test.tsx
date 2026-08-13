// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActivityBlock } from "@/components/study-planner/ActivityBlock";
import type { StudyActivity } from "@/lib/types/study-activity";

const activity: StudyActivity = {
  id: "preview-1",
  title: "Revisar avaliação",
  category: "revisao",
  subjectCode: "GTI03",
  subjectName: "Gestão de Processos",
  date: "2026-08-13",
  startTime: "08:00",
  endTime: "09:00",
  notes: "",
  source: "ai",
};

describe("ActivityBlock", () => {
  it("distingue a prévia pendente de uma atividade confirmada", () => {
    const review = vi.fn();
    const { rerender } = render(
      <ActivityBlock activity={{ ...activity, confirmationStatus: "pending" }} style={{ height: 8 }} onSelect={() => undefined} onReviewPreview={review} />
    );
    expect(screen.getByText(/Aguardando confirmação/)).toBeTruthy();
    expect(screen.queryByText("✨ Criado pelo Vitru")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Revisar" }));
    expect(review).toHaveBeenCalledOnce();

    rerender(<ActivityBlock activity={activity} style={{}} onSelect={() => undefined} />);
    expect(screen.queryByText(/Aguardando confirmação/)).toBeNull();
    expect(screen.getByText("✨ Criado pelo Vitru")).toBeTruthy();
  });
});
