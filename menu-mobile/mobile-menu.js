(function () {
    //Configurações
    const CONFIG = {
        colors: {
            festa: '#E8115B', trabalho: '#148A08', balada: '#8D67AB',
            dia: '#F037A5', noite: '#1E3264', casual: '#FF4632', elegante: '#50371F'
        },
        momentos: [
            { t: 'ROUPAS PARA FESTA', c: '#E8115B', i: 'bi-stars' },
            { t: 'ROUPAS PARA TRABALHO', c: '#148A08', i: 'bi-briefcase' },
            { t: 'ROUPAS PARA BALADA', c: '#8D67AB', i: 'bi-music-note-beamed' },
            { t: 'LOOKS PARA O DIA', c: '#F037A5', i: 'bi-sun' },
            { t: 'LOOKS PARA A NOITE', c: '#477D95', i: 'bi-moon-stars' },
            { t: 'CONFORTO', c: '#FF4632', i: 'bi-house-heart' }
        ]
    };

    //Dependências
    const links = [
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;900&display=swap',
        'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css'
    ];
    links.forEach(href => {
        if (!document.querySelector(`link[href="${href}"]`)) {
            const l = document.createElement('link');
            l.rel = 'stylesheet'; l.href = href;
            document.head.appendChild(l);
        }
    });

    //CSS
    const style = document.createElement('style');
    style.innerHTML = `
        .modal-nav-hamburger {position: fixed !important; top: 0; left: 0; width: 100vw; height: 100vh; background: #fff; z-index: 99999; }
        .modal-nav-hamburger .nav-primary { display: none !important; }
        
        #pangeia-menu { font-family: 'Inter', sans-serif; padding:10px 5px; background: #fff; height: 100%; overflow-y: auto; }
        .pg-title { font-size: 22px; font-weight: 900; margin: 10px 5px; color: #000; letter-spacing: -1px; }

        /*Cards */
        .pg-card { position: relative; overflow: hidden; text-decoration: none; border-radius: 14px; display: flex; padding: 20px 0px 20px 14px; transition: transform 0.1s; }
        .pg-card:active { transform: scale(0.96); }
        .pg-card b { color: #fff; font-weight: 900; font-size: 15px; line-height: 1; z-index: 5; text-transform: uppercase; width: 100%; }
        .pg-card i { position: absolute; right: -15px; bottom: -10px; font-size: 90px; color: rgba(255,255,255,0.3); transform: rotate(20deg); z-index: 1; }

        /* Bloco 1*/
        .pg-carousel { overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        .pg-carousel::-webkit-scrollbar { display: none; }
        .pg-track { display: flex; gap: 10px; }
        .pg-track .pg-card { flex: 0 0 calc(70% / 2.4); aspect-ratio: 1/1; }

        /* Bloco 2 */
        .pg-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
        .pg-col-12 { flex: 0 0 100%; min-height: 110px; }
        .pg-col-6 { flex: 0 0 calc(50% - 5px); min-height: 140px; }

        /* Bloco 3*/
        .pg-bubbles { display: flex; justify-content: space-around; margin: 40px 0; }
        .pg-bubble-item { text-decoration: none; display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .pg-circle { 
            width: 75px; height: 75px; 
            background: #f3e5f5; 
            border: 3px solid #6a1b9a;
            border-radius: 50%; display: flex; align-items: center; justify-content: center; 
            font-size: 28px; color: #6a1b9a;
            box-shadow: 0 8px 15px rgba(106, 27, 154, 0.15); 
        }
        .pg-bubble-item span { font-size: 13px; color: #4a148c; font-weight: 900; text-transform: uppercase; }
    `;
    document.head.appendChild(style);

    //Função de Injeção
    function injectLayout() {
        if (document.querySelector('#pangeia-menu')) return;
        const target = document.querySelector('.modal-nav-hamburger .modal-body');
        if (!target) return;

        const container = document.createElement('div');
        container.id = 'pangeia-menu';

        //Bloco 1
        let b1 = `<div class="pg-carousel"><div class="pg-track">`;
        CONFIG.momentos.forEach(m => {
            b1 += `<a href="#" class="pg-card" style="background:${m.c}"><b>${m.t}</b><i class="bi ${m.i}"></i></a>`;
        });
        b1 += `</div></div>`;

        //Bloco 2
        let b2 = `
            <h2 class="pg-title">Categorias</h2>
            <div class="pg-grid">
                <a href="/calcas" class="pg-card pg-col-12" style="background:#BA5D07"><b>Calças</b><i class="bi bi-tags"></i></a>
                <a href="/bodies" class="pg-card pg-col-6" style="background:#AF2896"><b>Bodies</b><i class="bi bi-heart"></i></a>
                <a href="/tops" class="pg-card pg-col-6" style="background:#608108"><b>Tops</b><i class="bi bi-suit-heart-fill"></i></a>
                <a href="/vestidos" class="pg-card pg-col-6" style="background:#E1118C"><b>Vestidos</b><i class="bi bi-person-standing-dress"></i></a>
                <a href="/saias-shorts" class="pg-card pg-col-6" style="background:#AF2896"><b>Saias</b><i class="bi bi-magic"></i></a>
                <a href="/seu-presente" class="pg-card pg-col-12" style="background:#509BF5"><b>Quer um Presente?</b><i class="bi bi-gift"></i></a>
                <a href="/nao-voltam-mais" class="pg-card pg-col-12" style="background:#000"><b>Não Voltam Mais!!!</b><i class="bi bi-fire"></i></a>
            </div>
        `;

        //Bloco 3
        let b3 = `
            <div class="pg-bubbles">
                <a href="/trocas" class="pg-bubble-item"><div class="pg-circle"><i class="bi bi-arrow-left-right"></i></div><span>Trocas</span></a>
                <a href="/rastreio" class="pg-bubble-item"><div class="pg-circle"><i class="bi bi-truck"></i></div><span>Rastreio</span></a>
                <a href="#" class="pg-bubble-item"><div class="pg-circle"><i class="bi bi-whatsapp"></i></div><span>Suporte</span></a>
            </div>
        `;

        container.innerHTML = b1 + b2 + b3;
        target.prepend(container);
    }

    //Observar
    const observer = new MutationObserver(injectLayout);
    observer.observe(document.body, { childList: true, subtree: true });
    injectLayout();
})();