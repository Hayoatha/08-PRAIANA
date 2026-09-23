# Praiana by Lana — Site

Site de catálogo para a loja de biquínis **Praiana by Lana**, com uma área
administrativa protegida por senha onde a proprietária cadastra fotos,
descrições e preços das peças, que aparecem automaticamente para os clientes.

## Como rodar

```bash
npm install
cp .env.example .env      # depois ajuste os valores
npm run setup-admin       # define a senha do painel (digitada de forma oculta)
npm start
```

O site abre em `http://localhost:3000`.

## Acesso da loja (admin)

- URL: `http://localhost:3000/admin/login`
- Usuário: definido em `ADMIN_USER` no arquivo `.env` (padrão: `lana`)
- Senha: a que você definiu em `npm run setup-admin` (mínimo 12 caracteres).

Para trocar a senha a qualquer momento, rode `npm run setup-admin` de novo.
Só o hash (bcrypt) fica salvo no `.env`; a senha nunca é gravada.

## Segurança

- O `.env` (hash da senha e segredo de sessão) **nunca** deve ir para o GitHub —
  já está no `.gitignore`.
- Fotos enviadas são validadas pelo conteúdo real, redimensionadas e regravadas
  como JPEG, o que remove metadados como GPS/EXIF.
- Em produção use HTTPS, defina `NODE_ENV=production` e, se estiver atrás de um
  proxy da hospedagem, `TRUST_PROXY=1`.
- `data/products.json` e `public/uploads/` (dados e fotos da loja) ficam fora do
  Git; faça backup deles separadamente.

## Configurar WhatsApp e Instagram

Edite o `.env` (crie a partir de `.env.example` se ainda não existir):

```
WHATSAPP_NUMERO=559296051474              # DDI + DDD + número, só números
WHATSAPP_CATALOGO_URL=https://wa.me/c/559296051474
INSTAGRAM_USUARIO=praianabylana
```

- `WHATSAPP_NUMERO` é usado pelos botões "Fale Conosco" e "Quero essa", que
  abrem uma conversa no WhatsApp já com a mensagem preenchida.
- `WHATSAPP_CATALOGO_URL` é o link do catálogo da loja no WhatsApp Business
  (aparece no menu, na home, no catálogo e no rodapé como "Catálogo no WhatsApp").

## Slide de fotos com frases de marketing

A home e o topo do catálogo mostram um slide com 5 imagens que trocam
automaticamente, com uma frase por cima de cada uma. Isso é controlado em
[server.js](server.js), na lista `app.locals.slidesVitrine`.

Por enquanto as imagens são ilustrações genéricas em
`public/img/slides/slide-1.svg` até `slide-5.svg` (geradas por
`scripts/gen-slides.js`). **Quando a proprietária enviar as fotos da modelo:**

1. Salve as fotos como `public/img/slides/slide-1.jpg` (ou `.png`) até `slide-5`.
2. Em `server.js`, atualize o campo `imagem` de cada item de `slidesVitrine`
   para apontar para o novo arquivo (ex: `/img/slides/slide-1.jpg`).
3. Ajuste as frases de marketing no mesmo lugar, se quiser.

Não é necessário mexer nas telas (`views/`) nem no CSS — só nesses arquivos.

## Cadastrando produtos

1. Acesse `/admin/login` e entre com usuário e senha.
2. Clique em **+ Novo produto**.
3. Preencha nome, categoria, descrição, preço (e preço promocional, se houver),
   tamanhos disponíveis e envie as fotos.
4. Marque **Destaque** para a peça aparecer na página inicial, e **Visível**
   para que ela apareça no catálogo público (desmarque para ocultar sem excluir).

## Estrutura do projeto

```
server.js              → servidor Express e todas as rotas
middleware/auth.js      → proteção das rotas do admin
middleware/upload.js    → upload de imagens (multer)
utils/store.js          → leitura/escrita dos produtos (data/products.json)
data/products.json      → "banco de dados" simples dos produtos
views/                  → páginas (EJS): site público e admin
public/                 → CSS, JS, logos e fotos enviadas (uploads/)
scripts/setup-admin.js  → gera a senha do admin com segurança (bcrypt)
```

## Publicando o site (hospedagem)

Este é um site com backend Node.js (não é só HTML estático), então precisa
de uma hospedagem que rode Node — por exemplo Render, Railway ou um VPS.
Ao publicar:

1. Configure as variáveis de ambiente do `.env` no painel do serviço escolhido
   (nunca envie o arquivo `.env` para repositórios públicos).
2. Rode `npm install` e `npm start` no servidor.

### Persistência dos dados (catálogo e fotos)

Por padrão, os produtos ficam em `data/products.json` e as fotos em
`public/uploads/` — dentro da própria pasta do projeto. Isso é ótimo para
desenvolvimento, mas a maioria das hospedagens (inclusive o Render) apaga
esses arquivos a cada novo deploy, porque recriam a pasta do zero.

Para evitar isso, configure a variável `DATA_DIR` apontando para um disco
persistente (uma pasta que sobrevive aos deploys). Quando `DATA_DIR` está
definida, o site passa a gravar tudo lá dentro automaticamente:

- `$DATA_DIR/products.json`
- `$DATA_DIR/uploads/`

No **Render**, isso já está configurado em [render.yaml](render.yaml): o
disco é montado em `/var/data` e `DATA_DIR=/var/data` é definida sozinha no
deploy. Só funciona em planos pagos (o plano free não suporta disco).

Sem `DATA_DIR`, o site funciona normalmente, só que os dados não sobrevivem
a um novo deploy — útil apenas para testes rápidos.
