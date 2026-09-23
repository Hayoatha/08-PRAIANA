document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("mainNav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
  }

  document.querySelectorAll("form[data-confirm]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      if (!confirm(form.dataset.confirm)) e.preventDefault();
    });
  });

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
