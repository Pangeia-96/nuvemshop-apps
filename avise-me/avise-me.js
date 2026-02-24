(async function () {
  "use strict";

  if (window.__P96NotifyMeLoaded) return;
  window.__P96NotifyMeLoaded = true;

  console.log("🟣 P96 Avise-me iniciado");

  const SUPABASE_URL = "https://ijojpaziiqdjplunfbjj.supabase.co";
  const SUPABASE_ANON =
    "08c4cb2fb016fd8f4fdd7872d8b8acf6080be111b5b4a002b79daed2cb0737c2";

  const EDGE_ENDPOINT =
    "https://ijojpaziiqdjplunfbjj.supabase.co/functions/v1/inserir_aviseme_no_banco";

  // ============================
  // CSS
  // ============================
  const style = document.createElement("style");
  style.textContent = `
    .p96-eu-quero {
      margin-top: 3px;
      width: 100%;
      height: 48px;
      padding: 0;
      border-radius: 50px;
      border: none;
      background: #ef9837;
      color: #fff;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .p96-popup {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .p96-popup-box {
      background: #fff;
      width: 360px;
      padding: 28px 22px;
      border-radius: 16px;
      text-align: center;
      position: relative;
    }

    .p96-popup-close {
      position: absolute;
      right: 14px;
      top: 12px;
      cursor: pointer;
      font-size: 22px;
    }

    .p96-input {
      width: 100%;
      padding: 12px;
      margin: 8px 0;
      border-radius: 8px;
      border: 1px solid #ccc;
    }

    .p96-submit {
      width: 100%;
      margin-top: 12px;
      padding: 14px;
      font-weight: 700;
      border-radius: 8px;
      background: #000;
      color: #fff;
      cursor: pointer;
    }
    
    .p96-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    }

    .p96-header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    }

    .p96-header h2 {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
    }

    .p96-icon {
    background: #f1f1f1;
    border-radius: 10px;
    padding: 8px;
    font-size: 16px;
    }

    .p96-product {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 12px;
    }

    .p96-product img {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    object-fit: cover;
    }

    .p96-product-info strong {
    font-size: 14px;
    color: #333;
    }

    .p96-text {
    font-size: 14px;
    color: #555;
    text-align: left;
    margin-bottom: 16px;
    }

    .p96-form-row {
    display: flex;
    gap: 10px;
    }

    .p96-tamanho-row {
    margin-bottom: 16px;
    }

    .p96-tamanho-label {
    font-size: 13px;
    color: #555;
    margin-bottom: 10px;
    display: block;
    text-align: left;
    }

    .p96-tamanho-btns {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    }

    .p96-tamanho-btn {
    min-width: 48px;
    height: 48px;
    padding: 0 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fff;
    color: #333;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    }

    .p96-tamanho-btn:hover {
    border-color: #999;
    }

    .p96-tamanho-btn.selected {
    background: #000;
    color: #fff;
    border-color: #000;
    }

    .p96-tamanho-btn.error {
    border-color: #e74c3c;
    animation: p96-shake 0.3s ease;
    }

    @keyframes p96-shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
    }

    .p96-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 18px;
    }

    .p96-cancel {
    background: #eee;
    border: none;
    padding: 10px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    }

    .p96-send {
    background: #ef9837;
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    }

    .p96-send[disabled] {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .p96-loading {
      width: 100%;
      height: 6px;
      margin-top: 12px;
      background: #f2f2f2;
      border-radius: 999px;
      overflow: hidden;
      display: none;
    }

    .p96-loading.active {
      display: block;
    }

    .p96-loading-bar {
      width: 40%;
      height: 100%;
      background: linear-gradient(90deg, #ef9837, #8E58C8);
      animation: p96-loading 1s linear infinite;
      transform: translateX(-100%);
    }

    @keyframes p96-loading {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(300%); }
    }
  `;
  document.head.appendChild(style);

  // ============================
  // UTIL
  // ============================
  function produtoSemEstoque(card) {
    const texto = card.innerText.toLowerCase();
    return texto.includes("esgotado");
  }

  function extrairProduto(card) {
    const link = card.querySelector("a");
    return {
      product_name:
        link?.getAttribute("title") ||
        link?.innerText?.trim() ||
        "Produto",
      product_url: link?.href || window.location.href
    };
  }

  // ============================
  // LISTAGEM
  // ============================
  function inserirBotoes() {
    const cards = document.querySelectorAll(
      ".product-card, .item-product, .js-product"
    );

    cards.forEach(card => {
      const existingBtn = card.querySelector(".p96-eu-quero:not(.p96-eu-quero-pdp)");

      if (!produtoSemEstoque(card)) {
        if (existingBtn) existingBtn.remove();
        return;
      }

      if (existingBtn) return;

      const produto = extrairProduto(card);

      const btn = document.createElement("button");
      btn.className = "p96-eu-quero";
      btn.innerText = "EU QUERO";
      btn.onclick = () => abrirPopup(produto);

      card.appendChild(btn);
    });
  }

  // ============================
  // PDP
  // ============================
  function inserirBotaoProduto() {
    const buyInput = document.querySelector(
      "input[data-store='product-buy-button'][disabled]"
    );

    const existingBtn = document.querySelector(".p96-eu-quero-pdp");

    if (!buyInput) {
      if (existingBtn) existingBtn.remove();
      return;
    }

    if (existingBtn) return;

    const produto = {
      product_name:
        document.querySelector("h1")?.innerText?.trim() || "Produto",
      product_url: window.location.href,
      product_image:
        document.querySelector("img[itemprop='image']")?.src ||
        document.querySelector(".js-product-image img")?.src ||
        null
    };

    const btn = document.createElement("button");
    btn.className = "p96-eu-quero p96-eu-quero-pdp";
    btn.type = "button";
    btn.innerText = "EU QUERO";
    btn.onclick = () => abrirPopup(produto);

    // 🔥 insere logo abaixo do input "Esgotado"
    buyInput.insertAdjacentElement("afterend", btn);
  }


  // ============================
  // POPUP
  // ============================

  function ehCalca(nomeProduto) {
    const nome = nomeProduto.toLowerCase();
    return nome.includes("calça") || nome.includes("calca") || nome.includes("jeans");
  }

  function getTamanhos(nomeProduto) {
    if (ehCalca(nomeProduto)) {
      return ["32", "34", "36", "38", "40", "42"];
    }
    return ["P", "M", "G"];
  }

  function abrirPopup(produto) {
    const tamanhos = getTamanhos(produto.product_name);
    const botoesHtml = tamanhos.map(t => `<button type="button" class="p96-tamanho-btn" data-tamanho="${t}">${t}</button>`).join("");

    const popup = document.createElement("div");
    popup.className = "p96-popup";
    popup.innerHTML = `
      <div class="p96-popup-box">

        <!-- Header -->
        <div class="p96-header">
            <div class="p96-header-left">
            <span class="p96-icon">⏰</span>
            <h2>Avise-me quando chegar</h2>
            </div>
            <div class="p96-popup-close">✖</div>
        </div>

        <!-- Produto -->
        <div class="p96-product">
            ${produto.product_image
        ? `<img src="${produto.product_image}" />`
        : ""
      }
            <div class="p96-product-info">
            <strong>${produto.product_name}</strong>
            </div>
        </div>

        <!-- Texto -->
        <p class="p96-text">
            Nós vamos te avisar quando esse produto estiver disponível novamente💜
        </p>

        <!-- Seleção de Tamanho -->
        <div class="p96-tamanho-row">
            <label class="p96-tamanho-label">Qual tamanho você precisa?</label>
            <div class="p96-tamanho-btns" id="p96TamanhoBtns">
                ${botoesHtml}
            </div>
            <input type="hidden" id="p96Tamanho" value="" />
        </div>

        <!-- Form -->
        <div class="p96-form-row">
            <input id="p96Nome" class="p96-input" placeholder="Seu nome" />
            <input id="p96Whats" class="p96-input" placeholder="Whatsapp" />
        </div>

        <input id="p96Email" class="p96-input" placeholder="Seu e-mail" />

        <!-- Ações -->
        <div class="p96-actions">
            <button class="p96-cancel"
            onclick="this.closest('.p96-popup').remove()">
            Cancelar
            </button>
            <button id="p96Enviar" class="p96-send">
            Enviar
            </button>
        </div>
        <div class="p96-loading" aria-hidden="true">
          <div class="p96-loading-bar"></div>
        </div>

    </div>

    `;
    document.body.appendChild(popup);

    // Event listeners para botões de tamanho
    popup.querySelectorAll(".p96-tamanho-btn").forEach(btn => {
      btn.onclick = () => {
        // Remove seleção anterior
        popup.querySelectorAll(".p96-tamanho-btn").forEach(b => {
          b.classList.remove("selected");
          b.classList.remove("error");
        });
        // Marca o botão clicado como selecionado
        btn.classList.add("selected");
        // Atualiza o input hidden
        popup.querySelector("#p96Tamanho").value = btn.dataset.tamanho;
      };
    });

    popup.querySelector(".p96-popup-close").onclick = () => popup.remove();
    popup.querySelector("#p96Enviar").onclick = () =>
      enviarLead(popup, produto);
  }

  // ============================
  // ENVIO
  // ============================
  async function enviarLead(popup, produto) {
    const sendBtn = popup.querySelector("#p96Enviar");
    if (sendBtn?.dataset.sending === "true") return;

    // Validar se selecionou tamanho
    const tamanhoInput = popup.querySelector("#p96Tamanho");
    const tamanhoSelecionado = tamanhoInput?.value;

    if (!tamanhoSelecionado) {
      // Adiciona classe de erro em todos os botões para chamar atenção
      popup.querySelectorAll(".p96-tamanho-btn").forEach(btn => {
        btn.classList.add("error");
      });
      return;
    }

    // Validar se preencheu email (obrigatório)
    const emailInput = popup.querySelector("#p96Email");
    const emailValue = emailInput?.value?.trim();

    if (!emailValue) {
      emailInput.style.borderColor = "#e74c3c";
      emailInput.placeholder = "E-mail obrigatório!";
      emailInput.focus();
      return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      emailInput.style.borderColor = "#e74c3c";
      emailInput.value = "";
      emailInput.placeholder = "E-mail inválido!";
      emailInput.focus();
      return;
    }

    // Limpa erro do email se válido
    emailInput.style.borderColor = "#ccc";

    const loading = popup.querySelector(".p96-loading");
    if (sendBtn) {
      sendBtn.dataset.sending = "true";
      sendBtn.disabled = true;
      sendBtn.innerText = "Enviando...";
    }
    loading?.classList.add("active");

    const payload = {
      product_name: produto.product_name,
      product_url: produto.product_url,
      variant_name: tamanhoSelecionado,
      customer_name: popup.querySelector("#p96Nome").value,
      customer_email: popup.querySelector("#p96Email").value,
      customer_phone: popup.querySelector("#p96Whats").value,
      created_at: new Date().toISOString()
    };

    try {
      const response = await fetch(EDGE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON,
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar: ${response.status}`);
      }

      popup.remove();
    } catch (err) {
      console.error("Erro ao enviar lead", err);
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerText = "Enviar";
        sendBtn.dataset.sending = "";
      }
      loading?.classList.remove("active");
    }
  }

  // ============================
  // INIT + OBSERVER
  // ============================
  inserirBotoes();
  inserirBotaoProduto();

  const observer = new MutationObserver(() => {
    inserirBotoes();
    inserirBotaoProduto();
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
