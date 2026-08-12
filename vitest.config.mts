import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": import.meta.dirname,
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // PGlite é single-writer sobre um diretório em disco (como o SQLite) —
    // vários arquivos de teste rodando em processos/threads paralelos abrem
    // handles concorrentes ao mesmo .vitru/pglite e derrubam o WASM. Os
    // testes compartilham esse banco de propósito (é o mesmo estado
    // semeado que a Fase 2 verificou), então a suíte roda sequencial e sem
    // isolamento de módulo — sem `isolate: false` cada arquivo de teste
    // ganha seu próprio globalThis e o cache de conexão em lib/db/client.ts
    // não é compartilhado entre eles, abrindo uma instância de PGlite por
    // arquivo mesmo em série.
    fileParallelism: false,
    isolate: false,
  },
});
