// Service Worker registration + in-app update prompt
(function () {
    if (!('serviceWorker' in navigator)) return;

    // Only register when served over http(s) (not file://)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
    });

    window.addEventListener('load', async () => {
        try {
            const reg = await navigator.serviceWorker.register('./sw.js');

            reg.addEventListener('updatefound', () => {
                const installing = reg.installing;
                if (!installing) return;
                installing.addEventListener('statechange', () => {
                    // controller exists => this is an update, not the first install
                    if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateBanner(reg.waiting);
                    }
                });
            });
        } catch (e) {
            console.error('SW registration failed:', e);
        }
    });

    function showUpdateBanner(waitingWorker) {
        if (document.getElementById('sw-update-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'sw-update-banner';
        banner.style.cssText = [
            'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:10000',
            'background:var(--primary,#6C5CE7)', 'color:#fff',
            'display:flex', 'align-items:center', 'gap:12px',
            'padding:12px 16px', 'box-shadow:0 -2px 10px rgba(0,0,0,.2)',
            'font-family:inherit'
        ].join(';');
        banner.innerHTML =
            '<span style="flex:1;font-size:14px;font-weight:600;">🔄 Nueva versión disponible</span>' +
            '<button id="sw-update-btn" style="background:#fff;color:var(--primary,#6C5CE7);border:none;' +
            'border-radius:8px;padding:8px 18px;font-weight:700;cursor:pointer;font-size:13px;">Actualizar</button>';

        document.body.appendChild(banner);

        banner.querySelector('#sw-update-btn').addEventListener('click', () => {
            if (waitingWorker) {
                waitingWorker.postMessage({ type: 'SKIP_WAITING' });
            }
            banner.remove();
            // controllerchange listener reloads the page once activated
        });
    }
})();
