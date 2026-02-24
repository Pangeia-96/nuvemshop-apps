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

  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(start, 500);
  } else {
    document.addEventListener("DOMContentLoaded", () => setTimeout(start, 500));
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
