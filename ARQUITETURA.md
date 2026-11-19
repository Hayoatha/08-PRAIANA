# Arquitetura — Praiana by Lana (versão estática)

Resumo para colar como contexto em um chat novo: [CONTEXTO.md](CONTEXTO.md).

## Visão geral

Site estático gerado por um script Node a partir de templates EJS. Hospedagem
no GitHub Pages (branch `main`, pasta `/docs`), domínio próprio
`praianabylana.com.br`. Sem backend, sem banco, sem login, sem cookies.

Histórico: até 2026-11 o site rodava em Express + EJS no Render, com painel
admin e disco persistente (`products.json` + `uploads/`). Foi convertido porque
a proprietária não usa o painel e o custo de hospedagem não se justificava.
O código antigo continua no histórico do Git (commits até `89f09e6`).

## Fluxo de build

`npm run build` (`scripts/build.js`):

1. Lê `data/products.json` (só `ativo`, do mais novo ao mais antigo).
2. Limpa `docs/` e copia `public/` para dentro (exceto logos-fonte não usadas).
3. Renderiza `views/index.ejs`, `views/catalogo.ejs` e `views/404.ejs` com os
   dados de `site.config.js` para `docs/index.html`, `docs/catalogo.html` e
   `docs/404.html`.
4. Gera `docs/sitemap.xml`, `docs/robots.txt`, `docs/CNAME` e `docs/.nojekyll`.

## Decisões

- **Mesmo HTML de antes:** as views EJS são as mesmas do servidor antigo. Um
  diff do HTML gerado contra o site no ar mostrou só 3 diferenças: o link
  "área da loja" saiu do rodapé, os cards ganharam `data-categoria` e há um
  aviso oculto de "filtro sem resultado".
- **Filtro de categoria no navegador:** o GitHub Pages não executa código, então
  `/catalogo?categoria=X` serve a mesma página e `public/js/main.js` esconde os
  cards de outras categorias. Os links antigos (e o sitemap) seguem válidos.
- **`/catalogo` sem extensão:** depende de o GitHub Pages servir
  `catalogo.html` nessa URL (comportamento padrão dele).
- **Fotos de produto em `public/uploads/`:** mesmo caminho público
  (`/uploads/<arquivo>.jpg`) que o site antigo usava, então URLs de imagem já
  indexadas não quebram.
- **JS do navegador (`public/js/main.js`):** menu mobile, slideshow, zoom (lightbox)
  e o filtro de categoria. Nada de rede.

## Pontos de atenção

- `docs/` é gerado: edite `views/`, `public/`, `data/` ou `site.config.js` e rode
  o build; não edite `docs/` à mão.
- Repositório público: nada sensível pode entrar (sem `.env`, senhas, chaves).
- Mudar o domínio exige alterar `DOMINIO` em `site.config.js`, rebuild e os
  registros DNS.
- Scripts de imagem (`scripts/import-slides.js`, `trim-logos.js`,
  `chroma-key-logo.js`, `gen-slides.js`) são utilitários locais que usam `sharp`;
  não fazem parte do build.
