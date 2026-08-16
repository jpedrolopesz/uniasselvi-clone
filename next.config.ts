import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desabilita TypeScript check no build (módulos em desenvolvimento)
  typescript: { ignoreBuildErrors: true },
  // Desabilita ESLint no build
  eslint: { ignoreDuringBuilds: true },
  // Permite abrir o servidor de desenvolvimento pelo IP da rede local.
  allowedDevOrigins: ["192.168.0.18", "10.10.128.59"],
  // PGlite carrega um binário WASM relativo ao seu próprio pacote.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
