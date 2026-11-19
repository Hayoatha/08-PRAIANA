document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("mainNav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
  }

  // Catálogo: filtra por /catalogo?categoria=X no navegador (o site é estático).
  const chips = document.querySelectorAll(".faixa-categorias a");
  const cartoes = document.querySelectorAll(".card-produto[data-categoria]");
  if (chips.length && cartoes.length) {
    const escolhida = new URLSearchParams(location.search).get("categoria") || "";
    let visiveis = 0;
    cartoes.forEach((cartao) => {
      const mostrar = !escolhida || cartao.dataset.categoria === escolhida;
      cartao.style.display = mostrar ? "" : "none";
      if (mostrar) visiveis++;
    });
    chips.forEach((chip) => {
      const categoriaDoChip = new URL(chip.href).searchParams.get("categoria") || "";
      chip.classList.toggle("active", categoriaDoChip === escolhida);
    });
    const vazio = document.getElementById("vazioFiltro");
    if (vazio) vazio.hidden = visiveis > 0;
  }

  document.querySelectorAll("[data-slideshow]").forEach((container) => {
    const slides = Array.from(container.querySelectorAll(".slide"));
    const dots = Array.from(container.querySelectorAll(".dot"));
    if (slides.length < 2) return;

    let atual = 0;
    let timer = null;

    function mostrar(indice) {
      slides[atual].classList.remove("ativo");
      dots[atual] && dots[atual].classList.remove("ativo");
      atual = (indice + slides.length) % slides.length;
      slides[atual].classList.add("ativo");
      dots[atual] && dots[atual].classList.add("ativo");
    }

    function iniciarAuto() {
      timer = setInterval(() => mostrar(atual + 1), 4500);
    }

    function reiniciarAuto() {
      clearInterval(timer);
      iniciarAuto();
    }

    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        mostrar(i);
        reiniciarAuto();
      });
    });

    container.addEventListener("mouseenter", () => clearInterval(timer));
    container.addEventListener("mouseleave", reiniciarAuto);

    iniciarAuto();
  });

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxFechar = document.getElementById("lightboxFechar");

  if (lightbox && lightboxImg) {
    function abrirLightbox(img) {
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt || "";
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
    }

    function fecharLightbox() {
      lightbox.hidden = true;
      lightboxImg.src = "";
      document.body.style.overflow = "";
    }

    document.querySelectorAll("img.foto-zoom").forEach((img) => {
      img.addEventListener("click", () => abrirLightbox(img));
      img.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrirLightbox(img);
        }
      });
    });

    lightbox.addEventListener("click", fecharLightbox);
    lightboxFechar.addEventListener("click", (e) => {
      e.stopPropagation();
      fecharLightbox();
    });
    lightboxImg.addEventListener("click", (e) => e.stopPropagation());

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !lightbox.hidden) fecharLightbox();
    });
  }
});
