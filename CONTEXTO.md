# Contexto — Praiana by Lana (colar em chat novo)

**Projeto:** site de catálogo da loja de biquínis Praiana by Lana. Pasta local:
`C:\Users\hayoa\OneDrive\ARQUIVOS\04 - VISUAL STUDIO\02 - PROJETO SITES\08 - PRAIANA`.
Repo: `github.com/Hayoatha/08-PRAIANA` (privado). Deploy: Render (plano pago
"Starter"), domínio `www.praianabylana.com.br` (raiz redireciona pro www).

**Stack:** Node >=20, Express 4, EJS (SSR, sem frontend framework). "Banco"
= `data/products.json` via `utils/store.js` (CRUD + escrita atômica). Sessão
= `express-session` + `memorystore` (evita leak do MemoryStore padrão).
Upload = `multer` (memória) + `sharp` (valida conteúdo real, remove
EXIF/GPS, redimensiona, regrava JPEG). Segurança = `helmet`, `bcryptjs`,
`express-rate-limit` no login, CSRF caseiro (checa `Sec-Fetch-Site`/Origin).

**Arquivos-chave:** `server.js` (tudo: rotas + middlewares + config, sem
router separado), `utils/store.js` (dados), `middleware/upload.js` (fotos),
`middleware/auth.js` (`requireAuth`), `views/` (EJS: index, catalogo, 404,
admin/{login,dashboard,produto-form}, partials/{head,header,footer,slideshow}),
`public/` (css/js/logos/slides/uploads), `render.yaml` (Blueprint deploy).

**Produto:** `{id, nome, descricao, preco, precoPromocional, tamanhos[],
categoria, imagens[] (até 6, /uploads/xxx.jpg), destaque, ativo, createdAt}`.
Categorias fixas em `CATEGORIAS` (server.js): Biquíni, Maiô, Saída de Praia,
Acessórios.

**Rotas públicas:** `/`, `/catalogo?categoria=`, `/sitemap.xml`,
`/robots.txt` (últimos dois gerados dinamicamente via `SITE_URL`).
**Admin (requireAuth):** `/admin/login` (GET/POST), `/admin/logout` (POST),
`/admin` (lista), `/admin/produtos/novo` (GET/POST), `/admin/produtos/:id/editar`
(GET/POST), `/admin/produtos/:id/excluir` (POST). 1 usuário só (a proprietária).

**Persistência em prod:** `DATA_DIR=/var/data` (env var, só setada no
Render) redireciona `products.json` e `uploads/` para o disco persistente
(1GB, configurado em `render.yaml`, snapshot automático a cada 24h). Sem
`DATA_DIR` (dev local), tudo fica dentro do projeto e normalmente some a
cada deploy em host efêmero — por isso a env var existe.

**Env vars obrigatórias:** `SESSION_SECRET`, `ADMIN_USER`, `ADMIN_PASS_HASH`
(gerar com `npm run setup-admin`, nunca commitar). **Opcionais/config:**
`DATA_DIR`, `SITE_URL`, `TRUST_PROXY`, `WHATSAPP_NUMERO`,
`WHATSAPP_CATALOGO_URL`, `INSTAGRAM_USUARIO`, `PORT`, `NODE_ENV`. Ver
`.env.example`.

**Coisas para lembrar / pegadinhas já resolvidas:**
- `helmet`'s `Referrer-Policy` já causou bug no CSRF check (Origin sumia) —
  por isso a checagem usa `Sec-Fetch-Site` como primária.
- `render.yaml` só sincroniza com o serviço já criado via **Manual Sync**
  no dashboard do Render — push no GitHub sozinho não reaplica o YAML.
- `plan: starter` no render.yaml é uma suposição do slug real do Render —
  confirmar se bater errado num sync.
- Sem testes automatizados; verificação é sempre manual (curl + browser).
- `.gitignore` mantém fora do Git: `.env`, `data/products.json`,
  `public/uploads/*`, `node_modules/`.

**Documentação completa:** ver `ARQUITETURA.md` na raiz do projeto.
