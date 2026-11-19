# Praiana by Lana — site estático

Catálogo da loja de biquínis **Praiana by Lana**, publicado como site 100%
estático no **GitHub Pages**, em https://praianabylana.com.br. Não há
servidor, banco de dados nem login: as páginas são geradas a partir dos
templates EJS e de `data/products.json`.

## Como o site é gerado

```
site.config.js        → dados fixos (nome, WhatsApp, Instagram, endereço, slides, categorias)
data/products.json    → catálogo de produtos (editado à mão)
views/                → templates EJS (home, catálogo, 404, partials)
public/               → CSS, JS, logos, slides e fotos dos produtos (uploads/)
scripts/build.js      → gera a pasta docs/ a partir de tudo acima
docs/                 → SAÍDA publicada pelo GitHub Pages (não edite à mão)
```

## Comandos

```bash
npm install        # uma vez
npm run build      # gera/atualiza docs/
npm run preview    # abre docs/ em http://localhost:8080 (imita o GitHub Pages)
```

## Atualizar produtos

1. Salve a foto do produto em `public/uploads/` (JPG, de preferência até ~1600 px
   no maior lado e sem dados de localização).
2. Edite `data/products.json` (um bloco por produto):

   ```json
   {
     "id": "identificador-unico",
     "nome": "NOME DA PEÇA",
     "descricao": "texto curto",
     "preco": 99,
     "precoPromocional": null,
     "tamanhos": ["P", "M", "G"],
     "categoria": "Biquíni",
     "imagens": ["/uploads/nome-da-foto.jpg"],
     "destaque": false,
     "ativo": true,
     "createdAt": 1790000000000
   }
   ```

   - `categoria`: Biquíni, Maiô, Saída de Praia ou Acessórios.
   - `destaque`: `true` mostra na home (até 6). `ativo`: `false` oculta sem apagar.
   - `createdAt`: maior número = aparece primeiro (use `Date.now()`).
3. `npm run build`, depois `git add -A`, `git commit` e `git push`.
   O GitHub Pages publica sozinho em alguns minutos.

## Publicação (GitHub Pages)

- Settings → Pages → *Deploy from a branch* → branch `main`, pasta `/docs`.
- O domínio é definido em `docs/CNAME` (gerado a partir de `DOMINIO` em
  `site.config.js`). O repositório precisa ser público (Pages em repositório
  privado exige plano pago).
- **Nunca** coloque senhas, chaves ou tokens neste repositório: ele é público.

## Catálogo por categoria

Os links `/catalogo?categoria=Maiô` continuam funcionando: a página contém
todos os produtos e o `public/js/main.js` filtra no navegador.
