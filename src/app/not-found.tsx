/**
 * Página 404 customizada — não usa banco de dados.
 * Necessária para evitar que o PGlite seja inicializado durante o build.
 */
export default function NotFound() {
  return (
    <html lang="pt-BR">
      <body style={{ backgroundColor: "#0d0d0d", color: "#fff", fontFamily: "system-ui", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ color: "#ffcc00", fontSize: "3rem", margin: 0 }}>404</h1>
          <p style={{ color: "#9a9a9a", marginTop: "0.5rem" }}>Página não encontrada</p>
          <a href="/" style={{ color: "#ffcc00", textDecoration: "none", marginTop: "1rem", display: "inline-block" }}>← Voltar para o início</a>
        </div>
      </body>
    </html>
  );
}
