# Arquitetura — Praiana by Lana

Documentação técnica do site. Para um resumo ultra-compacto (colar em um chat
novo como contexto), veja [CONTEXTO.md](CONTEXTO.md).

## Stack

- **Backend:** Node.js (>=20) + Express 4, sem framework de frontend — HTML
  renderizado no servidor com **EJS**.
- **"Banco de dados":** um arquivo JSON (`data/products.json`), lido/escrito
  via `utils/store.js`. Sem banco relacional — decisão consciente por ser um
  catálogo pequeno de uma única loja.
- **Sessão:** `express-session` com `memorystore` (limpeza periódica de
  sessões expiradas — evita o vazamento de memória do `MemoryStore` padrão).
  Sessão só existe para autenticar a proprietária no painel; não há
  conta/login de cliente.
- **Imagens:** `multer` (upload em memória) + `sharp` (valida o conteúdo
  real do arquivo, corrige orientação, redimensiona, remove metadados
  EXIF/GPS e regrava como JPEG).
- **Segurança:** `helmet` (CSP, HSTS, etc.), `bcryptjs` (hash de senha),
  `express-rate-limit` (login), checagem de CSRF via `Sec-Fetch-Site`/Origin.

## Estrutura de pastas

```
server.js                  → toda a aplicação: rotas, middlewares, config
middleware/auth.js          → requireAuth (protege /admin/*)
middleware/upload.js        → uploadImagens (multer + sharp), UPLOAD_DIR
utils/store.js              → CRUD do catálogo (data/products.json), escrita atômica
views/                      → EJS: index, catalogo, 404, admin/*, partials/*
public/                     → CSS, JS, logos, slides, uploads/ (fotos de produto)
scripts/                    → utilitários de linha de comando (ver abaixo)
render.yaml                 → Blueprint do Render (deploy declarativo)
```

### Scripts (`scripts/`)

- `setup-admin.js` — define/troca a senha do painel. Pede a senha de forma
  oculta (sem eco no terminal), exige 12+ caracteres, grava só o hash bcrypt
  no `.env` e gera um novo `SESSION_SECRET` a cada troca.
- `import-slides.js "<pasta>"` — importa até 5 fotos de uma pasta, redimensiona
  e otimiza para `public/img/slides/slide-N.jpg`.
- `gen-slides.js`, `trim-logos.js`, `chroma-key-logo.js` — geração/tratamento
  pontual das artes da marca (uso raro, já rodados uma vez).

## Modelo de dados (produto)

```js
{
  id, nome, descricao, preco, precoPromocional, // preço em número (reais)
  tamanhos: ["P","M","G"], categoria,            // uma das 4 fixas (ver abaixo)
  imagens: ["/uploads/xxx.jpg", ...],            // até 6, caminho público
  destaque: bool,   // aparece nos "destaques" da home
  ativo: bool,      // aparece no catálogo público (oculto ≠ excluído)
  createdAt
}
```

Categorias fixas (`CATEGORIAS` em `server.js`): **Biquíni, Maiô, Saída de
Praia, Acessórios**. Mudar isso é uma edição direta no array.

## Rotas

**Públicas**
- `GET /` — home (logo, slideshow, categorias, destaques)
- `GET /catalogo?categoria=X` — catálogo completo, com filtro opcional
- `GET /sitemap.xml`, `GET /robots.txt` — gerados dinamicamente a partir de
  `SITE_URL` (não são arquivos estáticos)

**Admin** (tudo sob `requireAuth`, exceto login)
- `GET/POST /admin/login`, `POST /admin/logout`
- `GET /admin` — lista de produtos
- `GET/POST /admin/produtos/novo`
- `GET/POST /admin/produtos/:id/editar`
- `POST /admin/produtos/:id/excluir`

## Segurança — decisões específicas

- **CSRF:** middleware próprio (não usa `csurf`). Bloqueia POST/PUT/DELETE
  que não venham do próprio site, checando `Sec-Fetch-Site: same-origin`
  (navegadores modernos) com fallback para `Origin`/`Referer` == `Host`.
  ⚠️ Já causou um bug: `helmet` manda `Referrer-Policy` que zera o Origin em
  alguns casos — por isso a checagem prioriza `Sec-Fetch-Site`.
