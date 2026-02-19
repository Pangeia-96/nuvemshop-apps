(function () {
  "use strict";
  // Evitar execução duplicada
  if (window.__TimerBarLoaded) return;
  window.__TimerBarLoaded = true;

  const path = window.location.pathname;
  const body = document.body;

  const isHome = path === "/" || body.classList.contains("template-index");
  const isCategory =
    path.includes("/categorias") ||
    path.includes("/c/") ||
    body.classList.contains("template-collection");

  if (!isHome && !isCategory) return;
  if (path.includes("checkout")) return;

  // ------------------------------------------------------
  // FIX UNIVERSAL — remove bloqueio de clique do tema
  // ------------------------------------------------------
  const cssFix = `
    body.p96-open-popup * {
      pointer-events: auto !important;
    }

    .p96-popup {
      position: static;
      inset: 0 !important;
      background: rgba(0,0,0,0.6) !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      z-index: 999999999 !important;
      pointer-events: auto !important;
    }

    .p96-popup * {
      pointer-events: auto !important;
    }
  `;
  const injectCSS = document.createElement("style");
  injectCSS.textContent = cssFix;
  document.head.appendChild(injectCSS);

  // ------------------------------------------------------
  // BANNER + CSS (Estilo conforme print)
  // ------------------------------------------------------
  const html = `
    <style>
    :root { --p96-bar-height: 56px; }
body { padding-top: var(--p96-bar-height); }
.p96-top-banner.hidden {
  transform: translateY(-100%);
  opacity: 0;
  pointer-events: none;
}
      .p96-top-banner {
      
        width: 100%;
        background: linear-gradient(180deg, #000 0%, #1a1a2e 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
        padding: 10px 14x;
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        top: 0;
        left: 0;
        z-index: 9999;
        box-sizing: border-box;
        transform: translateY(0);
        opacity: 1;
        transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
                    opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        border-bottom: 3px solid #8B5CF6;
        
      }

      .p96-top-banner.hidden {
        transform: translateY(-100%);
        opacity: 0;
        pointer-events: none;
      }

      .p96-title {
        color: #A78BFA;
        font-weight: 700;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        white-space: nowrap;
      }

      .p96-timer {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .p96-timer-block {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 36px;
      }

      .p96-timer-value {
        font-size: 18px;
        font-weight: 700;
        color: #fff;
        line-height: 1;
      }

      .p96-timer-label {
        font-size: 9px;
        color: rgba(255,255,255,0.6);
        text-transform: capitalize;
        margin-top: 2px;
      }

      .p96-timer-sep {
        font-size: 18px;
        font-weight: 700;
        color: #fff;
        margin: 0 2px;
        align-self: flex-start;
        margin-top: 2px;
      }

      .p96-btn-prod {
        background: #8B5CF6;
        color: #fff;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
        border: none;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        transition: background 0.2s ease, transform 0.2s ease;
        white-space: nowrap;
        position: relative !important;
        z-index: 999999999999 !important;
        pointer-events: auto !important;
      }

      .p96-btn-prod:hover {
        background: #7C3AED;
        transform: scale(1.02);
      }

      .p96-popup-box {
        width: 330px;
        max-width: 90vw;
        background: #fff;
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        position: relative;
      }

      .p96-input {
        width: 100%;
        padding: 10px;
        margin: 8px 0;
        border-radius: 6px;
        border: 1px solid #bbb;
        box-sizing: border-box;
      }

      .p96-submit-btn {
        width: 100%;
        background: #8B5CF6;
        color: #fff;
        padding: 12px;
        border-radius: 6px;
        font-weight: 700;
        cursor: pointer;
        border: none;
        transition: background 0.2s ease;
      }

      .p96-submit-btn:hover {
        background: #7C3AED;
      }

      .p96-cupom {
        background: #fff;
        border: 2px dashed #8B5CF6;
        padding: 12px;
        margin-top: 10px;
        font-size: 22px;
        font-weight: 800;
        cursor: pointer;
        color: #8B5CF6;
      }

      /* RESPONSIVO MOBILE */
      @media (max-width: 768px) {
        .p96-top-banner {
          flex-wrap: wrap;
          gap: 10px;
          padding: 10px 12px;
        }

        .p96-title {
          font-size: 11px;
          letter-spacing: 1px;
        }

        .p96-timer-block {
          min-width: 28px;
        }

        .p96-timer-value {
          font-size: 14px;
        }

        .p96-timer-label {
          font-size: 7px;
        }

        .p96-timer-sep {
          font-size: 14px;
        }

        .p96-btn-prod {
          padding: 6px 12px;
          font-size: 10px;
        }
      }

      @media (max-width: 480px) {
        .p96-top-banner {
          gap: 8px;
          padding: 8px 10px;
        }

        .p96-title {
          font-size: 10px;
          letter-spacing: 0.5px;
        }

        .p96-timer-block {
          min-width: 24px;
        }

        .p96-timer-value {
          font-size: 12px;
        }

        .p96-timer-label {
          font-size: 6px;
        }

        .p96-timer-sep {
          font-size: 12px;
          margin: 0 1px;
        }

        .p96-btn-prod {
          padding: 5px 10px;
          font-size: 9px;
        }
      }
    </style>

    <div class="p96-top-banner" id="p96BannerTop">
      <span class="p96-title">ÚLTIMAS HORAS</span>

      <div class="p96-timer">
        <div class="p96-timer-block">
          <span class="p96-timer-value" id="p96-dias">00</span>
          <span class="p96-timer-label">Dias</span>
        </div>
        <span class="p96-timer-sep">:</span>
        <div class="p96-timer-block">
          <span class="p96-timer-value" id="p96-horas">00</span>
          <span class="p96-timer-label">Horas</span>
        </div>
        <span class="p96-timer-sep">:</span>
        <div class="p96-timer-block">
          <span class="p96-timer-value" id="p96-min">00</span>
          <span class="p96-timer-label">Mins</span>
        </div>
        <span class="p96-timer-sep">:</span>
        <div class="p96-timer-block">
          <span class="p96-timer-value" id="p96-seg">00</span>
          <span class="p96-timer-label">Segs</span>
        </div>
      </div>

      <button id="p96BtnProdutos" class="p96-btn-prod">Ver produtos</button>
    </div>
  `;

  document.body.insertAdjacentHTML("afterbegin", html);
  const banner = document.getElementById("p96BannerTop");

  // ------------------------------------------------------
  // SCROLL — esconde banner suavemente ao rolar
  // ------------------------------------------------------
  let lastScrollY = 0;
  let ticking = false;

  function handleScroll() {
    const currentScrollY = window.scrollY;

    // Esconde quando rola para baixo, mostra quando está no topo ou rola para cima
    if (currentScrollY > 50) {
      banner.classList.add("hidden");
    } else {
      banner.classList.remove("hidden");
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(handleScroll);
      ticking = true;
    }
  }, { passive: true });

  handleScroll();

  // ------------------------------------------------------
  // TIMER - Alterna entre 10 e 30 minutos
  // ------------------------------------------------------
  const TIMER_OPTIONS = [10 * 60 * 1000, 30 * 60 * 1000]; // 10 min e 30 min em ms

  function getRandomTimer() {
    return TIMER_OPTIONS[Math.floor(Math.random() * TIMER_OPTIONS.length)];
  }

  let countdown = getRandomTimer();
  let start = Date.now();

  function atualizarTimer() {
    let diff = countdown - (Date.now() - start);

    if (diff <= 0) {
      // Quando terminar, escolhe novo tempo aleatório (10 ou 30 min)
      countdown = getRandomTimer();
      start = Date.now();
      diff = countdown;
    }

    const dias = Math.floor(diff / (24 * 60 * 60 * 1000));
    const horas = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutos = Math.floor((diff % (60 * 60 * 1000)) / 60000);
    const segundos = Math.floor((diff % 60000) / 1000);

    document.getElementById("p96-dias").textContent = String(dias).padStart(2, "0");
    document.getElementById("p96-horas").textContent = String(horas).padStart(2, "0");
    document.getElementById("p96-min").textContent = String(minutos).padStart(2, "0");
    document.getElementById("p96-seg").textContent = String(segundos).padStart(2, "0");
  }

  setInterval(atualizarTimer, 1000);
  atualizarTimer();

  // ------------------------------------------------------
  // POPUP FORM
  // ------------------------------------------------------
  function abrirPopupForm() {
    body.classList.add("p96-open-popup");

    const popup = document.createElement("div");
    popup.className = "p96-popup";
    popup.innerHTML = `
      <div class="p96-popup-box">
        <div class="p96-popup-close" style="position:static;right:12px;top:10px;font-size:22px;cursor:pointer;">✖</div>

        <h3>Parabéns! 🎉</h3>
        <p>Você ganhou um cupom exclusivo.<br>Preencha para resgatar:</p>

        <input id="p96Nome" class="p96-input" placeholder="Nome*" />
        <input id="p96Email" class="p96-input" placeholder="E-mail*" />
        <input id="p96Whats" class="p96-input" placeholder="Whatsapp*" />

        <button id="p96Enviar" class="p96-submit-btn">Enviar</button>
      </div>
    `;

    document.body.appendChild(popup);

    popup.querySelector(".p96-popup-close").onclick = () => {
      body.classList.remove("p96-open-popup");
      popup.remove();
    };

    popup.querySelector("#p96Enviar").onclick = () => {
      const nome = p96Nome.value.trim();
      const email = p96Email.value.trim();
      const tel = p96Whats.value.trim();

      if (!nome || !email || !tel) return alert("Preencha todos os campos!");

      popup.remove();
      abrirPopupCupom();
    };
  }

  // ------------------------------------------------------
  // POPUP CUPOM
  // ------------------------------------------------------
  function abrirPopupCupom() {
    const popup = document.createElement("div");
    popup.className = "p96-popup";

    popup.innerHTML = `
      <div class="p96-popup-box">
        <div class="p96-popup-close" style="position:static;right:12px;top:10px;font-size:22px;cursor:pointer;">✖</div>

        <h3>Cupom liberado 🎉</h3>

        <div id="p96Cupom" class="p96-cupom">GANHEI12</div>
        <div id="p96CopyMsg" style="color:green;font-size:14px;display:none;margin-top:8px;">
          Copiado! redirecionando…
        </div>
      </div>
    `;

    document.body.appendChild(popup);

    popup.querySelector(".p96-popup-close").onclick = () => {
      body.classList.remove("p96-open-popup");
      popup.remove();
    };

    const box = popup.querySelector("#p96Cupom");
    const msg = popup.querySelector("#p96CopyMsg");

    box.onclick = () => {
      navigator.clipboard.writeText("GANHEI12");
      msg.style.display = "block";

      setTimeout(() => {
        window.location.href = "https://www.pangeia96.com.br/produtos/";
      }, 1000);
    };
  }

  // ------------------------------------------------------
  // BOTÃO — ABRE POPUP
  // ------------------------------------------------------
  document.getElementById("p96BtnProdutos").onclick = (e) => {
    e.preventDefault();
    abrirPopupForm();
  };

})();