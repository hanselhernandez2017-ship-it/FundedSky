/* Shared helpers for checkout and sign-in pages */
(function () {
  const KEY = 'fs_cart';
  const FS = {
    cart: { get() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } }, set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* private mode */ } }, clear() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } } },
    money: (v) => '$' + (Math.round(Number(v) * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: Number(v) % 1 ? 2 : 0, maximumFractionDigits: 2 }),
    catalog: null,
    async loadCatalog() { if (!FS.catalog) FS.catalog = await DC.api('/api/catalog'); return FS.catalog; },
    async me() { try { return (await DC.api('/api/me')).user; } catch (e) { return null; } },
    next() { const n = DC.qs('next'); return n && n.startsWith('/') && !n.startsWith('//') ? n : '/app'; }
  };
  window.FSX = FS;
})();
/* Checkout: load the summary (cart, an existing order, or an activation fee) and pay */
(function () {
  const M = (v) => FSX.money(v);
  const lineOut = (l) => ({ label: l.label, amount: l.free ? 'Free' : l.amount < 0 ? '−' + M(-l.amount) : M(l.amount), color: document.documentElement.dataset.theme === 'light' ? (l.free ? '#0F66BA' : l.amount < 0 ? '#0A7245' : l.kind === 'addon' ? '#5E636C' : '#2B2E34') : (l.free ? '#7CC4FF' : l.amount < 0 ? '#5FD39B' : l.kind === 'addon' ? '#9C9693' : '#D4CFCD') });
  FSX.checkout = {
    async load(member) {
      const cat = await FSX.loadCatalog();
      const code = DC.qs('order'); const act = DC.qs('activate');
      if (member && act) { const o = await DC.api('/api/orders/activation', { account: act }); history.replaceState(null, '', '/checkout/payment?order=' + o.code); return FSX.checkout.fromOrder(await DC.api('/api/orders/' + o.code), cat); }
      if (member && code) {
        // a reward code in the link (the checkout reminder email) goes on this order before it is shown
        const rc = DC.qs('code'); let warn = '';
        if (rc) { try { const r = await DC.api('/api/orders/' + encodeURIComponent(code) + '/code', { code: rc }); if (r.paid) { location.replace('/checkout/confirmed?order=' + code); return new Promise(() => {}); } } catch (e) { if (e.status !== 404) warn = `Code ${String(rc).toUpperCase().slice(0, 40)} was not applied: ${e.message}.`; } }
        const sum = FSX.checkout.fromOrder(await DC.api('/api/orders/' + encodeURIComponent(code)), cat); if (warn) sum.note = warn; return sum;
      }
      const saved = FSX.cart.get();
      if (!saved || !saved.cart || !saved.cart.length) return { empty: true, cat };
      const items = saved.cart.map((c) => ({ plan: c.plan, size: c.size, platform: c.platform, addons: Object.keys(c.addons || {}).filter((k) => c.addons[k]), qty: c.qty }));
      let priced; let note = ''; try { priced = await DC.api('/api/cart/price', { items, promo: saved.promo || undefined }); } catch (e) { if (!saved.promo) throw e; note = `Code ${String(saved.promo).toUpperCase()} was taken off: ${e.message}.`; priced = await DC.api('/api/cart/price', { items }); FSX.cart.set(Object.assign({}, saved, { promo: '' })); }
      const lines = priced.lines.map(lineOut);
      // the free packs line comes from the server with the priced cart (kind 'packs')
      const P = (id) => cat.plans.find((p) => p.id === id);
      const n = items.reduce((s, i) => s + i.qty, 0);
      const first = items[0]; const p0 = P(first.plan);
      return { cat, source: 'cart', items, note, promo: priced.promo || (priced.autoCard ? null : priced.coupon), lines, total: priced.total,
        title: n > 1 ? n + ' Accounts' : `${p0.short} · $${first.size / 1000}K`, sub: n > 1 ? items.map((i) => `${P(i.plan).short} $${i.size / 1000}K${i.qty > 1 ? ' × ' + i.qty : ''}`).join(', ') : [first.platform].concat(first.addons.map((k) => cat.addons[k].name)).join(' · ') };
    },
    fromOrder(o, cat) {
      return { cat, source: 'order', code: o.code, status: o.status, note: o.note || '', lines: o.lines.map(lineOut), total: o.total, kind: o.kind, account: o.account || '',
        title: o.kind === 'activation' ? 'Activation Fee' : o.kind === 'reset' ? 'Account Reset' : o.kind === 'credits' ? ((o.lines[0] || {}).label || 'Credits').replace(/ \(.*\)$/, '') : 'Order ' + o.code, sub: o.kind === 'activation' ? 'For ' + (o.account || '') : o.lines.filter((l) => l.kind === 'plan').map((l) => l.label).join(', ') };
    },
    async pay(sum, st) {
      if (sum.source === 'cart') {
        const o = await DC.api('/api/orders', { items: sum.items, promo: sum.promo || undefined });
        sum.code = o.code; sum.source = 'order'; if (o.paid) { FSX.cart.clear(); return '/checkout/confirmed?order=' + o.code; }
        if (o.total != null) sum.total = o.total; // the order is what is charged
      }
      const code = sum.code;
      const method = st.method || 'card';
      let r;
      try { r = method === 'card' || st.backup ? await FSPAY.payCard(code, sum.total, st) : await DC.api('/api/orders/' + code + '/pay', { method }); }
      catch (e) {
        // the server priced the order again (a code that no longer applies, a price change): show the new lines and total with its message
        if (e.repriced || e.status === 409) { try { const o = await DC.api('/api/orders/' + code); sum.lines = o.lines.map(lineOut); sum.total = o.total; sum.status = o.status; } catch (e2) { /* keep the message */ } }
        throw e;
      }
      if (r.redirect) return r.redirect;
      FSX.cart.clear();
      return '/checkout/confirmed?order=' + code;
    },
    lineOut
  };
})();
