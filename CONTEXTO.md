# Contexto — Praiana by Lana (colar em chat novo)

**Projeto:** site de catálogo da loja de biquínis Praiana by Lana. **Site 100%
estático** no GitHub Pages (`main`, pasta `/docs`), domínio
`praianabylana.com.br`. Repo: `github.com/Hayoatha/08-PRAIANA`. Pasta local:
`...\04 - VISUAL STUDIO\02 - PROJETO SITES\08 - PRAIANA`. (Até 2026-11 era
Express + painel admin no Render; essa versão está no histórico do Git.)

**Stack:** Node >=20, EJS (só no build), sem framework. `npm run build`
(`scripts/build.js`) lê `data/products.json` + `site.config.js`, renderiza
`views/{index,catalogo,404}.ejs` e escreve `docs/` (HTML, sitemap.xml,
robots.txt, CNAME, .nojekyll) copiando `public/` (css, js, img, uploads).
`npm run preview` serve `docs/` em localhost:8080 imitando o GitHub Pages.

**Arquivos-chave:** `site.config.js` (nome, WhatsApp, Instagram, endereço,
slides, categorias, DOMINIO), `data/products.json` (catálogo),
`views/` (templates), `public/` (assets + `uploads/` com fotos dos produtos),
`scripts/build.js`, `docs/` (saída gerada, não editar à mão).

**Produto:** `{id, nome, descricao, preco, precoPromocional, tamanhos[],
categoria, imagens[] ("/uploads/x.jpg"), destaque, ativo, createdAt}`.
Categorias: Biquíni, Maiô, Saída de Praia, Acessórios.

**Páginas:** `/` (home), `/catalogo` (= `catalogo.html`), `404.html`,
`/sitemap.xml`, `/robots.txt`. `/catalogo?categoria=X` é filtrado no navegador
por `public/js/main.js` (cards têm `data-categoria`).

**Atualizar catálogo:** foto em `public/uploads/` + editar
`data/products.json` + `npm run build` + commit/push (Pages publica sozinho).

**Cuidados:** repo público, então nunca versionar senhas/chaves/.env. Sem
login, sem backend, sem cookies. Tamanho das fotos: JPG até ~1600 px, sem GPS.

**Docs completos:** `README.md` e `ARQUITETURA.md` na raiz.
