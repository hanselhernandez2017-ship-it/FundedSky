/* Payments, chat and tracking on every page: reads /api/public-config */
(function () {
  const P = {
    cfg: null,
    async config() { if (!P.cfg) { try { P.cfg = await (await fetch('/api/public-config', { credentials: 'same-origin' })).json(); } catch (e) { P.cfg = { card: 'test' }; } } return P.cfg; },
    loadScript(src, attrs) { return new Promise((res, rej) => { if (document.querySelector(`script[src="${src}"]`)) return res(); const s = document.createElement('script'); s.src = src; s.async = true; Object.entries(attrs || {}).forEach(([k, v]) => s.setAttribute(k, v)); s.onload = res; s.onerror = () => rej(new Error('Could not load ' + src)); document.head.appendChild(s); }); },
    // TailoredPay (NMI Collect.js lightbox): opens the gateway's secure card window and resolves with a one-time token
    async cardToken(amount) {
      const c = await P.config(); if (c.card !== 'tailoredpay') return null;
      await P.loadScript(c.gatewayUrl.replace(/\/$/, '') + '/token/Collect.js', { 'data-tokenization-key': c.tokenizationKey, 'data-variant': 'lightbox' });
      return new Promise((resolve, reject) => {
        window.CollectJS.configure({ variant: 'lightbox', currency: 'USD', price: amount ? Number(amount).toFixed(2) : undefined, callback: (r) => resolve(r.token), timeoutCallback: () => reject(new Error('The card form timed out. Try again.')), timeoutDuration: 120000 });
        window.CollectJS.startPaymentRequest();
      });
    },
    async boot(user) {
      const c = await P.config();
      if (c.crisp) { window.$crisp = window.$crisp || []; window.CRISP_WEBSITE_ID = c.crisp; if (user && user.email) { window.$crisp.push(['set', 'user:email', [user.email]]); if (user.first) window.$crisp.push(['set', 'user:nickname', [user.first + ' ' + (user.last || '')]]); } P.loadScript('https://client.crisp.chat/l.js').catch(() => {}); }
      if (c.posthog && c.posthog.key) { const host = c.posthog.host || 'https://us.i.posthog.com'; P.loadScript(host.replace('.i.posthog', '-assets.i.posthog') + '/static/array.js').then(() => { if (window.posthog && window.posthog.init) { window.posthog.init(c.posthog.key, { api_host: host, person_profiles: 'identified_only' }); if (user && user.email) window.posthog.identify(user.email); } }).catch(() => {}); }
    },
    chat() { if (window.$crisp) { window.$crisp.push(['do', 'chat:open']); return true; } return false; }
  };
  window.FSPAY = P;
})();
(function () { if (document.getElementById('dc-root') && !/\/checkout\/payment/.test(location.pathname)) window.FSPAY.boot(null); })();