- **Login:** comparação de usuário em tempo constante (`crypto.timingSafeEqual`)
  e um hash "de mentira" (`HASH_FALSO`) para gastar o mesmo tempo quando o
  usuário não existe — evita enumeração por tempo de resposta.
- **Exclusão de arquivo:** `apagarUpload()` só apaga arquivos que resolvem
  para dentro de `UPLOAD_DIR` (proteção contra path traversal via
  `imagensRemover`).
- **Validação de produto:** `lerProduto()` centraliza sanitização (tamanho
  máximo de string, preço numérico entre 0 e 1.000.000, categoria precisa
  estar em `CATEGORIAS`).
- **Cookies do painel:** `SameSite=Strict`, `HttpOnly`, `Secure` em produção,
  `Cache-Control: no-store` em toda rota `/admin`.
- O servidor **recusa iniciar** se faltar env var obrigatória ou se
  `SESSION_SECRET` for curto/valor de exemplo (`server.js`, topo do arquivo).

## Persistência em produção (Render)

Por padrão (`DATA_DIR` não definida) tudo fica dentro do projeto — ótimo
para dev, mas some a cada deploy em hospedagens efêmeras. Em produção,
`DATA_DIR=/var/data` (disco persistente do Render, 1GB, configurado no
`render.yaml`) redireciona:

- `utils/store.js` → `$DATA_DIR/products.json`
- `middleware/upload.js` → `$DATA_DIR/uploads/` (servido via rota dedicada
  `app.use("/uploads", express.static(UPLOAD_DIR))`, independente de estar
  ou não dentro de `public/`)

Render tira snapshot do disco a cada 24h (retém 7 dias) — é o backup de fato.

## Variáveis de ambiente

Ver `.env.example` para a lista comentada. As relevantes para arquitetura:

| Variável | Efeito |
|---|---|
| `DATA_DIR` | Ativa o modo "disco persistente" (ver acima) |
| `SITE_URL` | Base para sitemap.xml/robots.txt (sem barra final) |
| `TRUST_PROXY` | Só confia em `X-Forwarded-For` se setado (Render precisa) |
| `SESSION_SECRET`, `ADMIN_USER`, `ADMIN_PASS_HASH` | Obrigatórias, geradas via `setup-admin` |
| `WHATSAPP_NUMERO`, `WHATSAPP_CATALOGO_URL`, `INSTAGRAM_USUARIO` | Conteúdo do site (links) |

## Deploy (Render)

- **Domínio:** `www.praianabylana.com.br` (raiz redireciona para `www` —
  configurado nos Custom Domains do Render, não no código).
- **Plano:** pago ("Starter", ~$7/mês) — necessário para disco persistente e
  para o serviço não "dormir" (no free, o sitemap falhava ao ser buscado
  pelo Google por causa do cold-start).
- **Deploy:** automático a cada push em `main` (GitHub → Render). O
  `render.yaml` é um Blueprint; mudanças nele só se aplicam ao serviço já
  criado depois de um **Manual Sync** no dashboard.
- **Repositório:** `github.com/Hayoatha/08-PRAIANA` (privado). `.env`,
  `data/products.json` e `public/uploads/*` ficam fora do Git
  (`.gitignore`) — só existem localmente e no disco do Render.

## Decisões/trade-offs conhecidos

- **JSON em vez de banco de verdade:** simples e suficiente para o volume
  (uma loja, dezenas de produtos). Se crescer muito ou precisar de acesso
  concorrente pesado, migrar para Postgres é o próximo passo natural.
- **Sem fila/CDN de imagens:** fotos ficam no disco do próprio serviço.
  Funciona bem no volume atual; um catálogo grande se beneficiaria de algo
  como Cloudinary/S3.
- **Sem testes automatizados.** Verificação até agora foi manual/smoke test
  via curl e navegador a cada mudança.
- **`plan: starter` no render.yaml é uma suposição do nome do slug** — não
  há 100% de certeza de que bate com o nome atual do Render; se o Manual
  Sync falhar por causa disso, é só corrigir esse valor.
