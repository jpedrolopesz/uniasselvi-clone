import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir o servidor de desenvolvimento pelo IP da rede local.
  // Sem isso o Next bloqueia HMR e outros recursos internos vindos desse host.
  allowedDevOrigins: ["192.168.0.18", "10.10.128.59"],
  // PGlite carrega um binário WASM relativo ao seu próprio pacote em
  // node_modules. Empacotado pelo Next (Turbopack ou webpack, testado nos
  // dois), essa resolução de asset quebra com
  // "TypeError: The path argument must be of type string... Received an
  // instance of URL" — o bundler reescreve a forma como o pacote localiza o
  // próprio WASM. serverExternalPackages faz o Next usar `require` nativo
  // do Node para este pacote, sem empacotar, que é como os scripts (tsx) e
  // o vitest sempre rodaram sem problema.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
