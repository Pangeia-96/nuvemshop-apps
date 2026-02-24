(async function () {
    "use strict";

    // Evitar execução duplicada
    if (window.__FreteGratisBarLoaded) return;
    window.__FreteGratisBarLoaded = true;

    // ============================
    // SUPABASE CONFIG
    // ============================
    const SUPABASE_URL = "https://ijojpaziiqdjplunfbjj.supabase.co";
    const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqb2pwYXppaXFkanBsdW5mYmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTk5ODQsImV4cCI6MjA3MTk3NTk4NH0.H5nbOF6_kvOoVRLuLoCZXn4n1U21d2jqqQ6ojksjUKI";
    const SETTINGS_URL = `${SUPABASE_URL}/rest/v1/frete_gratis_config?select=*&id=eq.1&apikey=${SUPABASE_ANON}`;

    let settings = null;

    // ============================
    // CARREGAR CONFIGURAÇÕES DO SUPABASE
    // ============================
    try {
        const r = await fetch(SETTINGS_URL);
        settings = (await r.json())[0];
    } catch (e) {
        console.error("[Frete Grátis] Erro ao carregar config", e);
        return;
    }

    if (!settings || !settings.ativo) return;

    // ============================
    // MAPEAMENTO DE ESTADOS PARA REGIÕES
    // ============================
    const estadoParaRegiao = {
        "GO": "centro_oeste", "MT": "centro_oeste", "MS": "centro_oeste", "DF": "centro_oeste",
        "SP": "sudeste", "RJ": "sudeste", "MG": "sudeste", "ES": "sudeste",
        "PR": "sul", "SC": "sul", "RS": "sul",
        "BA": "nordeste", "SE": "nordeste", "AL": "nordeste", "PE": "nordeste",
        "PB": "nordeste", "RN": "nordeste", "CE": "nordeste", "PI": "nordeste", "MA": "nordeste",
        "AM": "norte", "PA": "norte", "AC": "norte", "RO": "norte",
        "RR": "norte", "AP": "norte", "TO": "norte"
    };

    const regiaoNomes = {
        "centro_oeste": "CENTRO-OESTE",
        "sudeste": "SUDESTE",
        "sul": "SUL",
        "nordeste": "NORDESTE",
        "norte": "NORTE"
    };

    // Estado do componente
    let currentCartValue = 0;
    let currentRegion = null;
    let regionDetected = false;

    // ============================
    // CONTROLE ROBUSTO DE ANIMAÇÃO — STATE MACHINE
    // ============================
    //
    // Estados possíveis:
    //   COLD_START  → Script acabou de carregar, ainda não sabemos o valor do carrinho.
    //   GRACE       → Dentro da janela de proteção de 10s. Qualquer transição é DESCARTADA.
    //   BELOW       → Carrinho está ABAIXO do threshold. Pronto para detectar transição.
    //   ABOVE       → Carrinho está ACIMA do threshold. Animação já disparou ou foi descartada.
    //   EXHAUSTED   → Limite de 2 animações atingido. Nunca mais dispara.
    //
    // Transições válidas:
    //   COLD_START → GRACE  (se valor inicial chega durante janela de 10s)
    //   COLD_START → BELOW  (se valor inicial chega após janela de 10s E está abaixo)
    //   COLD_START → ABOVE  (se valor inicial chega após janela de 10s E está acima — NÃO dispara)
    //   GRACE → BELOW       (janela de 10s expira com carrinho abaixo)
    //   GRACE → ABOVE       (janela de 10s expira com carrinho acima — NÃO dispara, descarta)
    //   BELOW → ABOVE       (transição real! Dispara animação se count < 2)
    //   ABOVE → BELOW       (carrinho caiu, permite futura animação)
    //   qualquer → EXHAUSTED (se count >= 2 no momento do disparo)
    //
    const ANIM_COUNT_KEY = 'frete_gratis_anim_count';
    const ANIM_MAX_COUNT = 2;
    const GRACE_PERIOD_MS = 10000; // 10 segundos de proteção inicial

    const scriptInitTimestamp = Date.now();

    // State machine
    let animState = 'COLD_START';
    let graceTimerStarted = false;

    function getAnimationCount() {
        try { return parseInt(sessionStorage.getItem(ANIM_COUNT_KEY)) || 0; } catch (e) { return 0; }
    }

    function incrementAnimationCount() {
        try {
            const count = getAnimationCount() + 1;
            sessionStorage.setItem(ANIM_COUNT_KEY, count.toString());
            return count;
        } catch (e) { return 999; }
    }

    function isInGracePeriod() {
        return (Date.now() - scriptInitTimestamp) < GRACE_PERIOD_MS;
    }

    // Agenda a transição automática quando o grace period acabar
    function scheduleGraceExpiry() {
        if (graceTimerStarted) return;
        graceTimerStarted = true;
        const remaining = GRACE_PERIOD_MS - (Date.now() - scriptInitTimestamp);
        if (remaining <= 0) return; // já passou
        setTimeout(() => {
            if (animState !== 'GRACE') return;
            // Grace expirou — decidir para onde ir baseado no valor ATUAL
            const valorMinimo = getValorMinimo();
            const above = currentCartValue >= valorMinimo;
            if (above) {
                animState = 'ABOVE';
            } else {
                animState = 'BELOW';
            }
        }, remaining + 50); // +50ms de margem
    }

    // ============================
    // HELPER: OBTER VALOR MÍNIMO (respeitando modo e região)
    // ============================
    function getValorMinimo() {
        // Se modo é fixo OU região não detectada, usar valor fixo
        if (settings.modo === "fixo" || !regionDetected || !currentRegion) {
            return parseFloat(settings.valor_fixo) || 99;
        }
        // Modo por região - usar valor da região
        const valorField = `valor_${currentRegion}`;
        return parseFloat(settings[valorField]) || parseFloat(settings.valor_fixo) || 99;
    }

    // ============================
    // HELPER: OBTER COR PRIMÁRIA (do banco de dados)
    // ============================
    function getCorPrimaria() {
        return settings.cor_primaria || "#9b59b6";
    }

    // ============================
    // ANIMAÇÃO DE FRETE GRÁTIS DESBLOQUEADO
    // ============================
    function showFreteGratisAnimation() {
        // Evita duplicar
        if (document.getElementById('frete-gratis-anim')) return;

        // Incrementar contador ANTES de mostrar
        incrementAnimationCount();

        const overlay = document.createElement('div');
        overlay.id = 'frete-gratis-anim';
        overlay.innerHTML = `
            <div class="frete-anim-blur"></div>
            <div class="frete-anim-container">
                <img 
                    src="https://ijojpaziiqdjplunfbjj.supabase.co/storage/v1/object/public/ursos/frete-gratis.webp" 
                    alt="Frete Grátis" 
                    class="frete-anim-urso"
                />
            </div>
        `;

        document.body.appendChild(overlay);

        // Função auxiliar para remover o overlay de forma segura
        function forceRemoveOverlay() {
            const el = document.getElementById('frete-gratis-anim');
            if (el) {
                el.classList.remove('show');
                el.style.opacity = '0';
                el.style.pointerEvents = 'none';
                setTimeout(() => {
                    const elAgain = document.getElementById('frete-gratis-anim');
                    if (elAgain) elAgain.remove();
                }, 400);
            }
        }

        // Ativar animação após inserção no DOM
        setTimeout(() => {
            overlay.classList.add('show');
        }, 50);

        // Remover após 2.65 segundos
        setTimeout(() => {
            forceRemoveOverlay();
        }, 2650);

        // SAFETY: Garantia absoluta de remoção após 4 segundos (caso algo falhe)
        setTimeout(() => {
            forceRemoveOverlay();
        }, 4000);
    }

    // ============================
    // INICIALIZAÇÃO
    // ============================
    function init() {

        const isProduct = isProductPage();
        const isCart = isCartPage();

        if (!isProduct && !isCart) {
            return;
        }

        injectStyles();

        if (isProduct) {
            createFreteBar();
        }

        if (isCart) {
            createFreteBarCart();
        }

        // Observar abertura do modal do carrinho
        setupCartModalObserver();

        setupCartInterception();

        // Primeiro: obter valor do carrinho (isso vai chamar updateFreteBar internamente)
        getInitialCartValue();
        setTimeout(getInitialCartValue, 1000);
        setTimeout(getInitialCartValue, 3000);

        // Se modo é por região, também detectar região
        if (settings.modo !== "fixo") {
            detectCustomerRegion();
            setTimeout(detectCustomerRegion, 2000);
            setTimeout(detectCustomerRegion, 5000);
        }
    }

    // ============================
    // OBSERVAR MODAL DO CARRINHO (via eventos, NÃO observer)
    // ============================
    let modalInserted = false;
    let checkingModal = false;

    function setupCartModalObserver() {

        // Escutar cliques em QUALQUER elemento que possa abrir o carrinho
        document.addEventListener('click', function (e) {
            const target = e.target;
            const path = e.composedPath ? e.composedPath() : [target];

            // Verificar se clicou em algo relacionado ao carrinho
            const isCartClick = path.some(el => {
                if (!el.classList && !el.id) return false;
                const classes = el.classList?.toString() || '';
                const id = el.id || '';
                return classes.includes('cart') ||
                    id.includes('cart') ||
                    classes.includes('minicart') ||
                    classes.includes('basket') ||
                    el.getAttribute?.('data-cart') !== null ||
                    el.getAttribute?.('href')?.includes('cart');
            });

            if (isCartClick) {
                // Aguardar o modal abrir e tentar inserir
                setTimeout(tryInsertCartBarInModal, 100);
                setTimeout(tryInsertCartBarInModal, 300);
                setTimeout(tryInsertCartBarInModal, 600);
                setTimeout(tryInsertCartBarInModal, 1000);
            }
        }, true);

        // Verificação inicial com poucos tentativas (não em loop!)
        setTimeout(tryInsertCartBarInModal, 500);
        setTimeout(tryInsertCartBarInModal, 2000);
    }

    function tryInsertCartBarInModal() {
        // Se a barra não existe mais (modal fechou), resetar o flag
        if (!document.getElementById('frete-gratis-bar-modal')) {
            modalInserted = false;
        }

        // Se já inseriu e barra existe, apenas atualizar
        if (modalInserted) {
            updateFreteBarModal();
            return;
        }

        // ESTRATÉGIA 1: Procurar pelo modal do carrinho usando IDs/classes conhecidos
        let modal = document.getElementById('modal-cart') ||
            document.getElementById('modal-fullscreen-cart') ||
            document.getElementById('quick-cart') ||
            document.querySelector('.js-fullscreen-modal.modal-cart-big') ||
            document.querySelector('.js-modal.modal-cart-big') ||
            document.querySelector('.js-modal[class*="cart"]') ||
            document.querySelector('[class*="modal"][class*="cart"]');

        // ESTRATÉGIA 2: Buscar modal visível com lista de carrinho
        if (!modal) {
            const modals = document.querySelectorAll('.js-modal, [id*="modal"], [class*="modal"]');
            for (const m of modals) {
                const hasCartList = m.querySelector('.js-ajax-cart-list') ||
                    m.querySelector('[class*="cart-item"]') ||
                    m.querySelector('[class*="ajax-cart"]');
                if (hasCartList) {
                    const style = window.getComputedStyle(m);
                    const isVis = style.display !== 'none' && style.visibility !== 'hidden';
                    if (isVis) {
                        modal = m;
                        break;
                    }
                }
            }
        }

        // ESTRATÉGIA 3: Buscar por elemento com Subtotal visível (fallback)
        if (!modal) {
            const subtotals = document.querySelectorAll('[class*="subtotal"], [class*="Subtotal"]');
            for (const sub of subtotals) {
                const style = window.getComputedStyle(sub);
                if (style.display !== 'none' && style.visibility !== 'hidden') {
                    // Subir até encontrar o container modal
                    let parent = sub.parentElement;
                    let depth = 0;
                    while (parent && parent !== document.body && depth < 10) {
                        if (parent.classList.contains('js-modal') ||
                            parent.id?.includes('modal') ||
                            parent.classList.toString().includes('modal')) {
                            modal = parent;
                            break;
                        }
                        parent = parent.parentElement;
                        depth++;
                    }
                    if (modal) break;
                }
            }
        }

        if (!modal) {
            return;
        }

        // Verificar se modal está visível
        const modalStyle = window.getComputedStyle(modal);
        const isVisible = modalStyle.display !== 'none' && modalStyle.visibility !== 'hidden';

        if (!isVisible) {
            return;
        }

        // Verificar se barra já existe
        if (modal.querySelector('#frete-gratis-bar-modal') || document.getElementById('frete-gratis-bar-modal')) {
            // Apenas atualizar
            updateFreteBarModal();
            return;
        }

        // Criar a barra
        const container = document.createElement("div");
        container.id = "frete-gratis-bar-modal";
        container.style.cssText = "margin: 15px; padding: 15px; background: #f5f5f5; border-radius: 10px;";

        const valorMinimo = getValorMinimo();
        const corPrimaria = getCorPrimaria();
        const progresso = Math.min((currentCartValue / valorMinimo) * 100, 100);
        let messageText = '';

        if (currentCartValue >= valorMinimo) {
            messageText = `Parabéns, você ganhou <span style="color: ${corPrimaria}; font-weight: bold;">FRETE GRÁTIS</span>`;
        } else if (currentCartValue > 0) {
            const faltando = valorMinimo - currentCartValue;
            messageText = `Falta apenas <span style="color: ${corPrimaria}; font-weight: bold;">${formatCurrency(faltando)}</span> para você ganhar <span style="color: ${corPrimaria}; font-weight: bold;">FRETE GRÁTIS</span>`;
        } else {
            messageText = `Compre <span style="color: ${corPrimaria}; font-weight: bold;">${formatCurrency(valorMinimo)}</span> e ganhe <span style="color: ${corPrimaria}; font-weight: bold;">FRETE GRÁTIS</span>`;
        }

        container.innerHTML = `
            <div style="position: relative; width: 100%; margin-bottom: 15px; padding-right: 25px;">
                <div style="width: 100%; height: 12px; background-color: #e0e0e0; border-radius: 6px; overflow: visible; position: relative;">
                    <div id="frete-bar-modal-fill" style="height: 100%; background: ${corPrimaria}; border-radius: 6px; transition: width 0.5s ease-out; width: ${progresso}%;"></div>
                    <div style="position: absolute; right: -20px; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; background: ${corPrimaria}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">🐻</div>
                </div>
            </div>
            <div id="frete-message-modal" style="text-align: center; font-size: 16px; color: #555; line-height: 1.6;">${messageText}</div>
        `;

        // INSERÇÃO: Múltiplos pontos de inserção para compatibilidade

        // Opção 1: Anchor do Hintup
        let insertPoint = modal.querySelector('[hintup-anchor="cart-after-list"]');
        if (insertPoint) {
            insertPoint.parentNode.insertBefore(container, insertPoint.nextSibling);
            modalInserted = true;
            return;
        }

        // Opção 2: Antes do subtotal (múltiplos seletores)
        const subtotalSelectors = ['.cart-panel-subtotal', '[class*="subtotal"]', '.cart-totals', '.cart-summary'];
        for (const sel of subtotalSelectors) {
            insertPoint = modal.querySelector(sel);
            if (insertPoint && !insertPoint.closest('#frete-gratis-bar-modal')) {
                insertPoint.parentNode.insertBefore(container, insertPoint);
                modalInserted = true;
                return;
            }
        }

        // Opção 3: Antes do botão de finalizar/checkout
        const btnSelectors = ['a[href*="checkout"]', 'a[href*="finalizar"]', '[class*="checkout"]', '[class*="finalizar"]'];
        for (const sel of btnSelectors) {
            insertPoint = modal.querySelector(sel);
            if (insertPoint) {
                insertPoint.parentNode.insertBefore(container, insertPoint);
                modalInserted = true;
                return;
            }
        }

        // Opção 4: Após a lista de itens
        const listSelectors = ['.js-ajax-cart-list', '[class*="cart-item"]:last-child', '.cart-items', '.cart-list'];
        for (const sel of listSelectors) {
            insertPoint = modal.querySelector(sel);
            if (insertPoint) {
                insertPoint.parentNode.insertBefore(container, insertPoint.nextSibling);
                modalInserted = true;
                return;
            }
        }

        // Opção 5: Container principal do modal
        const containerSelectors = ['.modal-body', '.modal-content', '.cart-content', '.drawer-content'];
        for (const sel of containerSelectors) {
            insertPoint = modal.querySelector(sel);
            if (insertPoint) {
                insertPoint.appendChild(container);
                modalInserted = true;
                return;
            }
        }

        // Opção 6: Fallback - inserir diretamente no modal
        modal.appendChild(container);
        modalInserted = true;
    }

    function insertBarInModal(modal) {
        // Função mantida para compatibilidade mas não mais usada
    }

    function createFreteBarModal(insertLocation) {
        const container = document.createElement("div");
        container.id = "frete-gratis-bar-modal";
        container.className = "frete-gratis-cart-container";

        container.innerHTML = `
            <div class="frete-gratis-cart-bar-wrapper">
                <div class="frete-gratis-cart-bar-bg">
                    <div class="frete-gratis-cart-bar-fill" id="frete-bar-modal-fill"></div>
                    <div class="frete-gratis-cart-icon">🐻</div>
                </div>
            </div>
            <div class="frete-gratis-cart-message" id="frete-message-modal">Carregando...</div>
        `;

        insertLocation.parentNode.insertBefore(container, insertLocation.nextSibling);

        // Atualizar imediatamente
        updateFreteBarModal();
    }

    // ============================
    // VERIFICAR SE É PÁGINA DE PRODUTO
    // ============================
    function isProductPage() {
        return document.querySelector('.js-product-container') ||
            document.querySelector('[data-product]') ||
            document.querySelector('.product-form') ||
            document.querySelector('.js-product-form') ||
            document.querySelector('.product-detail') ||
            window.location.pathname.includes('/productos/') ||
            window.location.pathname.includes('/products/');
    }

    // ============================
    // VERIFICAR SE É PÁGINA DE CARRINHO
    // ============================
    function isCartPage() {
        return window.location.pathname.includes('/cart') ||
            window.location.pathname.includes('/carrinho') ||
            window.location.pathname.includes('/carrito') ||
            document.querySelector('.cart-page') ||
            document.querySelector('.js-cart-page') ||
            document.querySelector('[data-store="cart"]') ||
            document.querySelector('.cart-table') ||
            document.querySelector('#cart-form');
    }

    // ============================
    // MODO FIXO - Valor único para todo Brasil
    // ============================
    function updateFreteBarFixo() {
        const container = document.getElementById('frete-gratis-bar');
        if (!container) return;

        const valorMinimo = parseFloat(settings.valor_fixo) || 99;
        const progresso = Math.min((currentCartValue / valorMinimo) * 100, 100);

        const barFill = document.getElementById('frete-bar-fill');
        const message = document.getElementById('frete-message');
        const indicator = document.getElementById('frete-indicator');

        if (indicator) indicator.textContent = formatCurrency(valorMinimo);
        if (barFill) barFill.style.width = `${progresso}%`;

        if (message) {
            if (currentCartValue >= valorMinimo) {
                message.innerHTML = `<span class="frete-gratis-sucesso">Parabéns, você ganhou <span class="frete-destaque">FRETE GRÁTIS</span></span>`;
            } else if (currentCartValue > 0) {
                const faltando = valorMinimo - currentCartValue;
                message.innerHTML = `Falta apenas <span class="valor-destaque">${formatCurrency(faltando)}</span> para você ganhar <span class="frete-destaque">FRETE GRÁTIS NA SUA COMPRA!</span> `;
            } else {
                message.innerHTML = `Aproveite: comprando a partir de <span class="valor-destaque">${formatCurrency(valorMinimo)}</span>, você ganha <span class="frete-destaque">FRETE GRÁTIS NA SUA COMPRA!</span> `;
            }
        }
    }





    // ============================
    // MODO POR REGIÃO - Com detecção
    // ============================
    function updateFreteBarPorRegiao() {
        const container = document.getElementById('frete-gratis-bar');
        if (!container) return;

        const barFill = document.getElementById('frete-bar-fill');
        const message = document.getElementById('frete-message');
        const indicator = document.getElementById('frete-indicator');

        // Se ainda não detectou a região, mostrar mensagem para calcular frete
        if (!regionDetected || !currentRegion) {
            if (indicator) indicator.textContent = "???";
            if (barFill) barFill.style.width = "0%";
            if (message) {
                message.innerHTML = `<span class="frete-aguardando">Faça o cálculo de frete para desbloquear seu <span class="frete-destaque">FRETE GRÁTIS!</span></span> 📦`;
            }
            return;
        }

        // Região detectada - mostrar valor específico
        const valorField = `valor_${currentRegion}`;
        const valorMinimo = parseFloat(settings[valorField]) || parseFloat(settings.valor_fixo) || 99;
        const regiaoNome = regiaoNomes[currentRegion] || "";
        const progresso = Math.min((currentCartValue / valorMinimo) * 100, 100);

        if (indicator) indicator.textContent = formatCurrency(valorMinimo);
        if (barFill) barFill.style.width = `${progresso}%`;

        if (message) {
            if (currentCartValue >= valorMinimo) {
                const regiaoText = regiaoNome ? ` (${regiaoNome})` : '';
                message.innerHTML = `<span class="frete-gratis-sucesso">Parabéns, você ganhou <span class="frete-destaque">FRETE GRÁTIS${regiaoText}</span></span>`;
            } else if (currentCartValue > 0) {
                const faltando = valorMinimo - currentCartValue;
                message.innerHTML = `Falta apenas <span class="valor-destaque">${formatCurrency(faltando)}</span> para você ganhar <span class="frete-destaque">FRETE GRÁTIS NA SUA COMPRA!</span> `;
            } else {
                message.innerHTML = `Aproveite: comprando a partir de <span class="valor-destaque">${formatCurrency(valorMinimo)}</span>, você ganha <span class="frete-destaque">FRETE GRÁTIS NA SUA COMPRA!</span> `;
            }
        }
    }

    // ============================
    // ATUALIZAR BARRA (DISPATCHER)
    // ============================
    function updateFreteBar() {
        if (settings.modo === "fixo") {
            updateFreteBarFixo();
        } else {
            updateFreteBarPorRegiao();
        }
        // Também atualizar barras do carrinho e modal se existirem
        updateFreteBarCart();
        updateFreteBarModal();

        // 🎯 STATE MACHINE — DISPARADOR DA ANIMAÇÃO
        const valorMinimo = getValorMinimo();
        const cartAbove = currentCartValue >= valorMinimo;


        // Verificar exaustão global (limite de 2 atingido)
        if (getAnimationCount() >= ANIM_MAX_COUNT && animState !== 'EXHAUSTED') {
            animState = 'EXHAUSTED';
        }

        switch (animState) {
            case 'COLD_START': {
                if (isInGracePeriod()) {
                    // Ainda dentro dos 10s — ir para GRACE e agendar expiração
                    animState = 'GRACE';
                    scheduleGraceExpiry();
                } else {
                    // Já passou dos 10s (improvável, mas seguro)
                    animState = cartAbove ? 'ABOVE' : 'BELOW';
                }
                break;
            }

            case 'GRACE': {
                // Durante o grace period, apenas atualizar a barra visual.
                break;
            }

            case 'BELOW': {
                if (cartAbove) {
                    // 🎉 Transição REAL de abaixo → acima!
                    if (getAnimationCount() < ANIM_MAX_COUNT) {
                        showFreteGratisAnimation();
                    }
                    animState = getAnimationCount() >= ANIM_MAX_COUNT ? 'EXHAUSTED' : 'ABOVE';
                }
                // Se continua abaixo, fica em BELOW
                break;
            }

            case 'ABOVE': {
                if (!cartAbove) {
                    animState = 'BELOW';
                }
                // Se continua acima, fica em ABOVE
                break;
            }

            case 'EXHAUSTED': {
                break;
            }
        }
    }

    // ============================
    // ATUALIZAR BARRA DO CARRINHO
    // ============================
    function updateFreteBarCart() {
        const container = document.getElementById('frete-gratis-bar-cart');
        if (!container) return;

        const valorMinimo = getValorMinimo();
        const progresso = Math.min((currentCartValue / valorMinimo) * 100, 100);

        const barFill = document.getElementById('frete-bar-cart-fill');
        const message = document.getElementById('frete-message-cart');

        if (barFill) barFill.style.width = `${progresso}%`;

        if (message) {
            if (currentCartValue >= valorMinimo) {
                message.innerHTML = `Parabéns, você ganhou <span class="font-bold text-black">FRETE GRÁTIS</span>`;
            } else if (currentCartValue > 0) {
                const faltando = valorMinimo - currentCartValue;
                message.innerHTML = `Falta apenas <span class="valor-destaque">${formatCurrency(faltando)}</span> para você ganhar <span class="frete-destaque">FRETE GRÁTIS</span>`;
            } else {
                message.innerHTML = `Comprando a partir de <span class="valor-destaque">${formatCurrency(valorMinimo)}</span>, você ganha <span class="frete-destaque">FRETE GRÁTIS</span>`;
            }
        }
    }

    // ============================
    // ATUALIZAR BARRA DO MODAL
    // ============================
    function updateFreteBarModal() {
        const container = document.getElementById('frete-gratis-bar-modal');
        if (!container) return;

        const valorMinimo = getValorMinimo();
        const progresso = Math.min((currentCartValue / valorMinimo) * 100, 100);

        const barFill = document.getElementById('frete-bar-modal-fill');
        const message = document.getElementById('frete-message-modal');

        if (barFill) barFill.style.width = `${progresso}%`;

        if (message) {
            if (currentCartValue >= valorMinimo) {
                message.innerHTML = `Parabéns, você ganhou <span class="font-bold text-black">FRETE GRÁTIS</span>`;
            } else if (currentCartValue > 0) {
                const faltando = valorMinimo - currentCartValue;
                message.innerHTML = `Falta apenas <span class="valor-destaque">${formatCurrency(faltando)}</span> para você ganhar <span class="frete-destaque">FRETE GRÁTIS</span>`;
            } else {
                message.innerHTML = `Comprando a partir de <span class="valor-destaque">${formatCurrency(valorMinimo)}</span>, você ganha<span class="frete-destaque">FRETE GRÁTIS</span>`;
            }
        }
    }

    // ============================
    // DETECTAR REGIÃO DO CLIENTE
    // ============================
    function detectCustomerRegion() {
        let state = null;

        // Múltiplos métodos de detecção...
        if (window.LS && window.LS.store) {
            if (window.LS.store.customer && window.LS.store.customer.default_address) {
                state = window.LS.store.customer.default_address.province ||
                    window.LS.store.customer.default_address.state;
            }
            if (!state && window.LS.store.shipping && window.LS.store.shipping.address) {
                state = window.LS.store.shipping.address.province ||
                    window.LS.store.shipping.address.state;
            }
        }

        // Via elementos DOM (CEP/Estado)
        if (!state) {
            const stateSelectors = [
                '#shipping_address_province', '[name="shipping_address[province]"]',
                '.js-shipping-province', 'select[name*="province"]'
            ];
            for (const selector of stateSelectors) {
                const element = document.querySelector(selector);
                if (element && element.value) {
                    state = element.value.trim();
                    break;
                }
            }
        }

        // Via CEP
        if (!state) {
            const cepSelectors = [
                '#shipping_address_zipcode', '[name="shipping_address[zipcode]"]',
                '.js-shipping-zipcode', 'input[name*="cep"]', 'input[name*="zipcode"]'
            ];
            for (const selector of cepSelectors) {
                const element = document.querySelector(selector);
                if (element && element.value) {
                    const cep = element.value.replace(/\D/g, '');
                    if (cep.length >= 5) {
                        state = getStateFromCEP(cep);
                        break;
                    }
                }
            }
        }

        // Via localStorage
        if (!state) {
            try {
                const savedState = localStorage.getItem('frete_gratis_estado');
                if (savedState) state = savedState;
            } catch (e) { }
        }

        if (state) {
            setRegionByState(state);
        }
    }

    // ============================
    // OBTER ESTADO A PARTIR DO CEP
    // ============================
    function getStateFromCEP(cep) {
        const cepNum = parseInt(cep.substring(0, 5));
        if (cepNum >= 1000 && cepNum <= 19999) return "SP";
        if (cepNum >= 20000 && cepNum <= 28999) return "RJ";
        if (cepNum >= 29000 && cepNum <= 29999) return "ES";
        if (cepNum >= 30000 && cepNum <= 39999) return "MG";
        if (cepNum >= 40000 && cepNum <= 48999) return "BA";
        if (cepNum >= 49000 && cepNum <= 49999) return "SE";
        if (cepNum >= 50000 && cepNum <= 56999) return "PE";
        if (cepNum >= 57000 && cepNum <= 57999) return "AL";
        if (cepNum >= 58000 && cepNum <= 58999) return "PB";
        if (cepNum >= 59000 && cepNum <= 59999) return "RN";
        if (cepNum >= 60000 && cepNum <= 63999) return "CE";
        if (cepNum >= 64000 && cepNum <= 64999) return "PI";
        if (cepNum >= 65000 && cepNum <= 65999) return "MA";
        if (cepNum >= 66000 && cepNum <= 68899) return "PA";
        if (cepNum >= 68900 && cepNum <= 68999) return "AP";
        if (cepNum >= 69000 && cepNum <= 69299) return "AM";
        if (cepNum >= 69300 && cepNum <= 69399) return "RR";
        if (cepNum >= 69400 && cepNum <= 69899) return "AM";
        if (cepNum >= 69900 && cepNum <= 69999) return "AC";
        if (cepNum >= 70000 && cepNum <= 73699) return "DF";
        if (cepNum >= 73700 && cepNum <= 76799) return "GO";
        if (cepNum >= 76800 && cepNum <= 76999) return "RO";
        if (cepNum >= 77000 && cepNum <= 77999) return "TO";
        if (cepNum >= 78000 && cepNum <= 78899) return "MT";
        if (cepNum >= 79000 && cepNum <= 79999) return "MS";
        if (cepNum >= 80000 && cepNum <= 87999) return "PR";
        if (cepNum >= 88000 && cepNum <= 89999) return "SC";
        if (cepNum >= 90000 && cepNum <= 99999) return "RS";
        return null;
    }

    // ============================
    // DEFINIR REGIÃO PELO ESTADO
    // ============================
    function setRegionByState(state) {
        const uf = state.length === 2 ? state.toUpperCase() : normalizeState(state);
        if (!uf) return;

        const regiao = estadoParaRegiao[uf];
        if (regiao) {
            currentRegion = regiao;
            regionDetected = true;
            try { localStorage.setItem('frete_gratis_estado', uf); } catch (e) { }
            updateFreteBar();
        }
    }

    function normalizeState(state) {
        const nomes = {
            "acre": "AC", "alagoas": "AL", "amapa": "AP", "amazonas": "AM",
            "bahia": "BA", "ceara": "CE", "distrito federal": "DF", "espirito santo": "ES",
            "goias": "GO", "maranhao": "MA", "mato grosso": "MT", "mato grosso do sul": "MS",
            "minas gerais": "MG", "para": "PA", "paraiba": "PB", "parana": "PR",
            "pernambuco": "PE", "piaui": "PI", "rio de janeiro": "RJ",
            "rio grande do norte": "RN", "rio grande do sul": "RS", "rondonia": "RO",
            "roraima": "RR", "santa catarina": "SC", "sao paulo": "SP",
            "sergipe": "SE", "tocantins": "TO"
        };
        const normalized = state.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return nomes[normalized] || null;
    }

    // ============================
    // CONVERTER VALOR PARA NÚMERO
    // ============================
    function parseCartValue(value) {
        if (value === null || value === undefined) return 0;

        // Se já é número
        if (typeof value === 'number') {
            // Nuvemshop retorna valores em centavos (ex: 9900 = R$ 99,00)
            // Se o valor for maior que 10000 e não tiver decimais, provavelmente está em centavos
            if (value > 10000 && value % 100 === 0) {
                return value / 100;
            }
            return value;
        }

        if (typeof value === 'string') {
            // Remove R$, espaços
            let cleaned = value.replace(/[R$\s]/g, '').trim();

            // Se string vazia
            if (!cleaned) return 0;

            // Detectar formato: "1.234,56" (BR) vs "1234.56" (US)
            const hasComma = cleaned.includes(',');
            const hasDot = cleaned.includes('.');

            if (hasComma && hasDot) {
                // Formato BR: 1.234,56 -> remove pontos, troca vírgula por ponto
                cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            } else if (hasComma && !hasDot) {
                // Pode ser 1234,56 ou 1,234
                // Se tem apenas uma vírgula e 2 dígitos depois, é decimal
                const parts = cleaned.split(',');
                if (parts[1] && parts[1].length === 2) {
                    cleaned = cleaned.replace(',', '.');
                } else {
                    // Vírgula é separador de milhar
                    cleaned = cleaned.replace(/,/g, '');
                }
            }
            // Se só tem ponto, pode ser 1234.56 (decimal) ou 1.234 (milhar BR)
            // Assumir que se tem ponto e 2 dígitos depois, é decimal

            const numValue = parseFloat(cleaned);
            if (isNaN(numValue)) return 0;

            // Verificar se está em centavos
            if (numValue > 10000 && numValue % 100 === 0) {
                return numValue / 100;
            }

            return numValue;
        }

        return 0;
    }

    // ============================
    // OBTER VALOR INICIAL DO CARRINHO
    // ============================
    function getInitialCartValue() {
        let value = 0;

        // PRIMEIRO: Verificar se carrinho está vazio (mensagem visível)
        // Isso deve ser verificado ANTES de qualquer leitura de valor pois o DOM pode ter valores desatualizados
        const emptyCartEl = document.querySelector('.js-empty-ajax-cart');
        if (emptyCartEl) {
            const style = window.getComputedStyle(emptyCartEl);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
                // Carrinho está vazio - retornar 0 imediatamente
                currentCartValue = 0;
                updateFreteBar();
                return;
            }
        }

        // PRIORIDADE 1: DOM texto - PRIORIZAR TOTAL (com descontos) antes de SUBTOTAL
        const domSelectors = [
            // Total (com descontos aplicados) - PRIORIDADE MÁXIMA
            '.cart-total',
            '.js-cart-total',
            '#cart-total',
            '[data-cart-total]',
            '.minicart-total',
            '.cart-popup-total',
            '.drawer-cart-total',
            '.cart-drawer-total',
            '.ajax-cart-total',
            // Modal específico - procurar pela linha "Total:" 
            '.modal-body .total .js-price',
            '.modal-body [class*="total"]:not([class*="subtotal"]) .js-price',
            // Subtotal (fallback se total não existir)
            '.js-ajax-cart-total',
            '.js-cart-widget-subtotal',
            '.cart-subtotal .js-price',
            '[data-component="cart.subtotal"]',
            '.minicart-subtotal',
            '.cart-popup-subtotal',
            '.js-cart-subtotal',
            '.header-cart-total',
            '.drawer-cart-subtotal',
            '.cart-drawer-subtotal',
            '.ajax-cart-subtotal'
        ];

        for (const selector of domSelectors) {
            const el = document.querySelector(selector);
            if (el) {
                const text = el.textContent || el.innerText || '';
                const parsed = parseCartValue(text);
                if (parsed > 0) {
                    value = parsed;
                    break;
                }
            }
        }

        // PRIORIDADE 1.5: Buscar linha específica "Total:" no modal (ignora Subtotal)
        if (value === 0) {
            // Procurar por todos os elementos que contenham texto "Total"
            const allElements = document.querySelectorAll('.modal-body *, .js-modal *');
            for (const el of allElements) {
                const text = el.textContent?.trim() || '';
                // Se encontrar "Total:" mas NÃO "Subtotal"
                if (text.startsWith('Total:') || text === 'Total') {
                    // Procurar o valor no próximo elemento ou no pai
                    const parent = el.parentElement;
                    if (parent) {
                        const priceEl = parent.querySelector('.js-price, [class*="price"]');
                        if (priceEl) {
                            const parsed = parseCartValue(priceEl.textContent || '');
                            if (parsed > 0) {
                                value = parsed;
                                break;
                            }
                        }
                    }
                }
            }
        }

        // PRIORIDADE 2: data-priceraw (atributo em centavos)
        if (value === 0) {
            const priceRawEl = document.querySelector('.js-cart-total[data-priceraw], .js-cart-subtotal[data-priceraw], [data-component="cart.subtotal"][data-priceraw]');
            if (priceRawEl) {
                const rawValue = parseInt(priceRawEl.getAttribute('data-priceraw')) || 0;
                if (rawValue > 0) {
                    value = rawValue / 100;
                }
            }
        }

        // PRIORIDADE 3: LS.store.cart
        if (value === 0 && window.LS && window.LS.store && window.LS.store.cart) {
            const cart = window.LS.store.cart;
            const rawValue = cart.total || cart.subtotal || 0;
            if (typeof rawValue === 'number' && rawValue > 0) {
                value = rawValue / 100;
            }
        }

        // PRIORIDADE 4: LS.cart
        if (value === 0 && window.LS && window.LS.cart) {
            const rawValue = window.LS.cart.total || window.LS.cart.subtotal || 0;
            if (typeof rawValue === 'number' && rawValue > 0) {
                value = rawValue / 100;
            }
        }

        // PRIORIDADE 5: Calcular a partir dos items
        if (value === 0 && window.LS && window.LS.store && window.LS.store.cart && window.LS.store.cart.items) {
            const items = window.LS.store.cart.items;
            if (items && items.length > 0) {
                let totalCents = 0;
                for (const item of items) {
                    const price = item.price || item.unit_price || 0;
                    const qty = parseInt(item.quantity) || parseInt(item.qty) || 1;
                    totalCents += price * qty;
                }
                if (totalCents > 0) {
                    value = totalCents / 100;
                }
            }
        }

        // Atualizar o valor
        currentCartValue = value;
        updateFreteBar();
    }

    // ============================
    // AGENDAR ATUALIZAÇÃO DO CARRINHO (com debounce)
    // ============================
    let cartUpdateTimeout = null;
    function scheduleCartUpdate() {
        // Debounce: esperar 500ms antes de atualizar
        if (cartUpdateTimeout) clearTimeout(cartUpdateTimeout);
        cartUpdateTimeout = setTimeout(() => {
            getInitialCartValue();
        }, 500);

        // Também agendar atualizações subsequentes para garantir
        setTimeout(getInitialCartValue, 1500);
        setTimeout(getInitialCartValue, 3000);
    }

    // ============================
    // INTERCEPTAR CARRINHO
    // ============================
    function setupCartInterception() {
        // NOTA: Não interceptamos funções LS diretamente para evitar conflitos
        // com o código da Nuvemshop. Usamos outras formas de detecção.

        // Cliques em botões de adicionar/remover/alterar quantidade
        document.addEventListener('click', function (e) {
            const target = e.target;
            const clickSelectors = [
                '.js-addtocart', '.js-add-to-cart', '[data-add-to-cart]',
                '.js-item-remove', '.js-cart-remove', '[data-remove-from-cart]',
                '.js-item-quantity-btn', '.js-cart-item-quantity',
                '.cart-item-quantity-btn', '.quantity-btn',
                '.js-cart-item-delete', '.cart-item-delete',
                'button[data-item-id]', '[data-cart-action]',
                '.fa-plus', '.fa-minus', '.fa-trash',
                '.btn-plus', '.btn-minus', '.btn-remove'
            ];

            if (clickSelectors.some(sel => target.closest(sel))) {
                scheduleCartUpdate();
            }
        }, true);

        // Mudanças em inputs de quantidade
        document.addEventListener('change', function (e) {
            if (e.target.name && (
                e.target.name.includes('quantity') ||
                e.target.name.includes('qty') ||
                e.target.classList.contains('js-item-quantity')
            )) {
                scheduleCartUpdate();
            }

            // CEP/estado
            if (e.target.name && (e.target.name.includes('province') || e.target.name.includes('zipcode') || e.target.name.includes('cep'))) {
                setTimeout(detectCustomerRegion, 500);
            }
        });

        // Input de CEP em tempo real
        document.addEventListener('input', function (e) {
            if (e.target.name && (e.target.name.includes('zipcode') || e.target.name.includes('cep'))) {
                const cep = e.target.value.replace(/\D/g, '');
                if (cep.length >= 8) {
                    setTimeout(detectCustomerRegion, 300);
                }
            }
        });

        // Interceptar requisições AJAX/fetch para detectar mudanças no carrinho
        const originalFetch = window.fetch;
        window.fetch = function (...args) {
            const result = originalFetch.apply(this, args);
            const url = args[0]?.toString() || '';
            if (url.includes('cart') || url.includes('carrinho')) {
                result.then(() => scheduleCartUpdate());
            }
            return result;
        };

        // Interceptar XMLHttpRequest
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (method, url, ...rest) {
            this._url = url;
            return originalOpen.apply(this, [method, url, ...rest]);
        };

        const originalSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function (...args) {
            this.addEventListener('load', function () {
                if (this._url && (this._url.includes('cart') || this._url.includes('carrinho'))) {
                    scheduleCartUpdate();
                }
            });
            return originalSend.apply(this, args);
        };

        // MutationObserver mais abrangente
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                // Verificar elementos adicionados/removidos
                if (mutation.type === 'childList') {
                    const target = mutation.target;
                    const targetClasses = target.classList?.toString() || '';
                    const targetId = target.id || '';

                    if (targetClasses.includes('cart') || targetId.includes('cart') ||
                        targetClasses.includes('minicart') || targetId.includes('minicart')) {
                        scheduleCartUpdate();
                        break;
                    }
                }

                // Verificar mudanças de texto em totais
                if (mutation.type === 'characterData') {
                    const parent = mutation.target.parentElement;
                    if (parent?.classList && (
                        parent.classList.contains('js-cart-total') ||
                        parent.classList.contains('cart-total') ||
                        parent.classList.contains('js-ajax-cart-total')
                    )) {
                        scheduleCartUpdate();
                        break;
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });

        // Polling de segurança a cada 3 segundos
        setInterval(getInitialCartValue, 3000);
    }

    // ============================
    // FORMATAR MOEDA
    // ============================
    function formatCurrency(value) {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    }

    // ============================
    // INJETAR ESTILOS
    // ============================
    function injectStyles() {
        const s = settings;
        const primaryColor = s.cor_primaria || "#9b59b6";
        const bgColor = s.cor_fundo || "#e0e0e0";
        const textColor = s.cor_texto || "#666666";

        const style = document.createElement("style");
        style.id = "frete-gratis-bar-styles";
        style.textContent = `
            .frete-gratis-container {
                width: 100%;
                margin: 15px 0;
                padding: 15px;
                box-sizing: border-box;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: ${bgColor};
                border-radius: 8px;
            }
            .frete-gratis-bar-wrapper {
                position: relative;
                width: 100%;
                margin-bottom: 10px;
            }
            .frete-gratis-bar-bg {
                width: 100%;
                height: 6px;
                background-color: rgba(255, 255, 255, 0.5);
                border-radius: 3px;
                overflow: hidden;
            }
            .frete-gratis-bar-fill {
                height: 100%;
                background: ${primaryColor};
                border-radius: 3px;
                transition: width 0.5s ease-out;
                width: 0%;
            }
            .frete-gratis-bar-indicator {
                position: absolute;
                right: 0;
                top: -22px;
                font-size: 12px;
                color: ${textColor};
                font-weight: 500;
            }
            .frete-gratis-message {
                text-align: center;
                font-size: 14px;
                color: ${textColor};
                line-height: 1.5;
            }
            .frete-gratis-message .valor-destaque,
            .frete-gratis-message .frete-destaque {
                color: ${primaryColor};
                font-weight: 700;
            }
            .frete-gratis-sucesso { color: ${primaryColor}; font-weight: 600; }
            .frete-aguardando { color: ${textColor}; font-weight: 500; }
            .frete-gratis-container { animation: fadeInUp 0.4s ease-out; }
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* Estilos para barra do carrinho */
            .frete-gratis-cart-container {
                width: 100%;
                margin: 25px 0;
                padding: 20px;
                box-sizing: border-box;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #f5f5f5;
                border-radius: 10px;
                animation: fadeInUp 0.4s ease-out;
            }
            .frete-gratis-cart-bar-wrapper {
                position: relative;
                width: 100%;
                margin-bottom: 20px;
            }
            .frete-gratis-cart-bar-bg {
                width: 100%;
                height: 12px;
                background-color: #e0e0e0;
                border-radius: 6px;
                overflow: visible;
                position: relative;
            }
            .frete-gratis-cart-bar-fill {
                height: 100%;
                background: ${primaryColor};
                border-radius: 6px;
                transition: width 0.5s ease-out;
                width: 0%;
            }
            .frete-gratis-cart-icon {
                position: absolute;
                right: -15px;
                top: 50%;
                transform: translateY(-50%);
                width: 40px;
                height: 40px;
                background: ${primaryColor};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                color: white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }
            .frete-gratis-cart-message {
                text-align: center;
                font-size: 18px;
                color: #555;
                line-height: 1.6;
            }
            .frete-gratis-cart-message .frete-destaque {
                color: ${primaryColor};
                font-weight: 700;
                font-size: 22px;
                display: block;
                margin-top: 5px;
            }
            .frete-gratis-cart-message .valor-destaque {
                color: ${primaryColor};
                font-weight: 700;
            }

            /* === ANIMAÇÃO DE FRETE GRÁTIS DESBLOQUEADO === */
            #frete-gratis-anim {
                position: fixed;
                inset: 0;
                background: transparent;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.5s ease;
            }

            #frete-gratis-anim.show {
                opacity: 1;
                pointer-events: all;
            }

            .frete-anim-container {
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                z-index: 10;
                padding: 25px 35px;
            }

            /* Desfoque gradual com mask-image para transição perfeitamente suave */
            .frete-anim-blur {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.1);
                width: 500px;
                height: 500px;
                border-radius: 50%;
                backdrop-filter: blur(5px);
                -webkit-backdrop-filter: blur(5px);
                background: rgba(255, 255, 255, 0.04);
                mask-image: radial-gradient(circle, rgba(0,0,0,1) 20%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 80%);
                -webkit-mask-image: radial-gradient(circle, rgba(0,0,0,1) 20%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 80%);
                z-index: 1;
                opacity: 0;
            }

            #frete-gratis-anim.show .frete-anim-blur {
                animation: blurFadeIn 2.8s ease-out forwards;
            }

            @keyframes blurFadeIn {
                0%   { transform: translate(-50%, -50%) scale(0.1); opacity: 0; }
                10%  { transform: translate(-50%, -50%) scale(0.2); opacity: 0.15; }
                20%  { transform: translate(-50%, -50%) scale(0.35); opacity: 0.3; }
                30%  { transform: translate(-50%, -50%) scale(0.5); opacity: 0.5; }
                40%  { transform: translate(-50%, -50%) scale(0.65); opacity: 0.65; }
                50%  { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
                60%  { transform: translate(-50%, -50%) scale(0.9); opacity: 0.9; }
                70%  { transform: translate(-50%, -50%) scale(1.0); opacity: 1; }
                85%  { transform: translate(-50%, -50%) scale(1.0); opacity: 1; }
                92%  { transform: translate(-50%, -50%) scale(1.0); opacity: 0.6; }
                100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0; }
            }

            .frete-anim-urso {
                width: 260px;
                height: auto;
                transform: scale(0.05);
                opacity: 0;
            }

            #frete-gratis-anim.show .frete-anim-urso {
                animation: ursoBounce 2.8s ease-out forwards;
            }

            @keyframes ursoBounce {
                0% {
                    transform: scale(0.05);
                    opacity: 0;
                }
                5% {
                    transform: scale(0.13);
                    opacity: 0.15;
                }
                10% {
                    transform: scale(0.2);
                    opacity: 0.25;
                }
                15% {
                    transform: scale(0.29);
                    opacity: 0.35;
                }
                20% {
                    transform: scale(0.39);
                    opacity: 0.45;
                }
                25% {
                    transform: scale(0.49);
                    opacity: 0.55;
                }
                30% {
                    transform: scale(0.6);
                    opacity: 0.65;
                }
                35% {
                    transform: scale(0.7);
                    opacity: 0.72;
                }
                40% {
                    transform: scale(0.81);
                    opacity: 0.78;
                }
                45% {
                    transform: scale(0.91);
                    opacity: 0.84;
                }
                50% {
                    transform: scale(1.0);
                    opacity: 0.88;
                }
                55% {
                    transform: scale(1.09);
                    opacity: 0.92;
                }
                60% {
                    transform: scale(1.17);
                    opacity: 0.95;
                }
                65% {
                    transform: scale(1.24);
                    opacity: 0.98;
                }
                70% {
                    transform: scale(1.3);
                    opacity: 1;
                }
                75% {
                    transform: scale(1.3);
                    opacity: 1;
                }
                85% {
                    transform: scale(1.3);
                    opacity: 1;
                }
                92% {
                    transform: scale(1.3);
                    opacity: 0.8;
                }
                100% {
                    transform: scale(1.15);
                    opacity: 0;
                }
            }

            /* Responsivo para mobile */
            @media (max-width: 480px) {
                .frete-anim-urso {
                    width: 195px;
                }
                .frete-anim-blur {
                    width: 380px;
                    height: 380px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ============================
    // CRIAR BARRA
    // ============================
    function createFreteBar() {
        const container = document.createElement("div");
        container.id = "frete-gratis-bar";
        container.className = "frete-gratis-container";

        container.innerHTML = `
            <div class="frete-gratis-bar-wrapper">
                <div class="frete-gratis-bar-bg">
                    <div class="frete-gratis-bar-fill" id="frete-bar-fill"></div>
                </div>
            </div>
            <div class="frete-gratis-message" id="frete-message">Carregando...</div>
        `;

        const insertLocation = findInsertLocation();
        if (insertLocation) {
            insertLocation.parentNode.insertBefore(container, insertLocation.nextSibling);
        }
    }

    function findInsertLocation() {
        const selectors = [
            '.js-addtocart', '.js-add-to-cart', '[data-add-to-cart]',
            '.product-form__submit', '.product-buy-button',
            '.js-product-form button[type="submit"]', '.product-form'
        ];
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.tagName === 'BUTTON' || element.tagName === 'INPUT'
                    ? element.closest('div') || element.parentElement
                    : element;
            }
        }
        return document.querySelector('.js-product-container');
    }

    // ============================
    // CRIAR BARRA PARA PÁGINA DE CARRINHO
    // ============================
    function createFreteBarCart() {
        const container = document.createElement("div");
        container.id = "frete-gratis-bar-cart";
        container.className = "frete-gratis-cart-container";

        container.innerHTML = `
            <div class="frete-gratis-cart-bar-wrapper">
                <div class="frete-gratis-cart-bar-bg">
                    <div class="frete-gratis-cart-bar-fill" id="frete-bar-cart-fill"></div>
                    <div class="frete-gratis-cart-icon">🐻</div>
                </div>
            </div>
            <div class="frete-gratis-cart-message" id="frete-message-cart">Carregando...</div>
        `;

        const insertLocation = findCartInsertLocation();
        if (insertLocation) {
            insertLocation.parentNode.insertBefore(container, insertLocation.nextSibling);
        }
    }

    function findCartInsertLocation() {
        // 1) Melhor lugar: antes do subtotal/resumo (se existir)
        const beforeSelectors = [
            '[hintup-anchor="cart-after-list"]',
            '.cart-panel-subtotal',
            '.cart-subtotal',
            '[data-component="cart.subtotal"]',
            '.cart-summary',
            '.cart-totals',
            '.summary',
            '.subtotal'
        ];

        for (const selector of beforeSelectors) {
            const el = document.querySelector(selector);
            if (el) return { element: el, where: 'beforebegin' };
        }

        // 2) Segundo melhor: depois da lista/tabela de itens (âncoras seguras)
        const afterSelectors = [
            '.js-ajax-cart-list',
            '.cart-items',
            '.cart-list',
            '.js-cart-item-list',
            '.cart-table',     // ✅ TABLE (ok)
            '#cart-form',      // ✅ FORM (ok)
            '[data-store="cart"]'
        ];

        for (const selector of afterSelectors) {
            const el = document.querySelector(selector);
            if (el) return { element: el, where: 'afterend' };
        }

        return null;
    }

    // ============================
    // API PÚBLICA
    // ============================
    window.FreteGratis = {
        setRegion: (regiao) => { currentRegion = regiao; regionDetected = true; updateFreteBar(); },
        setState: setRegionByState,
        setCartValue: (value) => { currentCartValue = parseCartValue(value); updateFreteBar(); },
        getConfig: () => settings,
        getCartValue: () => currentCartValue,
        getAnimState: () => animState,
        getAnimCount: () => getAnimationCount(),
        refresh: () => { detectCustomerRegion(); getInitialCartValue(); },
        debug: () => {
            console.log("[Frete Grátis] DEBUG INFO:");
            console.log("  - Cart Value:", currentCartValue);
            console.log("  - Anim State:", animState);
            console.log("  - Anim Count:", getAnimationCount(), "/", ANIM_MAX_COUNT);
            console.log("  - Grace Remaining:", Math.max(0, GRACE_PERIOD_MS - (Date.now() - scriptInitTimestamp)), "ms");
            console.log("  - Region:", currentRegion);
            console.log("  - Valor Mínimo:", getValorMinimo());
            console.log("  - Settings:", settings);
        }
    };

    // ============================
    // INICIAR
    // ============================
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(init, 150);
    } else {
        document.addEventListener("DOMContentLoaded", () => setTimeout(init, 150));
    }
})();