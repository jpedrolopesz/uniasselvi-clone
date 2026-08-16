import "server-only";

export class DatabaseError extends Error {
  constructor(message: string, readonly code: string | undefined, readonly httpStatus: number) {
    super(message);
    this.name = "DatabaseError";
  }
}

export function toDatabaseError(error: unknown) {
  const code = (error as { code?: string }).code;
  if (code === "23505") return new DatabaseError("Registro já existe.", code, 409);
  if (code === "23503") return new DatabaseError("Referência inválida.", code, 400);
  if (code === "23514" || code === "23502") return new DatabaseError("Dados inválidos.", code, 400);
  if (code === "42P01") return new DatabaseError("Banco não inicializado.", code, 503);
  if (code?.startsWith("08") || ["ECONNREFUSED", "ETIMEDOUT"].includes(code ?? "")) {
    return new DatabaseError("Banco indisponível.", code, 503);
  }
  return new DatabaseError("Erro interno.", code, 500);
}
