// Dados fixos do site (antes ficavam em server.js e em variáveis de ambiente).
// Tudo aqui é público; não coloque senhas nem chaves neste arquivo.

const ENDERECO_LOJA = "Tv. São Geraldo, 48B - São Geraldo, Manaus - AM, 69053-310";

// Endereço definitivo do site, sem barra no final. Deve ser igual ao
// conteúdo de docs/CNAME (gerado a partir daqui no build).
const DOMINIO = "praianabylana.com.br";
const SITE_URL = `https://${DOMINIO}`;

const site = {
  nome: "Praiana by Lana",
  url: SITE_URL,
  whatsapp: "559296051474",
  whatsappCatalogo: "https://wa.me/c/559296051474",
  instagram: "praianabylana",
  endereco: ENDERECO_LOJA,
  mapaUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ENDERECO_LOJA)}`,
};

const CATEGORIAS = ["Biquíni", "Maiô", "Saída de Praia", "Acessórios"];

// Slides da home e do topo do catálogo (fotos em public/img/slides/).
const slidesVitrine = [
  { imagem: "/img/slides/slide-1.jpg", frase: "Feito para valorizar cada curva" },
  { imagem: "/img/slides/slide-2.jpg", frase: "Conforto e caimento perfeito em cada peça" },
  { imagem: "/img/slides/slide-3.jpg", frase: "Proteção UV50 com muito estilo" },
  { imagem: "/img/slides/slide-4.jpg", frase: "Coleção nova toda semana" },
  { imagem: "/img/slides/slide-5.jpg", frase: "Feito à mão, com amor, para você" },
];

// Blocos "Explore por categoria" da home.
const categoriasVitrine = [
  { nome: "Biquíni", frase: "Modelagens que valorizam cada curva" },
  { nome: "Maiô", frase: "Conforto e elegância para o dia inteiro" },
  { nome: "Saída de Praia", frase: "Looks leves para completar o visual" },
  { nome: "Acessórios", frase: "Detalhes que fazem toda diferença" },
];

// Diferenciais da seção "Por que a Praiana".
const valoresMarca = [
  "Proteção solar UV50 em todas as peças",
  "Modelagem exclusiva, pensada para valorizar você",
  "Produção cuidadosa, sem grandes lotes",
  "Atendimento direto com a proprietária pelo WhatsApp",
];

module.exports = { DOMINIO, SITE_URL, site, CATEGORIAS, slidesVitrine, categoriasVitrine, valoresMarca };
