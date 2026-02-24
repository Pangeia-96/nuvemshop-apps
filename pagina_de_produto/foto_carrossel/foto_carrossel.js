(async function () {
  "use strict";

  if (window.__P96GaleriaLayoutLoaded) return;
  window.__P96GaleriaLayoutLoaded = true;

  if (!window.location.pathname.startsWith("/produtos/")) return;

  /* ───── boot ───── */

  function start() {
    injectStyle();
    waitForSwiper(function (swiperEl) {
      reorganizeLayout();
      fixMainSwiper(swiperEl);
      fixThumbSwiper();
      fixThumbSizes();
      markVideoThumb();
      setupActiveThumbHighlight(swiperEl);
    });
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(start, 300);
  } else {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(start, 300); });
  }

  /* ───── Esperar o swiper existir ───── */

  function waitForSwiper(callback) {
    var attempts = 0;
    var maxAttempts = 50;
    var interval = setInterval(function () {
      attempts++;
      var el = document.querySelector(".js-swiper-product");
      if (el && el.swiper) {
        clearInterval(interval);
        callback(el);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        if (el) callback(el);
      }
    }, 200);
  }

  /* ───── Reorganizar layout ───── */

  function reorganizeLayout() {
    var galleryRow = document.querySelector('[data-store^="product-image-"] .row[data-store^="product-image-"]');
    if (!galleryRow || galleryRow.classList.contains("p96-gallery-ready")) return;
    galleryRow.classList.add("p96-gallery-ready");

    var thumbsCol = galleryRow.querySelector(".d-none.d-md-block.col-md-auto") ||
      galleryRow.querySelector('[class*="col-md-auto"]');
    var sliderCol = galleryRow.querySelector(".col-md");
    if (!thumbsCol || !sliderCol) return;

    // Slider em cima, thumbs embaixo
    galleryRow.insertBefore(sliderCol, thumbsCol);

    sliderCol.className = "col-12 p96-main-slider-col";
    thumbsCol.className = "col-12 d-block p96-thumbs-col";

    // IMPORTANTE: remover d-none de TODOS os elementos dentro da coluna de thumbs
    thumbsCol.querySelectorAll(".d-none").forEach(function (el) {
      el.classList.remove("d-none");
      if (!el.classList.contains("d-block")) {
        el.classList.add("d-block");
      }
    });

    // Esconder setas verticais das thumbs
    thumbsCol.querySelectorAll(".product-thumbs-prev, .product-thumbs-next").forEach(function (el) {
      el.style.cssText = "display:none!important";
    });
  }

  /* ───── FIX PRINCIPAL: slidesPerView 1.2 → 1 + Loop Fix ───── */

  function fixMainSwiper(swiperEl) {
    if (!swiperEl || !swiperEl.swiper) return;

    var swiper = swiperEl.swiper;

    function patchParams(params) {
      if (!params) return;
      // Forçar 1 slide por vez e desativar loop para "travar" nas bordas
      params.slidesPerView = 1;
      params.spaceBetween = 20; // Espaço para separar as imagens
      params.centeredSlides = false;
      params.loop = false;     // Desativa o loop infinito
      params.resistance = true; // Ativa resistência nas bordas
      params.resistanceRatio = 0.85;

      if (params.breakpoints) {
        Object.keys(params.breakpoints).forEach(function (bp) {
          params.breakpoints[bp].slidesPerView = 1;
          params.breakpoints[bp].spaceBetween = 20;
          params.breakpoints[bp].loop = false;
        });
      }
    }

    function applyFix() {
      patchParams(swiper.params);
      patchParams(swiper.originalParams);
      if (swiper.passedParams) patchParams(swiper.passedParams);

      // Se tiver slides duplicados de um loop anterior, tentar esconder ou remover seria ideal,
      // mas apenas desativar o loop deve fazer o swiper ignorá-los na navegação normal.
      swiper.update();
      swiper.slideTo(0, 0); // Ir para o primeiro slide

      // Forçar width 100% nos slides novamente após update
      var slides = swiperEl.querySelectorAll('.swiper-slide');
      slides.forEach(function (s) {
        s.style.width = '100%';
        // Esconder slides duplicados se houver
        if (s.classList.contains('swiper-slide-duplicate')) {
          s.style.display = 'none';
        }
      });
    }

    applyFix();
    setTimeout(applyFix, 100);
    setTimeout(applyFix, 500);

    swiper.on("resize", function () {
      if (swiper.params.slidesPerView !== 1) {
        patchParams(swiper.params);
        swiper.update();
      }
    });

    // Garantir que não volte a ser loop
    swiper.on("beforeInit", function () {
      patchParams(swiper.params);
    });
  }

  /* ───── Fix thumbs para horizontal ───── */

  function fixThumbSwiper() {
    var thumbEl = document.querySelector(".js-swiper-product-thumbs");
    if (!thumbEl) return;

    // Destruir o Swiper das thumbs para evitar conflito de translate3d
    // O scroll horizontal será feito por CSS nativo (overflow-x: auto)
    if (thumbEl.swiper) {
      try {
        thumbEl.swiper.destroy(true, true);
      } catch (e) { }
    }

    // Resetar qualquer transform residual no wrapper
    var wrapper = thumbEl.querySelector(".swiper-wrapper");
    if (wrapper) {
      wrapper.style.transform = "none";
      wrapper.style.transition = "none";
    }
  }

  /* ───── Forçar tamanho e layout das thumbs (Com ajustes do usuário) ───── */

  function fixThumbSizes() {
    var container = document.querySelector(".p96-thumbs-col .product-thumbs-container");
    if (container) {
      container.style.cssText = "width:100%!important;height:auto!important;max-height:none!important;overflow:visible!important;";
    }

    var swiperEl = document.querySelector(".p96-thumbs-col .js-swiper-product-thumbs");
    if (swiperEl) {
      swiperEl.style.overflowX = "auto";
      swiperEl.style.overflowY = "hidden";
      swiperEl.style.maxHeight = "none";
      swiperEl.style.height = "auto";
      swiperEl.style.width = "100%";
    }

    var wrapper = document.querySelector(".p96-thumbs-col .js-swiper-product-thumbs .swiper-wrapper");
    if (wrapper) {
      wrapper.style.display = "flex";
      wrapper.style.flexDirection = "row";
      wrapper.style.flexWrap = "nowrap";
      wrapper.style.gap = "10px";
      wrapper.style.padding = "8px 0";
      wrapper.style.transform = "none";
      wrapper.style.transition = "none";
    }

    var thumbSlides = document.querySelectorAll(".p96-thumbs-col .js-swiper-product-thumbs .swiper-slide");
    thumbSlides.forEach(function (slide) {
      slide.style.cssText = "width:auto!important;height:auto!important;flex-shrink:0!important;margin:0!important;";
    });

    var thumbs = document.querySelectorAll(".p96-thumbs-col .js-product-thumb");
    // TAMANHOS DEFINIDOS PELO USUÁRIO
    var THUMB_WIDTH = 60;
    var THUMB_HEIGHT = 80;

    thumbs.forEach(function (thumb) {
      thumb.style.cssText =
        "width:" + THUMB_WIDTH + "px!important;" +
        "height:" + THUMB_HEIGHT + "px!important;" +
        "display:flex!important;" +
        "align-items:center!important;" +
        "justify-content:center!important;" +
        "padding-bottom:0!important;" +
        "position:relative!important;" +
        "border-radius:10px!important;" +
        "overflow:hidden!important;" +
        "border:2px solid rgba(0,0,0,0.1)!important;" +
        "flex-shrink:0!important;" +
        "background:#f5f5f5;" +
        "cursor:pointer;" +
        "transition:border-color 0.2s ease, box-shadow 0.2s ease!important;";

      var img = thumb.querySelector("img");
      if (img) {
        img.style.cssText =
          "position:relative!important;" +
          "width:100%!important;" +
          "height:100%!important;" +
          "object-fit:cover!important;" +
          "object-position:center center!important;" +
          "display:block!important;";
      }
    });
  }

  /* ───── Marcar thumb de vídeo ───── */

  function markVideoThumb() {
    var slides = document.querySelectorAll(".js-swiper-product .swiper-slide");
    var thumbs = document.querySelectorAll(".js-product-thumb");

    slides.forEach(function (slide, i) {
      var hasVideo =
        slide.querySelector("video, iframe, .video-container, [data-video]") ||
        slide.querySelector('[data-component="product-video"]') ||
        slide.querySelector(".product-video") ||
        (slide.getAttribute("data-video") !== null);

      if (hasVideo && thumbs[i]) {
        addVideoOverlay(thumbs[i]);
      }
    });

    // Fallback: último slide com link de vídeo
    if (thumbs.length > 0) {
      var lastThumb = thumbs[thumbs.length - 1];
      // Ignorar slides duplicados se houver
      var realSlides = Array.from(slides).filter(s => !s.classList.contains('swiper-slide-duplicate'));
      var lastSlide = realSlides[realSlides.length - 1];

      if (lastSlide && lastThumb && !lastThumb.classList.contains("p96-thumb-video")) {
        var link = lastSlide.querySelector("a[href*='youtube'], a[href*='vimeo'], a[data-video]");
        if (link) {
          addVideoOverlay(lastThumb);
        }
      }
    }
  }

  function addVideoOverlay(thumb) {
    if (thumb.classList.contains("p96-thumb-video")) return;
    thumb.classList.add("p96-thumb-video");

    var overlay = document.createElement("div");
    overlay.className = "p96-thumb-play-overlay";
    overlay.innerHTML = '<svg viewBox="0 0 24 24" class="p96-play-icon"><polygon points="8,5 19,12 8,19" fill="white"/></svg>';
    thumb.appendChild(overlay);
  }

  /* ───── Highlight ativo na thumb ───── */

  function setupActiveThumbHighlight(swiperEl) {
    var thumbs = document.querySelectorAll(".js-product-thumb");
    if (thumbs.length === 0) return;

    function highlightThumb(index) {
      thumbs.forEach(function (t) {
        t.classList.remove("p96-thumb-active");
        t.style.borderColor = "rgba(0,0,0,0.1)";
        t.style.boxShadow = "none";
      });

      var targetIndex = parseInt(index);
      var target = document.querySelector('.js-product-thumb[data-thumb-loop="' + targetIndex + '"]');
      if (!target && thumbs[targetIndex]) target = thumbs[targetIndex];

      if (target) {
        target.classList.add("p96-thumb-active");
        target.style.borderColor = "#ef9837";
        target.style.boxShadow = "0 0 0 1px #ef9837";

        // Garantir que o wrapper não tem transform residual do Swiper
        var wrapper = document.querySelector(".p96-thumbs-col .js-swiper-product-thumbs .swiper-wrapper");
        if (wrapper) {
          wrapper.style.transform = "none";
        }

        // Scroll suave até a thumb ativa usando getBoundingClientRect
        // (porque cada thumb está dentro de um .swiper-slide, offsetLeft retorna 0)
        var scrollContainer = document.querySelector(".p96-thumbs-col .js-swiper-product-thumbs");
        if (scrollContainer) {
          var containerRect = scrollContainer.getBoundingClientRect();
          var thumbRect = target.getBoundingClientRect();
          var thumbCenter = thumbRect.left + thumbRect.width / 2;
          var containerCenter = containerRect.left + containerRect.width / 2;
          var scrollOffset = thumbCenter - containerCenter;
          scrollContainer.scrollBy({ left: scrollOffset, behavior: "smooth" });
        }
      }
    }

    setTimeout(function () {
      if (swiperEl && swiperEl.swiper) {
        highlightThumb(swiperEl.swiper.activeIndex);
      } else {
        highlightThumb(0);
      }
    }, 500);

    thumbs.forEach(function (thumb, i) {
      thumb.addEventListener("click", function () {
        var idx = thumb.getAttribute("data-thumb-loop") ? parseInt(thumb.getAttribute("data-thumb-loop")) : i;
        highlightThumb(idx);
        if (swiperEl && swiperEl.swiper) {
          swiperEl.swiper.slideTo(idx, 300);
        }
      });
    });

    if (swiperEl && swiperEl.swiper) {
      swiperEl.swiper.on("slideChange", function () {
        highlightThumb(swiperEl.swiper.activeIndex);
      });
      swiperEl.swiper.on("transitionEnd", function () {
        highlightThumb(swiperEl.swiper.activeIndex);
      });
    }
  }

  /* ───── CSS ───── */

  function injectStyle() {
    if (document.getElementById("p96-gallery-style")) return;

    var css = [
      /* ── Layout ── */
      ".p96-gallery-ready {",
      "  display: flex !important;",
      "  flex-direction: column !important;",
      "  flex-wrap: nowrap !important;",
      "  align-items: center !important;",
      "  background: #ffffff !important;",
      "  padding: 12px 0 8px 0 !important;",
      "}",

      /* ── Main Slider ── */
      ".p96-main-slider-col {",
      "  flex: 0 0 auto !important;",
      "  max-width: 88% !important;",
      "  width: 88% !important;",
      "  padding: 0 !important;",
      "  margin: 0 auto 12px auto !important;",
      "}",

      ".p96-main-slider-col .product-detail-slider {",
      "  border-radius: 16px !important;",
      "  overflow: hidden !important;",
      "  width: 100% !important;",
      "  box-shadow: 0 1px 8px rgba(0,0,0,0.06);",
      "}",

      ".p96-main-slider-col .product-detail-slider .swiper-slide {",
      "  width: 100% !important;",
      "  min-width: 100% !important;",
      "  flex-shrink: 0 !important;",
      "}",

      /* Ocultar duplicates se existirem */
      ".p96-main-slider-col .product-detail-slider .swiper-slide-duplicate { display: none !important; }",

      ".p96-main-slider-col .product-slide a.js-product-slide-link { display: block !important; width: 100% !important; }",

      ".p96-main-slider-col .swiper-button-prev, .p96-main-slider-col .swiper-button-next { display: none !important; }",
      ".p96-main-slider-col .js-swiper-product-pagination { display: none !important; }",

      /* ── Thumbs Col ── */
      ".p96-thumbs-col {",
      "  flex: 0 0 auto !important;",
      "  max-width: 88% !important;",
      "  width: 88% !important;",
      "  padding: 0 !important;",
      "  margin: 0 auto !important;",
      "  display: block !important;",
      "}",

      ".p96-thumbs-col .js-swiper-product-thumbs {",
      "  overflow-x: auto !important;",
      "  overflow-y: hidden !important;",
      "  scrollbar-width: none;",
      "  -webkit-overflow-scrolling: touch;",
      "  width: 100% !important;",
      "}",
      ".p96-thumbs-col .js-swiper-product-thumbs::-webkit-scrollbar { display: none; }",

      ".p96-thumbs-col .js-swiper-product-thumbs .swiper-wrapper {",
      "  justify-content: flex-start !important;",
      "  transform: none !important;",
      "}",

      /* Ocultar duplicates nas thumbs */
      ".p96-thumbs-col .swiper-slide-duplicate { display: none !important; }",

      ".p96-thumbs-col .product-thumbs-prev, .p96-thumbs-col .product-thumbs-next { display: none !important; }",

      /* ── Video Overlay ── */
      ".p96-thumb-play-overlay {",
      "  position: absolute;",
      "  top: 0; left: 0; right: 0; bottom: 0;",
      "  background: rgba(0,0,0,0.3);",
      "  display: flex;",
      "  align-items: center;",
      "  justify-content: center;",
      "  border-radius: 8px;",
      "  z-index: 2;",
      "  pointer-events: none;",
      "}",
      ".p96-play-icon { width: 24px; height: 24px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5)); }",

      /* ── Desktop ── */
      "@media (min-width: 768px) {",
      "  .p96-main-slider-col, .p96-thumbs-col {",
      "    max-width: 70% !important;",
      "    width: 70% !important;",
      "  }",
      "  .p96-thumbs-col .js-swiper-product-thumbs .swiper-wrapper {",
      "    justify-content: center !important;",
      "  }",
      "}"
    ].join("\n");

    var style = document.createElement("style");
    style.id = "p96-gallery-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

})();
