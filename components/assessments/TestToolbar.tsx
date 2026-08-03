"use client";

interface TestToolbarProps {
  onIncreaseFontSize: () => void;
}

export function TestToolbar({ onIncreaseFontSize }: TestToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        aria-label="Imprimir"
        title="Imprimir"
        className="flex h-9 w-9 items-center justify-center rounded-md bg-bg-card text-white hover:bg-bg-card-hover"
      >
        🖨
      </button>
      <button
        type="button"
        onClick={onIncreaseFontSize}
        title="Aumentar fonte"
        className="flex h-9 items-center justify-center rounded-md bg-bg-card px-3 text-sm font-semibold text-white hover:bg-bg-card-hover"
      >
        A+
      </button>
      <button
        type="button"
        disabled
        title="Disponível em breve"
        className="flex h-9 items-center justify-center rounded-md bg-bg-card px-3 text-sm font-medium text-text-secondary/70 disabled:cursor-not-allowed"
      >
        Alterar modo de visualização
      </button>
    </div>
  );
}
