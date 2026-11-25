/* Payments, chat and tracking on every page: reads /api/public-config */
(function () {
  const P = {
    cfg: null,
    async config() { if (!P.cfg) { try { P.cfg = await (await fetch('/api/public-config', { credentials: 'same-origin' })).json(); } catch (e) { P.cfg = { card: 'test' }; } } return P.cfg; },
    loadScript(src, attrs) { return new Promise((res, rej) => { if (document.querySelector(`script[src="${src}"]`)) return res(); const s = document.createElement('script'); s.src = src; s.async = true; Object.entries(attrs || {}).forEach(([k, v]) => s.setAttribute(k, v)); s.onload = res; s.onerror = () => rej(new Error('Could not load ' + src)); document.head.appendChild(s); }); },
    // TailoredPay (NMI Collect.js lightbox): opens the gateway's secure card window and resolves with a one-time token
    async cardToken(amount) {
      const c = await P.config(); if (!c.tokenizationKey) return null;
      await P.loadScript(c.gatewayUrl.replace(/\/$/, '') + '/token/Collect.js', { 'data-tokenization-key': c.tokenizationKey, 'data-variant': 'lightbox' });
      return new Promise((resolve, reject) => {
        window.CollectJS.configure({ variant: 'lightbox', currency: 'USD', price: amount ? Number(amount).toFixed(2) : undefined, callback: (r) => resolve(r.token), timeoutCallback: () => reject(new Error('The card form timed out. Try again.')), timeoutDuration: 120000 });
        window.CollectJS.startPaymentRequest();
      });
    },
    // Stripe card fields, mounted into the designed card box: #sx-num, #sx-exp and #sx-cvc (each marked data-keep)
    sx: null,
    async stripe() {
      const c = await P.config(); if (c.card !== 'stripe' || !c.stripePk) return null;
      if (!P.sx) { await P.loadScript('https://js.stripe.com/v3/'); P.sx = { s: window.Stripe(c.stripePk) }; }
      return P.sx.s;
    },
    sxStyle() {
      const L = document.documentElement.dataset.theme === 'light';
      return { base: { color: L ? '#101216' : '#F4F2F1', fontFamily: '"Geist Mono", ui-monospace, Menlo, monospace', fontSize: '15px', fontSmoothing: 'antialiased', '::placeholder': { color: L ? '#8A8F98' : '#6E6966' }, iconColor: L ? '#5E636C' : '#9C9693' }, invalid: { color: L ? '#C2353F' : '#F2777F', iconColor: L ? '#C2353F' : '#F2777F' } };
    },
    async mountCard() {
      const s = await P.stripe(); if (!s) return false;
      const X = P.sx; const box = { num: document.getElementById('sx-num'), exp: document.getElementById('sx-exp'), cvc: document.getElementById('sx-cvc') };
      if (!box.num) return false;
      if (!X.el) {
        const css = [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap' }];
        const els = s.elements({ fonts: css, locale: 'en' }); const style = P.sxStyle();
        X.el = { num: els.create('cardNumber', { style, showIcon: true, placeholder: '1234 1234 1234 1234' }), exp: els.create('cardExpiry', { style, placeholder: 'MM / YY' }), cvc: els.create('cardCvc', { style, placeholder: '123' }) };
        X.err = {}; Object.keys(X.el).forEach((k) => X.el[k].on('change', (e) => { X.err[k] = e.error ? e.error.message : ''; X.done = X.done || {}; X.done[k] = e.complete; }));
        X.at = {};
      }
      Object.keys(box).forEach((k) => { const b = box[k]; if (b && X.at[k] !== b) { try { X.el[k].unmount(); } catch (e) { /* not mounted */ } X.el[k].mount(b); X.at[k] = b; } });
      return true;
    },
    watchCard() { if (P._w) return; P._w = setInterval(() => { if (document.getElementById('sx-num')) P.mountCard().catch(() => {}); }, 250); },
    // Confirms a PaymentIntent with the mounted card fields. Stripe shows the bank's 3-D Secure step when needed.
    async stripeConfirm(clientSecret, who) {
      const s = await P.stripe(); const X = P.sx;
      if (!X || !X.el) throw new Error('The card form did not load. Refresh the page and try again.');
      const bad = Object.values(X.err || {}).find(Boolean); if (bad) throw new Error(bad);
      const r = await s.confirmCardPayment(clientSecret, { payment_method: { card: X.el.num, billing_details: { name: (who && who.name) || undefined, email: (who && who.email) || undefined } } });
      if (r.error) { const e = new Error(r.error.message || 'Your card was declined.'); e.status = 402; e.decline = r.error.type === 'card_error'; throw e; }
      return r.paymentIntent;
    },
    // Runs the whole card payment for an order: Stripe on this page, TailoredPay's secure window, or the test card
    async payCard(code, total, st, api) {
      const c = await P.config(); api = api || DC.api;
      if (st.backup) {
        const body = { method: c.backup || 'stripe' }; if (body.method === 'tailoredpay') body.token = await P.cardToken(total);
        return api('/api/orders/' + code + '/pay', body);
      }
      if (c.card === 'stripe') {
        const r1 = await api('/api/orders/' + code + '/pay', { method: 'card' }); if (r1.paid || r1.redirect) return r1;
        try { const pi = await P.stripeConfirm(r1.clientSecret, r1); return api('/api/orders/' + code + '/pay', { method: 'card', paymentIntent: pi.id }); }
        catch (e) { if (e.decline && c.backup) { e.message += ' You can also pay with our backup processor.'; e.fallback = true; } throw e; }
      }
      const body = { method: 'card' };
      if (c.card === 'tailoredpay') body.token = await P.cardToken(total);
      if (c.card === 'test') Object.assign(body, { card: st.card, exp: st.exp, cvc: st.cvc });
      return api('/api/orders/' + code + '/pay', body);
    },
    async boot(user) {
      const c = await P.config();
      const msgs = [].concat(c.maint ? [{ t: c.maint, tone: 'wa' }] : [], (c.announcements || []).filter((a) => { const w = String(a.where || 'everywhere'); const app = /^\/app/.test(location.pathname); return w !== 'admin' && (w === 'everywhere' || w === 'Dashboard and Website' || (app ? /dashboard/i.test(w) : /website|site/i.test(w))); }).map((a) => ({ t: a.title + (a.body ? ' · ' + a.body : ''), tone: a.tone || 'sk', link: a.link })));
      if (msgs.length && !document.getElementById('fs-ann')) { const LT = document.documentElement.dataset.theme === 'light'; const d = document.createElement('div'); d.id = 'fs-ann'; d.style.cssText = 'position:relative;z-index:60;font:500 13px "Mona Sans",system-ui;text-align:center'; d.innerHTML = msgs.map((m) => `<div style="padding:9px 16px;background:${LT ? (m.tone === 'wa' ? '#FBF1DD' : '#E6F0FA') : (m.tone === 'wa' ? '#3A2A10' : '#13202E')};color:${LT ? (m.tone === 'wa' ? '#8A5A00' : '#1569B3') : (m.tone === 'wa' ? '#F2C46D' : '#A9D8FF')};border-bottom:1px solid ${LT ? "#E1E4E9" : "#26262A"}">${String(m.t).replace(/[<>&]/g, '')}${m.link ? ` <a href="${String(m.link).replace(/"/g, '')}" style="color:inherit;text-decoration:underline">Learn More</a>` : ''}</div>`).join(''); document.body.prepend(d); }
      const sp = c.support || {}; const chatOk = /^\/app/.test(location.pathname) ? sp.chatDash !== false : sp.chatCheckout !== false;
      if (c.crisp && chatOk) { window.$crisp = window.$crisp || []; window.CRISP_WEBSITE_ID = c.crisp; if (user && user.email) { window.$crisp.push(['set', 'user:email', [user.email]]); if (user.first) window.$crisp.push(['set', 'user:nickname', [user.first + ' ' + (user.last || '')]]); } P.loadScript('https://client.crisp.chat/l.js').catch(() => {}); }
      if (c.posthog && c.posthog.key) { const host = c.posthog.host || 'https://us.i.posthog.com'; P.loadScript(host.replace('.i.posthog', '-assets.i.posthog') + '/static/array.js').then(() => { if (window.posthog && window.posthog.init) { window.posthog.init(c.posthog.key, { api_host: host, person_profiles: 'identified_only' }); if (user && user.email) window.posthog.identify(user.email); } }).catch(() => {}); }
    },
    chat() { if (window.$crisp) { window.$crisp.push(['do', 'chat:open']); return true; } return false; }
  };
  window.FSPAY = P;
})();
(function () { if (document.getElementById('dc-root') && !/\/checkout\/payment/.test(location.pathname)) window.FSPAY.boot(null); })();
