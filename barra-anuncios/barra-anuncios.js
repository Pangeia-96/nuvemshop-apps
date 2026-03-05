(async function () {
    'use strict';

    const app_id = 'p96-announcement-bar';
    if (window.BarraAnunciosLoaded) return;
    window.BarraAnunciosLoaded = true;

    // Configuração Supabase
    const SUPABASE_URL = "https://ijojpaziiqdjplunfbjj.supabase.co";
    const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqb2pwYXppaXFkanBsdW5mYmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTk5ODQsImV4cCI6MjA3MTk3NTk4NH0.H5nbOF6_kvOoVRLuLoCZXn4n1U21d2jqqQ6ojksjUKI";
    const SETTINGS_URL = `${SUPABASE_URL}/rest/v1/barra_anuncios?select=*&id=eq.1&apikey=${SUPABASE_ANON}`;

    async function init() {
        try {
            //Aguarda a section ser criada
            if (document.readyState === "loading") {
                await new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve));
            }

            const response = await fetch(SETTINGS_URL);
            if (!response.ok) throw new Error('Falha na comunicação com o banco');
            const [config] = await response.json();

            if (!config || !Array.isArray(config.itens)) return;

            injectAssets();
            renderBar(config);
            setupPerformanceObserver();

        } catch (e) {
            console.error("[Barra Anúncios] Erro de inicialização:", e);
        }
    }

    function injectAssets() {
        const assets = [
            { id: 'p96-font-inter', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap' },
            { id: 'p96-bs-icons', href: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css' }
        ];

        assets.forEach(asset => {
            if (!document.getElementById(asset.id)) {
                const link = document.createElement('link');
                link.id = asset.id;
                link.rel = 'stylesheet';
                link.href = asset.href;
                document.head.appendChild(link);
            }
        });
    }

    function renderBar(config) {
        //Elemento Banner para inserção apos
        const target = document.querySelector('section.section-slider');

        if (!target) {
            console.warn("[Barra Anúncios] Alvo 'section.section-slider' não encontrado. Abortando inserção.");
            return;
        }

        const angulo = config.gradiente_angulo || '135';
        const bg = (config.gradiente_cor1 && config.gradiente_cor2)
            ? `linear-gradient(${angulo}deg, ${config.gradiente_cor1}, ${config.gradiente_cor2})`
            : (config.cor_fundo || '#000');

        const style = document.createElement('style');
        style.textContent = `
            #${app_id} {
                width: 100%; background: ${bg} !important;
                overflow: hidden; height: 42px; display: flex;
                align-items: center; position: relative; z-index: 999;
                contain: paint; 
            }
            .p96-track {
                display: flex; white-space: nowrap;
                animation: p96-loop ${config.velocidade || '40s'} linear infinite;
                will-change: transform;
            }
            .p96-unit {
                display: flex; align-items: center;
                color: ${config.cor_texto || '#fff'}; font-family: 'Inter', sans-serif;
                font-size: 12px; font-weight: 600; text-transform: uppercase;
                padding: 0 45px;
            }
            .p96-unit i { margin-right: 12px; font-size: 16px; display: flex; align-items: center; }
            .p96-unit::after { 
                content: "•"; margin-left: 45px; 
                opacity: 0.3; color: ${config.cor_texto || '#fff'}; 
            }
            @keyframes p96-loop {
                from { transform: translate3d(0, 0, 0); }
                to { transform: translate3d(-50%, 0, 0); }
            }
            #${app_id}.paused .p96-track { animation-play-state: paused; }
            @media (max-width: 768px) {
                #${app_id} { height: 36px; }
                .p96-unit { font-size: 10px; padding: 0 25px; }
                .p96-unit::after { margin-left: 25px; }
            }
        `;

        const itemsHtml = config.itens.map(item => `
            <div class="p96-unit">
                <i class="bi ${item.icone}"></i>
                <span>${item.texto}</span>
            </div>
        `).join('');

        const marqueeDiv = document.createElement('div');
        marqueeDiv.id = app_id;
        marqueeDiv.innerHTML = `<div class="p96-track">${itemsHtml}${itemsHtml}</div>`;

        document.head.appendChild(style);

        //Insere somente apos a section
        target.parentNode.insertBefore(marqueeDiv, target.nextSibling);
    }

    function setupPerformanceObserver() {
        const bar = document.getElementById(app_id);
        if (!bar || !('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                entry.isIntersecting ? bar.classList.remove('paused') : bar.classList.add('paused');
            });
        }, { threshold: 0 });

        observer.observe(bar);
    }

    init();
})();