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
  const lineOut = (l) => ({ label: l.label, amount: l.amount < 0 ? '−' + M(-l.amount) : M(l.amount), color: document.documentElement.dataset.theme === 'light' ? (l.amount < 0 ? '#139A63' : l.kind === 'addon' ? '#5E636C' : '#2B2E34') : (l.amount < 0 ? '#5FD39B' : l.kind === 'addon' ? '#9C9693' : '#D4CFCD') });
  FSX.checkout = {
    async load(member) {
      const cat = await FSX.loadCatalog();
      const code = DC.qs('order'); const act = DC.qs('activate');
      if (member && act) { const o = await DC.api('/api/orders/activation', { account: act }); history.replaceState(null, '', '/checkout/payment?order=' + o.code); return FSX.checkout.fromOrder(await DC.api('/api/orders/' + o.code), cat); }
      if (member && code) return FSX.checkout.fromOrder(await DC.api('/api/orders/' + code), cat);
      const saved = FSX.cart.get();
      if (!saved || !saved.cart || !saved.cart.length) return { empty: true, cat };
      const items = saved.cart.map((c) => ({ plan: c.plan, size: c.size, platform: c.platform, addons: Object.keys(c.addons || {}).filter((k) => c.addons[k]), qty: c.qty }));
      let priced; try { priced = await DC.api('/api/cart/price', { items, promo: saved.promo || undefined }); } catch (e) { priced = await DC.api('/api/cart/price', { items }); }
      const P = (id) => cat.plans.find((p) => p.id === id);
      const n = items.reduce((s, i) => s + i.qty, 0);
      const first = items[0]; const p0 = P(first.plan);
      return { cat, source: 'cart', items, promo: priced.promo, lines: priced.lines.map(lineOut), total: priced.total,
        title: n > 1 ? n + ' Accounts' : `${p0.short} · $${first.size / 1000}K`, sub: n > 1 ? items.map((i) => `${P(i.plan).short} $${i.size / 1000}K${i.qty > 1 ? ' × ' + i.qty : ''}`).join(', ') : [first.platform].concat(first.addons.map((k) => cat.addons[k].name)).join(' · ') };
    },
    fromOrder(o, cat) {
      return { cat, source: 'order', code: o.code, status: o.status, lines: o.lines.map(lineOut), total: o.total, kind: o.kind,
        title: o.kind === 'activation' ? 'Activation Fee' : o.kind === 'reset' ? 'Account Reset' : o.kind === 'credits' ? ((o.lines[0] || {}).label || 'Credits').replace(/ \(.*\)$/, '') : 'Order ' + o.code, sub: o.kind === 'activation' ? 'For ' + (o.account || '') : o.lines.filter((l) => l.kind === 'plan').map((l) => l.label).join(', ') };
    },
    async pay(sum, st) {
      if (sum.source === 'cart') {
        const o = await DC.api('/api/orders', { items: sum.items, promo: sum.promo || undefined });
        sum.code = o.code; sum.source = 'order'; if (o.paid) { FSX.cart.clear(); return '/checkout/confirmed?order=' + o.code; }
      }
      const code = sum.code;
      const method = st.method || 'card';
      const r = method === 'card' || st.backup ? await FSPAY.payCard(code, sum.total, st) : await DC.api('/api/orders/' + code + '/pay', { method });
      if (r.redirect) return r.redirect;
      FSX.cart.clear();
      return '/checkout/confirmed?order=' + code;
    },
    lineOut
  };
})();
