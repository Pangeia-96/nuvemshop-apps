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
  if (document.readyState === "complete" || document.readyState === "interactive") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
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
  window.addEventListener('load', init); // Garantia extra após carregamento total

})();
