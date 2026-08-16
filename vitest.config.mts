import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Espelha os paths de tsconfig.json: as entradas mais específicas
    // (@/app, @/components) precisam vir antes do catch-all @, senão o Vite
    // resolve tudo contra a raiz do repo em vez de src/.
    alias: [
      { find: "@/app", replacement: `${import.meta.dirname}/src/app` },
      { find: "@/components", replacement: `${import.meta.dirname}/src/components` },
      { find: "@", replacement: import.meta.dirname },
    ],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // vitru/ hospeda o serviço de voz (huggingface/speech-to-speech), que traz
    // sua própria suíte em pytest e node:test. Ela é rodada pelas ferramentas
    // dele, não por esta.
    exclude: ["**/node_modules/**", "**/dist/**", "vitru/**"],
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
