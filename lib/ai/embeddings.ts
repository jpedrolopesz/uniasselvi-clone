import "server-only";

/**
 * Stub de embeddings — em produção usa Bedrock Titan Embeddings.
 * Necessário para build: src/lib/db/agent.ts importa este módulo.
 */

export async function embedOne(text: string): Promise<number[]> {
  // Em produção: chama Bedrock Titan Embeddings
  // Retorna vetor de 1536 dimensões
  return new Array(1536).fill(0).map(() => Math.random() * 2 - 1);
}

export function toVectorLiteral(vector: number[]): string {
  return `[${vector.join(",")}]`;
}
