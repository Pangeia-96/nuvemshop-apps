(function () {
    'use strict';

    if (window.ContagemRegressivaLoaded) return;
    window.ContagemRegressivaLoaded = true;

    const app_id = 'p96-contagem_regressiva'

    const app_config = {
        link_botao: 'https://www.pangeia96.com.br/seu-presente/',
        texto_titulo: 'ÚLTIMAS HORAS',
        texto_botao_cta: 'Ver produtos',
        cor_primaria: '#d24c45',
        cor_secundaria: '#f8ca89',
        cor_destaque: '#ef9837',
        cor_preto: '#2b2b2b',
        cor_branco: '#fff5f5'
    }

    window.__ALTURAS_BARRAS_TOPO__ = window.__ALTURAS_BARRAS_TOPO__ || {};

    const css = `

        #${app_id} .etiqueta {
            display: none;
        }

        #${app_id} {
            width: 100%;
            height: 45px;
            left: 0;
            right: 0;
            top: 0;
            padding: 8px 14px;
            background-color: ${app_config.cor_preto};
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        #${app_id} > * {
            margin: 0 5px;
        }

        #${app_id} .titulo {
            color: ${app_config.cor_primaria};
            font-weight: 700;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            text-align: center;
        }

        #${app_id} .relogio {
            color: ${app_config.cor_branco};
            display: flex;
            align-items: center;
            gap: 4px;
        }

        #${app_id} .bloco {
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 36px;
        }

        #${app_id} .bloco > * {
            font-size: 20px;
            font-weight: 700;
            line-height: 1;
            text-align: center;
        }

        #${app_id} .botao_cta {
            height: 80%;
            max-width: 110px;
            border: 0;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
            background-color: ${app_config.cor_destaque};
            color: ${app_config.cor_branco};
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0 16px;
            margin: 0;
            line-height: 1.2;
            text-decoration: none;
            box-sizing: border-box;
        }

        /* ATÉ 768px (tablet / mobile landscape) */
        @media (max-width: 768px) {

            #${app_id} {
                font-size: 11px;
                letter-spacing: 1px;
                padding: 6px 10px;           /* um pouco menos de padding */
            }

            #${app_id} .titulo {
                font-size: 12px;             /* reduz título */
            }

            #${app_id} .bloco {
                min-width: 30px;             /* um pouco menor */
            }

            #${app_id} .bloco > * {
                font-size: 18px;             /* números menores */
            }

            #${app_id} .botao_cta {
                max-width: 90px;
                font-size: 11px;
                padding: 0 12px;
            }
        }

        /* ATÉ 480px (celular estreito) */
        @media (max-width: 480px) {

            #${app_id} {
                padding: 4px 8px;            /* ainda menos espaço lateral */
            }

            #${app_id} .titulo {
                font-size: 11px;
                letter-spacing: 0.5px;       /* já tinha, mantido */
            }

            #${app_id} .relogio {
                gap: 2px;
            }

            #${app_id} .bloco {
                min-width: 24px;
            }

            #${app_id} .bloco > * {
                font-size: 16px;
            }

            #${app_id} .botao_cta {
                max-width: 80px;
                font-size: 10px;
                padding: 0 8px;
            }
        }
    `;

    const html = `
    <div id="${app_id}">
        <div class="titulo">${app_config.texto_titulo}</div>
        <div class="relogio">
            <div class="bloco">
                <span class="valor">00</span>
                <span class="etiqueta">Hora(s)</span>
            </div>
            <span class="separador">:</span>
            <div class="bloco">
                <span class="valor">00</span>
                <span class="etiqueta">Minuto(s)</span>
            </div>
            <span class="separador">:</span>
            <div class="bloco">
                <span class="valor">00</span>
                <span class="etiqueta">Segundo(s)</span>
            </div>
        </div>
        <a href="${app_config.link_botao}" class="botao_cta" role="button">${app_config.texto_botao_cta}</a>
    </div>
    `;

    document.head.appendChild(Object.assign(document.createElement('style'), { textContent: css }));

    document.body.insertAdjacentHTML('afterbegin', html);

    // // REGISTRA (imediatamente após HTML)
    // const bar = document.getElementById(app_id);
    // window.__ALTURAS_BARRAS_TOPO__[app_id] = bar.offsetHeight;

    // // DISPARA EVENTO
    // window.dispatchEvent(new CustomEvent('topbar:registered', { detail: { id: app_id, height: bar.offsetHeight } }));

    // window.addEventListener('topbar:registered', function () {
    //     const heights = window.__ALTURAS_BARRAS_TOPO__;
    //     const ids = Object.keys(heights).sort();
    //     let top = 0;
    //     ids.forEach(id => {
    //         const el = document.querySelector(`[data-app="${id}"]`);
    //         if (el) el.style.top = top + 'px';
    //         top += heights[id];
    //     });
    //     document.body.style.paddingTop = top + 'px';
    // });

    function iniciaCronometro() {
        const minutosDecimais = 20 + Math.random() * 10;
        let tempo = Math.floor(minutosDecimais * 60);

        const tick = () => {
            const h = Math.floor(tempo / 3600);
            const m = Math.floor((tempo % 3600) / 60);
            const s = tempo % 60;

            document.querySelectorAll(`#${app_id} .valor`)[0].textContent = h.toString().padStart(2, '0');
            document.querySelectorAll(`#${app_id} .valor`)[1].textContent = m.toString().padStart(2, '0');
            document.querySelectorAll(`#${app_id} .valor`)[2].textContent = s.toString().padStart(2, '0');

            if (--tempo >= 0) {
                setTimeout(tick, 1000);
            }
        };

        tick();
    }

    iniciaCronometro();

})();
