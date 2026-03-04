(async function () {
    'use strict';

    if (window.ContagemRegressivaLoaded) return;
    window.ContagemRegressivaLoaded = true;

    // 1. CONFIGURAÇÕES
    const CUPOM = "PANGEIA30OFF";
    const SUPABASE_URL = "https://ijojpaziiqdjplunfbjj.supabase.co";
    const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqb2pwYXppaXFkanBsdW5mYmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTk5ODQsImV4cCI6MjA3MTk3NTk4NH0.H5nbOF6_kvOoVRLuLoCZXn4n1U21d2jqqQ6ojksjUKI";
    const SETTINGS_URL = `${SUPABASE_URL}/rest/v1/contagem_regressiva?select=*&id=eq.1&apikey=${SUPABASE_ANON}`;

    let app_config = null;
    const app_id = 'p96-contagem_regressiva';

    try {
        const response = await fetch(SETTINGS_URL);
        const data = await response.json();
        app_config = data[0];
    } catch (e) {
        console.error("[Contagem Regressiva] Erro ao carregar configurações", e);
        return;
    }

    if (!app_config) return;

    // 2. INJEÇÃO DE ESTILOS CSS
    const css = `
        #${app_id} .etiqueta { display: none; }
        #${app_id} {
            width: 100%; 
            min-height: 50px; 
            position: relative;
            background-color: ${app_config.cor_preto};
            display: flex; 
            flex-direction: row;
            align-items: center; 
            justify-content: center;
            gap: 20px;
            padding: 5px 15px;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            z-index: 9998;
            box-sizing: border-box;
        }

        #${app_id} .titulo {
            color: ${app_config.cor_primaria}; 
            font-weight: 700; 
            font-size: 13px;
            text-transform: uppercase; 
            letter-spacing: 1px;
            white-space: nowrap;
        }

        #${app_id} .relogio { 
            color: ${app_config.cor_branco}; 
            display: flex; 
            align-items: center; 
            gap: 5px; 
        }

        #${app_id} .bloco { 
            display: flex; 
            align-items: center; 
            font-size: 18px; 
            font-weight: 800; 
        }
        
        #${app_id} .botao_cta {
            height: 34px; 
            border: 0; 
            border-radius: 50px;
            font-size: 11px; 
            font-weight: 700; 
            white-space: nowrap;
            background: linear-gradient(135deg, ${app_config.cor_destaque}, #ff8e53);
            color: #fff; 
            padding: 0 25px; 
            text-transform: uppercase;
            cursor: pointer; 
            transition: all 0.3s ease;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            flex-shrink: 0;
        }

        /* MODAL */
        .modal-lead-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); display: none; align-items: center;
            justify-content: center; z-index: 9999; font-family: sans-serif;
            backdrop-filter: blur(4px);
        }
        .modal-lead-content {
            background: #fff; padding: 30px; border-radius: 20px;
            max-width: 400px; width: 90%; text-align: center; color: #333;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .modal-lead-content h3 { margin: 0 0 10px 0; font-size: 22px; font-weight: 800; }
        .modal-lead-content input {
            width: 100%; padding: 12px; margin: 6px 0;
            border: 1px solid #e1e1e1; border-radius: 8px; box-sizing: border-box;
        }
        .btn-enviar-lead {
            background: linear-gradient(135deg, ${app_config.cor_destaque}, #ff8e53);
            color: #fff; border: none; padding: 16px; width: 100%; border-radius: 10px;
            font-weight: 800; cursor: pointer; margin-top: 10px;
        }
        .cupom-container {
            background: #fff5f5; border: 2px dashed ${app_config.cor_destaque};
            padding: 15px; margin: 15px 0; font-weight: 900; font-size: 1.8rem;
            color: ${app_config.cor_destaque}; border-radius: 10px;
        }
        .hidden-step { display: none !important; }

        @media (max-width: 600px) {
            #${app_id} { 
                gap: 10px; 
                padding: 10px 5px;
            }
            #${app_id} .titulo { font-size: 11px; }
            #${app_id} .bloco { font-size: 16px; }
            #${app_id} .botao_cta { padding: 0 12px; font-size: 10px; }
        }
    `;

    // 3. INJEÇÃO DE HTML
    const html = `
    <div id="${app_id}">
        <div class="titulo">${app_config.texto_titulo}</div>
        <div class="relogio">
            <div class="bloco"><span class="valor">00</span></div>
            <span class="separador">:</span>
            <div class="bloco"><span class="valor">00</span></div>
            <span class="separador">:</span>
            <div class="bloco"><span class="valor">00</span></div>
        </div>
        <button id="triggerModal" class="botao_cta">${app_config.texto_botao_cta}</button>
    </div>

    <div id="modalLead" class="modal-lead-overlay">
        <div class="modal-lead-content">
            <div id="stepForm">
                <h3>Resgate seu Cupom</h3>
                <p>Preencha os dados abaixo para liberar o desconto.</p>
                <form id="formCapture">
                    <input type="text" id="lead_nome" placeholder="Nome Completo" required>
                    <input type="email" id="lead_email" placeholder="Seu melhor e-mail" required>
                    <input type="tel" id="lead_whats" placeholder="WhatsApp" required>
                    <input type="date" id="lead_nasc" required>
                    <button type="submit" class="btn-enviar-lead">GERAR MEU CUPOM AGORA</button>
                </form>
            </div>
            
            <div id="stepSuccess" class="hidden-step">
                <h3 style="color: #27ae60;">Cupom Gerado!</h3>
                <div class="cupom-container" id="displayCupom"></div>
                <p>Use o código acima no checkout para garantir seu desconto.</p>
                <a href="${app_config.link_botao}" class="btn-enviar-lead" style="display:block; text-decoration:none; text-align:center">
                    APLICAR DESCONTO AGORA
                </a>
            </div>
        </div>
    </div>
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
    document.body.insertAdjacentHTML('afterbegin', html);

    // 4. LÓGICA DO CRONÔMETRO
    function iniciaCronometro() {
        const minutosDecimais = 20 + Math.random() * 10;
        let tempo = Math.floor(minutosDecimais * 60);
        const elementosValor = document.querySelectorAll(`#${app_id} .valor`);

        const tick = () => {
            const h = Math.floor(tempo / 3600);
            const m = Math.floor((tempo % 3600) / 60);
            const s = tempo % 60;
            if (elementosValor.length >= 3) {
                elementosValor[0].textContent = h.toString().padStart(2, '0');
                elementosValor[1].textContent = m.toString().padStart(2, '0');
                elementosValor[2].textContent = s.toString().padStart(2, '0');
            }
            if (--tempo >= 0) setTimeout(tick, 1000);
            else document.getElementById(app_id).style.display = 'none';
        };
        tick();
    }

    // 5. LÓGICA DO MODAL E ENVIO
    const modal = document.getElementById('modalLead');
    const triggerBtn = document.getElementById('triggerModal');
    const form = document.getElementById('formCapture');
    const stepForm = document.getElementById('stepForm');
    const stepSuccess = document.getElementById('stepSuccess');
    const btnSubmit = form.querySelector('.btn-enviar-lead');

    const EDGE_FUNCTION_URL = "https://ijojpaziiqdjplunfbjj.supabase.co/functions/v1/inserirTAG_contagem_regressiva_RD";

    triggerBtn.addEventListener('click', () => { modal.style.display = 'flex'; });

    function isEmailValid(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailValue = document.getElementById('lead_email').value;

        if (!isEmailValid(emailValue)) {
            alert("Por favor, insira um endereço de e-mail válido.");
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.innerText = "PROCESSANDO...";

        const leadData = {
            name: document.getElementById('lead_nome').value,
            email: emailValue,
            phone: document.getElementById('lead_whats').value,
            birthdate: document.getElementById('lead_nasc').value
        };

        try {
            const response = await fetch(EDGE_FUNCTION_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leadData)
            });

            if (!response.ok) throw new Error("Erro no servidor");

            document.getElementById('displayCupom').innerText = CUPOM;
            stepForm.classList.add('hidden-step');
            stepSuccess.classList.remove('hidden-step');

        } catch (error) {
            alert("Erro ao conectar com o servidor.");
            btnSubmit.disabled = false;
            btnSubmit.innerText = "GERAR MEU CUPOM AGORA";
        }
    });

    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    iniciaCronometro();

})();