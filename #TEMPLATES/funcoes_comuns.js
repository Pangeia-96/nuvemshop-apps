function empilhaApps(app_id, registroDeTamanhos) {
// Essa função deve ser invocada imediatamente após
// a injeção dos componentes HTML na página
    
    const bar = document.getElementById(app_id);
    window.registroDeTamanhos[app_id] = bar.offsetHeight;

    // DISPARA EVENTO
    //crie evento customizado 'nome_da_secao:registered'
    window.dispatchEvent(new CustomEvent(, { detail: { id: app_id, height: bar.offsetHeight } }));

    window.addEventListener('topbar:registered', function () {
        const heights = window.registroDeTamanhos;
        const ids = Object.keys(heights).sort();
        let top = 0;
        ids.forEach(id => {
            const el = document.querySelector(`[data-app="${id}"]`);
            if (el) el.style.top = top + 'px';
            top += heights[id];
        });
        document.body.style.paddingTop = top + 'px';
    });
}