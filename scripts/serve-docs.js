// Servidor local para pré-visualizar docs/ imitando o GitHub Pages
// (/catalogo -> catalogo.html, página 404.html). Uso: npm run preview
const http = require("http");
const fs = require("fs");
const path = require("path");

const DOCS = path.join(__dirname, "..", "docs");
const PORTA = Number(process.env.PORT) || 8080;

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function arquivoPara(urlPath) {
  const limpo = path.normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, "");
  const base = path.join(DOCS, limpo);
  if (!base.startsWith(DOCS)) return null;
  for (const candidato of [base, `${base}.html`, path.join(base, "index.html")]) {
    if (fs.existsSync(candidato) && fs.statSync(candidato).isFile()) return candidato;
  }
  return null;
}

http
  .createServer((req, res) => {
    const { pathname } = new URL(req.url, "http://localhost");
    const arquivo = arquivoPara(pathname);
    const final = arquivo || path.join(DOCS, "404.html");
    res.writeHead(arquivo ? 200 : 404, {
      "Content-Type": TIPOS[path.extname(final)] || "application/octet-stream",
    });
    fs.createReadStream(final).pipe(res);
  })
  .listen(PORTA, () => console.log(`Pré-visualização em http://localhost:${PORTA}`));
