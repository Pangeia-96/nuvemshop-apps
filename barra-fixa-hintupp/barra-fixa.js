(async function () {
  "use strict";

  if (window.innerWidth > 868) return;
  if (window.__P96BottomBarLoaded) return;
  window.__P96BottomBarLoaded = true;

  const SUPABASE_URL = "https://ijojpaziiqdjplunfbjj.supabase.co";
  const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqb2pwYXppaXFkanBsdW5mYmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTk5ODQsImV4cCI6MjA3MTk3NTk4NH0.H5nbOF6_kvOoVRLuLoCZXn4n1U21d2jqqQ6ojksjUKI"

  const SETTINGS_URL = `${SUPABASE_URL}/rest/v1/p96_bottom_bar?select=*&id=eq.1&apikey=${SUPABASE_ANON}`;

  let settings = null;

  // ============================
  // CARREGAR CONFIGURAÇÕES
  // ============================
  try {
    const r = await fetch(SETTINGS_URL);
    settings = (await r.json())[0];
  } catch (e) {
    console.error("Erro carregando configs:", e);
    return;
  }

  // ============================
  // INICIAR BARRA
  // ============================
  function startBar() {
    initP96Bar();
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(startBar, 150);
  } else {
    document.addEventListener("DOMContentLoaded", () => setTimeout(startBar, 150));
  }

  // ============================
  // BARRA INFERIOR
  // ============================
  function initP96Bar() {
    const path = window.location.pathname || "";
    const body = document.body;

    const isHome = path === "/" || body.classList.contains("template-index");
    const isCategory =
      path.includes("/categorias") ||
      path.includes("/c/") ||
      body.classList.contains("template-collection");

    const isProduct =
      body.classList.contains("template-product") || path.includes("/produto");
    const isCart =
      body.classList.contains("template-cart") || path.includes("/cart");

    if (isProduct || isCart) return;
    if (!isHome && !isCategory) return;

    const s = settings;

    const style = document.createElement("style");
    style.textContent = `
      .p96-bottom-wrap {
        position: fixed;
        left: 0; right: 0; bottom: 0;
        background: ${s.bg_color};
        z-index: 1;
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 8px 0;
        border-top: 3px solid ${s.border_color};
      }

      .p96-item {
        text-decoration: none;
        color: ${s.text_color};
        font-size: 6px;
        text-align: center;
        font-weight: 700;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .p96-item img {
        width: 25px;
        height: 25px;
        margin-bottom: 3px;
      }

      body {
        padding-bottom: 70px !important;
      }

      .p96-popup {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 12;
      }

      .p96-popup-box {
        background: #f1f1f1;
        width: 330px;
        padding: 25px 20px;
        border-radius: 10px;
        position: relative;
        text-align: center;
      }

      .p96-popup-close {
        position: absolute;
        right: 10px;
        top: 10px;
        cursor: pointer;
        font-size: 20px;
      }

      .p96-input {
        width: 100%;
        padding: 10px;
        margin: 6px 0;
        border-radius: 6px;
        border: 1px solid #bbb;
      }

      .p96-submit-btn {
        width: 100%;
        margin-top: 10px;
        padding: 10px;
        font-weight: 700;
        border-radius: 6px;
        background: #000;
        color: #fff;
        cursor: pointer;
      }

      .p96-cupom {
        margin-top: 10px;
        font-size: 22px;
        font-weight: 800;
        border: 2px dashed #000;
        padding: 10px;
        background: #fff;
        cursor: pointer;
      }

      .p96-copy-msg {
        display: none;
        margin-top: 8px;
        color: green;
        font-size: 14px;
      }
    `;
    document.head.appendChild(style);

    const wrap = document.createElement("div");
    wrap.className = "p96-bottom-wrap";
    wrap.innerHTML = `
      <a class="p96-item" href="${s.btn1_link}">
        <img src="${s.btn1_icon}">${s.btn1_text}
      </a>
      <a class="p96-item" href="${s.btn2_link}">
        <img src="${s.btn2_icon}">${s.btn2_text}
      </a>
      <a class="p96-item p96-btn3" href="#">
        <img src="${s.btn3_icon}">${s.btn3_text}
      </a>
      <a class="p96-item" href="${s.btn4_link}">
        <img src="${s.btn4_icon}">
        <span>${s.btn4_text1}</span>
        <span>${s.btn4_text2}</span>
      </a>
      <a class="p96-item" href="${s.btn5_link}">
        <img src="${s.btn5_icon}">${s.btn5_text}
      </a>
    `;
    document.body.appendChild(wrap);

    wrap.querySelector(".p96-btn3").addEventListener("click", (e) => {
      e.preventDefault();
      abrirPopupForm();
    });
  }

  // ============================
  // POPUP FORM
  // ============================
  function abrirPopupForm() {
    const popup = document.createElement("div");
    popup.className = "p96-popup";
    popup.innerHTML = `
      <div class="p96-popup-box">
        <div class="p96-popup-close">✖</div>
        <h3>Resgate seu cupom de 10% OFF</h3>
        <input id="p96Nome" class="p96-input" placeholder="Nome*" />
        <input id="p96Email" class="p96-input" placeholder="E-mail*" />
        <input id="p96Whats" class="p96-input" placeholder="Whatsapp*" />
        <input id="p96Aniver" class="p96-input" placeholder="DD/MM/AAAA*" />
        <button id="p96Enviar" class="p96-submit-btn">Enviar</button>
      </div>
    `;
    document.body.appendChild(popup);

    popup.querySelector(".p96-popup-close").onclick = () => popup.remove();
    popup.querySelector("#p96Enviar").onclick = () => validarForm(popup);
  }

  async function validarForm(popup) {
    const nome = popup.querySelector("#p96Nome").value.trim();
    const email = popup.querySelector("#p96Email").value.trim();
    const whats = popup.querySelector("#p96Whats").value.trim();
    const aniver = popup.querySelector("#p96Aniver").value.trim();

    if (!nome || !email || !whats || !aniver) {
      alert("Preencha todos os campos.");
      return;
    }

    await fetch(`${SUPABASE_URL}/functions/v1/inserirTAG_super_desconto_RD`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nome, email, phone: whats, aniver }),
    });

    popup.remove();
    abrirPopupCupom();
  }

  function abrirPopupCupom() {
    const popup = document.createElement("div");
    popup.className = "p96-popup";
    popup.innerHTML = `
      <div class="p96-popup-box">
        <div class="p96-popup-close">✖</div>
        <h3>Seu cupom de 10% OFF 🎉</h3>
        <div id="p96Cupom" class="p96-cupom">GAROTA10</div>
        <div id="p96CopyMsg" class="p96-copy-msg">Cupom copiado ✔</div>
        <button class="p96-submit-btn" onclick="window.location.href='https://www.pangeia96.com.br/seu-presente/'">
          Usar agora
        </button>
      </div>
    `;
    document.body.appendChild(popup);

    popup.querySelector(".p96-popup-close").onclick = () => popup.remove();

    const cupom = popup.querySelector("#p96Cupom");
    const msg = popup.querySelector("#p96CopyMsg");

    cupom.onclick = () => {
      navigator.clipboard.writeText("GAROTA10");
      msg.style.display = "block";
      setTimeout(() => (msg.style.display = "none"), 1500);
    };
  }
})();
