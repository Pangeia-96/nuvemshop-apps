(function () {
    "use strict";

    if (window.__P96DescricaoAccordionLoaded) return;
    window.__P96DescricaoAccordionLoaded = true;

    if (!window.location.pathname.startsWith("/produtos/")) return;

    // ============================
    // CONFIGURAÇÃO DE ÍCONES SVG
    // ============================
    const ICONS = {
        especificacoes: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
        cuidados: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
        provador: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46L16 2 12 5.5 8 2l-4.38 1.46a2 2 0 0 0-1.34 1.88v14.2A2 2 0 0 0 4 21.5a2 2 0 0 0 .93-.24L8 19.5l4 2 4-2 3.07 1.76A2 2 0 0 0 20 21.5a2 2 0 0 0 1.72-1.96V5.34a2 2 0 0 0-1.34-1.88z"></path></svg>`,
        descricao: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h7"></path></svg>`,
        chevron: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`
    };

    // ============================
    // PARSER DA DESCRIÇÃO PADRÃO PANGEIA96
    // ============================
    function parseDescricao(texto) {
        const resultado = {
            sobreProduto: "",
            provadorVirtual: "",
            informacoesTecnicas: "",
            cuidados: ""
        };

        if (!texto) return resultado;

        // Normalizar quebras de linha
        let raw = texto
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/p>/gi, "\n")
            .replace(/<[^>]+>/g, "")
            .replace(/&nbsp;/g, " ")
            .trim();

        // Palavras-chave que separam as seções
        const secoes = [
            { key: "provadorVirtual", regex: /Provador Virtual e suporte:/i },
            { key: "informacoesTecnicas", regex: /Informa[çc][õo]es t[eé]cnicas:/i },
            { key: "cuidados", regex: /Cuidados:/i }
        ];

        // Encontrar posições das seções
        const posicoes = [];
        for (const secao of secoes) {
            const match = raw.match(secao.regex);
            if (match) {
                posicoes.push({
                    key: secao.key,
                    index: match.index,
                    headerLength: match[0].length
                });
            }
        }

        // Ordenar por posição no texto
        posicoes.sort((a, b) => a.index - b.index);

        // Extrair "sobre o produto" (tudo antes da primeira seção)
        if (posicoes.length > 0) {
            resultado.sobreProduto = raw.substring(0, posicoes[0].index).trim();
        } else {
            resultado.sobreProduto = raw;
            return resultado;
        }

        // Extrair cada seção
        for (let i = 0; i < posicoes.length; i++) {
            const inicio = posicoes[i].index + posicoes[i].headerLength;
            const fim = i + 1 < posicoes.length ? posicoes[i + 1].index : raw.length;
            resultado[posicoes[i].key] = raw.substring(inicio, fim).trim();
        }

        // Limpeza: Remover a palavra "Descrição" se estiver no início do texto sobre o produto
        if (resultado.sobreProduto) {
            resultado.sobreProduto = resultado.sobreProduto
                .replace(/^descri[çc][ãa]o:?\s*/i, "")
                .trim();
        }

        return resultado;
    }

    // ============================
    // FORMATAR CONTEÚDO EM HTML BONITO
    // ============================
    function formatContent(text) {
        if (!text) return "<p>—</p>";

        // Dividir por linhas e filtrar vazias
        const linhas = text.split("\n").map(l => l.trim()).filter(l => l);

        // Verificar se parece uma lista (linhas curtas, sem ponto final em todas)
        const pareceListaItems = linhas.filter(l =>
            l.startsWith("Lavar") ||
            l.startsWith("Não") ||
            l.startsWith("Secar") ||
            l.startsWith("Passar") ||
            l.startsWith("A modelo") ||
            l.startsWith("Composição") ||
            l.startsWith("Use ") ||
            l.startsWith("Se precisar")
        );

        // Se tem itens de lista, formatar como lista
        if (pareceListaItems.length > 1) {
            let html = '<ul class="p96-acc-list">';
            for (const linha of linhas) {
                html += `<li>${linha}</li>`;
            }
            html += "</ul>";
            return html;
        }

        // Senão, formatar como parágrafos
        return linhas.map(l => `<p>${l}</p>`).join("");
    }

    // ============================
    // CONSTRUIR O ACCORDION
    // ============================
    function buildAccordion(descData) {
        const secoes = [
            {
                id: "descricao",
                titulo: "Descrição do Produto",
                icon: ICONS.descricao,
                conteudo: descData.sobreProduto
            },
            {
                id: "especificacoes",
                titulo: "Especificações Técnicas",
                icon: ICONS.especificacoes,
                conteudo: descData.informacoesTecnicas
            },
            {
                id: "cuidados",
                titulo: "Cuidados com a Peça",
                icon: ICONS.cuidados,
                conteudo: descData.cuidados
            },
            {
                id: "provador",
                titulo: "Provador Virtual e Suporte",
                icon: ICONS.provador,
                conteudo: descData.provadorVirtual
            }
        ];

        let accordionHTML = "";

        for (const secao of secoes) {
            if (!secao.conteudo) continue;

            accordionHTML += `
        <div class="p96-acc-item" data-section="${secao.id}">
          <button class="p96-acc-header" aria-expanded="false">
            <div class="p96-acc-header-left">
              <span class="p96-acc-icon">${secao.icon}</span>
              <span class="p96-acc-title">${secao.titulo}</span>
            </div>
            <span class="p96-acc-chevron">${ICONS.chevron}</span>
          </button>
          <div class="p96-acc-body">
            <div class="p96-acc-body-inner">
              ${formatContent(secao.conteudo)}
            </div>
          </div>
        </div>
      `;
        }

        return accordionHTML;
    }

    // ============================
    // INICIALIZAÇÃO
    // ============================
    function init() {
        const descricaoBox =
            document.querySelector(".product-description") ||
            document.querySelector(".js-product-description") ||
            document.querySelector('[data-store="product-description"]');

        if (!descricaoBox) return;
        if (descricaoBox.classList.contains("p96-accordion-ready")) return;
        descricaoBox.classList.add("p96-accordion-ready");

        // Obter texto bruto
        const textoOriginal = descricaoBox.innerText || descricaoBox.textContent || "";

        // Parsear a descrição
        const descData = parseDescricao(textoOriginal);

        // Se não conseguiu parsear nada relevante, não fazer nada
        if (!descData.sobreProduto && !descData.cuidados && !descData.informacoesTecnicas) return;

        // Construir accordion (incluindo a descrição agora)
        const accordionHTML = buildAccordion(descData);

        // Montar a estrutura completa
        const container = document.createElement("div");
        container.className = "p96-sobre-produto";
        container.innerHTML = `
      <h2 class="p96-sobre-titulo">Sobre o Produto</h2>
      <div class="p96-accordion">${accordionHTML}</div>
    `;

        // Substituir o conteúdo original
        descricaoBox.innerHTML = "";
        descricaoBox.appendChild(container);

        // Remover classes do script antigo se existirem
        descricaoBox.classList.remove("p96-collapsed", "p96-open");
        const oldBtn = descricaoBox.parentNode?.querySelector(".p96-toggle-btn");
        if (oldBtn) oldBtn.remove();

        // Configurar eventos de accordion
        setupAccordionEvents(container);

        // Injetar estilos
        injectStyles();
    }

    // ============================
    // EVENTOS DO ACCORDION
    // ============================
    function setupAccordionEvents(container) {
        const headers = container.querySelectorAll(".p96-acc-header");

        headers.forEach(header => {
            header.addEventListener("click", function () {
                const item = this.closest(".p96-acc-item");
                const body = item.querySelector(".p96-acc-body");
                const isOpen = item.classList.contains("p96-acc-open");

                // Fechar todos os outros
                container.querySelectorAll(".p96-acc-item.p96-acc-open").forEach(openItem => {
                    if (openItem !== item) {
                        openItem.classList.remove("p96-acc-open");
                        openItem.querySelector(".p96-acc-header")?.setAttribute("aria-expanded", "false");
                        const openBody = openItem.querySelector(".p96-acc-body");
                        if (openBody) openBody.style.maxHeight = "0";
                    }
                });

                // Toggle o clicado
                if (isOpen) {
                    item.classList.remove("p96-acc-open");
                    this.setAttribute("aria-expanded", "false");
                    if (body) body.style.maxHeight = "0";
                } else {
                    item.classList.add("p96-acc-open");
                    this.setAttribute("aria-expanded", "true");
                    if (body) body.style.maxHeight = body.scrollHeight + "px";
                }
            });
        });
    }

    // ============================
    // ESTILOS CSS
    // ============================
    function injectStyles() {
        if (document.getElementById("p96-accordion-style")) return;

        // Carregar fonte Google Fonts via <link> (mais confiável que @import)
        if (!document.querySelector('link[href*="Cormorant+Garamond"]')) {
            const fontLink = document.createElement("link");
            fontLink.rel = "stylesheet";
            fontLink.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap";
            document.head.appendChild(fontLink);
        }

        const style = document.createElement("style");
        style.id = "p96-accordion-style";
        style.textContent = `
      /* ===== CONTAINER PRINCIPAL ===== */
      .p96-sobre-produto {
        font-family: 'Cormorant Garamond', 'Georgia', serif;
        max-width: 100%;
        margin: 0;
        padding: 0;
      }

      /* ===== TÍTULO "Sobre o Produto" ===== */
      .p96-sobre-titulo {
        font-family: 'Cormorant Garamond', 'Georgia', serif;
        font-size: 26px;
        font-weight: 500;
        font-style: italic;
        color: #2c2c2c;
        text-align: center;
        margin: 0 0 20px 0;
        padding-bottom: 14px;
        border-bottom: 1px solid #e0dcd4;
        letter-spacing: 0.5px;
      }

      /* ===== TEXTO SOBRE O PRODUTO ===== */
      .p96-sobre-texto {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.75;
        color: #555;
        margin-bottom: 24px;
        padding: 0 4px;
      }

      .p96-sobre-texto p {
        margin: 0 0 10px 0;
      }

      .p96-sobre-texto p:last-child {
        margin-bottom: 0;
      }

      /* ===== ACCORDION CONTAINER ===== */
      .p96-accordion {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      /* ===== ACCORDION ITEM ===== */
      .p96-acc-item {
        background: #faf9f7;
        border: 1px solid #ebe8e2;
        border-radius: 10px;
        overflow: hidden;
        transition: box-shadow 0.3s ease, border-color 0.3s ease;
      }

      .p96-acc-item:hover {
        border-color: #d4cfc5;
        box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
      }

      /* ===== ACCORDION HEADER (BOTÃO) ===== */
      .p96-acc-header {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 18px;
        background: none;
        border: none;
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: #333;
        text-align: left;
        transition: background-color 0.2s ease;
        -webkit-tap-highlight-color: transparent;
      }

      .p96-acc-header:hover {
        background-color: rgba(0, 0, 0, 0.015);
      }

      .p96-acc-header:focus {
        outline: none;
      }

      .p96-acc-header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      /* ===== ÍCONE DA SEÇÃO ===== */
      .p96-acc-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--button-background, #b8860b);
        flex-shrink: 0;
      }

      /* ===== CHEVRON ===== */
      .p96-acc-chevron {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
        transition: transform 0.3s ease;
        flex-shrink: 0;
      }

      .p96-acc-open .p96-acc-chevron {
        transform: rotate(180deg);
      }

      /* ===== ACCORDION BODY ===== */
      .p96-acc-body {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.35s ease;
      }

      .p96-acc-body-inner {
        padding: 0 18px 16px 52px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13.5px;
        line-height: 1.7;
        color: #666;
      }

      .p96-acc-body-inner p {
        margin: 0 0 8px 0;
      }

      .p96-acc-body-inner p:last-child {
        margin-bottom: 0;
      }

      /* ===== LISTA DENTRO DO ACCORDION ===== */
      .p96-acc-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .p96-acc-list li {
        position: relative;
        padding-left: 16px;
        margin-bottom: 6px;
        line-height: 1.6;
      }

      .p96-acc-list li::before {
        content: "•";
        position: absolute;
        left: 0;
        color: var(--button-background, #b8860b);
        font-weight: bold;
      }

      .p96-acc-list li:last-child {
        margin-bottom: 0;
      }

      /* ===== RESPONSIVO ===== */
      @media (max-width: 480px) {
        .p96-sobre-titulo {
          font-size: 22px;
          margin-bottom: 16px;
          padding-bottom: 12px;
        }

        .p96-sobre-texto {
          font-size: 13.5px;
          margin-bottom: 20px;
        }

        .p96-acc-header {
          padding: 14px 14px;
          font-size: 13.5px;
        }

        .p96-acc-body-inner {
          padding: 0 14px 14px 46px;
          font-size: 13px;
        }

        .p96-acc-icon svg {
          width: 20px;
          height: 20px;
        }
      }

      /* ===== ANIMAÇÃO DE ENTRADA ===== */
      .p96-sobre-produto {
        animation: p96FadeIn 0.5s ease-out;
      }

      @keyframes p96FadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
        document.head.appendChild(style);
    }

    // ============================
    // INICIAR
    // ============================
    // Inicialização ultra-rápida (sem setTimeout)
    function fastestInit() {
        if (document.querySelector(".product-description") ||
            document.querySelector(".js-product-description") ||
            document.querySelector('[data-store="product-description"]')) {
            init();
        } else if (document.readyState !== "complete") {
            requestAnimationFrame(fastestInit);
        }
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        init();
    } else {
        document.addEventListener("DOMContentLoaded", init);
        fastestInit(); // Tenta rodar antes do DOMContentLoaded se o elemento aparecer
    }
})();


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

    function fastestStart() {
        if (document.querySelector(".js-swiper-product")) {
            start();
        } else if (document.readyState !== "complete") {
            requestAnimationFrame(fastestStart);
        }
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        start();
    } else {
        document.addEventListener("DOMContentLoaded", start);
        fastestStart();
    }

    /* ───── Esperar o swiper existir ───── */

    function waitForSwiper(callback) {
        var attempts = 0;
        var maxAttempts = 100;
        var interval = setInterval(function () {
            attempts++;
            var el = document.querySelector(".js-swiper-product");
            // Checar se o swiper e o tema estão prontos
            if (el && el.swiper) {
                clearInterval(interval);
                callback(el);
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                if (el) callback(el);
            }
        }, 50); // Reduzido de 200ms para 50ms para maior fluidez
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


(async function () {
    "use strict";

    // ================================================
    // SCRIPT INTEGRADO: Nome + Preço + Tamanho + Compra
    // Combina: script_nome_preco_integrado.js
    //        + script_tamanho_e_compra.js
    // ================================================

    // Garantir que o script só rode na página de produto individual
    // Se for o modal de compra rápida (#modal-fullscreen-quickshop), nós abortamos
    // para deixar o tema original funcionar corretamente.
    const isProductPage = window.location.pathname.match(/^\/produtos\/[^\/]+\/?$/) && !window.location.search.includes('mpage');
    const hasQuickShop = !!document.querySelector('#modal-fullscreen-quickshop');

    if (!isProductPage || hasQuickShop) {
        return;
    }

    // ============================
    // INICIALIZAÇÃO
    // ============================
    function start() {
        console.log("P96: Executando start()");
        cleanupOldElements();
        injectStyles();
        initHeader();
        initPrice();
        modifyLayout();
    }

    function fastestStart() {
        if (document.querySelector(".js-product-form") || document.querySelector(".js-product-container")) {
            start();
        } else if (document.readyState !== "complete") {
            requestAnimationFrame(fastestStart);
        }
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        start();
    } else {
        document.addEventListener("DOMContentLoaded", start);
        fastestStart();
    }

    // ============================
    // UTILS
    // ============================
    function formatMoney(value) {
        return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    function getNumber(text) {
        return parseFloat(text.replace(/[^\d,]/g, "").replace(",", "."));
    }

    function getCategory() {
        const breadcrumb = document.querySelector(".breadcrumbs a:nth-child(2)");
        if (breadcrumb) return breadcrumb.textContent.trim();
        const catLink = document.querySelector('.breadcrumb-item:nth-child(2) a, .breadcrumb a:nth-child(2)');
        if (catLink) return catLink.textContent.trim();
        return "MODA FEMININA";
    }

    // ============================
    // CLEANUP: Remover elementos de versões anteriores dos scripts
    // ============================
    function cleanupOldElements() {
        // De script_tamanho_e_compra.js
        document.querySelectorAll('.p96-size-container').forEach(el => el.remove());
        document.querySelectorAll('.p96-static-size-title').forEach(el => el.remove());
        document.querySelectorAll('.p96-model-info').forEach(el => el.remove());
    }

    // ============================
    // CSS INJECTION (todos os estilos unificados)
    // ============================
    function injectStyles() {
        // Remover estilos antigos dos scripts individuais
        const oldIds = ["p96-integrated-style", "p96-size-buy-css"];
        oldIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });

        if (document.getElementById("p96-full-product-style")) return;

        const style = document.createElement("style");
        style.id = "p96-full-product-style";
        style.innerHTML = `
      /* ========================================
         SEÇÃO 1: NOME DO PRODUTO (Header)
         ======================================== */
      .p96-nome-header {
        padding: 0;
      }
      .p96-breadcrumb-label {
        font-size: 11px;
        font-weight: 400;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: #888;
        margin-bottom: 6px;
        font-family: "Open Sans", sans-serif;
      }
      .p96-product-title {
        font-family: "Open Sans", serif !important;
        font-size: 24px;
        font-weight: 700;
        color: #1a1a1a;
        line-height: 1.25;
        margin: 0 0 2px 0;
        padding: 0;
      }

      /* ========================================
         SEÇÃO 2: PREÇO
         ======================================== */
      .p96-flex-price-box {
        background: #f3f0ec;
        padding: 18px;
        border-radius: 14px;
        margin: 4px 0 0 0 !important;
        font-family: "DM Sans", sans-serif !important;
      }
      .p96-flex-old {
        text-decoration: line-through;
        color: #8c8c8c;
        font-size: 14px;
        margin-bottom: 6px;
      }
      .p96-flex-main {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .p96-flex-current {
        font-size: 28px;
        font-weight: 800;
        color: var(--button-background, #b37c0f);
      }
      .p96-flex-badge {
        background: var(--success, #8fb09c) !important;
        padding: 6px 14px;
        border-radius: 25px;
        font-size: 12px;
        font-weight: 800;
        color: #fff !important;
      }
      .p96-flex-installments {
        margin-top: 6px;
        font-size: 14px;
        color: #555;
      }

      /* Esconder preços originais da Nuvemshop APENAS na área do produto individual */
      .template-product #single-product .js-price-display,
      .template-product #single-product .js-compare-price-display,
      .template-product .js-product-container .js-installments-container,
      .template-product .js-product-container .js-max-installments-container,
      .template-product .js-product-container .js-max-installments,
      .template-product .js-product-container .js-product-installments {
        display: none !important;
      }

      /* ========================================
         SEÇÃO 3: TAMANHO (Variantes)
         ======================================== */

      /* Hide: Quantity section */
      .js-product-form .form-quantity,
      .js-product-form .js-quantity {
        display: none !important;
      }
      /* Hide the col-4 wrapper that holds quantity */
      .js-product-form > .form-row:not(.js-product-variants) > .col-4,
      .js-product-form > .form-row:not(.js-product-variants) > .col-md-3 {
        display: none !important;
      }

      /* Style: Provador Virtual / Tabela de Medidas (Sizebay) */
      .vfr__container,
      #szb-container {
        display: flex !important;
        gap: 10px !important;
        margin: 16px 0 12px 0 !important;
        padding: 0 !important;
      }
      .szb-vfr-btns {
        display: flex !important;
        gap: 10px !important;
        width: 100% !important;
      }
      .szb-vfr-btns button {
        flex: 1 !important;
        padding: 10px 14px !important;
        border: 1.5px solid #e0e0e0 !important;
        border-radius: 8px !important;
        background: #fff !important;
        font-family: "Open Sans", sans-serif !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        color: #333 !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
      }
      .szb-vfr-btns button:hover {
        border-color: var(--button-background, #f2b90d) !important;
        background: var(--main-background-opacity-05, #fffbee) !important;
      }

      /* Hide: Nuvemshop original payments info only on product page */
      .template-product .js-product-payments-container {
        display: none !important;
        margin: 0 !important;
        padding: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
      }

      /* Hide: Original form labels inside variant container */
      .js-product-form .js-product-variants .form-label,
      .js-product-form .js-product-variants label.form-label,
      .js-product-variants label {
        display: none !important;
      }

      /* Hide: The native <select> dropdown */
      .js-product-form > .js-product-variants .form-group.d-none {
        display: none !important;
      }
      .js-product-form > .js-product-variants {
        margin-top: 0 !important;
        padding-top: 0 !important;
      }
      /* Style: Native variant buttons row */
      .js-product-form > .js-product-variants .js-variant-container > .row {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 10px !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      /* Style: Each variant button (a.btn-variant) */
      .js-product-form > .js-product-variants a.btn-variant {
        width: 48px !important;
        height: 48px !important;
        min-width: 48px !important;
        min-height: 48px !important;
        border: 1.5px solid #e0e0e0 !important;
        border-radius: 8px !important;
        background: #fff !important;
        color: #333 !important;
        font-family: "Open Sans", sans-serif !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
        margin: 0 !important;
        padding: 0 !important;
        text-decoration: none !important;
        line-height: 1 !important;
        overflow: hidden !important;
        text-overflow: unset !important;
        white-space: nowrap !important;
      }

      /* Hover state */
      .js-product-form > .js-product-variants a.btn-variant:hover {
        border-color: var(--button-background, #f2b90d) !important;
      }

      /* Active/selected state */
      .js-product-form > .js-product-variants a.btn-variant.selected {
        background: var(--button-background, #f2b90d) !important;
        border-color: var(--button-background, #f2b90d) !important;
        color: var(--button-foreground, #000) !important;
        font-weight: 700 !important;
      }

      /* ========================================
         SEÇÃO 4: BOTÃO COMPRAR
         ======================================== */

      /* Hide: Original submit buttons */
      .js-product-form input.js-addtocart.js-prod-submit-form,
      .js-product-form .js-addtocart-placeholder {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
        position: absolute !important;
        pointer-events: none !important;
      }

      /* Buy button row: col takes full width when quantity is hidden */
      .js-product-form > .form-row:not(.js-product-variants) > .col-8,
      .js-product-form > .form-row:not(.js-product-variants) > .col-md-9 {
        flex: 0 0 100% !important;
        max-width: 100% !important;
      }

      /* Style: Custom Buy Button */
      .p96-custom-buy-btn {
        width: 100% !important;
        margin-top: 8px !important;
        background: var(--button-background, #f2b90d) !important;
        color: var(--button-foreground, #000) !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 16px 24px !important;
        font-family: "Open Sans", sans-serif !important;
        font-size: 16px !important;
        font-weight: 700 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 10px !important;
        cursor: pointer !important;
        text-transform: none !important;
        
        box-shadow: 0 2px 10px var(--main-foreground-opacity-10, rgba(242, 185, 13, 0.3)) !important;
        transition: all 0.2s ease !important;
        letter-spacing: 0.3px !important;
        line-height: 1.2 !important;
      }

      .p96-custom-buy-btn:hover:not(.p96-btn-esgotado) {
        filter: brightness(0.9);
      }

      .p96-custom-buy-btn svg {
        width: 20px;
        height: 20px;
        fill: currentColor;
        flex-shrink: 0;
      }

      /* Estado: ESGOTADO */
      .p96-custom-buy-btn.p96-btn-esgotado {
        background: #ccc !important;
        color: #666 !important;
        cursor: not-allowed !important;
        box-shadow: none !important;
        opacity: 0.85 !important;
      }

      .p96-custom-buy-btn.p96-btn-esgotado svg {
        display: none !important;
      }

      /* ========================================
         RESPONSIVO
         ======================================== */
      @media (max-width: 767px) {
        .p96-product-title { font-size: 20px; }
        .p96-breadcrumb-label { font-size: 10px; }
        .p96-flex-current { font-size: 24px; }
      }
    `;
        document.head.appendChild(style);
    }

    // ============================
    // NOME DO PRODUTO (Header)
    // ============================
    function initHeader() {
        const nameEl = document.querySelector("#product-name, .js-product-name");
        if (!nameEl) return;
        if (document.querySelector(".p96-nome-header")) return;

        let brand = "PANGEIA";
        if (window.LS && window.LS.product && window.LS.product.brand) {
            brand = window.LS.product.brand.toUpperCase();
        }

        let category = getCategory();

        let productName = nameEl.textContent.trim();
        if (window.LS && window.LS.product) productName = window.LS.product.name;

        // Criar header customizado
        const wrapper = document.createElement("div");
        wrapper.className = "p96-nome-header";
        wrapper.innerHTML = `
      <div class="p96-breadcrumb-label">
        ${brand} · ${category}
      </div>
      <h1 class="p96-product-title">${productName}</h1>
    `;

        nameEl.style.display = "none";
        if (nameEl.parentNode) nameEl.parentNode.insertBefore(wrapper, nameEl);
    }

    // ============================
    // PREÇO
    // ============================
    function initPrice() {
        const container = document.querySelector(".js-price-container");
        if (!container) return;

        const update = () => {
            const oldEl = container.querySelector(".js-compare-price-display");
            const currentEl = container.querySelector(".js-price-display");

            // Buscar texto de parcelas
            let installText = "";
            const selectors = [
                ".js-max-installments",
                ".js-installments-max",
                ".js-installment-price",
                "[data-installments]",
                ".js-product-installments"
            ];

            for (let sel of selectors) {
                const el = container.querySelector(sel) || document.querySelector(sel);
                if (el && el.textContent.trim()) {
                    installText = el.textContent.trim().replace(/\s+/g, ' ');
                    break;
                }
            }

            // Parsing preços
            let oldPrice = 0;
            let currentPrice = 0;

            if (oldEl) oldPrice = getNumber(oldEl.textContent);
            if (currentEl) currentPrice = getNumber(currentEl.textContent);

            if (!currentPrice) return;

            // Desconto
            let discount = 0;
            if (oldPrice > currentPrice) {
                discount = Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
            }

            // Renderizar box de preço
            let box = container.querySelector(".p96-flex-price-box");
            if (!box) {
                box = document.createElement("div");
                box.className = "p96-flex-price-box";
                container.appendChild(box);
            }

            let html = '';

            if (oldPrice > currentPrice) {
                html += `<div class="p96-flex-old">De ${formatMoney(oldPrice)}</div>`;
            }

            html += `<div class="p96-flex-main">
                    <div class="p96-flex-current">
                        ${oldPrice > currentPrice ? 'Por ' : ''}${formatMoney(currentPrice)}
                    </div>`;

            if (discount > 0) {
                html += `<div class="p96-flex-badge">-${discount}% OFF</div>`;
            }
            html += `</div>`;

            if (installText) {
                if (!installText.toLowerCase().startsWith('ou')) {
                    installText = 'ou ' + installText;
                }
                // Aplicar negrito em números (ex: 3 x ou 3x) e valores (ex: R$ 10,00)
                let formattedInstallText = installText
                    .replace(/(\d+\s*x)/gi, '<span style="font-weight:700;font-size:15px">$1</span>')
                    .replace(/(R\$\s?[\d,.]+)/g, '<span style="font-weight:700;font-size:15px">$1</span>');

                html += `<div class="p96-flex-installments">${formattedInstallText}</div>`;
            } else {
                html += `<div class="p96-flex-installments">
          ou <strong style="font-weight:700;font-size:15px">3x</strong> de 
          <strong style="font-weight:700;font-size:15px">${formatMoney(currentPrice / 3)}</strong> sem juros
        </div>`;
            }
            box.innerHTML = html;
        };

        update();

        const observer = new MutationObserver(() => {
            setTimeout(update, 50);
        });

        observer.observe(container, { childList: true, subtree: true, characterData: true });
    }

    // ============================
    // TAMANHO + BOTÃO COMPRAR (Layout)
    // ============================
    function modifyLayout() {
        const form = document.querySelector(".js-product-form");
        if (!form) return;

        /* 1. Hide the entire Nuvemshop installments/payments container */
        document.querySelectorAll('.js-product-payments-container').forEach(el => {
            el.style.setProperty('display', 'none', 'important');
        });

        /* 1b. Ensure Sizebay is visible and move it below the sizes selection */
        const szbContainer = form.querySelector('.vfr__container, .szb-vfr-btns, #szb-container');
        const variantRow = form.querySelector('.js-product-variants');
        if (szbContainer) {
            szbContainer.style.removeProperty('display');
            if (variantRow && variantRow.nextSibling) {
                variantRow.parentNode.insertBefore(szbContainer, variantRow.nextSibling);
            } else if (variantRow) {
                variantRow.parentNode.appendChild(szbContainer);
            }
        }

        /* 2. Hide Quantity containers */
        form.querySelectorAll('.js-quantity, .form-quantity').forEach(el => {
            el.style.setProperty('display', 'none', 'important');
        });

        /* 3. Force hide original submit buttons + placeholder */
        let originalSubmit = null;

        const origInput = form.querySelector('input.js-addtocart.js-prod-submit-form');
        if (origInput) {
            originalSubmit = origInput;
            origInput.style.setProperty('display', 'none', 'important');
            origInput.style.setProperty('visibility', 'hidden', 'important');
            origInput.style.setProperty('position', 'absolute', 'important');
            origInput.style.setProperty('pointer-events', 'none', 'important');
        }

        const placeholder = form.querySelector('.js-addtocart-placeholder');
        if (placeholder) {
            if (!originalSubmit) originalSubmit = placeholder;
            placeholder.style.setProperty('display', 'none', 'important');
            placeholder.style.setProperty('visibility', 'hidden', 'important');
            placeholder.style.setProperty('position', 'absolute', 'important');
        }

        /* 4. Remove any old custom buy buttons */
        form.querySelectorAll('.p96-custom-buy-wrapper').forEach(el => el.remove());
        form.querySelectorAll('.p96-custom-buy-btn').forEach(el => el.remove());

        /* 5. Create custom buy button */
        if (originalSubmit && !form.querySelector('.p96-custom-buy-btn')) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "p96-custom-buy-btn";

            const ICON_CART = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h6v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z"/></svg>`;

            // Função para verificar se o produto/variante está esgotado
            function isOutOfStock() {
                // 1. Checa se o input original está disabled
                if (origInput && origInput.disabled) return true;

                // 2. Checa se o placeholder tem texto de esgotado
                if (placeholder) {
                    const placeholderText = placeholder.textContent.trim().toLowerCase();
                    if (placeholderText.includes('esgotado') ||
                        placeholderText.includes('sold out') ||
                        placeholderText.includes('indisponível') ||
                        placeholderText.includes('unavailable')) {
                        return true;
                    }
                }

                // 3. Checa se o formulário tem indicador de sem estoque
                if (form.querySelector('.js-addtocart[disabled]')) return true;
                if (form.querySelector('.js-addtocart-placeholder.is-visible')) {
                    const phText = form.querySelector('.js-addtocart-placeholder.is-visible')?.textContent?.trim().toLowerCase() || '';
                    if (phText.includes('esgotado') || phText.includes('sold out')) return true;
                }

                // 4. Checa variante selecionada com classe de sem estoque
                const selectedVariant = form.querySelector('.btn-variant.selected');
                if (selectedVariant && selectedVariant.classList.contains('btn-variant-disabled')) return true;

                // 5. Checa via LS.product (objeto global da Nuvemshop)
                if (window.LS && window.LS.product && window.LS.product.available === false) return true;

                return false;
            }

            // Função para atualizar o estado visual do botão
            function updateBuyButtonState() {
                const esgotado = isOutOfStock();

                if (esgotado) {
                    btn.classList.add('p96-btn-esgotado');
                    btn.innerHTML = 'ESGOTADO';
                    btn.disabled = true;
                } else {
                    btn.classList.remove('p96-btn-esgotado');
                    btn.innerHTML = ICON_CART + ' Comprar Agora';
                    btn.disabled = false;
                }
            }

            btn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Não faz nada se esgotado
                if (btn.classList.contains('p96-btn-esgotado')) return;

                if (origInput) {
                    origInput.style.setProperty('pointer-events', 'auto', 'important');
                    origInput.click();
                    origInput.style.setProperty('pointer-events', 'none', 'important');
                } else if (placeholder) {
                    placeholder.click();
                } else {
                    form.submit();
                }
            });

            // Inserir no col-8 (mesmo lugar do original)
            const col8 = form.querySelector('.form-row:not(.js-product-variants) > .col-8');
            if (col8) {
                col8.appendChild(btn);
            } else {
                const variantRow = form.querySelector('.js-product-variants');
                if (variantRow && variantRow.nextSibling) {
                    variantRow.parentNode.insertBefore(btn, variantRow.nextSibling);
                } else {
                    form.appendChild(btn);
                }
            }

            // Estado inicial
            updateBuyButtonState();

            // Observer: atualizar botão quando a variante muda (ex: clicou outro tamanho)
            const stockObserver = new MutationObserver(() => {
                setTimeout(updateBuyButtonState, 100);
            });
            stockObserver.observe(form, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['disabled', 'class', 'style']
            });
        }

        /* 6. Ensure the buy button row col expands to full width */
        const buyRow = form.querySelector('.form-row:not(.js-product-variants)');
        if (buyRow) {
            const col4 = buyRow.querySelector('.col-4');
            if (col4) col4.style.setProperty('display', 'none', 'important');

            const col8 = buyRow.querySelector('.col-8, .col-md-9');
            if (col8) {
                col8.style.setProperty('flex', '0 0 100%', 'important');
                col8.style.setProperty('max-width', '100%', 'important');
            }
        }
    }

})();


