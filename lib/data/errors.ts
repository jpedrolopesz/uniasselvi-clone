/** Erros de carregamento de dados locais — usados pelas páginas para renderizar estados controlados. */
export class DataNotFoundError extends Error {
  constructor(path: string) {
    super(`Arquivo não encontrado: ${path}`);
    this.name = "DataNotFoundError";
  }
}

export class DataInvalidError extends Error {
  constructor(path: string, cause?: unknown) {
    super(`Arquivo inválido: ${path}`);
    this.name = "DataInvalidError";
    this.cause = cause;
  }
}
