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
            openItem.querySelector(".p96-acc-header").setAttribute("aria-expanded", "false");
            openItem.querySelector(".p96-acc-body").style.maxHeight = "0";
          }
        });

        // Toggle o clicado
        if (isOpen) {
          item.classList.remove("p96-acc-open");
          this.setAttribute("aria-expanded", "false");
          body.style.maxHeight = "0";
        } else {
          item.classList.add("p96-acc-open");
          this.setAttribute("aria-expanded", "true");
          body.style.maxHeight = body.scrollHeight + "px";
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
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(init, 600);
  } else {
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 600));
  }
})();
