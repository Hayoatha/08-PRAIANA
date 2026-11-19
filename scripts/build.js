// Gera o site estático em docs/ (pasta publicada pelo GitHub Pages).
// Uso: npm run build
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");

const config = require("../site.config");

const RAIZ = path.join(__dirname, "..");
const VIEWS = path.join(RAIZ, "views");
const PUBLIC = path.join(RAIZ, "public");
const SAIDA = path.join(RAIZ, "docs");

function lerProdutos() {
  const arquivo = path.join(RAIZ, "data", "products.json");
  const todos = JSON.parse(fs.readFileSync(arquivo, "utf8"));
  // Mesma regra do antigo servidor: só os ativos, do mais novo para o mais antigo.
  return todos.filter((p) => p.ativo).sort((a, b) => b.createdAt - a.createdAt);
}

function renderizar(view, dados) {
  return ejs.renderFile(path.join(VIEWS, `${view}.ejs`), {
    site: config.site,
    slidesVitrine: config.slidesVitrine,
    categoriasVitrine: config.categoriasVitrine,
    valoresMarca: config.valoresMarca,
    ...dados,
  });
}

function sitemap() {
  const hoje = new Date().toISOString().slice(0, 10);
  const paginas = [
    { loc: "/", prioridade: "1.0" },
    { loc: "/catalogo", prioridade: "0.9" },
    ...config.CATEGORIAS.map((c) => ({
      loc: `/catalogo?categoria=${encodeURIComponent(c)}`,
      prioridade: "0.6",
    })),
  ];
  const urls = paginas
    .map(
      (p) => `  <url>
    <loc>${config.SITE_URL}${p.loc}</loc>
    <lastmod>${hoje}</lastmod>
    <priority>${p.prioridade}</priority>
  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

async function main() {
  const produtos = lerProdutos();
  const destaques = produtos.filter((p) => p.destaque).slice(0, 6);

  fs.rmSync(SAIDA, { recursive: true, force: true });
  // Arquivos-fonte de logo (usados só pelos scripts de imagem) não são publicados.
  const NAO_PUBLICAR = new Set(["logo-color-raw.jpg", "logo-dark-raw.png", "logo-icon.png"]);
  fs.cpSync(PUBLIC, SAIDA, {
    recursive: true,
    filter: (origem) => !NAO_PUBLICAR.has(path.basename(origem)),
  });

  const paginas = {
    "index.html": await renderizar("index", {
      titulo: "Praiana by Lana",
      destaques: destaques.length ? destaques : produtos.slice(0, 6),
    }),
    // O GitHub Pages serve catalogo.html em /catalogo (a ?categoria=X é filtrada no navegador).
    "catalogo.html": await renderizar("catalogo", {
      titulo: "Catálogo - Praiana by Lana",
      produtos,
      categorias: config.CATEGORIAS,
      categoriaFiltro: "",
    }),
    "404.html": await renderizar("404", { titulo: "Página não encontrada" }),
  };

  for (const [nome, html] of Object.entries(paginas)) {
    fs.writeFileSync(path.join(SAIDA, nome), html);
  }

  fs.writeFileSync(path.join(SAIDA, "sitemap.xml"), sitemap());
  fs.writeFileSync(
    path.join(SAIDA, "robots.txt"),
    `User-agent: *\nAllow: /\n\nSitemap: ${config.SITE_URL}/sitemap.xml\n`
  );
  fs.writeFileSync(path.join(SAIDA, "CNAME"), `${config.DOMINIO}\n`);
  fs.writeFileSync(path.join(SAIDA, ".nojekyll"), "");

  console.log(`Site gerado em docs/ (${produtos.length} produtos, ${destaques.length} em destaque).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