(function () {
    "use strict";

    if (window.__P96HeaderMinimizedLoaded) return;
    window.__P96HeaderMinimizedLoaded = true;

    const isProductPage = window.location.pathname.startsWith("/produtos/");
    const isCheckoutPage = window.location.pathname.includes("/checkout/") || window.location.pathname.includes("/cart/");

    function shouldApply() {
        const isMobile = window.innerWidth <= 768;
        return isMobile && (isProductPage || isCheckoutPage);
    }

    function injectStyles() {
        if (document.getElementById("p96-header-minimized-style")) return;

        const style = document.createElement("style");
        style.id = "p96-header-minimized-style";
        style.textContent = `
      @media (max-width: 768px) {
        /* Esconder barra de pesquisa mobile padrão APENAS no cabeçalho */
        .header-logo-row .js-search-form, 
        .js-head-main .js-search-form:not(#nav-search .js-search-form),
        .search-mobile, .js-mobile-search {
          display: none !important;
        }

        /* Ajustar container do cabeçalho */
        .js-head-main, .head-main {
          padding-bottom: 0 !important;
        }

        .header-logo-row.d-block.d-md-none {
          padding: 8px 0 !important;
          background-color: transparent !important;
        }

        /* Linha única */
        .js-head-logo.row {
          display: flex !important;
          flex-wrap: nowrap !important;
          align-items: center !important;
          justify-content: space-between !important;
          margin: 0 !important;
        }

        /* Colunas */
        .js-head-logo .col-2.h-col, 
        .js-head-logo .col-2.col-md-auto.h-col {
          flex: 0 0 auto !important;
          max-width: none !important;
          width: 50px !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          visibility: visible !important;
          opacity: 1 !important;
          }

        .js-head-logo .col.text-center {
          flex: 1 1 auto !important;
          max-width: none !important;
          padding: 0 5px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .js-head-logo .text-right {
          flex: 0 0 auto !important;
          max-width: none !important;
          width: auto !important;
          min-width: 70px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          padding-right: 15px !important;
        }

        .utilities-container {
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 12px !important;
        }

        /* Logo */
        .logo-img {
          max-height: 50px !important;
          width: auto !important;
          display: block !important;
        }

        /* Lupa de Busca */
        #p96-search-trigger {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          width: 32px !important;
          height: 32px !important;
          z-index: 99 !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        #p96-search-trigger svg {
          width: 20px !important;
          height: 20px !important;
          stroke: #fff !important;
          stroke-width: 2.8 !important;
          display: block !important;
        }

        /* hambúrguer */
        .btn-hamburger, .js-modal-open[data-toggle="#nav-hamburger"] {
          opacity: 1 !important;
          visibility: visible !important;
          display: flex !important;
          align-items: center !important;
        }
        .btn-hamburger svg, .js-modal-open[data-toggle="#nav-hamburger"] svg {
          stroke: #fff !important;
          stroke-width: 2.5 !important;
          opacity: 1 !important;
          width: 20px !important;
          height: 20px !important;
        }

        /* Carrinho */
        .link-cart {
          display: flex !important;
          align-items: center !important;
          opacity: 1 !important;
        }
        .link-cart svg {
          width: 22px !important;
          height: 22px !important;
          fill: #fff !important;
        }
        
        .js-cart-widget-amount {
          position: absolute !important;
          top: -6px !important;
          right: -8px !important;
          font-size: 9px !important;
          width: 15px !important;
          height: 15px !important;
          min-width: 15px !important;
          background: #000 !important;
          color: #fff !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        /* Forçar visibilidade do modal de busca e input */
        #nav-search {
          display: none;
          background-color: #fff !important;
          z-index: 99999 !important;
        }
        #nav-search.modal-show {
          display: block !important;
        }
        /* Corrigir conflito: o CSS de minimizar escondia o form de busca */
        #nav-search .js-search-form {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          padding: 20px !important;
        }
        #nav-search .js-search-input {
          display: block !important;
          background-color: #f2f2f2 !important;
          color: #000 !important;
          border: 1px solid #ccc !important;
          height: 45px !important;
          width: 100% !important;
        }
        #nav-search .search-close-btn, #nav-search .js-modal-close {
          color: #000 !important;
          z-index: 100000 !important;
          display: block !important;
        }

        /* Esconder ícone de conta */
        [data-store="account-links"], .utilities-item:has(.nav-accounts-link) {
          display: none !important;
        }
      }
    `;
        document.head.appendChild(style);
    }

    function createSearchTrigger() {
        if (document.getElementById('p96-search-trigger')) return;

        const visibleRow = Array.from(document.querySelectorAll('.js-head-logo.row')).find(r => r.offsetHeight > 0);
        if (!visibleRow) return;

        const rightCol = visibleRow.querySelector('.text-right');
        if (!rightCol) return;

        const trigger = document.createElement('a');
        trigger.id = 'p96-search-trigger';
        trigger.href = '#';
        // Classes nativas da Nuvemshop para abrir modais
        trigger.className = 'js-modal-open js-fullscreen-modal-open';
        trigger.setAttribute('data-toggle', '#nav-search');

        trigger.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;

        trigger.onclick = (e) => {
            e.preventDefault();

            const searchModal = document.querySelector('#nav-search');

            // Se o modal estiver "preso" com a classe active mas não estiver visível, resetamos
            if (searchModal && searchModal.classList.contains('active') && searchModal.offsetHeight === 0) {
                searchModal.classList.remove('active', 'modal-show');
            }

            // Estratégia 1: Simular clique no botão nativo
            const nativeBtn = Array.from(document.querySelectorAll('.js-toggle-search, .js-search-button, .js-modal-open[data-toggle="#nav-search"]'))
                .find(el => el !== trigger && (el.offsetHeight > 0 || el.classList.contains('js-search-link') || el.classList.contains('js-toggle-search')));

            if (nativeBtn) {
                nativeBtn.click();
            }

            // Estratégia 2: Forçar abertura se o clique nativo não responder em 150ms (Fallback)
            setTimeout(() => {
                if (searchModal && (searchModal.offsetHeight === 0 || !searchModal.classList.contains('modal-show'))) {
                    searchModal.classList.add('modal-show');
                    document.body.classList.add('modal-open', 'modal-search-open', 'overflow-none');

                    if (!searchModal.classList.contains('active')) {
                        searchModal.classList.add('active');
                    }
                    const input = searchModal.querySelector('input');
                    if (input) {
                        input.focus();
                    }
                }
            }, 150);
        };

        const container = rightCol.querySelector('.utilities-container') || rightCol;
        container.prepend(trigger);
    }

    function init() {
        if (shouldApply()) {
            injectStyles();
            createSearchTrigger();
        }
    }

    // Inicialização robusta
    function fastestInit() {
        if (document.querySelector('.js-head-logo')) {
            init();
        } else if (document.readyState !== "complete") {
            requestAnimationFrame(fastestInit);
        }
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        init();
    } else {
        document.addEventListener("DOMContentLoaded", init);
        fastestInit();
    }

    // Observer focado em reconstruir se algo mudar
    const observer = new MutationObserver((mutations) => {
        if (shouldApply()) {
            const hasTrigger = !!document.getElementById('p96-search-trigger');
            const hasStyle = !!document.getElementById('p96-header-minimized-style');

            if (!hasTrigger || !hasStyle) {
                init();
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', init);
    // Removido window.onload redundante e lento

})();

