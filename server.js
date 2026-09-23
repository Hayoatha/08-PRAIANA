require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const crypto = require("crypto");
const { nanoid } = require("nanoid");

const store = require("./utils/store");
const { requireAuth } = require("./middleware/auth");
const { uploadImagens, UPLOAD_DIR } = require("./middleware/upload");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const REQUIRED_ENV = ["SESSION_SECRET", "ADMIN_USER", "ADMIN_PASS_HASH"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(
    `\nConfiguração incompleta. Faltando no .env: ${missing.join(", ")}` +
      `\nRode: npm run setup-admin\n`
  );
  process.exit(1);
}

if (
  process.env.SESSION_SECRET.length < 32 ||
  process.env.SESSION_SECRET.startsWith("troque-este-valor")
) {
  console.error("\nSESSION_SECRET fraco ou de exemplo. Rode: npm run setup-admin\n");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === "production";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// Só confie em proxy reverso quando configurado (ex: TRUST_PROXY=1 na hospedagem);
// caso contrário X-Forwarded-For poderia ser forjado para burlar o limite de login.
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1);
app.disable("x-powered-by");

app.use(
  helmet({
    referrerPolicy: { policy: "same-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: IS_PROD ? [] : null,
      },
    },
  })
);

app.use(express.urlencoded({ extended: false, limit: "50kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "strict",
      secure: IS_PROD,
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);
app.use(flash());

// Defesa extra contra CSRF: requisições que alteram dados precisam vir do próprio site.
app.use((req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const fetchSite = req.get("sec-fetch-site");
  if (fetchSite) {
    return fetchSite === "same-origin" ? next() : res.status(403).send("Requisição bloqueada.");
  }
  const origem = req.get("origin") || req.get("referer");
  if (origem) {
    try {
      if (new URL(origem).host === req.get("host")) return next();
    } catch {
      /* cai no bloqueio abaixo */
    }
  }
  return res.status(403).send("Requisição bloqueada.");
});

// Páginas do painel não devem ser guardadas em cache do navegador.
app.use("/admin", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use((req, res, next) => {
  res.locals.isAdmin = Boolean(req.session && req.session.isAdmin);
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

const CATEGORIAS = ["Biquíni", "Maiô", "Saída de Praia", "Acessórios"];

const ENDERECO_LOJA = "Tv. São Geraldo, 48B - São Geraldo, Manaus - AM, 69053-310";

// URL pública e definitiva do site (sem barra no final), usada no sitemap.xml
// e no robots.txt. Configure SITE_URL no .env quando o domínio for definido.
const SITE_URL = (process.env.SITE_URL || "https://praianabylana.com.br").replace(/\/+$/, "");

app.locals.site = {
  nome: "Praiana by Lana",
  url: SITE_URL,
  whatsapp: process.env.WHATSAPP_NUMERO || "5500000000000",
  whatsappCatalogo: process.env.WHATSAPP_CATALOGO_URL || "https://wa.me/c/5500000000000",
  instagram: process.env.INSTAGRAM_USUARIO || "praianabylana",
  endereco: ENDERECO_LOJA,
  mapaUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ENDERECO_LOJA)}`,
};

// Slides de vitrine (fotos + frases de marketing).
// Para trocar as fotos: salve os novos arquivos em public/img/slides/ e
// ajuste o campo "imagem" abaixo (rode "node scripts/import-slides.js" se
// quiser redimensionar/otimizar automaticamente, editando a pasta de
// origem no topo do script).
app.locals.slidesVitrine = [
  { imagem: "/img/slides/slide-1.jpg", frase: "Feito para valorizar cada curva" },
  { imagem: "/img/slides/slide-2.jpg", frase: "Conforto e caimento perfeito em cada peça" },
  { imagem: "/img/slides/slide-3.jpg", frase: "Proteção UV50 com muito estilo" },
  { imagem: "/img/slides/slide-4.jpg", frase: "Coleção nova toda semana" },
  { imagem: "/img/slides/slide-5.jpg", frase: "Feito à mão, com amor, para você" },
];

// Descrição de cada categoria, usada na vitrine "Explore por categoria" da home.
app.locals.categoriasVitrine = [
  { nome: "Biquíni", frase: "Modelagens que valorizam cada curva" },
  { nome: "Maiô", frase: "Conforto e elegância para o dia inteiro" },
  { nome: "Saída de Praia", frase: "Looks leves para completar o visual" },
  { nome: "Acessórios", frase: "Detalhes que fazem toda diferença" },
];

// Diferenciais mostrados na seção "Por que a Praiana" da home.
app.locals.valoresMarca = [
  "Proteção solar UV50 em todas as peças",
  "Modelagem exclusiva, pensada para valorizar você",
  "Produção cuidadosa, sem grandes lotes",
  "Atendimento direto com a proprietária pelo WhatsApp",
];

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Muitas tentativas de login. Tente novamente em alguns minutos.",
});

// Hash "de mentira" para gastar o mesmo tempo quando o usuário não existe,
// evitando revelar por tempo de resposta se o usuário está correto.
const HASH_FALSO = bcrypt.hashSync("senha-inexistente", 12);

function textoIgual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function texto(valor, max) {
  return String(valor || "").trim().slice(0, max);
}

function numeroPreco(valor) {
  const n = Number(String(valor).replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n <= 1_000_000 ? Math.round(n * 100) / 100 : null;
}

// Valida e normaliza os dados de produto vindos do formulário.
function lerProduto(body) {
  const nome = texto(body.nome, 120);
  const preco = numeroPreco(body.preco);
  if (!nome || preco === null) return null;

  let precoPromocional = null;
  if (body.precoPromocional) {
    precoPromocional = numeroPreco(body.precoPromocional);
    if (precoPromocional === null) return null;
  }

  return {
    nome,
    descricao: texto(body.descricao, 1000),
    preco,
    precoPromocional,
    tamanhos: texto(body.tamanhos, 100)
      .split(",")
      .map((t) => t.trim().slice(0, 10))
      .filter(Boolean)
      .slice(0, 12),
    categoria: CATEGORIAS.includes(body.categoria) ? body.categoria : CATEGORIAS[0],
    destaque: body.destaque === "on",
    ativo: body.ativo === "on",
  };
}

// Só apaga arquivos dentro da pasta de uploads, nunca fora dela.
function apagarUpload(caminhoPublico) {
  if (typeof caminhoPublico !== "string") return;
  const nome = path.basename(caminhoPublico);
  const alvo = path.join(UPLOAD_DIR, nome);
  if (path.dirname(alvo) === UPLOAD_DIR && nome !== ".gitkeep") {
    fs.unlink(alvo, () => {});
  }
}

// ---------- Rotas públicas ----------

app.get("/", (req, res) => {
  const produtos = store.getPublic();
  const destaques = produtos.filter((p) => p.destaque).slice(0, 6);
  res.render("index", {
    titulo: "Praiana by Lana",
    destaques: destaques.length ? destaques : produtos.slice(0, 6),
  });
});

app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(
    ["User-agent: *", "Disallow: /admin", "", `Sitemap: ${SITE_URL}/sitemap.xml`, ""].join("\n")
  );
});

app.get("/sitemap.xml", (req, res) => {
  const hoje = new Date().toISOString().slice(0, 10);

  const paginas = [
    { loc: "/", prioridade: "1.0" },
    { loc: "/catalogo", prioridade: "0.9" },
    ...CATEGORIAS.map((c) => ({
      loc: `/catalogo?categoria=${encodeURIComponent(c)}`,
      prioridade: "0.6",
    })),
  ];

  const urls = paginas
    .map(
      (p) => `  <url>
    <loc>${SITE_URL}${p.loc}</loc>
    <lastmod>${hoje}</lastmod>
    <priority>${p.prioridade}</priority>
  </url>`
    )
    .join("\n");

  res.type("application/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
});

app.get("/catalogo", (req, res) => {
  const categoriaFiltro = req.query.categoria || "";
  let produtos = store.getPublic();
  if (categoriaFiltro) {
    produtos = produtos.filter((p) => p.categoria === categoriaFiltro);
  }
  res.render("catalogo", {
    titulo: "Catálogo - Praiana by Lana",
    produtos,
    categorias: CATEGORIAS,
    categoriaFiltro,
  });
});

// ---------- Autenticação admin ----------

app.get("/admin/login", (req, res) => {
  if (req.session.isAdmin) return res.redirect("/admin");
  res.render("admin/login", { titulo: "Login - Praiana" });
});

app.post("/admin/login", loginLimiter, async (req, res) => {
  const usuario = String(req.body.usuario || "").slice(0, 100);
  const senha = String(req.body.senha || "").slice(0, 200);

  const usuarioOk = textoIgual(usuario, process.env.ADMIN_USER);
  const senhaOk = await bcrypt.compare(
    senha,
    usuarioOk ? process.env.ADMIN_PASS_HASH : HASH_FALSO
  );

  if (!usuarioOk || !senhaOk) {
    req.flash("error", "Usuário ou senha inválidos.");
    return res.redirect("/admin/login");
  }

  req.session.regenerate((err) => {
    if (err) {
      req.flash("error", "Erro ao iniciar sessão. Tente novamente.");
      return res.redirect("/admin/login");
    }
    req.session.isAdmin = true;
    res.redirect("/admin");
  });
});

app.post("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

// ---------- Painel administrativo ----------

app.get("/admin", requireAuth, (req, res) => {
  const produtos = store
    .getAll()
    .sort((a, b) => b.createdAt - a.createdAt);
  res.render("admin/dashboard", {
    titulo: "Painel - Praiana",
    produtos,
  });
});

app.get("/admin/produtos/novo", requireAuth, (req, res) => {
  res.render("admin/produto-form", {
    titulo: "Novo produto - Praiana",
    produto: null,
    categorias: CATEGORIAS,
  });
});

app.post(
  "/admin/produtos/novo",
  requireAuth,
  (req, res, next) => {
    uploadImagens(req, res, (err) => {
      if (err) {
        req.flash("error", err.message);
        return res.redirect("/admin/produtos/novo");
      }
      next();
    });
  },
  (req, res) => {
    const imagens = (req.files || []).map((f) => `/uploads/${f.filename}`);
    const dados = lerProduto(req.body);

    if (!dados) {
      imagens.forEach(apagarUpload);
      req.flash("error", "Nome e preço válido são obrigatórios.");
      return res.redirect("/admin/produtos/novo");
    }

    store.create({ id: nanoid(10), ...dados, imagens, createdAt: Date.now() });
    req.flash("success", "Produto cadastrado com sucesso!");
    res.redirect("/admin");
  }
);

app.get("/admin/produtos/:id/editar", requireAuth, (req, res) => {
  const produto = store.getById(req.params.id);
  if (!produto) {
    req.flash("error", "Produto não encontrado.");
    return res.redirect("/admin");
  }
  res.render("admin/produto-form", {
    titulo: "Editar produto - Praiana",
    produto,
    categorias: CATEGORIAS,
  });
});

app.post(
  "/admin/produtos/:id/editar",
  requireAuth,
  (req, res, next) => {
    uploadImagens(req, res, (err) => {
      if (err) {
        req.flash("error", err.message);
        return res.redirect(`/admin/produtos/${req.params.id}/editar`);
      }
      next();
    });
  },
  (req, res) => {
    const novasImagens = (req.files || []).map((f) => `/uploads/${f.filename}`);
    const produtoAtual = store.getById(req.params.id);
    if (!produtoAtual) {
      novasImagens.forEach(apagarUpload);
      req.flash("error", "Produto não encontrado.");
      return res.redirect("/admin");
    }

    const dados = lerProduto(req.body);
    if (!dados) {
      novasImagens.forEach(apagarUpload);
      req.flash("error", "Nome e preço válido são obrigatórios.");
      return res.redirect(`/admin/produtos/${req.params.id}/editar`);
    }

    // Só é possível remover imagens que realmente pertencem a este produto.
    const pedido = req.body.imagensRemover;
    const remover = new Set(Array.isArray(pedido) ? pedido : pedido ? [pedido] : []);
    const removidas = produtoAtual.imagens.filter((img) => remover.has(img));
    removidas.forEach(apagarUpload);

    const imagens = produtoAtual.imagens
      .filter((img) => !remover.has(img))
      .concat(novasImagens);

    store.update(req.params.id, { ...dados, imagens });
    req.flash("success", "Produto atualizado com sucesso!");
    res.redirect("/admin");
  }
);

app.post("/admin/produtos/:id/excluir", requireAuth, (req, res) => {
  const produto = store.getById(req.params.id);
  if (produto) {
    produto.imagens.forEach(apagarUpload);
    store.remove(req.params.id);
    req.flash("success", "Produto excluído.");
  }
  res.redirect("/admin");
});

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).render("404", { titulo: "Página não encontrada" });
});

// Nunca expõe detalhes internos (stack trace) ao visitante.
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).send("Erro interno. Tente novamente mais tarde.");
});

app.listen(PORT, () => {
  console.log(`\nPraiana by Lana rodando em http://localhost:${PORT}\n`);
});
