
function startCatalog(root) {
  const NOW = new Date('2026-11-22T13:00:00-05:00');
  const ME = '[Your Name]';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = (v) => (v < 0 ? '−' : '') + '$' + Math.abs(Math.round(v * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const K = (n) => '$' + (n / 1000) + 'K';
  let seq = 100; const uid = (p) => p + (++seq);
  const fmtD = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const SIZES = [25000, 50000, 100000, 150000];

  const S = {
    view: 'overview', planId: 'pa', drawer: null, sideOpen: false, promoFilter: 'all', ruleFilter: 'all', toast: '',
    plans: [
      { id: 'pa', name: '[Plan A Name]', slug: 'plan-a', badge: '', billing: 'one-time', status: 'live', sort: 1, desc: '[One-line description of this account]',
        sizes: [{ size: 25000, price: 99, compare: null, floor: 49, active: true, sched: null }, { size: 50000, price: 149, compare: null, floor: 79, active: true, sched: null }, { size: 100000, price: 0, compare: null, floor: 0, active: false, sched: null }, { size: 150000, price: 0, compare: null, floor: 0, active: false, sched: null }],
        platforms: { tradovate: true, ninja: true, tv: true, rithmic: false }, defPlatform: 'tradovate', addons: { reset: true, daily: false, noact: false, split: false }, bundles: { tier: true, starter: true, mix: false } },
      { id: 'pb', name: '[Plan B Name]', slug: 'plan-b', badge: 'Most Popular', billing: 'one-time', status: 'live', sort: 2, desc: '[One-line description of this account]',
        sizes: [{ size: 25000, price: 0, compare: null, floor: 0, active: false, sched: null }, { size: 50000, price: 169, compare: null, floor: 89, active: true, sched: null }, { size: 100000, price: 259, compare: null, floor: 139, active: true, sched: null }, { size: 150000, price: 349, compare: null, floor: 189, active: true, sched: { price: 329, date: '2026-12-01' } }],
        platforms: { tradovate: true, ninja: true, tv: true, rithmic: true }, defPlatform: 'tradovate', addons: { reset: true, daily: true, noact: true, split: false }, bundles: { tier: true, starter: false, mix: true } },
      { id: 'pc', name: '[Plan C Name]', slug: 'plan-c', badge: '', billing: 'monthly', status: 'live', sort: 3, desc: '[One-line description of this account]',
        sizes: [{ size: 25000, price: 79, compare: null, floor: 39, active: true, sched: null }, { size: 50000, price: 119, compare: null, floor: 59, active: true, sched: null }, { size: 100000, price: 189, compare: 229, floor: 99, active: true, sched: null }, { size: 150000, price: 0, compare: null, floor: 0, active: false, sched: null }],
        platforms: { tradovate: true, ninja: true, tv: false, rithmic: false }, defPlatform: 'ninja', addons: { reset: false, daily: false, noact: true, split: true }, bundles: { tier: false, starter: false, mix: true } }
    ],
    platforms: [
      { id: 'tradovate', name: 'Tradovate', adapter: 'Simulator', visible: true },
      { id: 'ninja', name: 'NinjaTrader', adapter: 'Simulator', visible: true },
      { id: 'tv', name: 'TradingView', adapter: 'Simulator', visible: true },
      { id: 'rithmic', name: 'Rithmic', adapter: 'Simulator', visible: true }
    ],
    addons: [
      { id: 'reset', name: 'Free Reset', pricing: 'percent', value: 15, discountable: false, effect: 'One free reset after a breach', status: 'live' },
      { id: 'daily', name: 'Daily Payouts', pricing: 'percent', value: 25, discountable: true, effect: 'Payout cycle shortened to 1 day', status: 'live' },
      { id: 'noact', name: 'No Activation Fee', pricing: 'flat', value: 79, discountable: true, effect: 'Activation fee waived when funded', status: 'live' },
      { id: 'split', name: 'Bigger Split', pricing: 'percent', value: 20, discountable: false, effect: 'Profit split raised to [X]%', status: 'live' }
    ],
    bundles: [
      { id: 'tier', name: 'Multi-Account Savings', type: 'tier', tiers: [{ min: 2, pct: 10 }, { min: 3, pct: 15 }], samePlan: true, stacks: true, status: 'live', uses: 0 },
      { id: 'starter', name: 'Starter Pack', type: 'fixed', items: [{ plan: 'pa', size: 50000, qty: 2 }], price: 249, stacks: false, status: 'live', uses: 0 },
      { id: 'mix', name: 'Mix and Match', type: 'mix', mixPlans: ['pb', 'pc'], min: 2, pct: 12, stacks: false, status: 'live', uses: 0 }
    ],
    promos: [
      { id: 'p1', name: 'Black Friday', kind: 'code', code: 'BLACKFRIDAY', vtype: 'percent', value: 40, freeAddon: '', plans: ['pa', 'pb'], sizes: [], lines: { base: true, addon: false, reset: false }, withBundles: false, first: false, affiliate: false, minCart: 0, countries: '', start: '2026-11-24', end: '2026-11-30', total: 0, perTrader: 1, maxOff: 0, priority: 10, exclusive: true, status: 'on', uses: 0 },
      { id: 'p2', name: 'Affiliate Code', kind: 'code', code: 'AFF10', vtype: 'percent', value: 10, freeAddon: '', plans: [], sizes: [], lines: { base: true, addon: true, reset: false }, withBundles: true, first: true, affiliate: true, minCart: 0, countries: '', start: '2026-11-01', end: '', total: 0, perTrader: 1, maxOff: 0, priority: 20, exclusive: false, status: 'on', uses: 2 },
      { id: 'p3', name: 'Reset After Breach', kind: 'auto', code: '', vtype: 'percent', value: 50, freeAddon: '', plans: [], sizes: [], lines: { base: false, addon: false, reset: true }, withBundles: true, first: false, affiliate: false, minCart: 0, countries: '', start: '2026-11-01', end: '', total: 0, perTrader: 0, maxOff: 0, priority: 5, exclusive: false, status: 'on', uses: 0 },
      { id: 'p4', name: '150K Perk', kind: 'auto', code: '', vtype: 'free', value: 0, freeAddon: 'daily', plans: ['pb'], sizes: [150000], lines: { base: false, addon: true, reset: false }, withBundles: true, first: false, affiliate: false, minCart: 0, countries: '', start: '2026-11-15', end: '2026-12-15', total: 0, perTrader: 0, maxOff: 0, priority: 8, exclusive: false, status: 'on', uses: 1 }
    ],
    rules: [],
    changes: [
      { id: 'c1', area: 'Prices', text: '[Plan B Name] $150K scheduled price for Dec 1, 2026', who: ME, when: 'Today, 11:42 AM', before: '$349', after: '$329', approve: true, approved: false },
      { id: 'c2', area: 'Promotions', text: 'Created Black Friday (BLACKFRIDAY, 40% off)', who: ME, when: 'Today, 11:58 AM' }
    ],
    history: [
      { v: 12, text: 'Added Mix and Match bundle; [Plan C Name] $100K compare-at price', who: ME, when: 'Nov 18, 2026, 4:10 PM', count: 3 },
      { v: 11, text: 'New rule set versions for [Plan B Name]', who: ME, when: 'Nov 10, 2026, 9:32 AM', count: 2 },
      { v: 10, text: 'Launched catalog: 3 plans, 4 add-ons, 2 bundles', who: ME, when: 'Nov 3, 2026, 2:05 PM', count: 21 }
    ],
    version: 12,
    tester: { lines: [{ plan: 'pb', size: 100000, platform: 'tradovate', addons: ['daily'], qty: 2 }], code: 'AFF10', newTrader: true, affiliate: false }
  };
  // rule sets: one live version per active plan size
  const ruleBase = { 25000: [1500, 500, 1500, 3], 50000: [3000, 1100, 2500, 5], 100000: [6000, 2200, 3000, 10], 150000: [9000, 3300, 4500, 15] };
  S.plans.forEach((p) => p.sizes.forEach((z) => {
    const r = ruleBase[z.size];
    S.rules.push({ id: uid('r'), plan: p.id, size: z.size, version: p.id === 'pb' ? 3 : 1, status: z.active ? 'live' : 'retired', target: r[0], daily: r[1], dd: r[2], ddType: 'Trailing EOD', contracts: r[3], minDays: 5, consistency: 40, split: 90, payoutMin: 250, accounts: z.active ? Math.round(z.size / 25000) * 3 + (p.id === 'pb' ? 11 : 2) : 0 });
    if (p.id === 'pb' && z.active) S.rules.push({ id: uid('r'), plan: p.id, size: z.size, version: 2, status: 'retired', target: r[0], daily: r[1], dd: r[2] - 500, ddType: 'Trailing EOD', contracts: r[3], minDays: 5, consistency: 30, split: 80, payoutMin: 250, accounts: 4 });
  }));

  const plan = (id) => S.plans.find((p) => p.id === id);
  const addon = (id) => S.addons.find((a) => a.id === id);
  const plat = (id) => S.platforms.find((p) => p.id === id);
  const liveRule = (pid, size) => S.rules.filter((r) => r.plan === pid && r.size === size && r.status === 'live').sort((a, b) => b.version - a.version)[0];
  const sizeOf = (pid, size) => plan(pid).sizes.find((z) => z.size === size);
  const promoState = (p) => {
    if (p.status === 'off') return ['Paused', 'ret'];
    const s = p.start ? new Date(p.start + 'T00:00:00-05:00') : null, e = p.end ? new Date(p.end + 'T23:59:59-05:00') : null;
    if (s && s > NOW) return ['Scheduled', 'sched'];
    if (e && e < NOW) return ['Ended', 'ended'];
    if (p.total && p.uses >= p.total) return ['Used Up', 'ended'];
    return ['Live', 'live'];
  };
  const log = (area, text, ex = {}) => { S.changes.unshift({ id: uid('c'), area, text, who: ME, when: 'Just now', before: ex.before, after: ex.after, approve: !!ex.approve, approved: false }); };
  const toast = (t) => { S.toast = t; render(); clearTimeout(toast.t); toast.t = setTimeout(() => { S.toast = ''; render(); }, 2200); };

  // ---------- checks before publish ----------
  function checks() {
    const out = [];
    S.plans.filter((p) => p.status === 'live').forEach((p) => {
      p.sizes.filter((z) => z.active).forEach((z) => {
        if (!z.price) out.push({ lvl: 'err', text: `${p.name} ${K(z.size)} is on but has no price`, go: ['plan', p.id] });
        if (!liveRule(p.id, z.size)) out.push({ lvl: 'err', text: `${p.name} ${K(z.size)} has no live rule set`, go: ['rules'] });
        if (z.floor && z.price && z.floor > z.price) out.push({ lvl: 'err', text: `${p.name} ${K(z.size)} floor price is above its price`, go: ['plan', p.id] });
      });
      if (!Object.values(p.platforms).some(Boolean)) out.push({ lvl: 'err', text: `${p.name} has no platform switched on`, go: ['plan', p.id] });
      if (!p.platforms[p.defPlatform]) out.push({ lvl: 'warn', text: `${p.name} default platform is switched off`, go: ['plan', p.id] });
      if (!p.sizes.some((z) => z.active)) out.push({ lvl: 'err', text: `${p.name} is live with no sizes on`, go: ['plan', p.id] });
    });
    S.promos.forEach((pr) => {
      const st = promoState(pr)[0];
      if (st === 'Ended' || st === 'Paused') return;
      if (pr.kind === 'code' && !pr.code) out.push({ lvl: 'err', text: `${pr.name} is a code promotion with no code`, go: ['promo', pr.id] });
      if (pr.vtype === 'percent' && pr.lines.base) {
        S.plans.forEach((p) => { if (pr.plans.length && !pr.plans.includes(p.id)) return; p.sizes.filter((z) => z.active && z.price).forEach((z) => { if (pr.sizes.length && !pr.sizes.includes(z.size)) return; if (z.price * (1 - pr.value / 100) < z.floor) out.push({ lvl: 'warn', text: `${pr.name} would take ${p.name} ${K(z.size)} below its floor; the floor will apply`, go: ['promo', pr.id] }); }); });
      }
      if (pr.end) { const days = (new Date(pr.end + 'T23:59:59-05:00') - NOW) / 864e5; if (days >= 0 && days <= 10 && st === 'Live') out.push({ lvl: 'info', text: `${pr.name} ends ${fmtD(pr.end)}`, go: ['promo', pr.id] }); }
    });
    S.bundles.filter((b) => b.status === 'live').forEach((b) => {
      if (b.type === 'fixed') b.items.forEach((it) => { const z = sizeOf(it.plan, it.size); if (!z || !z.active) out.push({ lvl: 'err', text: `${b.name} includes ${plan(it.plan).name} ${K(it.size)}, which is switched off`, go: ['bundle', b.id] }); });
      const offered = S.plans.some((p) => p.bundles[b.id]); if (!offered) out.push({ lvl: 'warn', text: `${b.name} is live but no plan offers it`, go: ['availability'] });
    });
    S.rules.filter((r) => r.status === 'draft').forEach((r) => out.push({ lvl: 'info', text: `Draft rule set v${r.version} for ${plan(r.plan).name} ${K(r.size)} goes live on publish`, go: ['rules'] }));
    return out;
  }

  // ---------- pricing engine ----------
  function quote(t) {
    const msgs = []; const comps = []; let accounts = [];
    t.lines.forEach((ln, li) => {
      const p = plan(ln.plan); const z = sizeOf(ln.plan, ln.size);
      if (!p || p.status !== 'live') { msgs.push(['✕', `Line ${li + 1}: plan is not live`]); return; }
      if (!z || !z.active || !z.price) { msgs.push(['✕', `Line ${li + 1}: ${K(ln.size)} is not offered on ${p.name}`]); return; }
      if (!p.platforms[ln.platform]) { msgs.push(['✕', `Line ${li + 1}: ${plat(ln.platform).name} is not offered on ${p.name}`]); return; }
      const qty = Math.max(1, Math.min(20, +ln.qty || 1));
      comps.push({ li, type: 'base', label: `${p.name} · ${K(z.size)} · ${plat(ln.platform).name}`, unit: z.price, qty, amt: z.price * qty, rem: z.price * qty, floor: z.floor * qty, plan: p.id, size: z.size, bundled: false });
      for (let i = 0; i < qty; i++) accounts.push({ li, plan: p.id, size: z.size, price: z.price });
      ln.addons.forEach((aid) => {
        const a = addon(aid);
        if (!a || a.status !== 'live' || !p.addons[aid]) { msgs.push(['✕', `Line ${li + 1}: ${a ? a.name : 'add-on'} is not offered on ${p.name}`]); return; }
        const unit = a.pricing === 'flat' ? a.value : Math.round(z.price * a.value) / 100;
        comps.push({ li, type: 'addon', aid, label: `${a.name} × ${qty}`, unit, qty, amt: unit * qty, rem: unit * qty, floor: 0, plan: p.id, size: z.size, discountable: a.discountable, bundled: false });
      });
    });
    const sub = comps.reduce((n, c) => n + c.amt, 0);
    const savings = [];
    // bundles: best single bundle wins
    let best = null;
    S.bundles.filter((b) => b.status === 'live').forEach((b) => {
      let off = 0, hit = [];
      if (b.type === 'tier') {
        const by = {}; accounts.forEach((a) => { if (plan(a.plan).bundles[b.id]) (by[b.samePlan ? a.plan : 'all'] = by[b.samePlan ? a.plan : 'all'] || []).push(a); });
        Object.values(by).forEach((arr) => { const tier = b.tiers.filter((x) => arr.length >= x.min).sort((x, y) => y.min - x.min)[0]; if (tier) { off += arr.reduce((n, a) => n + a.price, 0) * tier.pct / 100; hit.push(...new Set(arr.map((a) => a.li))); } });
      } else if (b.type === 'mix') {
        const arr = accounts.filter((a) => b.mixPlans.includes(a.plan) && plan(a.plan).bundles[b.id]);
        if (arr.length >= b.min) { off = arr.reduce((n, a) => n + a.price, 0) * b.pct / 100; hit = [...new Set(arr.map((a) => a.li))]; }
      } else if (b.type === 'fixed') {
        let ok = true, val = 0; const used = [];
        b.items.forEach((it) => { const arr = accounts.filter((a) => a.plan === it.plan && a.size === it.size && plan(a.plan).bundles[b.id]); if (arr.length < it.qty) ok = false; else { val += it.qty * arr[0].price; used.push(...arr.slice(0, it.qty).map((a) => a.li)); } });
        if (ok && b.items.length) { off = Math.max(0, val - b.price); hit = [...new Set(used)]; }
      }
      off = Math.round(off * 100) / 100;
      if (off > 0 && (!best || off > best.off)) best = { b, off, hit };
    });
    if (best) {
      let left = best.off;
      comps.filter((c) => c.type === 'base' && best.hit.includes(c.li)).forEach((c) => { const take = Math.min(left, Math.max(0, c.rem - c.floor)); c.rem -= take; left -= take; c.bundled = true; });
      savings.push([`Bundle: ${best.b.name}`, best.off - left]);
      msgs.push(['✓', `${best.b.name} applied: it gave the lowest total of the bundles this cart qualifies for`]);
    }
    const applyPromo = (pr, label) => {
      let tot = 0;
      comps.forEach((c) => {
        if (pr.plans.length && !pr.plans.includes(c.plan)) return;
        if (pr.sizes.length && !pr.sizes.includes(c.size)) return;
        if (c.bundled && !pr.withBundles) return;
        let take = 0;
        if (pr.vtype === 'free') { if (c.type === 'addon' && c.aid === pr.freeAddon) take = c.rem; }
        else {
          if (c.type === 'base' && !pr.lines.base) return;
          if (c.type === 'addon' && (!pr.lines.addon || !c.discountable)) return;
          take = pr.vtype === 'percent' ? c.rem * pr.value / 100 : pr.vtype === 'fixed' ? Math.min(c.rem, pr.value) : 0;
        }
        take = Math.min(take, Math.max(0, c.rem - c.floor));
        if (pr.maxOff) take = Math.min(take, pr.maxOff - tot);
        take = Math.max(0, Math.round(take * 100) / 100);
        c.rem -= take; tot += take;
      });
      if (tot > 0) savings.push([label, tot]);
      return tot;
    };
    // automatic promotions by priority
    const autos = S.promos.filter((p) => p.kind === 'auto' && promoState(p)[0] === 'Live').sort((a, b) => a.priority - b.priority);
    let exclusiveUsed = false;
    autos.forEach((pr) => { if (!pr.lines.base && !pr.lines.addon && pr.vtype !== 'free') return; const got = applyPromo(pr, `Automatic: ${pr.name}`); if (got) { msgs.push(['✓', `${pr.name} applied automatically`]); if (pr.exclusive) exclusiveUsed = true; } });
    // code
    const code = (t.code || '').trim().toUpperCase();
    if (code) {
      const pr = S.promos.find((p) => p.kind === 'code' && p.code.toUpperCase() === code);
      const st = pr ? promoState(pr)[0] : '';
      if (!pr) msgs.push(['✕', `Code ${code} doesn't exist`]);
      else if (st !== 'Live') msgs.push(['✕', `Code ${code} is ${st.toLowerCase()}${pr.start && st === 'Scheduled' ? ', it starts ' + fmtD(pr.start) : ''}`]);
      else if (pr.first && !t.newTrader) msgs.push(['✕', `Code ${code} is for a trader's first purchase only`]);
      else if (pr.affiliate && !t.affiliate && pr.first && false) msgs.push(['✕', '']);
      else if (pr.minCart && sub < pr.minCart) msgs.push(['✕', `Code ${code} needs a cart of at least ${money(pr.minCart)}`]);
      else if (exclusiveUsed) msgs.push(['✕', `Code ${code} can't combine with an exclusive automatic promotion`]);
      else if (best && !pr.withBundles && comps.filter((c) => !c.bundled && c.type === 'base').length === 0) msgs.push(['✕', `Code ${code} doesn't stack with bundles, and every line is in ${best.b.name}`]);
      else { const got = applyPromo(pr, `Code: ${pr.code}`); if (got) msgs.push(['✓', `Code ${code} applied${best && !pr.withBundles ? ', skipping lines in the bundle' : ''}`]); else msgs.push(['✕', `Code ${code} has nothing to apply to in this cart`]); }
    }
    comps.forEach((c) => { if (c.type === 'base' && c.rem <= c.floor + 0.001 && c.amt > c.floor && savings.length) msgs.push(['!', `${c.label} hit its floor price of ${money(c.floor / c.qty)} per account`]); });
    const total = comps.reduce((n, c) => n + c.rem, 0);
    return { comps, sub, savings, total: Math.round(total * 100) / 100, msgs, accounts: accounts.length };
  }

  // ---------- views ----------
  const sw = (on, act, data, label) => `<button type="button" class="sw ${on ? 'on' : ''}" role="switch" aria-checked="${on}" aria-label="${esc(label || '')}" data-act="${act}" ${data}></button>`;
  const badgeSt = (s) => s === 'live' ? '<span class="b live">Live</span>' : s === 'draft' ? '<span class="b draft">Draft</span>' : '<span class="b ret">Retired</span>';
  const counts = () => ({
    plans: S.plans.filter((p) => p.status === 'live').length,
    sizes: S.plans.filter((p) => p.status === 'live').reduce((n, p) => n + p.sizes.filter((z) => z.active).length, 0),
    addons: S.addons.filter((a) => a.status === 'live').length,
    bundles: S.bundles.filter((b) => b.status === 'live').length,
    promos: S.promos.filter((p) => promoState(p)[0] === 'Live').length,
    changes: S.changes.length
  });

  function vOverview() {
    const c = counts(); const ch = checks(); const errs = ch.filter((x) => x.lvl === 'err').length;
    const lowest = Math.min(...S.plans.flatMap((p) => p.sizes.filter((z) => z.active && z.price).map((z) => z.price)));
    const rows = S.plans.map((p) => `<tr class="lk" data-act="openPlan" data-id="${p.id}"><td><span class="il"><b>${esc(p.name)}</b>${p.badge ? `<span class="b sched plain">${esc(p.badge)}</span>` : ''}</span></td><td>${badgeSt(p.status)}</td><td>${p.billing === 'monthly' ? 'Monthly' : 'One-Time'}</td>${SIZES.map((s) => { const z = sizeOf(p.id, s); return `<td class="num">${z.active ? (z.price ? (z.sched ? '<span class="il">' + money(z.price) + '<span class="b sched plain" title="Scheduled">→ ' + money(z.sched.price) + '</span></span>' : money(z.price)) : '<span class="b err plain">No Price</span>') : '<span style="color:var(--fa)">Off</span>'}</td>`; }).join('')}<td style="padding-left:28px">${S.platforms.filter((x) => p.platforms[x.id]).length} of 4</td></tr>`).join('');
    return `<div class="ph"><div><h1>Overview</h1><p>Everything the checkout offers right now, what's waiting in draft, and what needs fixing before you publish.</p></div><div class="act"><span class="envchip">Draft · ${c.changes} Unpublished</span></div></div>
    <div class="tiles">
      <div class="tile lk" data-act="go" data-v="plans"><span>Live Plans</span><b>${c.plans}</b><small>${S.plans.length - c.plans} in draft or retired</small></div>
      <div class="tile lk" data-act="go" data-v="availability"><span>Sizes on Sale</span><b>${c.sizes}</b><small>Lowest price ${money(lowest)}</small></div>
      <div class="tile lk" data-act="go" data-v="bundles"><span>Live Bundles</span><b>${c.bundles}</b><small>${S.addons.filter((a) => a.status === 'live').length} add-ons live</small></div>
      <div class="tile lk" data-act="go" data-v="promos"><span>Live Promotions</span><b>${c.promos}</b><small>${S.promos.filter((p) => promoState(p)[0] === 'Scheduled').length} scheduled</small></div>
    </div>
    <div class="card"><div class="ch"><h3>What the Checkout Shows</h3><span class="lab">Live v${S.version} Plus Drafts</span><div class="r"><button class="pill sm" data-act="go" data-v="preview">Live Preview</button></div></div>
    <div class="tsc"><table class="t"><thead><tr><th>Plan</th><th>Status</th><th>Billing</th>${SIZES.map((s) => `<th class="num" style="width:148px">${K(s)}</th>`).join('')}<th style="width:110px;padding-left:28px">Platforms</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <div class="two eq">
    <div class="card m0"><div class="ch"><h3>Checks Before Publish</h3><div class="r">${errs ? `<span class="b err">${errs} Blocking</span>` : '<span class="b live">Ready</span>'}</div></div><div class="cb" style="padding:6px 16px">${ch.length ? ch.slice(0, 7).map((x) => `<div class="msg"><i style="color:${x.lvl === 'err' ? 'var(--no)' : x.lvl === 'warn' ? 'var(--wa)' : 'var(--sky)'}">${x.lvl === 'err' ? '✕' : x.lvl === 'warn' ? '!' : 'i'}</i><span>${esc(x.text)}</span></div>`).join('') : '<div class="empty">Everything checks out.</div>'}</div></div>
    <div class="card m0"><div class="ch"><h3>Unpublished Changes</h3><div class="r"><button class="lnk" data-act="go" data-v="changes">Review All</button></div></div><div class="tsc"><table class="t wrapm"><tbody>${S.changes.slice(0, 5).map((x) => `<tr><td><span class="b plain">${esc(x.area)}</span></td><td>${esc(x.text)}</td><td style="color:var(--mu);white-space:nowrap">${esc(x.when)}</td></tr>`).join('') || '<tr><td class="empty">No draft changes.</td></tr>'}</tbody></table></div></div>
    </div>`;
  }

  function vPlans() {
    const rows = [...S.plans].sort((a, b) => a.sort - b.sort).map((p) => {
      const on = p.sizes.filter((z) => z.active);
      return `<tr class="lk" data-act="openPlan" data-id="${p.id}"><td class="mono">${p.sort}</td><td><b>${esc(p.name)}</b><div class="hint">/${esc(p.slug)}</div></td><td>${badgeSt(p.status)}</td><td>${p.billing === 'monthly' ? 'Monthly' : 'One-Time'}</td><td>${on.map((z) => K(z.size)).join(', ') || '—'}</td><td>${on.length ? money(Math.min(...on.map((z) => z.price || Infinity))) + '–' + money(Math.max(...on.map((z) => z.price))) : '—'}</td><td>${S.platforms.filter((x) => p.platforms[x.id]).map((x) => x.name).join(', ')}</td><td>${Object.values(p.addons).filter(Boolean).length}</td><td>${Object.values(p.bundles).filter(Boolean).length}</td><td>${p.badge ? `<span class="b sched plain">${esc(p.badge)}</span>` : ''}</td></tr>`;
    }).join('');
    return `<div class="ph"><div><h1>Plans</h1><p>Each plan is the root of what a trader buys. Open one to set its sizes, prices, platforms, add-ons and bundles.</p></div><div class="act"><button class="pill" data-act="newPlan">+ New Plan</button></div></div>
    <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Order</th><th>Plan</th><th>Status</th><th>Billing</th><th>Sizes On</th><th>Price Range</th><th>Platforms</th><th>Add-Ons</th><th>Bundles</th><th>Badge</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <p class="hint">Order sets the left-to-right order at checkout. Retired plans stay in the records so existing accounts keep working.</p>`;
  }

  function vPlan() {
    const p = plan(S.planId); if (!p) return vPlans();
    const sizeRows = p.sizes.map((z, i) => { const r = liveRule(p.id, z.size); return `<tr><td class="swc">${sw(z.active, 'sizeActive', `data-i="${i}"`, 'Sell ' + K(z.size))}</td><td><b>${K(z.size)}</b><div class="hint mono">${p.slug.toUpperCase().replace('PLAN-', 'PLAN')}-${z.size / 1000}K</div></td>
      <td style="width:130px"><input type="number" min="0" value="${z.price || ''}" placeholder="Price" data-bind="size.price" data-i="${i}" aria-label="Price ${K(z.size)}"></td>
      <td style="width:130px"><input type="number" min="0" value="${z.compare || ''}" placeholder="None" data-bind="size.compare" data-i="${i}" aria-label="Compare-at ${K(z.size)}"></td>
      <td style="width:120px"><input type="number" min="0" value="${z.floor || ''}" placeholder="None" data-bind="size.floor" data-i="${i}" aria-label="Floor ${K(z.size)}"></td>
      <td style="white-space:nowrap">${z.sched ? `<span class="il" style="gap:6px"><span class="b sched">${money(z.sched.price)} on ${fmtD(z.sched.date)}</span><button class="ic" title="Cancel scheduled price" data-act="unsched" data-i="${i}">✕</button></span>` : `<button class="lnk" data-act="sched" data-i="${i}">Schedule</button>`}</td>
      <td class="nw">${r ? `<span class="il"><button class="lnk" data-act="go" data-v="rules">v${r.version}</button><span class="hint">${money(r.target)} Target · ${money(r.dd)} Drawdown</span></span>` : '<span class="b err plain">None</span>'}</td></tr>`; }).join('');
    const platRows = S.platforms.map((x) => `<tr><td class="swc">${sw(p.platforms[x.id], 'planPlat', `data-id="${x.id}"`, x.name)}</td><td><b>${x.name}</b></td><td><span class="b plain">${x.adapter}</span></td><td class="nw"><label class="chk"><input type="radio" name="defp" ${p.defPlatform === x.id ? 'checked' : ''} data-act="defPlat" data-id="${x.id}" ${p.platforms[x.id] ? '' : 'disabled'}> Default</label></td></tr>`).join('');
    const adRows = S.addons.map((a) => `<tr><td class="swc">${sw(p.addons[a.id], 'planAddon', `data-id="${a.id}"`, a.name)}</td><td><b>${esc(a.name)}</b><div class="hint">${esc(a.effect)}</div></td><td>${a.pricing === 'flat' ? money(a.value) : a.value + '% of size price'}</td><td>${p.sizes.filter((z) => z.active && z.price).map((z) => `<span class="hint">${K(z.size)} ${money(a.pricing === 'flat' ? a.value : z.price * a.value / 100)}</span>`).join(' · ')}</td></tr>`).join('');
    const bRows = S.bundles.map((b) => `<tr><td class="swc">${sw(p.bundles[b.id], 'planBundle', `data-id="${b.id}"`, b.name)}</td><td class="nw"><b>${esc(b.name)}</b></td><td>${bundleSummary(b)}</td><td class="nw" style="color:var(--mu)">${b.stacks ? 'Codes stack' : 'No codes on top'}</td></tr>`).join('');
    return `<div class="crumb"><a data-act="go" data-v="plans">Plans</a> / ${esc(p.name)}</div>
    <div class="ph"><div><h1>${esc(p.name)}</h1><p>Changes here are saved to the draft and go live together when you publish.</p></div><div class="act"><button class="pill" data-act="dupPlan">Duplicate</button>${p.status !== 'retired' ? '<button class="pill dng" data-act="retirePlan">Retire</button>' : '<button class="pill" data-act="restorePlan">Restore</button>'}<button class="pill" data-act="pvFrom" data-id="${p.id}">Preview at Checkout</button></div></div>
    <div class="card"><div class="ch"><h3>Details</h3></div><div class="cb fg"><div class="fg3">
      <div class="fl"><label>Plan Name</label><input value="${esc(p.name)}" data-bind="plan.name"></div>
      <div class="fl"><label>URL Slug</label><input value="${esc(p.slug)}" data-bind="plan.slug"></div>
      <div class="fl"><label>Badge</label><input value="${esc(p.badge)}" placeholder="e.g. Most Popular" data-bind="plan.badge"></div>
      <div class="fl"><label>Billing</label><select data-bind="plan.billing"><option value="one-time" ${p.billing === 'one-time' ? 'selected' : ''}>One-Time</option><option value="monthly" ${p.billing === 'monthly' ? 'selected' : ''}>Monthly</option></select></div>
      <div class="fl"><label>Status</label><select data-bind="plan.status"><option value="draft" ${p.status === 'draft' ? 'selected' : ''}>Draft</option><option value="live" ${p.status === 'live' ? 'selected' : ''}>Live</option><option value="retired" ${p.status === 'retired' ? 'selected' : ''}>Retired</option></select></div>
      <div class="fl"><label>Checkout Order</label><input type="number" min="1" value="${p.sort}" data-bind="plan.sort"></div></div>
      <div class="fl"><label>Description at Checkout</label><input value="${esc(p.desc)}" data-bind="plan.desc"></div></div></div>
    <div class="card"><div class="ch"><h3>Sizes and Prices</h3><span class="lab">Floor = the lowest any discount can take this size</span></div>
      <div class="tsc"><table class="t"><thead><tr><th>Sell</th><th>Size and SKU</th><th>Price ($)</th><th>Compare-At ($)</th><th>Floor ($)</th><th>Scheduled Price</th><th>Rule Set</th></tr></thead><tbody>${sizeRows}</tbody></table></div></div>
    <div class="two">
    <div class="card m0"><div class="ch"><h3>Platforms</h3><span class="lab">All on the simulator until a partner is signed</span></div><div class="tsc"><table class="t"><tbody>${platRows}</tbody></table></div></div>
    <div class="card m0"><div class="ch"><h3>Bundles</h3><div class="r"><button class="lnk" data-act="go" data-v="bundles">Manage Bundles</button></div></div><div class="tsc"><table class="t"><tbody>${bRows}</tbody></table></div></div>
    </div>
    <div class="card" style="margin-top:14px"><div class="ch"><h3>Add-Ons</h3><div class="r"><button class="lnk" data-act="go" data-v="addons">Manage Add-Ons</button></div></div><div class="tsc"><table class="t"><tbody>${adRows}</tbody></table></div></div>`;
  }

  function bundleSummary(b) {
    if (b.type === 'tier') return 'Quantity tier: ' + b.tiers.map((x) => `${x.min}+ save ${x.pct}%`).join(', ') + (b.samePlan ? ', same plan' : ', any plan');
    if (b.type === 'mix') return `Mix: any ${b.min} from ${b.mixPlans.map((x) => plan(x).name).join(' + ')}, save ${b.pct}%`;
    return 'Fixed: ' + b.items.map((x) => `${x.qty}× ${plan(x.plan).name} ${K(x.size)}`).join(' + ') + ` for ${money(b.price)}`;
  }

  function vAvailability() {
    const ps = S.plans;
    const row = (label, kind, id, sub) => `<tr><td>${label}${sub ? `<div class="hint">${sub}</div>` : ''}</td>${ps.map((p) => {
      let on, na = false;
      if (kind === 'size') { const z = sizeOf(p.id, id); on = z.active; }
      else if (kind === 'plat') on = p.platforms[id];
      else if (kind === 'addon') on = p.addons[id];
      else on = p.bundles[id];
      return `<td><button type="button" class="ck ${on ? 'on' : ''} ${na ? 'na' : ''}" aria-pressed="${on}" aria-label="${esc(label)} on ${esc(p.name)}" data-act="mx" data-k="${kind}" data-id="${id}" data-p="${p.id}">✓</button></td>`;
    }).join('')}</tr>`;
    return `<div class="ph"><div><h1>Availability</h1><p>One grid for every plan. A checkmark means checkout shows that option for that plan; the server rejects anything unchecked at payment.</p></div></div>
    <div class="card"><div class="tsc"><table class="mx"><thead><tr><th></th>${ps.map((p) => `<th>${esc(p.name)}<div class="hint" style="font-weight:400">${p.status === 'live' ? 'Live' : p.status === 'draft' ? 'Draft' : 'Retired'}</div></th>`).join('')}</tr></thead><tbody>
    <tr class="g"><td colspan="4">Account Sizes</td></tr>${SIZES.map((s) => row(K(s), 'size', s)).join('')}
    <tr class="g"><td colspan="4">Platforms</td></tr>${S.platforms.map((x) => row(x.name, 'plat', x.id, x.adapter)).join('')}
    <tr class="g"><td colspan="4">Add-Ons</td></tr>${S.addons.map((a) => row(a.name, 'addon', a.id)).join('')}
    <tr class="g"><td colspan="4">Bundles</td></tr>${S.bundles.map((b) => row(b.name, 'bundle', b.id)).join('')}
    </tbody></table></div></div><p class="hint">Turning a size on that has no price shows up in Checks Before Publish and blocks publishing.</p>`;
  }

  function vRules() {
    const list = S.rules.filter((r) => S.ruleFilter === 'all' || r.plan === S.ruleFilter).sort((a, b) => a.plan.localeCompare(b.plan) || a.size - b.size || b.version - a.version);
    const rows = list.map((r) => `<tr><td><b>${esc(plan(r.plan).name)}</b></td><td>${K(r.size)}</td><td class="mono">v${r.version}</td><td>${badgeSt(r.status)}</td><td class="num">${money(r.target)}</td><td class="num">${money(r.daily)}</td><td class="num">${money(r.dd)}</td><td>${esc(r.ddType)}</td><td class="num">${r.contracts}</td><td class="num">${r.minDays}</td><td class="num">${r.consistency}%</td><td class="num">${r.split}%</td><td class="num">${r.accounts}</td><td>${r.status !== 'retired' ? `<button class="lnk" data-act="newRule" data-id="${r.id}">New Version</button>` : ''}${r.status === 'draft' ? ` · <button class="lnk" data-act="delRule" data-id="${r.id}">Discard</button>` : ''}</td></tr>`).join('');
    return `<div class="ph"><div><h1>Rule Sets</h1><p>The trading rules behind each plan and size. A rule set in use is never edited: a change creates a new version, and accounts already sold keep the version they bought.</p></div>
    <div class="act"><div class="seg">${[['all', 'All Plans'], ...S.plans.map((p) => [p.id, p.name])].map(([k, l]) => `<button class="${S.ruleFilter === k ? 'on' : ''}" data-act="ruleFilter" data-k="${k}">${esc(l)}</button>`).join('')}</div></div></div>
    <div class="card"><div class="tsc"><table class="t nw"><thead><tr><th>Plan</th><th>Size</th><th>Version</th><th>Status</th><th class="num">Target</th><th class="num">Daily Loss</th><th class="num">Drawdown</th><th>Drawdown Type</th><th class="num">Max Contracts</th><th class="num">Min Days</th><th class="num">Consistency</th><th class="num">Split</th><th class="num">Accounts</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <p class="hint">Rule amounts are examples until the real plan rules are set.</p>`;
  }

  function vAddons() {
    const rows = S.addons.map((a) => `<tr class="lk" data-act="editAddon" data-id="${a.id}"><td><b>${esc(a.name)}</b><div class="hint">${esc(a.effect)}</div></td><td>${badgeSt(a.status)}</td><td>${a.pricing === 'flat' ? 'Flat' : 'Percent of Size'}</td><td class="num">${a.pricing === 'flat' ? money(a.value) : a.value + '%'}</td><td>${a.discountable ? 'Yes' : 'No'}</td><td>${S.plans.filter((p) => p.addons[a.id]).map((p) => esc(p.name)).join(', ') || '—'}</td></tr>`).join('');
    return `<div class="ph"><div><h1>Add-Ons</h1><p>Extras priced per account. With a quantity of 3, an add-on is charged 3 times. Add-ons that change rules are copied onto each account's rule snapshot.</p></div><div class="act"><button class="pill" data-act="editAddon" data-id="">+ New Add-On</button></div></div>
    <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Add-On</th><th>Status</th><th>Pricing</th><th class="num">Value</th><th>Codes Can Discount It</th><th>Offered On</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }

  function vBundles() {
    const rows = S.bundles.map((b) => `<tr class="lk" data-act="editBundle" data-id="${b.id}"><td><b>${esc(b.name)}</b></td><td>${badgeSt(b.status)}</td><td>${b.type === 'tier' ? 'Quantity Tier' : b.type === 'mix' ? 'Mix and Match' : 'Fixed Bundle'}</td><td>${bundleSummary(b)}</td><td>${b.stacks ? 'Yes' : 'No'}</td><td>${S.plans.filter((p) => p.bundles[b.id]).map((p) => esc(p.name)).join(', ') || '—'}</td><td class="num">${b.uses}</td></tr>`).join('');
    return `<div class="ph"><div><h1>Bundles</h1><p>Bundles change the price of several accounts. When a cart qualifies for more than one, the checkout applies the one that gives the trader the lowest total.</p></div><div class="act"><button class="pill" data-act="editBundle" data-id="">+ New Bundle</button></div></div>
    <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Bundle</th><th>Status</th><th>Type</th><th>How It Prices</th><th>Codes Stack</th><th>Offered On</th><th class="num">Orders</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }

  function vPromos() {
    const list = S.promos.filter((p) => { const st = promoState(p)[0]; return S.promoFilter === 'all' || (S.promoFilter === 'live' && st === 'Live') || (S.promoFilter === 'sched' && st === 'Scheduled') || (S.promoFilter === 'ended' && ['Ended', 'Paused', 'Used Up'].includes(st)); });
    const val = (p) => p.vtype === 'percent' ? p.value + '% Off' : p.vtype === 'fixed' ? money(p.value) + ' Off' : 'Free ' + (addon(p.freeAddon) || {}).name;
    const nwj = (a, j) => a.map((t) => `<span class="nw">${esc(t)}</span>`).join(j);
    const tgt = (p) => nwj([...(p.plans.length ? p.plans.map((x) => plan(x).name) : ['All Plans']), ...p.sizes.map(K), ...Object.entries(p.lines).filter(([, v]) => v).map(([k]) => ({ base: 'Base Price', addon: 'Add-Ons', reset: 'Resets' }[k]))], ' · ');
    const never = (p) => nwj([!p.lines.base && 'Base Price', !p.lines.addon && 'Add-Ons', !p.lines.reset && 'Resets', !p.withBundles && 'Bundled Lines'].filter(Boolean), ', ') || '—';
    const rows = list.map((p) => { const [st, cls] = promoState(p); return `<tr class="lk" data-act="editPromo" data-id="${p.id}"><td class="nw"><b>${esc(p.name)}</b><div class="hint mono">${p.kind === 'code' ? esc(p.code) : 'Automatic'}</div></td><td><span class="b ${cls}">${st}</span></td><td class="nw">${val(p)}</td><td style="max-width:280px">${tgt(p)}</td><td style="color:var(--mu);max-width:220px">${never(p)}</td><td class="nw">${fmtD(p.start)} – ${p.end ? fmtD(p.end) : 'No End'}</td><td class="num">${p.uses}${p.total ? ' / ' + p.total : ''}</td><td>${p.exclusive ? 'Exclusive' : 'Stackable'}</td></tr>`; }).join('');
    const f = [['all', 'All'], ['live', 'Live'], ['sched', 'Scheduled'], ['ended', 'Ended']];
    return `<div class="ph"><div><h1>Promotions</h1><p>Codes and automatic discounts. Each one says who gets it, what it touches, what it never touches, its limits and how it stacks.</p></div><div class="act"><div class="seg">${f.map(([k, l]) => `<button class="${S.promoFilter === k ? 'on' : ''}" data-act="promoFilter" data-k="${k}">${l}</button>`).join('')}</div><button class="pill" data-act="editPromo" data-id="">+ New Promotion</button></div></div>
    <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Promotion</th><th>Status</th><th>Value</th><th>Applies To</th><th>Never Applies To</th><th>Dates</th><th class="num">Uses</th><th>Stacking</th></tr></thead><tbody>${rows || '<tr><td colspan="8" class="empty">No promotions here.</td></tr>'}</tbody></table></div></div>
    <div class="card"><div class="ch"><h3>Stacking Order</h3></div><div class="cb hint" style="font-size:13px">1. Bundles (best one wins) → 2. Automatic promotions by priority → 3. One code per order. Each step discounts what's left. A code marked "not with bundles" skips bundled lines. No line goes below its floor price.</div></div>`;
  }

  function vPlatforms() {
    const rows = S.platforms.map((x) => `<tr><td><b>${x.name}</b></td><td><span class="b plain">${x.adapter}</span></td><td><span class="b ret">Not Connected</span></td><td>${S.plans.filter((p) => p.platforms[x.id]).map((p) => esc(p.name)).join(', ') || '—'}</td><td class="swc">${sw(x.visible, 'platVis', `data-id="${x.id}"`, 'Show ' + x.name)}</td></tr>`).join('');
    return `<div class="ph"><div><h1>Platforms</h1><p>The platforms traders can pick at checkout. Every one runs on the simulator adapter until a platform partner is signed; that decision comes last.</p></div></div>
    <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Platform</th><th>Adapter</th><th>Connection</th><th>Offered On</th><th>Show at Checkout</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <div class="card"><div class="ch"><h3>When a Partner Is Signed</h3></div><div class="cb hint" style="font-size:13px">Its connector replaces the simulator for that platform. Accounts are then created on the real platform, with limits copied from each account's rule snapshot. Nothing in plans, prices or promotions changes.</div></div>`;
  }

  function vTester() {
    const t = S.tester; const q = quote(t);
    const lines = t.lines.map((ln, i) => { const p = plan(ln.plan); return `<div class="sec" style="padding:12px"><div class="rowx tline">
      <select data-bind="t.plan" data-i="${i}" aria-label="Plan">${S.plans.map((x) => `<option value="${x.id}" ${x.id === ln.plan ? 'selected' : ''}>${esc(x.name)}${x.status !== 'live' ? ' (' + x.status + ')' : ''}</option>`).join('')}</select>
      <select data-bind="t.size" data-i="${i}" aria-label="Size">${SIZES.map((s) => { const z = sizeOf(ln.plan, s); return `<option value="${s}" ${s === ln.size ? 'selected' : ''}>${K(s)}${z.active ? '' : ' (Off)'}</option>`; }).join('')}</select>
      <select data-bind="t.platform" data-i="${i}" aria-label="Platform">${S.platforms.map((x) => `<option value="${x.id}" ${x.id === ln.platform ? 'selected' : ''}>${x.name}${p.platforms[x.id] ? '' : ' (Off)'}</option>`).join('')}</select>
      <input type="number" min="1" max="20" value="${ln.qty}" data-bind="t.qty" data-i="${i}" aria-label="Quantity">
      <button class="ic" title="Remove line" data-act="tDel" data-i="${i}">✕</button></div>
      <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:10px">${S.addons.map((a) => `<label class="chk" style="${p.addons[a.id] ? '' : 'opacity:.45'}"><input type="checkbox" ${ln.addons.includes(a.id) ? 'checked' : ''} data-act="tAddon" data-i="${i}" data-id="${a.id}"> ${esc(a.name)}${p.addons[a.id] ? '' : ' (Off)'}</label>`).join('')}</div></div>`; }).join('');
    return `<div class="ph"><div><h1>Price Tester</h1><p>Build any cart and see exactly what the pricing engine charges, using the draft catalog. The same engine prices the real checkout.</p></div></div>
    <div class="two wl">
    <div class="card m0"><div class="ch"><h3>Cart</h3><div class="r"><button class="pill sm" data-act="tAdd">+ Add Line</button></div></div><div class="cb fg">${lines || '<div class="empty">Add a line to start.</div>'}
      <div class="fg2"><div class="fl"><label>Promo Code</label><input value="${esc(t.code)}" placeholder="e.g. BLACKFRIDAY" data-bind="t.code"></div>
      <div class="fl"><label>Trader</label><div style="display:flex;gap:16px;height:36px;align-items:center"><label class="chk"><input type="checkbox" ${t.newTrader ? 'checked' : ''} data-act="tFlag" data-k="newTrader"> First Purchase</label><label class="chk"><input type="checkbox" ${t.affiliate ? 'checked' : ''} data-act="tFlag" data-k="affiliate"> Came from an Affiliate</label></div></div></div>
      <div class="hint">Try: 2× [Plan B] $100K for a bundle, AFF10 with or without First Purchase, or [Plan B] $150K with Daily Payouts for the automatic perk.</div></div></div>
    <div class="card m0"><div class="ch"><h3>Quote</h3><span class="lab">${q.accounts} Account${q.accounts === 1 ? '' : 's'}</span></div><div class="cb" style="padding-top:6px">
      ${q.comps.map((c) => `<div class="qrow"><span>${esc(c.label)}${c.type === 'base' && c.qty > 1 ? ' × ' + c.qty : ''}</span><span>${money(c.amt)}</span></div>`).join('')}
      <div class="qrow" style="color:var(--mu)"><span>Subtotal</span><span>${money(q.sub)}</span></div>
      ${q.savings.map(([l, v]) => `<div class="qrow sv"><span>${esc(l)}</span><span>−${money(v)}</span></div>`).join('')}
      <div class="qrow tot"><span>Total</span><span>${money(q.total)}</span></div>
      <div style="margin-top:12px;border-top:1px solid var(--ln);padding-top:8px">${q.msgs.map(([i, m]) => `<div class="msg"><i style="color:${i === '✓' ? 'var(--ok)' : i === '!' ? 'var(--wa)' : 'var(--no)'}">${i}</i><span>${esc(m)}</span></div>`).join('') || '<div class="msg"><i>·</i><span>No discounts apply to this cart.</span></div>'}</div>
    </div></div></div>`;
  }

  function vChanges() {
    const ch = checks(); const errs = ch.filter((x) => x.lvl === 'err');
    return `<div class="ph"><div><h1>Changes and Publishing</h1><p>Everything you edit sits in a draft. Publishing switches all of it on at once and creates a new catalog version you can roll back to.</p></div><div class="act"><button class="pill" data-act="discardAll" ${S.changes.length ? '' : 'disabled'}>Discard All</button><button class="pill pri" data-act="publish" ${S.changes.length && !errs.length ? '' : 'disabled'}>Publish v${S.version + 1}</button></div></div>
    <div class="two wl2">
    <div class="card m0"><div class="ch"><h3>Unpublished Changes</h3><span class="lab">${S.changes.length}</span></div><div class="tsc"><table class="t"><thead><tr><th>Area</th><th>Change</th><th>By</th><th>When</th><th></th></tr></thead><tbody>${S.changes.map((x) => `<tr><td><span class="b plain">${esc(x.area)}</span></td><td>${esc(x.text)}</td><td class="nw" style="color:var(--mu)">${esc(x.who)}</td><td style="color:var(--mu);white-space:nowrap">${esc(x.when)}</td><td><button class="ic" title="Remove from list" data-act="dropChange" data-id="${x.id}">✕</button></td></tr>`).join('') || '<tr><td colspan="5" class="empty">No draft changes. The checkout matches v' + S.version + '.</td></tr>'}</tbody></table></div></div>
    <div class="card m0"><div class="ch"><h3>Checks Before Publish</h3><div class="r">${errs.length ? `<span class="b err">${errs.length} Blocking</span>` : '<span class="b live">Ready</span>'}</div></div><div class="cb" style="padding:6px 16px">${ch.map((x) => `<div class="msg"><i style="color:${x.lvl === 'err' ? 'var(--no)' : x.lvl === 'warn' ? 'var(--wa)' : 'var(--sky)'}">${x.lvl === 'err' ? '✕' : x.lvl === 'warn' ? '!' : 'i'}</i><span>${esc(x.text)} <button class="lnk" data-act="goCheck" data-go="${esc(JSON.stringify(x.go))}">Fix</button></span></div>`).join('') || '<div class="empty">Everything checks out.</div>'}</div></div>
    </div>
    <div class="card" style="margin-top:14px"><div class="ch"><h3>Version History</h3><span class="lab">Live: v${S.version}</span></div><div class="tsc"><table class="t"><thead><tr><th>Version</th><th>What Changed</th><th class="num">Changes</th><th>Published By</th><th>When</th><th></th></tr></thead><tbody>${S.history.map((h) => `<tr><td class="nw"><span class="mono">v${h.v}</span>${h.v === S.version ? ' <span class="b live" style="margin-left:8px">Live</span>' : ''}</td><td>${esc(h.text)}</td><td class="num">${h.count}</td><td class="nw" style="color:var(--mu)">${esc(h.who)}</td><td class="nw" style="color:var(--mu)">${esc(h.when)}</td><td class="nw">${h.v !== S.version ? `<button class="lnk" data-act="rollback" data-v="${h.v}">Roll Back to v${h.v}</button>` : ''}</td></tr>`).join('')}</tbody></table></div></div>
    <p class="hint">Price and rule changes never touch orders already placed: each order line and account keeps the prices and rules it was sold with. Only owners can publish price and rule changes.</p>`;
  }


  // ================= EXTENSIONS =================
  const APPROVER = '[Second Approver]';
  Object.assign(S, {
    fees: {}, upgrades: [], content: {}, limits: { maxActive: 5, maxFunded: 3, maxFundedBalance: 450000, blocked: '[Sanctioned countries], [Countries you choose]', vpn: true, plans: {} },
    agreements: ['Evaluation Agreement v3', 'Evaluation Agreement v2', 'Evaluation Agreement v1'],
    campaigns: [
      { id: 'cm1', name: 'Black Friday', start: '2026-11-27T00:00', end: '2026-11-30T23:59', promos: ['p1'], prices: [{ plan: 'pb', size: 150000, price: 299 }], bundlesOn: ['mix'], revert: true, paused: false },
      { id: 'cm2', name: 'Holiday Bundles', start: '2026-12-20T00:00', end: '2027-01-02T23:59', promos: [], prices: [], bundlesOn: ['tier', 'mix'], revert: true, paused: false }
    ],
    tests: [
      { id: 't1', name: '$100K Price Test', plan: 'pb', size: 100000, a: 259, b: 239, split: 50, status: 'running', start: 'Nov 12, 2026', va: 1840, vb: 1822, ba: 61, bb: 74 },
      { id: 't2', name: '$25K Starter Price', plan: 'pa', size: 25000, a: 99, b: 89, split: 50, status: 'ended', start: 'Oct 20, 2026', va: 2410, vb: 2388, ba: 96, bb: 101, applied: 'Kept $99' }
    ],
    perfRange: 30,
    batches: [{ id: 'cb1', promo: 'p2', prefix: 'CREATOR', count: 50, usesEach: 1, used: 12, created: 'Nov 14, 2026' }],
    affiliates: [
      { id: 'af1', name: '[Affiliate Name 1]', code: 'SKY10', pct: 10, commission: 15, uses: 38, revenue: 7420, status: 'active' },
      { id: 'af2', name: '[Affiliate Name 2]', code: 'TRADEWITHX', pct: 10, commission: 20, uses: 21, revenue: 4130, status: 'active' },
      { id: 'af3', name: '[Affiliate Name 3]', code: 'FUTURESPRO', pct: 5, commission: 10, uses: 4, revenue: 690, status: 'paused' }
    ],
    codeLog: [
      { code: 'SKY10', trader: '[Trader] #1043', order: 'FS-ORD-2291', off: 25.9, when: 'Today, 10:14 AM' },
      { code: 'AFF10', trader: '[Trader] #1040', order: 'FS-ORD-2288', off: 16.9, when: 'Today, 8:02 AM' },
      { code: 'CREATOR-7KQ2', trader: '[Trader] #1038', order: 'FS-ORD-2285', off: 14.9, when: 'Yesterday, 9:41 PM' },
      { code: 'TRADEWITHX', trader: '[Trader] #1031', order: 'FS-ORD-2279', off: 34.9, when: 'Yesterday, 3:20 PM' }
    ],
    flags: [
      { text: 'One card used with 3 different first-purchase codes', codes: 'AFF10, SKY10, CREATOR-9PLM', level: 'hot', done: false },
      { text: 'Same device on 2 accounts using TRADEWITHX', codes: 'TRADEWITHX', level: 'warm', done: false }
    ],
    currencies: [
      { code: 'USD', name: 'US Dollar', on: true, mode: 'base', rate: 1, round: '1' },
      { code: 'EUR', name: 'Euro', on: true, mode: 'auto', rate: 0.92, round: '.99' },
      { code: 'GBP', name: 'British Pound', on: true, mode: 'auto', rate: 0.79, round: '.99' },
      { code: 'CAD', name: 'Canadian Dollar', on: false, mode: 'auto', rate: 1.39, round: '1' },
      { code: 'AUD', name: 'Australian Dollar', on: false, mode: 'fixed', rate: 1.53, round: '1' }
    ],
    tax: [
      { name: 'European Union VAT', on: false, inclusive: true }, { name: 'United Kingdom VAT', on: false, inclusive: true },
      { name: 'Australia GST', on: false, inclusive: true }, { name: 'Canada GST/HST', on: false, inclusive: false }, { name: 'US Sales Tax', on: false, inclusive: false }
    ],
    recovery: { on: true, delay: 2, pct: 10, expiry: 48, oneTime: true, firstOnly: true, sent: 214, opened: 131, recovered: 37, revenue: 6290 },
    roles: { names: ['Owner', 'Finance', 'Marketing', 'Support', 'Risk'], caps: ['View the Catalog', 'Edit Plans and Sizes', 'Change Prices', 'Change Rule Sets', 'Create Promotions and Codes', 'Manage Affiliates', 'Run Price Tests and Campaigns', 'Approve Price and Rule Changes', 'Publish', 'Export and Import'],
      grid: { Finance: [1, 0, 1, 0, 0, 1, 0, 1, 1, 1], Marketing: [1, 0, 0, 0, 1, 1, 1, 0, 0, 0], Support: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0], Risk: [1, 0, 0, 1, 0, 0, 0, 1, 0, 0] } },
    preview: { device: 'desktop', plan: 'pb', size: 100000, platform: 'tradovate', addons: [], qty: 1, code: '', drafts: false }
  });
  S.plans.forEach((p) => {
    S.fees[p.id] = {}; p.sizes.forEach((z) => { S.fees[p.id][z.size] = { reset: z.price ? Math.round(z.price * 0.55) : 0, activation: p.id === 'pc' ? 0 : (z.size >= 100000 ? 149 : 99), renewal: p.billing === 'monthly' ? z.price : 0, resetDiscountable: true }; });
    S.content[p.id] = { agreement: S.agreements[0], tagline: p.desc, bullets: ['[Profit target rule, in plain words]', '[Drawdown rule, in plain words]', '[Daily loss rule, in plain words]', '[Payout rule, in plain words]'], faq: [{ q: '[How long do I have to pass?]', a: '[Answer]' }, { q: '[When can I request a payout?]', a: '[Answer]' }] };
    S.limits.plans[p.id] = { perTrader: p.id === 'pb' ? 5 : 3, cap: p.id === 'pa' ? 500 : 0, sold: p.id === 'pa' ? 212 : p.id === 'pb' ? 488 : 133, countries: '' };
  });
  S.upgrades = [{ plan: 'pb', from: 50000, to: 100000, price: 99 }, { plan: 'pb', from: 100000, to: 150000, price: 99 }, { plan: 'pc', from: 25000, to: 50000, price: 49 }];

  const pending = () => S.changes.filter((c) => c.approve && !c.approved);
  const campState = (c) => { if (c.paused) return ['Paused', 'ret']; const s = new Date(c.start), e = new Date(c.end); if (s > NOW) return ['Scheduled', 'sched']; if (e < NOW) return ['Ended', 'ended']; return ['Running', 'live']; };
  const fmtDT = (v) => v ? new Date(v).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
  const conv = (b, v) => v ? (b / v * 100) : 0;
  const curPrice = (c, usd) => { if (c.mode === 'base') return usd; let v = usd * c.rate; if (c.round === '.99') v = Math.ceil(v) - 0.01; else if (c.round === '1') v = Math.round(v); else if (c.round === '5') v = Math.ceil(v / 5) * 5; return v; };
  const sym = { USD: '$', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$' };
  const cm = (c, v) => sym[c.code] + (Math.round(v * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const perfOf = (p, z) => { const f = S.perfRange / 30; const base = { pa: 1, pb: 1.6, pc: 0.8 }[p.id] || 0.5; const o = Math.round((z.size / 25000 <= 2 ? 22 : 14) * base * f); return { orders: o, revenue: o * z.price, pass: [14, 11, 9, 7][SIZES.indexOf(z.size)], refunds: Math.round(o * 0.03), cb: Math.floor((o + 8) / 30) }; };

  function vFees() {
    const rows = S.plans.map((p) => p.sizes.filter((z) => z.active).map((z) => { const f = S.fees[p.id][z.size]; return `<tr><td class="nw"><b>${esc(p.name)}</b></td><td>${K(z.size)}</td><td class="num">${money(z.price)}</td>
      <td style="width:120px"><input type="number" min="0" value="${f.reset || ''}" placeholder="None" data-bind="fee.reset" data-p="${p.id}" data-s="${z.size}" aria-label="Reset price"></td>
      <td style="width:120px"><input type="number" min="0" value="${f.activation || ''}" placeholder="None" data-bind="fee.activation" data-p="${p.id}" data-s="${z.size}" aria-label="Activation fee"></td>
      <td style="width:120px">${p.billing === 'monthly' ? `<input type="number" min="0" value="${f.renewal || ''}" data-bind="fee.renewal" data-p="${p.id}" data-s="${z.size}" aria-label="Monthly renewal">` : '<span class="hint">One-Time Plan</span>'}</td>
      <td class="swc">${sw(f.resetDiscountable, 'feeDisc', `data-p="${p.id}" data-s="${z.size}"`, 'Resets can be discounted')}</td></tr>`; }).join('')).join('');
    const up = S.upgrades.map((u, i) => `<tr><td class="nw"><b>${esc(plan(u.plan).name)}</b></td><td>${K(u.from)} → ${K(u.to)}</td><td style="width:140px"><input type="number" min="0" value="${u.price}" data-bind="upg.price" data-i="${i}" aria-label="Upgrade price"></td><td class="hint">Keeps the trader's progress; the new size's rule set applies from the upgrade</td><td><button class="ic" title="Remove" data-act="upDel" data-i="${i}">✕</button></td></tr>`).join('');
    return `<div class="ph"><div><h1>Resets and Fees</h1><p>What traders pay after the first purchase: resets after a breach, the activation fee when funded, monthly renewals and upgrades to a bigger size.</p></div></div>
    <div class="card"><div class="ch"><h3>Per Size</h3><span class="lab">Leave a fee empty to charge nothing</span></div><div class="tsc"><table class="t"><thead><tr><th>Plan</th><th>Size</th><th class="num">Price</th><th>Reset ($)</th><th>Activation Fee ($)</th><th>Monthly Renewal ($)</th><th>Resets Discountable</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <div class="card"><div class="ch"><h3>Upgrades</h3><div class="r"><button class="pill sm" data-act="upAdd">+ Add Upgrade</button></div></div><div class="tsc"><table class="t"><thead><tr><th>Plan</th><th>From → To</th><th>Price ($)</th><th>How It Works</th><th></th></tr></thead><tbody>${up || '<tr><td colspan="5" class="empty">No upgrade paths yet.</td></tr>'}</tbody></table></div></div>
    <p class="hint">"Reset After Breach" and other promotions that target resets use these prices. Fees are priced by the same engine as checkout.</p>`;
  }

  function vContent() {
    const pid = S.contentPlan || S.plans[0].id; const p = plan(pid); const c = S.content[pid];
    return `<div class="ph"><div><h1>Checkout Content</h1><p>What traders read at checkout for each plan, and the agreement version they accept. The rule wording should always match the plan's live rule set.</p></div>
    <div class="act"><div class="seg">${S.plans.map((x) => `<button class="${x.id === pid ? 'on' : ''}" data-act="contentPlan" data-k="${x.id}">${esc(x.name)}</button>`).join('')}</div></div></div>
    <div class="two wl">
    <div>
    <div class="card"><div class="ch"><h3>Agreement</h3></div><div class="cb fg"><div class="fl"><label>Evaluation Agreement Traders Accept</label><select data-bind="cnt.agreement" data-p="${pid}">${S.agreements.map((a, i) => `<option ${c.agreement === a ? 'selected' : ''}>${a}${i === 0 ? ' (latest)' : ''}</option>`).join('')}</select><span class="hint">Each purchase stores the version accepted. Changing it here applies to new purchases only.</span></div></div></div>
    <div class="card"><div class="ch"><h3>Plan Card</h3></div><div class="cb fg"><div class="fl"><label>Tagline</label><input value="${esc(c.tagline)}" data-bind="cnt.tagline" data-p="${pid}"></div>
      <div class="fl"><label>Rule Highlights</label>${c.bullets.map((b, i) => `<div class="rowx" style="grid-template-columns:1fr 28px"><input value="${esc(b)}" data-bind="cnt.bullet" data-p="${pid}" data-i="${i}" aria-label="Highlight ${i + 1}"><button class="ic" data-act="cntDelB" data-i="${i}" title="Remove">✕</button></div>`).join('')}<button class="lnk" style="align-self:flex-start" data-act="cntAddB">+ Add Highlight</button></div></div></div>
    <div class="card"><div class="ch"><h3>FAQ at Checkout</h3><div class="r"><button class="pill sm" data-act="cntAddF">+ Add Question</button></div></div><div class="cb fg">${c.faq.map((f, i) => `<div class="sec" style="padding:12px"><div class="rowx" style="grid-template-columns:1fr 28px;margin-bottom:8px"><input value="${esc(f.q)}" data-bind="cnt.q" data-p="${pid}" data-i="${i}" aria-label="Question"><button class="ic" data-act="cntDelF" data-i="${i}" title="Remove">✕</button></div><textarea data-bind="cnt.a" data-p="${pid}" data-i="${i}" aria-label="Answer">${esc(f.a)}</textarea></div>`).join('') || '<div class="empty">No questions yet.</div>'}</div></div>
    </div>
    <div class="card m0"><div class="ch"><h3>How It Looks</h3><span class="lab">Plan Card at Checkout</span></div><div class="cb">
      <div style="border:1px solid var(--ln);border-radius:12px;padding:18px;background:var(--bg)"><div style="display:flex;align-items:center;gap:8px"><b style="font-size:17px">${esc(p.name)}</b>${p.badge ? `<span class="b sched plain">${esc(p.badge)}</span>` : ''}</div><div style="color:var(--mu);font-size:13px;margin:4px 0 12px">${esc(c.tagline)}</div>
      <ul style="margin:0;padding:0;list-style:none;display:grid;gap:8px">${c.bullets.map((b) => `<li style="display:flex;gap:8px;font-size:13.5px;color:var(--t2)"><span style="color:var(--sky)">✓</span>${esc(b)}</li>`).join('')}</ul>
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--ln2);font-size:12.5px;color:var(--mu)">I agree to the <span style="color:var(--sky)">${esc(c.agreement)}</span></div></div>
      <div style="margin-top:14px">${c.faq.map((f) => `<div class="qrow" style="flex-direction:column;gap:2px"><b style="font-size:13.5px">${esc(f.q)}</b><span style="color:var(--mu);font-size:13px">${esc(f.a)}</span></div>`).join('')}</div>
    </div></div></div>`;
  }

  function vLimits() {
    const L = S.limits;
    const rows = S.plans.map((p) => { const l = L.plans[p.id]; const pct = l.cap ? Math.min(100, l.sold / l.cap * 100) : 0; return `<tr><td class="nw"><b>${esc(p.name)}</b></td><td style="width:130px"><input type="number" min="0" value="${l.perTrader || ''}" placeholder="No Limit" data-bind="lim.perTrader" data-p="${p.id}" aria-label="Max per trader"></td>
      <td style="width:130px"><input type="number" min="0" value="${l.cap || ''}" placeholder="No Cap" data-bind="lim.cap" data-p="${p.id}" aria-label="Monthly cap"></td>
      <td style="min-width:180px">${l.cap ? `<div style="display:flex;align-items:center;gap:10px"><span style="flex:1;height:6px;border-radius:3px;background:#26262A;overflow:hidden"><span style="display:block;height:6px;width:${pct}%;background:${pct > 90 ? 'var(--no)' : 'var(--sky)'}"></span></span><span class="nw" style="font-size:12.5px">${l.sold} / ${l.cap}</span></div>` : `<span class="hint">${l.sold} Sold · No Cap</span>`}</td>
      <td style="min-width:200px"><input value="${esc(l.countries)}" placeholder="Same as Global" data-bind="lim.countries" data-p="${p.id}" aria-label="Extra blocked countries"></td></tr>`; }).join('');
    return `<div class="ph"><div><h1>Limits and Restrictions</h1><p>Enforced at checkout before payment, and again by the server. These match the restrictions in the risk plan.</p></div></div>
    <div class="card"><div class="ch"><h3>Every Trader</h3></div><div class="cb fg"><div class="fg3">
      <div class="fl"><label>Max Active Evaluations</label><input type="number" min="0" value="${L.maxActive}" data-bind="lim.maxActive"></div>
      <div class="fl"><label>Max Funded Accounts</label><input type="number" min="0" value="${L.maxFunded}" data-bind="lim.maxFunded"></div>
      <div class="fl"><label>Max Total Funded Balance ($)</label><input type="number" min="0" value="${L.maxFundedBalance}" data-bind="lim.maxFundedBalance"></div></div>
      <div class="fl"><label>Blocked Countries</label><input value="${esc(L.blocked)}" data-bind="lim.blocked"><span class="hint">Checked at sign-up, checkout, KYC and payout. Set by your lawyer.</span></div>
      <label class="chk"><input type="checkbox" ${L.vpn ? 'checked' : ''} data-act="limVpn"> Block Checkout When a VPN or Proxy Hides the Trader's Country</label></div></div>
    <div class="card"><div class="ch"><h3>Per Plan</h3><span class="lab">Caps reset on the 1st of each month</span></div><div class="tsc"><table class="t"><thead><tr><th>Plan</th><th>Max per Trader</th><th>Monthly Sales Cap</th><th>Sold This Month</th><th>Extra Blocked Countries</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <p class="hint">When a trader hits a limit, checkout explains why and the option is shown as unavailable instead of failing at payment.</p>`;
  }

  function vCurrency() {
    const ex = sizeOf('pb', 100000).price;
    const rows = S.currencies.map((c, i) => `<tr><td class="swc">${c.mode === 'base' ? '<span class="b live plain">Base</span>' : sw(c.on, 'curOn', `data-i="${i}"`, 'Sell in ' + c.code)}</td><td><span class="il" style="gap:6px;align-items:baseline"><b>${c.code}</b><span class="hint">${c.name}</span></span></td>
      <td style="width:170px">${c.mode === 'base' ? '<span class="hint">All prices are set in USD</span>' : `<select data-bind="cur.mode" data-i="${i}"><option value="auto" ${c.mode === 'auto' ? 'selected' : ''}>Convert Daily</option><option value="fixed" ${c.mode === 'fixed' ? 'selected' : ''}>Fixed Rate</option></select>`}</td>
      <td style="width:110px">${c.mode === 'base' ? '' : `<input type="number" step="0.01" value="${c.rate}" data-bind="cur.rate" data-i="${i}" ${c.mode === 'auto' ? 'disabled' : ''} aria-label="Rate">`}</td>
      <td style="width:180px">${c.mode === 'base' ? '' : `<select data-bind="cur.round" data-i="${i}"><option value=".99" ${c.round === '.99' ? 'selected' : ''}>End in .99</option><option value="1" ${c.round === '1' ? 'selected' : ''}>Whole Number</option><option value="5" ${c.round === '5' ? 'selected' : ''}>Nearest 5</option></select>`}</td>
      <td class="num nw">${cm(c, curPrice(c, ex))}</td></tr>`).join('');
    const tx = S.tax.map((t, i) => `<tr><td class="swc">${sw(t.on, 'taxOn', `data-i="${i}"`, 'Collect ' + t.name)}</td><td><b>${t.name}</b></td><td><label class="chk"><input type="checkbox" ${t.inclusive ? 'checked' : ''} data-act="taxInc" data-i="${i}"> Prices Include Tax</label></td></tr>`).join('');
    return `<div class="ph"><div><h1>Currencies and Tax</h1><p>Show prices in a trader's own currency and collect tax where required. Prices are still set once, in US dollars.</p></div></div>
    <div class="card"><div class="ch"><h3>Currencies</h3><span class="lab">Example: [Plan B Name] $100K at ${money(ex)}</span></div><div class="tsc"><table class="t"><thead><tr><th>Sell In</th><th>Currency</th><th>Rate</th><th>Rate Value</th><th>Rounding</th><th class="num">Example Price</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <div class="card"><div class="ch"><h3>Tax Collection</h3><span class="lab">Off Until Confirmed</span></div><div class="tsc"><table class="t"><tbody>${tx}</tbody></table></div></div>
    <p class="hint">Confirm with an accountant which regions require tax on evaluation fees before switching any region on. Rates shown are examples; live rates come from the payment processor.</p>`;
  }

  function vPreview() {
    const pv = S.preview; const plans = S.plans.filter((p) => p.status === 'live' || (pv.drafts && p.status === 'draft')).sort((a, b) => a.sort - b.sort);
    let p = plan(pv.plan); if (!plans.includes(p)) { p = plans[0]; pv.plan = p.id; }
    const sizes = p.sizes.filter((z) => z.active && z.price); if (!sizes.find((z) => z.size === pv.size)) pv.size = (sizes[0] || {}).size;
    const plats = S.platforms.filter((x) => p.platforms[x.id] && x.visible); if (!plats.find((x) => x.id === pv.platform)) pv.platform = p.defPlatform;
    const ads = S.addons.filter((a) => a.status === 'live' && p.addons[a.id]); pv.addons = pv.addons.filter((a) => p.addons[a]);
    const z = sizeOf(p.id, pv.size);
    const q = quote({ lines: [{ plan: p.id, size: pv.size, platform: pv.platform, addons: pv.addons, qty: pv.qty }], code: pv.code, newTrader: true, affiliate: false });
    const mob = pv.device === 'phone';
    const chip = (on, act, data, label, sub) => `<button type="button" data-act="${act}" ${data} style="all:unset;cursor:pointer;box-sizing:border-box;padding:12px 14px;border-radius:10px;border:1px solid ${on ? 'var(--sky)' : 'var(--ln)'};background:${on ? 'rgba(124,196,255,.08)' : 'transparent'};display:flex;flex-direction:column;gap:2px;${mob ? 'flex:1 1 40%' : 'flex:1'}"><b style="font-size:14px">${label}</b>${sub ? `<span style="font-size:12px;color:var(--mu)">${sub}</span>` : ''}</button>`;
    const left = `<div style="display:flex;flex-direction:column;gap:18px">
      <div><div class="lab" style="margin-bottom:8px;font-size:12.5px;color:var(--mu)">Choose Your Account</div><div style="display:flex;flex-wrap:wrap;gap:8px">${plans.map((x) => chip(x.id === p.id, 'pvPlan', `data-id="${x.id}"`, esc(x.name) + (x.badge ? `<span class="b sched plain" style="display:flex;width:max-content;margin:6px 0 2px">${esc(x.badge)}</span>` : ''), x.billing === 'monthly' ? 'Monthly' : 'One-Time')).join('')}</div></div>
      <div><div class="lab" style="margin-bottom:8px;font-size:12.5px;color:var(--mu)">Account Size</div><div style="display:flex;flex-wrap:wrap;gap:8px">${sizes.map((x) => chip(x.size === pv.size, 'pvSize', `data-s="${x.size}"`, K(x.size), (x.compare ? `<s style="color:var(--fa)">${money(x.compare)}</s> ` : '') + money(x.price))).join('')}</div></div>
      <div><div class="lab" style="margin-bottom:8px;font-size:12.5px;color:var(--mu)">Platform</div><div style="display:flex;flex-wrap:wrap;gap:8px">${plats.map((x) => chip(x.id === pv.platform, 'pvPlat', `data-id="${x.id}"`, x.name)).join('')}</div></div>
      ${ads.length ? `<div><div class="lab" style="margin-bottom:8px;font-size:12.5px;color:var(--mu)">Add-Ons</div><div style="display:grid;gap:8px">${ads.map((a) => `<label class="chk" style="padding:12px 14px;border:1px solid var(--ln);border-radius:10px;justify-content:space-between"><span style="display:flex;gap:8px;align-items:center"><input type="checkbox" ${pv.addons.includes(a.id) ? 'checked' : ''} data-act="pvAddon" data-id="${a.id}"> ${esc(a.name)}</span><span style="color:var(--mu)">+${money(a.pricing === 'flat' ? a.value : z.price * a.value / 100)}</span></label>`).join('')}</div></div>` : ''}
    </div>`;
    const right = `<div style="border:1px solid var(--ln);border-radius:12px;padding:16px;background:var(--p2)"><b style="font-size:15px">Your Order</b>
      <div style="display:flex;align-items:center;gap:10px;margin:12px 0"><span style="font-size:13px;color:var(--mu)">How Many?</span><button class="ic" data-act="pvQty" data-d="-1" style="border:1px solid var(--ln)">−</button><b>${pv.qty}</b><button class="ic" data-act="pvQty" data-d="1" style="border:1px solid var(--ln)">+</button></div>
      ${q.comps.map((c) => `<div class="qrow"><span>${esc(c.label)}</span><span>${money(c.amt)}</span></div>`).join('')}
      ${q.savings.map(([l, v]) => `<div class="qrow sv"><span>${esc(l)}</span><span>−${money(v)}</span></div>`).join('')}
      <div class="qrow tot"><span>Total</span><span>${money(q.total)}</span></div>
      <input value="${esc(pv.code)}" placeholder="Promo Code" data-bind="pv.code" style="margin-top:8px" aria-label="Promo Code">
      <div style="margin-top:12px;height:44px;border-radius:4px;background:#fff;color:#111113;display:grid;place-items:center;font-weight:600">Continue to Payment</div>
      ${q.msgs.filter((m) => m[0] !== '✓').map(([, m]) => `<div class="msg"><i style="color:var(--no)">✕</i><span>${esc(m)}</span></div>`).join('')}</div>`;
    return `<div class="ph"><div><h1>Live Preview</h1><p>The checkout exactly as traders will see it after you publish, built from the draft catalog and priced by the real engine.</p></div>
    <div class="act"><label class="chk"><input type="checkbox" ${pv.drafts ? 'checked' : ''} data-act="pvDrafts"> Include Draft Plans</label><div class="seg"><button class="${!mob ? 'on' : ''}" data-act="pvDev" data-k="desktop">Desktop</button><button class="${mob ? 'on' : ''}" data-act="pvDev" data-k="phone">Phone</button></div></div></div>
    <div style="display:flex;justify-content:center"><div style="width:100%;max-width:${mob ? '390px' : '1040px'};border:1px solid var(--ln);border-radius:${mob ? '28px' : '14px'};background:var(--bg);overflow:hidden;transition:max-width .2s">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--ln)"><span style="display:flex;align-items:center;gap:6px"><b style="font-size:19px;font-weight:700;letter-spacing:-.045em;line-height:1">fundedsky</b><span style="background:#7CC4FF;color:#08080A;font-weight:600;font-size:13px;letter-spacing:-.01em;padding:2px 6px 3px;border-radius:4px;line-height:1">futures</span></span><span style="font-size:12.5px;color:var(--mu)">Secure Checkout</span></div>
      <div class="pvg" style="padding:${mob ? '16px' : '24px'};display:grid;grid-template-columns:${mob ? '1fr' : 'minmax(0,1.5fr) minmax(0,1fr)'};gap:20px;align-items:start">${left}${right}</div></div></div>`;
  }

  function vCampaigns() {
    const rows = S.campaigns.map((c) => { const [st, cls] = campState(c); const parts = [c.promos.length && c.promos.map((x) => (S.promos.find((p) => p.id === x) || {}).name).join(', '), c.prices.length && c.prices.length + ' price change' + (c.prices.length > 1 ? 's' : ''), c.bundlesOn.length && c.bundlesOn.length + ' bundle' + (c.bundlesOn.length > 1 ? 's' : '') + ' on'].filter(Boolean).join(' · '); return `<tr class="lk" data-act="editCamp" data-id="${c.id}"><td class="nw"><b>${esc(c.name)}</b></td><td><span class="b ${cls}">${st}</span></td><td class="nw">${fmtDT(c.start)}</td><td class="nw">${fmtDT(c.end)}</td><td>${esc(parts) || '—'}</td><td>${c.revert ? 'Switches Back Automatically' : 'Stays On'}</td></tr>`; }).join('');
    return `<div class="ph"><div><h1>Campaigns</h1><p>Prepare a sale in advance: promotions, temporary prices and bundles that switch on at a set time and switch back when it ends. No one has to be awake to press Publish.</p></div><div class="act"><button class="pill" data-act="editCamp" data-id="">+ New Campaign</button></div></div>
    <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Campaign</th><th>Status</th><th>Starts</th><th>Ends</th><th>What Changes</th><th>When It Ends</th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="empty">No campaigns yet.</td></tr>'}</tbody></table></div></div>
    <p class="hint">Times are Eastern. A campaign's price changes still need a second approval before it's scheduled.</p>`;
  }

  function vTests() {
    const rows = S.tests.map((t) => { const ca = conv(t.ba, t.va), cb = conv(t.bb, t.vb); const ra = t.ba * t.a / t.va, rb = t.bb * t.b / t.vb; const lead = rb > ra ? 'B' : 'A'; const n = Math.min(t.va, t.vb); const sure = n > 1500 ? 'Enough visitors to decide' : 'Keep running'; return `<tr><td class="nw"><b>${esc(t.name)}</b><div class="hint">${esc(plan(t.plan).name)} ${K(t.size)} · since ${t.start}</div></td><td><span class="b ${t.status === 'running' ? 'live' : 'ended'}">${t.status === 'running' ? 'Running' : 'Ended'}</span></td>
      <td class="num nw">A ${money(t.a)}<div class="hint">${t.va.toLocaleString()} visitors · ${ca.toFixed(1)}% buy</div></td><td class="num nw">B ${money(t.b)}<div class="hint">${t.vb.toLocaleString()} visitors · ${cb.toFixed(1)}% buy</div></td>
      <td class="num nw">${money(ra)} vs ${money(rb)}<div class="hint">revenue per visitor</div></td><td class="nw">${t.status === 'running' ? `<b style="color:var(--ok)">${lead} Leads</b><div class="hint">${sure}</div>` : esc(t.applied || '')}</td>
      <td class="nw">${t.status === 'running' ? `<button class="lnk" data-act="testApply" data-id="${t.id}" data-w="${lead}">Use ${lead}'s Price</button> · <button class="lnk" data-act="testStop" data-id="${t.id}">Stop</button>` : ''}</td></tr>`; }).join('');
    return `<div class="ph"><div><h1>Price Tests</h1><p>Show two prices to different traders and keep the one that earns more per visitor, not just the one more people buy.</p></div><div class="act"><button class="pill" data-act="newTest">+ New Price Test</button></div></div>
    <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Test</th><th>Status</th><th class="num">Price A</th><th class="num">Price B</th><th class="num">Earned</th><th>Result</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <p class="hint">Each visitor always sees the same price. Using a price creates a draft price change that needs approval and publishing.</p>`;
  }

  function vPerf() {
    const live = S.plans.filter((p) => p.status === 'live');
    const all = live.flatMap((p) => p.sizes.filter((z) => z.active && z.price).map((z) => ({ p, z, m: perfOf(p, z) })));
    const tot = all.reduce((a, x) => ({ o: a.o + x.m.orders, r: a.r + x.m.revenue, rf: a.rf + x.m.refunds, cb: a.cb + x.m.cb }), { o: 0, r: 0, rf: 0, cb: 0 });
    const rows = all.map(({ p, z, m }) => `<tr><td class="nw"><b>${esc(p.name)}</b></td><td>${K(z.size)}</td><td class="num">${m.orders}</td><td class="num">${money(m.revenue)}</td><td class="num">${m.pass}%</td><td class="num">${m.refunds}</td><td class="num" style="color:${m.cb / Math.max(1, m.orders) > 0.01 ? 'var(--wa)' : 'inherit'}">${m.cb}</td></tr>`).join('');
    const f = S.perfRange / 30;
    const pr = S.promos.map((p) => { const uses = Math.round(p.uses * 10 * f) + (p.kind === 'auto' ? Math.round(18 * f) : Math.round(9 * f)); const off = uses * (p.vtype === 'free' ? 64 : 22); const rev = uses * 190; return `<tr><td class="nw"><b>${esc(p.name)}</b><div class="hint mono">${p.kind === 'code' ? p.code : 'Automatic'}</div></td><td class="num">${uses}</td><td class="num">${money(off)}</td><td class="num">${money(rev)}</td><td class="num">${Math.round(uses * 0.6)}</td><td class="num">${rev ? Math.round(off / rev * 100) : 0}%</td></tr>`; }).join('');
    const ad = S.addons.map((a) => { const n = Math.round({ reset: 41, daily: 27, noact: 19, split: 9 }[a.id] * f || 5); return `<tr><td><b>${esc(a.name)}</b></td><td class="num">${n}</td><td class="num">${money(Math.round(n * (a.pricing === 'flat' ? a.value : 2.2 * a.value)))}</td></tr>`; }).join('');
    return `<div class="ph"><div><h1>Performance</h1><p>What each part of the catalog sells, and what discounts cost. Use it before changing a price or launching a sale.</p></div><div class="act"><div class="seg">${[7, 30, 90].map((d) => `<button class="${S.perfRange === d ? 'on' : ''}" data-act="perfRange" data-k="${d}">${d} Days</button>`).join('')}</div></div></div>
    <div class="tiles"><div class="tile"><span>Orders</span><b>${tot.o}</b><small>Last ${S.perfRange} days</small></div><div class="tile"><span>Revenue</span><b>${money(tot.r)}</b><small>Before refunds</small></div><div class="tile"><span>Refund Rate</span><b>${(tot.rf / Math.max(1, tot.o) * 100).toFixed(1)}%</b><small>${tot.rf} refunds</small></div><div class="tile"><span>Chargeback Rate</span><b>${(tot.cb / Math.max(1, tot.o) * 100).toFixed(1)}%</b><small>Card networks penalize above 1%</small></div></div>
    <div class="card"><div class="ch"><h3>By Plan and Size</h3></div><div class="tsc"><table class="t"><thead><tr><th>Plan</th><th>Size</th><th class="num">Orders</th><th class="num">Revenue</th><th class="num">Pass Rate</th><th class="num">Refunds</th><th class="num">Chargebacks</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <div class="two"><div class="card m0"><div class="ch"><h3>Promotions</h3><span class="lab">What a discount cost vs. what it brought in</span></div><div class="tsc"><table class="t"><thead><tr><th>Promotion</th><th class="num">Uses</th><th class="num">Discount Given</th><th class="num">Revenue</th><th class="num">New Traders</th><th class="num">Cost</th></tr></thead><tbody>${pr}</tbody></table></div></div>
    <div class="card m0"><div class="ch"><h3>Add-Ons</h3></div><div class="tsc"><table class="t"><thead><tr><th>Add-On</th><th class="num">Sold</th><th class="num">Revenue</th></tr></thead><tbody>${ad}</tbody></table></div></div></div>
    <p class="hint" style="margin-top:14px">Sample numbers until real orders exist.</p>`;
  }

  function vCodes() {
    const ba = S.batches.map((b) => `<tr><td class="nw"><b class="mono">${esc(b.prefix)}-XXXX</b></td><td>${esc((S.promos.find((p) => p.id === b.promo) || {}).name || '—')}</td><td class="num">${b.count}</td><td class="num">${b.usesEach}</td><td class="num">${b.used} / ${b.count}</td><td class="nw">${b.created}</td><td class="nw num"><button class="lnk" data-act="batchExport" data-id="${b.id}">Download CSV</button></td></tr>`).join('');
    const af = S.affiliates.map((a) => `<tr class="lk" data-act="editAff" data-id="${a.id}"><td class="nw"><b>${esc(a.name)}</b></td><td class="mono">${esc(a.code)}</td><td><span class="b ${a.status === 'active' ? 'live' : 'ret'}">${a.status === 'active' ? 'Active' : 'Paused'}</span></td><td class="num">${a.pct}%</td><td class="num">${a.commission}%</td><td class="num">${a.uses}</td><td class="num">${money(a.revenue)}</td><td class="num">${money(a.revenue * a.commission / 100)}</td></tr>`).join('');
    const lg = S.codeLog.map((l) => `<tr><td class="mono nw">${esc(l.code)}</td><td class="nw">${esc(l.trader)}</td><td class="mono nw">${esc(l.order)}</td><td class="num">−${money(l.off)}</td><td class="nw" style="color:var(--mu)">${esc(l.when)}</td></tr>`).join('');
    const fl = S.flags.map((f, i) => `<div class="att" style="cursor:default"><div><b>${esc(f.text)}</b><small class="mono">${esc(f.codes)}</small></div>${f.done ? '<span class="b live">Reviewed</span>' : `<button class="pill sm" data-act="flagDone" data-i="${i}">Mark Reviewed</button>`}</div>`).join('');
    return `<div class="ph"><div><h1>Codes and Affiliates</h1><p>Unique codes in bulk, a code for every affiliate, a log of every use, and flags when codes look abused.</p></div><div class="act"><button class="pill" data-act="newBatch">+ Generate Codes</button><button class="pill" data-act="editAff" data-id="">+ New Affiliate</button></div></div>
    <div class="card"><div class="ch"><h3>Affiliates</h3><span class="lab">Commission is paid on the amount after discounts</span></div><div class="tsc"><table class="t"><thead><tr><th>Affiliate</th><th>Code</th><th>Status</th><th class="num">Trader Discount</th><th class="num">Commission</th><th class="num">Uses</th><th class="num">Revenue</th><th class="num">Owed</th></tr></thead><tbody>${af}</tbody></table></div></div>
    <div><div class="card"><div class="ch"><h3>Unique Code Batches</h3></div><div class="tsc"><table class="t"><thead><tr><th>Codes</th><th>Promotion</th><th class="num">Count</th><th class="num">Uses Each</th><th class="num">Used</th><th>Created</th><th></th></tr></thead><tbody>${ba || '<tr><td colspan="7" class="empty">No batches yet.</td></tr>'}</tbody></table></div></div>
    <div class="card"><div class="ch"><h3>Possible Abuse</h3><span class="lab">${S.flags.filter((f) => !f.done).length} Open</span></div><div class="cb" style="padding:4px 16px">${fl}</div></div></div>
    <div class="card"><div class="ch"><h3>Recent Code Uses</h3></div><div class="tsc"><table class="t"><thead><tr><th>Code</th><th>Trader</th><th>Order</th><th class="num">Discount</th><th>When</th></tr></thead><tbody>${lg}</tbody></table></div></div>`;
  }

  function vRecovery() {
    const r = S.recovery;
    return `<div class="ph"><div><h1>Abandoned Checkout</h1><p>When a signed-in trader leaves checkout without paying, send a reminder with a one-time code.</p></div><div class="act">${sw(r.on, 'recOn', '', 'Recovery emails on')}<span class="hint">${r.on ? 'On' : 'Off'}</span></div></div>
    <div class="tiles"><div class="tile"><span>Emails Sent</span><b>${r.sent}</b><small>Last 30 days</small></div><div class="tile"><span>Opened</span><b>${Math.round(r.opened / r.sent * 100)}%</b><small>${r.opened} opens</small></div><div class="tile"><span>Recovered</span><b>${r.recovered}</b><small>${(r.recovered / r.sent * 100).toFixed(1)}% of sent</small></div><div class="tile"><span>Recovered Revenue</span><b>${money(r.revenue)}</b><small>After the code discount</small></div></div>
    <div class="card"><div class="ch"><h3>Settings</h3></div><div class="cb fg"><div class="fg3">
      <div class="fl"><label>Send After (Hours)</label><input type="number" min="1" value="${r.delay}" data-bind="rec.delay"></div>
      <div class="fl"><label>Discount (%)</label><input type="number" min="0" value="${r.pct}" data-bind="rec.pct"><span class="hint">0 sends a plain reminder with no code</span></div>
      <div class="fl"><label>Code Expires After (Hours)</label><input type="number" min="1" value="${r.expiry}" data-bind="rec.expiry"></div></div>
      <label class="chk"><input type="checkbox" ${r.oneTime ? 'checked' : ''} data-act="recFlag" data-k="oneTime"> Each Code Works Once, for That Trader Only</label>
      <label class="chk"><input type="checkbox" ${r.firstOnly ? 'checked' : ''} data-act="recFlag" data-k="firstOnly"> Only for Traders Who Have Never Bought</label>
      <div class="hint">The code follows normal stacking: it never applies on top of another code and never goes below a size's floor price.</div></div></div>
    <div class="card"><div class="ch"><h3>Email Preview</h3></div><div class="cb"><div style="max-width:520px;border:1px solid var(--ln);border-radius:12px;padding:20px;background:var(--bg)"><b style="font-size:16px">Your account is still waiting</b><p style="color:var(--t2);font-size:14px;line-height:1.55;margin:8px 0 14px">You left [Plan B Name] $100K in your cart.${r.pct ? ` Use code <b class="mono" style="color:var(--sky)">BACK-XXXX</b> for ${r.pct}% off in the next ${r.expiry} hours.` : ''}</p><span style="display:inline-block;background:#fff;color:#111113;font-weight:600;padding:10px 16px;border-radius:4px">Finish Checkout</span></div></div></div>`;
  }

  function vRoles() {
    const R = S.roles;
    return `<div class="ph"><div><h1>Permissions</h1><p>Who on the team can do what in the catalog. Owners can do everything; every action is still recorded with who did it.</p></div></div>
    <div class="card"><div class="tsc"><table class="mx"><thead><tr><th>Can</th>${R.names.map((n) => `<th>${n}</th>`).join('')}</tr></thead><tbody>${R.caps.map((c, ci) => `<tr><td>${c}</td>${R.names.map((n) => n === 'Owner' ? '<td><button type="button" class="ck on na" aria-pressed="true" aria-label="Owner always">✓</button></td>' : `<td><button type="button" class="ck ${R.grid[n][ci] ? 'on' : ''}" aria-pressed="${!!R.grid[n][ci]}" aria-label="${esc(c)} for ${n}" data-act="roleCk" data-r="${n}" data-c="${ci}">✓</button></td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
    <p class="hint">Price and rule changes need someone with "Approve Price and Rule Changes" other than the person who made them.</p>`;
  }

  // Rewritten changes view with before/after and approvals
  vChanges = function () {
    const ch = checks(); const errs = ch.filter((x) => x.lvl === 'err'); const pend = pending();
    const can = S.changes.length && !errs.length && !pend.length;
    return `<div class="ph"><div><h1>Changes and Publishing</h1><p>Every edit sits in a draft. Price and rule changes need a second person to approve them. Publishing switches everything on at once as a new version you can roll back to.</p></div>
    <div class="act"><button class="pill" data-act="exportCat">Export</button><button class="pill" data-act="importCat">Import</button><button class="pill" data-act="discardAll" ${S.changes.length ? '' : 'disabled'}>Discard All</button><button class="pill pri" data-act="publish" ${can ? '' : 'disabled'}>Publish v${S.version + 1}</button></div></div>
    ${pend.length ? `<div class="card" style="border-color:rgba(242,196,109,.45)"><div class="cb" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><span class="b draft">${pend.length} Waiting for Approval</span><span style="color:var(--t2);font-size:13.5px">Price and rule changes can't be published until ${APPROVER} approves them.</span><button class="pill sm" style="margin-left:auto" data-act="approveAll">Approve All as ${APPROVER}</button></div></div>` : ''}
    <div class="card"><div class="ch"><h3>Unpublished Changes</h3><span class="lab">${S.changes.length}</span></div><div class="tsc"><table class="t"><thead><tr><th>Area</th><th>Change</th><th>Before</th><th>After</th><th>Approval</th><th>By</th><th></th></tr></thead><tbody>${S.changes.map((x) => `<tr><td><span class="b plain">${esc(x.area)}</span></td><td style="min-width:260px">${esc(x.text)}<div class="hint">${esc(x.when)}</div></td><td class="nw" style="color:var(--no)">${x.before != null ? esc(x.before) : '—'}</td><td class="nw" style="color:var(--ok)">${x.after != null ? esc(x.after) : '—'}</td>
      <td class="nw">${x.approve ? (x.approved ? `<span class="b live">Approved</span><div class="hint">${APPROVER}</div>` : `<button class="pill sm" data-act="approveOne" data-id="${x.id}">Approve</button>`) : '<span class="hint">Not Needed</span>'}</td><td class="nw" style="color:var(--mu)">${esc(x.who)}</td><td><button class="ic" title="Discard this change" data-act="dropChange" data-id="${x.id}">✕</button></td></tr>`).join('') || '<tr><td colspan="7" class="empty">No draft changes. The checkout matches v' + S.version + '.</td></tr>'}</tbody></table></div></div>
    <div class="two eq"><div class="card m0"><div class="ch"><h3>Checks Before Publish</h3><div class="r">${errs.length ? `<span class="b err">${errs.length} Blocking</span>` : '<span class="b live">Ready</span>'}</div></div><div class="cb" style="padding:6px 16px">${ch.map((x) => `<div class="msg"><i style="color:${x.lvl === 'err' ? 'var(--no)' : x.lvl === 'warn' ? 'var(--wa)' : 'var(--sky)'}">${x.lvl === 'err' ? '✕' : x.lvl === 'warn' ? '!' : 'i'}</i><span>${esc(x.text)} <button class="lnk" data-act="goCheck" data-go="${esc(JSON.stringify(x.go))}">Fix</button></span></div>`).join('') || '<div class="empty">Everything checks out.</div>'}</div></div>
    <div class="card m0"><div class="ch"><h3>Version History</h3><span class="lab">Live: v${S.version}</span></div><div class="tsc"><table class="t"><tbody>${S.history.map((h) => `<tr><td class="nw"><span class="mono">v${h.v}</span>${h.v === S.version ? ' <span class="b live" style="margin-left:8px">Live</span>' : ''}</td><td>${esc(h.text)}<div class="hint">${esc(h.who)} · ${esc(h.when)}</div></td><td class="nw">${h.v !== S.version ? `<button class="lnk" data-act="rollback" data-v="${h.v}">Roll Back</button>` : ''}</td></tr>`).join('')}</tbody></table></div></div></div>
    <p class="hint" style="margin-top:14px">Changes never touch orders already placed: each order line and account keeps the prices and rules it was sold with.</p>`;
  };

  function extDrawer(d) {
    const f = d.f;
    if (d.kind === 'intg') return intgDrawer(f);
    if (d.kind === 'camp') {
      return { title: f.id ? 'Edit Campaign' : 'New Campaign', body: `<div class="fl"><label>Name</label><input value="${esc(f.name)}" data-df="name"></div>
        <div class="fg2"><div class="fl"><label>Starts (Eastern)</label><input type="datetime-local" value="${f.start}" data-df="start"></div><div class="fl"><label>Ends (Eastern)</label><input type="datetime-local" value="${f.end}" data-df="end"></div></div>
        <div class="sec"><h4>Promotions to Switch On</h4><div style="display:flex;flex-direction:column;gap:10px">${S.promos.map((p) => `<label class="chk"><input type="checkbox" ${f.promos.includes(p.id) ? 'checked' : ''} data-dfa="promos" data-v="${p.id}"> ${esc(p.name)}${p.kind === 'code' ? ' (' + p.code + ')' : ''}</label>`).join('')}</div></div>
        <div class="sec"><h4>Temporary Prices</h4>${f.prices.map((x, i) => `<div class="rowx" style="grid-template-columns:1.3fr 1fr 100px 28px;margin-bottom:8px"><select data-dfr="${i}.plan">${S.plans.map((p) => `<option value="${p.id}" ${p.id === x.plan ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select><select data-dfr="${i}.size">${SIZES.map((s) => `<option value="${s}" ${s === +x.size ? 'selected' : ''}>${K(s)}</option>`).join('')}</select><input type="number" min="0" value="${x.price}" data-dfr="${i}.price" aria-label="Price"><button class="ic" data-act="campPDel" data-i="${i}">✕</button></div>`).join('')}<button class="lnk" data-act="campPAdd">+ Add Price</button></div>
        <div class="sec"><h4>Bundles to Switch On</h4><div style="display:flex;flex-direction:column;gap:10px">${S.bundles.map((b) => `<label class="chk"><input type="checkbox" ${f.bundlesOn.includes(b.id) ? 'checked' : ''} data-dfa="bundlesOn" data-v="${b.id}"> ${esc(b.name)}</label>`).join('')}</div></div>
        <label class="chk"><input type="checkbox" ${f.revert ? 'checked' : ''} data-dfc="revert"> Switch Everything Back Automatically When It Ends</label>
        <label class="chk"><input type="checkbox" ${f.paused ? 'checked' : ''} data-dfc="paused"> Paused</label>`, del: !!f.id };
    }
    if (d.kind === 'batch') {
      return { title: 'Generate Unique Codes', body: `<div class="fl"><label>Promotion the Codes Use</label><select data-df="promo">${S.promos.filter((p) => p.kind === 'code').map((p) => `<option value="${p.id}" ${f.promo === p.id ? 'selected' : ''}>${esc(p.name)} (${p.vtype === 'percent' ? p.value + '% off' : 'value'})</option>`).join('')}</select></div>
        <div class="fg3"><div class="fl"><label>Prefix</label><input value="${esc(f.prefix)}" data-df="prefix" style="text-transform:uppercase"></div><div class="fl"><label>How Many</label><input type="number" min="1" max="5000" value="${f.count}" data-df="count"></div><div class="fl"><label>Uses Each</label><input type="number" min="1" value="${f.usesEach}" data-df="usesEach"></div></div>
        <div class="hint">Codes look like ${esc((f.prefix || 'CODE').toUpperCase())}-7KQ2 and follow every rule of the promotion they belong to.</div>`, foot: 'Generate' };
    }
    if (d.kind === 'aff') {
      return { title: f.id ? 'Edit Affiliate' : 'New Affiliate', body: `<div class="fg2"><div class="fl"><label>Name</label><input value="${esc(f.name)}" data-df="name"></div><div class="fl"><label>Code</label><input value="${esc(f.code)}" data-df="code" style="text-transform:uppercase"></div>
        <div class="fl"><label>Trader Discount (%)</label><input type="number" min="0" value="${f.pct}" data-df="pct"></div><div class="fl"><label>Commission (%)</label><input type="number" min="0" value="${f.commission}" data-df="commission"></div></div>
        <div class="fl"><label>Status</label><select data-df="status"><option value="active" ${f.status === 'active' ? 'selected' : ''}>Active</option><option value="paused" ${f.status === 'paused' ? 'selected' : ''}>Paused</option></select></div>
        <div class="hint">Affiliate codes count as first-purchase codes and never stack with another code.</div>`, del: !!f.id };
    }
    if (d.kind === 'test') {
      return { title: 'New Price Test', body: `<div class="fl"><label>Name</label><input value="${esc(f.name)}" data-df="name"></div>
        <div class="fg2"><div class="fl"><label>Plan</label><select data-df="plan">${S.plans.map((p) => `<option value="${p.id}" ${f.plan === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div><div class="fl"><label>Size</label><select data-df="size">${SIZES.map((s) => `<option value="${s}" ${+f.size === s ? 'selected' : ''}>${K(s)}</option>`).join('')}</select></div>
        <div class="fl"><label>Price A ($), current</label><input type="number" value="${(sizeOf(f.plan, +f.size) || {}).price || 0}" disabled></div><div class="fl"><label>Price B ($)</label><input type="number" min="0" value="${f.b}" data-df="b"></div>
        <div class="fl"><label>Traders Who See B (%)</label><input type="number" min="5" max="95" value="${f.split}" data-df="split"></div></div>`, foot: 'Start Test' };
    }
    if (d.kind === 'import') {
      return { title: 'Import Catalog', body: `<div class="hint" style="font-size:13px">Paste a catalog file exported from Funded Sky. Everything in it goes into the draft and is checked before you can publish.</div><textarea style="height:220px" data-df="text" placeholder='{ "plans": [ … ] }'>${esc(f.text)}</textarea>`, foot: 'Import to Draft' };
    }
    return null;
  }

  function extSave(kind, f) {
    if (kind === 'intg') {
      const x = S.integrations.find((y) => y.id === f.id); const filled = f.fields.every(([k]) => (f.vals[k] || '').trim());
      const wentLive = x.env !== 'live' && f.env === 'live';
      x.vals = f.vals; x.tg = f.tg; x.env = f.env;
      if (filled) { x.status = 'connected'; x.warn = ''; x.last = x.last || 'Waiting for the first event'; }
      log('Integrations', `${x.name}: keys and settings saved (${f.env === 'live' ? 'live' : 'sandbox'})`, wentLive ? { before: 'Sandbox', after: 'Live', approve: true } : {});
      if (!filled) { S.drawer = null; toast('Saved. Add every key to finish connecting.'); return 'done'; }
      return true;
    }
    if (kind === 'camp') { if (!f.id) { f.id = uid('cm'); S.campaigns.push(f); } else Object.assign(S.campaigns.find((x) => x.id === f.id), f); const pc = f.prices.length; log('Campaigns', `${f.name}: ${fmtDT(f.start)} to ${fmtDT(f.end)}`, pc ? { after: pc + ' temporary price' + (pc > 1 ? 's' : ''), approve: true } : {}); return true; }
    if (kind === 'batch') { const b = Object.assign({}, f, { id: uid('cb'), prefix: (f.prefix || 'CODE').toUpperCase(), used: 0, created: 'Today' }); S.batches.unshift(b); log('Codes', `Generated ${b.count} codes ${b.prefix}-XXXX`); return true; }
    if (kind === 'aff') { f.code = (f.code || '').toUpperCase().replace(/\s+/g, ''); if (!f.id) { f.id = uid('af'); f.uses = 0; f.revenue = 0; S.affiliates.push(f); } else Object.assign(S.affiliates.find((x) => x.id === f.id), f); log('Affiliates', `${f.name}: code ${f.code}, ${f.pct}% off, ${f.commission}% commission`); return true; }
    if (kind === 'test') { const a = (sizeOf(f.plan, +f.size) || {}).price || 0; S.tests.unshift({ id: uid('t'), name: f.name, plan: f.plan, size: +f.size, a, b: +f.b, split: +f.split, status: 'running', start: 'Today', va: 0, vb: 0, ba: 0, bb: 0 }); log('Price Tests', `Started ${f.name}: ${money(a)} vs ${money(+f.b)}`); return true; }
    if (kind === 'import') { log('Import', 'Imported a catalog file into the draft'); return true; }
    return false;
  }

  function extClick(a, el) {
    const id = el.dataset.id, i = +el.dataset.i, D = S.drawer && S.drawer.f;
    switch (a) {
      case 'editIntg': { const x = S.integrations.find((y) => y.id === id); const f = JSON.parse(JSON.stringify(x)); f.vals = x.vals ? { ...x.vals } : Object.fromEntries(x.fields.map(([k, , , v]) => [k, v])); f.tg = x.tg ? { ...x.tg } : Object.fromEntries(x.toggles.map(([k, , v]) => [k, v])); f.show = {}; S.drawer = { kind: 'intg', f }; return true; }
      case 'intgShow': D.show[el.dataset.k] = !D.show[el.dataset.k]; return true;
      case 'intgEnv': if (D.id === 'stripe' && el.dataset.k === 'live') { toast("Stripe can't be used for live payments here"); return 'noRender'; } D.env = el.dataset.k; return true;
      case 'intgCopy': toast('Webhook URL copied'); return 'noRender';
      case 'intgTest': { const ok = D.fields.every(([k]) => (D.vals[k] || '').trim()); toast(ok ? `Connected to ${D.name} ${D.env === 'live' ? 'live' : 'sandbox'}` : 'Missing keys: fill every field, then test again'); return 'noRender'; }
      case 'intgOff': { const x = S.integrations.find((y) => y.id === D.id); x.status = 'off'; log('Integrations', `${x.name} disconnected`); S.drawer = null; toast(`${x.name} disconnected`); return 'noRender'; }
      case 'feeDisc': { const f = S.fees[el.dataset.p][+el.dataset.s]; f.resetDiscountable = !f.resetDiscountable; log('Fees', `${plan(el.dataset.p).name} ${K(+el.dataset.s)} resets ${f.resetDiscountable ? 'can' : "can't"} be discounted`); return true; }
      case 'upAdd': S.upgrades.push({ plan: S.plans[0].id, from: 25000, to: 50000, price: 49 }); log('Fees', 'Added an upgrade path'); return true;
      case 'upDel': S.upgrades.splice(i, 1); log('Fees', 'Removed an upgrade path'); return true;
      case 'contentPlan': S.contentPlan = el.dataset.k; return true;
      case 'cntAddB': S.content[S.contentPlan || S.plans[0].id].bullets.push('[New highlight]'); log('Checkout Content', 'Added a rule highlight'); return true;
      case 'cntDelB': S.content[S.contentPlan || S.plans[0].id].bullets.splice(i, 1); log('Checkout Content', 'Removed a rule highlight'); return true;
      case 'cntAddF': S.content[S.contentPlan || S.plans[0].id].faq.push({ q: '[New question]', a: '[Answer]' }); log('Checkout Content', 'Added an FAQ question'); return true;
      case 'cntDelF': S.content[S.contentPlan || S.plans[0].id].faq.splice(i, 1); log('Checkout Content', 'Removed an FAQ question'); return true;
      case 'limVpn': S.limits.vpn = el.checked; log('Limits', `VPN blocking ${el.checked ? 'on' : 'off'}`); return true;
      case 'curOn': { const c = S.currencies[i]; c.on = !c.on; log('Currencies', `${c.code} ${c.on ? 'on' : 'off'} at checkout`); return true; }
      case 'taxOn': { const t = S.tax[i]; t.on = !t.on; log('Tax', `${t.name} collection ${t.on ? 'on' : 'off'}`); return true; }
      case 'taxInc': S.tax[i].inclusive = el.checked; log('Tax', `${S.tax[i].name}: prices ${el.checked ? 'include' : 'exclude'} tax`); return true;
      case 'pvPlan': S.preview.plan = id; return true;
      case 'pvSize': S.preview.size = +el.dataset.s; return true;
      case 'pvPlat': S.preview.platform = id; return true;
      case 'pvAddon': S.preview.addons = el.checked ? [...S.preview.addons, id] : S.preview.addons.filter((x) => x !== id); return true;
      case 'pvQty': S.preview.qty = Math.max(1, Math.min(20, S.preview.qty + +el.dataset.d)); return true;
      case 'pvDev': S.preview.device = el.dataset.k; return true;
      case 'pvDrafts': S.preview.drafts = el.checked; return true;
      case 'editCamp': { const c = S.campaigns.find((x) => x.id === id) || { id: '', name: '[New Campaign]', start: '2026-12-01T00:00', end: '2026-12-07T23:59', promos: [], prices: [], bundlesOn: [], revert: true, paused: false }; S.drawer = { kind: 'camp', f: JSON.parse(JSON.stringify(c)) }; return true; }
      case 'campPAdd': D.prices.push({ plan: S.plans[0].id, size: 50000, price: 0 }); return true;
      case 'campPDel': D.prices.splice(i, 1); return true;
      case 'newTest': S.drawer = { kind: 'test', f: { name: '[New Price Test]', plan: 'pb', size: 50000, b: 149, split: 50 } }; return true;
      case 'testStop': { const t = S.tests.find((x) => x.id === id); t.status = 'ended'; t.applied = 'Stopped, kept ' + money(t.a); log('Price Tests', `Stopped ${t.name}`); return true; }
      case 'testApply': { const t = S.tests.find((x) => x.id === id); const w = el.dataset.w; const z = sizeOf(t.plan, t.size); const np = w === 'B' ? t.b : t.a; const old = z.price; z.price = np; t.status = 'ended'; t.applied = 'Used ' + money(np); log('Prices', `${plan(t.plan).name} ${K(t.size)} price from ${t.name}`, { before: money(old), after: money(np), approve: old !== np }); toast('Price change added to the draft'); return 'noRender'; }
      case 'perfRange': S.perfRange = +el.dataset.k; return true;
      case 'newBatch': S.drawer = { kind: 'batch', f: { promo: 'p2', prefix: 'CREATOR', count: 50, usesEach: 1 } }; return true;
      case 'batchExport': toast('CSV of codes downloaded'); return 'noRender';
      case 'editAff': { const af = S.affiliates.find((x) => x.id === id) || { id: '', name: '[Affiliate Name]', code: '', pct: 10, commission: 15, status: 'active' }; S.drawer = { kind: 'aff', f: JSON.parse(JSON.stringify(af)) }; return true; }
      case 'flagDone': S.flags[i].done = true; return true;
      case 'recOn': S.recovery.on = !S.recovery.on; log('Abandoned Checkout', `Recovery emails ${S.recovery.on ? 'on' : 'off'}`); return true;
      case 'recFlag': S.recovery[el.dataset.k] = el.checked; log('Abandoned Checkout', 'Recovery settings changed'); return true;
      case 'roleCk': { const g = S.roles.grid[el.dataset.r]; const c = +el.dataset.c; g[c] = g[c] ? 0 : 1; log('Permissions', `${el.dataset.r}: ${g[c] ? 'can' : "can't"} ${S.roles.caps[c].toLowerCase()}`); return true; }
      case 'approveOne': { const c = S.changes.find((x) => x.id === id); c.approved = true; return true; }
      case 'approveAll': pending().forEach((c) => { c.approved = true; }); toast(`Approved by ${APPROVER}`); return 'noRender';
      case 'exportCat': toast('Catalog exported as funded-sky-catalog-v' + S.version + '.json'); return 'noRender';
      case 'importCat': S.drawer = { kind: 'import', f: { text: '' } }; return true;
    }
    return false;
  }

  function extChange(el) {
    if (!el.dataset.bind) return false;
    const [o, k] = el.dataset.bind.split('.'); const i = +el.dataset.i; const pid = el.dataset.p; const num = el.value === '' ? 0 : +el.value;
    if (o === 'fee') { const f = S.fees[pid][+el.dataset.s]; const old = f[k]; f[k] = num; log('Fees', `${plan(pid).name} ${K(+el.dataset.s)} ${k === 'reset' ? 'reset price' : k === 'activation' ? 'activation fee' : 'monthly renewal'}`, { before: old ? money(old) : 'None', after: num ? money(num) : 'None', approve: true }); return true; }
    if (o === 'upg') { const u = S.upgrades[i]; const old = u.price; u.price = num; log('Fees', `${plan(u.plan).name} upgrade ${K(u.from)} → ${K(u.to)}`, { before: money(old), after: money(num), approve: true }); return true; }
    if (o === 'cnt') { const c = S.content[pid]; if (k === 'bullet') c.bullets[i] = el.value; else if (k === 'q') c.faq[i].q = el.value; else if (k === 'a') c.faq[i].a = el.value; else { const old = c[k]; c[k] = el.value; if (k === 'agreement') { log('Checkout Content', `${plan(pid).name} agreement`, { before: old, after: el.value }); return true; } } log('Checkout Content', `${plan(pid).name} checkout text edited`); return true; }
    if (o === 'lim') { if (pid) { const l = S.limits.plans[pid]; l[k] = k === 'countries' ? el.value : num; log('Limits', `${plan(pid).name}: ${k === 'perTrader' ? 'max per trader' : k === 'cap' ? 'monthly cap' : 'blocked countries'} set to ${el.value || 'none'}`); } else { const old = S.limits[k]; S.limits[k] = k === 'blocked' ? el.value : num; log('Limits', `${{ maxActive: 'Max active evaluations', maxFunded: 'Max funded accounts', maxFundedBalance: 'Max funded balance', blocked: 'Blocked countries' }[k]}`, { before: String(old), after: el.value }); } return true; }
    if (o === 'cur') { const c = S.currencies[i]; c[k] = k === 'rate' ? +el.value : el.value; log('Currencies', `${c.code} ${k} changed to ${el.value}`); return true; }
    if (o === 'rec') { S.recovery[k] = num; log('Abandoned Checkout', `${k === 'delay' ? 'Send after' : k === 'pct' ? 'Discount' : 'Code expiry'} set to ${el.value}`); return true; }
    if (o === 'pv') { S.preview.code = el.value; return true; }
    return false;
  }


  // ================= INTEGRATIONS =================
  const WH = 'https://api.fundedsky.com/webhooks/';
  S.integrations = [
    { id: 'card', group: 'Payments', name: 'TailoredPay', role: 'Card Processor · Primary', mono: 'TP', status: 'connected', env: 'sandbox', last: 'Today, 11:03 AM',
      fields: [['merchantId', 'Merchant ID', 'text', 'MID-[000000]'], ['publicKey', 'Public Key', 'text', 'pk_test_[••••]8F2A'], ['secretKey', 'Secret Key', 'secret', 'sk_test_51Hx••••••••Q9'], ['webhookSecret', 'Webhook Signing Secret', 'secret', 'whsec_••••••••3kP']],
      toggles: [['threeDS', '3-D Secure on every card payment', true], ['saveCards', 'Save Card Tokens for Resets and Renewals', true]], events: ['payment.succeeded', 'payment.failed', 'refund.created', 'dispute.opened'] },
    { id: 'crypto', group: 'Payments', name: 'Confirmo', role: 'Crypto Payments and Payouts', mono: 'CF', status: 'connected', env: 'sandbox', last: 'Yesterday, 6:40 PM',
      fields: [['apiKey', 'API Key', 'secret', 'cfm_••••••••••7Re'], ['callbackPassword', 'Callback Password', 'secret', '••••••••••'], ['settlement', 'Settle In', 'select:USDC,USDT,USD (bank)', 'USDC']],
      toggles: [['btc', 'Accept BTC', true], ['eth', 'Accept ETH', true], ['stable', 'Accept USDT and USDC', true]], events: ['invoice.paid', 'invoice.expired', 'payout.completed'] },
    { id: 'card2', group: 'Payments', name: '[Backup Card Processor]', role: 'Card Processor · Backup', mono: 'BP', status: 'off', env: 'sandbox', last: '',
      fields: [['merchantId', 'Merchant ID', 'text', ''], ['apiKey', 'API Key', 'secret', ''], ['webhookSecret', 'Webhook Signing Secret', 'secret', '']],
      toggles: [['failover', 'Take Over Automatically If the Primary Declines with a Processor Error', true]], events: ['payment.succeeded', 'payment.failed', 'refund.created', 'dispute.opened'] },
    { id: 'stripe', group: 'Payments', name: 'Stripe', role: 'Example Only', mono: 'S', logo: 'assets/stripe.png', status: 'off', env: 'sandbox', last: '', note: 'Stripe\'s restricted businesses list prohibits funded prop trading, so it can\'t be used for Funded Sky. It\'s here only to show what setting up a processor looks like.',
      fields: [['publishableKey', 'Publishable Key', 'text', ''], ['secretKey', 'Secret Key', 'secret', ''], ['webhookSecret', 'Webhook Signing Secret', 'secret', '']],
      toggles: [['radar', 'Fraud Screening', true]], events: ['checkout.session.completed', 'charge.refunded', 'charge.dispute.created'] },
    { id: 'rise', group: 'Payouts', name: 'Rise', role: 'Trader Payouts', mono: 'R', status: 'connected', env: 'sandbox', last: 'Today, 9:15 AM',
      fields: [['apiKey', 'API Key', 'secret', 'rise_••••••••••2Lm'], ['companyId', 'Company ID', 'text', '[Company ID]'], ['reserveAlert', 'Alert When Payout Balance Falls Below ($)', 'text', '25000']],
      toggles: [['autoKyc', 'Require Rise Identity Check Before the First Payout', true]], events: ['payout.sent', 'payout.failed', 'payee.onboarded'] },
    { id: 'sumsub', group: 'Identity', name: 'Sumsub', role: 'KYC and Sanctions Checks', mono: 'SS', status: 'attention', env: 'sandbox', last: '3 days ago', warn: 'Webhook signature failed on the last 2 calls. Check the signing secret.',
      fields: [['appToken', 'App Token', 'secret', 'sbx:••••••••••Yk'], ['secretKey', 'Secret Key', 'secret', '••••••••••'], ['level', 'Verification Level', 'text', 'funded-trader-kyc'], ['webhookSecret', 'Webhook Signing Secret', 'secret', '••••••••']],
      toggles: [['liveness', 'Liveness Selfie', true], ['aml', 'Sanctions, PEP and Adverse Media Screening', true]], events: ['applicantReviewed', 'applicantPending', 'applicantOnHold'] },
    { id: 'posthog', group: 'Analytics', name: 'PostHog', role: 'Product Analytics', mono: 'PH', status: 'connected', env: 'live', last: 'Just now',
      fields: [['projectKey', 'Project API Key', 'text', 'phc_[••••]'], ['host', 'Host', 'text', 'https://us.i.posthog.com']],
      toggles: [['replay', 'Session Replays on Checkout', true], ['server', 'Send Purchases from the Server', true]], events: [] },
    { id: 'email', group: 'Messages', name: '[Email Provider]', role: 'Receipts and Account Emails', mono: 'EM', status: 'off', env: 'sandbox', last: '',
      fields: [['apiKey', 'API Key', 'secret', ''], ['from', 'Send From', 'text', 'accounts@fundedsky.com']],
      toggles: [['receipts', 'Send Receipts', true]], events: ['delivered', 'bounced', 'complained'] }
  ];
  const istat = { connected: ['Connected', 'live', 'var(--ok)'], attention: ['Needs Attention', 'draft', 'var(--wa)'], off: ['Not Set Up', 'ret', 'var(--fa)'] };
  const logoOr = (x, cls) => x.logo ? `<img src="${x.logo}" alt="" class="${cls}">` : `<span>${esc(x.mono)}</span>`;
  const intgDot = (x) => `<button class="ig ${x.logo ? 'haslogo' : ''}" data-act="editIntg" data-id="${x.id}" title="${esc(x.name)}: ${istat[x.status][0]}" aria-label="${esc(x.name)} settings, ${istat[x.status][0]}">${logoOr(x, 'iglogo')}<i style="background:${istat[x.status][2]}"></i></button>`;

  function vIntegrations() {
    const groups = [...new Set(S.integrations.map((x) => x.group))];
    return `<div class="ph"><div><h1>Integrations</h1><p>The services the checkout and payouts run on. Set keys, switch between sandbox and live, and check that webhooks are arriving.</p></div></div>
    ${groups.map((g) => `<h5 style="margin:6px 0 10px;font-size:12.5px;color:var(--mu);font-weight:600">${g}</h5><div class="igrid">${S.integrations.filter((x) => x.group === g).map((x) => { const [st, cls] = istat[x.status]; return `<button class="icard" data-act="editIntg" data-id="${x.id}"><span class="imono ${x.logo ? 'haslogo' : ''}">${logoOr(x, 'imlogo')}</span><span style="flex:1;min-width:0;text-align:left"><b>${esc(x.name)}</b><small>${esc(x.role)}</small></span><span style="display:flex;flex-direction:column;align-items:flex-end;gap:6px"><span class="b ${cls}">${st}</span><small class="nw" style="color:var(--fa)">${x.status === 'off' ? 'Not Connected' : (x.env === 'live' ? 'Live' : 'Sandbox')}</small></span></button>`; }).join('')}</div>`).join('')}
    <p class="hint">Keys are stored encrypted in the secrets manager and are never shown again in full after saving. Every key change is written to the audit log without the key itself.</p>`;
  }

  function intgDrawer(f) {
    const [st, cls] = istat[f.status];
    const field = ([k, label, type, ph]) => {
      if (type.startsWith('select:')) return `<div class="fl"><label>${label}</label><select data-dfv="${k}">${type.slice(7).split(',').map((o) => `<option ${f.vals[k] === o ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
      const secret = type === 'secret'; const shown = f.show[k];
      return `<div class="fl"><label>${label}</label><div class="rowx" style="grid-template-columns:${secret ? '1fr auto' : '1fr'}"><input type="${secret && !shown ? 'password' : 'text'}" value="${esc(f.vals[k] || '')}" placeholder="${secret ? 'Paste the key' : 'Enter value'}" data-dfv="${k}" autocomplete="off" spellcheck="false" class="mono-in">${secret ? `<button class="pill sm" data-act="intgShow" data-k="${k}">${shown ? 'Hide' : 'Show'}</button>` : ''}</div></div>`;
    };
    return { title: f.name, body: `
      <div style="display:flex;align-items:center;gap:12px"><span class="imono ${f.logo ? 'haslogo' : ''}" style="width:44px;height:44px">${logoOr(f, 'imlogo')}</span><div style="flex:1"><b style="font-size:15px">${esc(f.name)}</b><div class="hint">${esc(f.role)}</div></div><span class="b ${cls}">${st}</span></div>
      ${f.note ? `<div class="sec" style="border-color:rgba(242,119,127,.45)"><div style="font-size:13px;color:var(--t2);line-height:1.5"><b style="color:var(--no)">Not for Funded Sky.</b> ${esc(f.note)}</div></div>` : ''}
      ${f.warn ? `<div class="sec" style="border-color:rgba(242,196,109,.45)"><div style="font-size:13px;color:var(--t2);line-height:1.5"><b style="color:var(--wa)">Needs attention.</b> ${esc(f.warn)}</div></div>` : ''}
      <div class="fl"><label>Environment</label><div class="seg">${[['sandbox', 'Sandbox'], ['live', 'Live']].map(([k, l]) => `<button class="${f.env === k ? 'on' : ''}" data-act="intgEnv" data-k="${k}">${l}</button>`).join('')}</div><span class="hint">${f.env === 'live' ? 'Real money. Switching to live needs a second approval.' : 'Test mode: no real money moves.'}</span></div>
      <div class="sec"><h4>Keys</h4><div class="fg">${f.fields.map(field).join('')}</div></div>
      ${f.events.length ? `<div class="sec"><h4>Webhook</h4><div class="fg"><div class="fl"><label>Paste This URL in ${esc(f.name)}'s Dashboard</label><div class="rowx" style="grid-template-columns:1fr auto"><input value="${WH + f.id}" readonly class="mono-in"><button class="pill sm" data-act="intgCopy">Copy</button></div></div>
        <div class="fl"><label>Events We Listen For</label><div style="display:flex;flex-wrap:wrap;gap:6px">${f.events.map((e) => `<span class="b plain mono" style="font-size:11.5px">${e}</span>`).join('')}</div></div>
        <div class="hint">${f.last ? 'Last event received ' + esc(f.last) + '.' : 'No events received yet.'} Every event is checked against the signing secret before we act on it.</div></div></div>` : ''}
      ${f.toggles.length ? `<div class="sec"><h4>Settings</h4><div class="fg">${f.toggles.map(([k, l]) => `<label class="chk"><input type="checkbox" ${f.tg[k] ? 'checked' : ''} data-dft2="${k}"> ${esc(l)}</label>`).join('')}</div></div>` : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="pill" data-act="intgTest">Test Connection</button>${f.status !== 'off' ? '<button class="pill dng" data-act="intgOff">Disconnect</button>' : ''}</div>`, foot: f.status === 'off' ? 'Connect' : 'Save' };
  }

  // ---------- drawers ----------
  function drawer() {
    const d = S.drawer; if (!d) return '';
    let title = '', body = '', foot = '<button class="pill" data-act="closeDrw">Cancel</button><button class="pill pri" data-act="saveDrw">Save to Draft</button>';
    const f = d.f;
    if (d.kind === 'addon') {
      title = f.id ? 'Edit Add-On' : 'New Add-On';
      body = `<div class="fl"><label>Name</label><input value="${esc(f.name)}" data-df="name"></div>
      <div class="fg2"><div class="fl"><label>Pricing</label><select data-df="pricing"><option value="flat" ${f.pricing === 'flat' ? 'selected' : ''}>Flat Amount</option><option value="percent" ${f.pricing === 'percent' ? 'selected' : ''}>Percent of Size Price</option></select></div><div class="fl"><label>${f.pricing === 'flat' ? 'Amount ($)' : 'Percent (%)'}</label><input type="number" min="0" value="${f.value}" data-df="value"></div></div>
      <div class="fl"><label>What It Does to the Account</label><input value="${esc(f.effect)}" data-df="effect"><span class="hint">If it changes rules (payout cycle, split), it's copied into each account's rule snapshot.</span></div>
      <label class="chk"><input type="checkbox" ${f.discountable ? 'checked' : ''} data-dfc="discountable"> Promo Codes Can Discount This Add-On</label>
      <div class="fl"><label>Status</label><select data-df="status"><option value="draft" ${f.status === 'draft' ? 'selected' : ''}>Draft</option><option value="live" ${f.status === 'live' ? 'selected' : ''}>Live</option><option value="retired" ${f.status === 'retired' ? 'selected' : ''}>Retired</option></select></div>
      <div class="sec"><h4>Offered On</h4><div style="display:flex;flex-direction:column;gap:10px">${S.plans.map((p) => `<label class="chk"><input type="checkbox" ${f.on[p.id] ? 'checked' : ''} data-dfo="${p.id}"> ${esc(p.name)}</label>`).join('')}</div></div>`;
    } else if (d.kind === 'bundle') {
      title = f.id ? 'Edit Bundle' : 'New Bundle';
      let typeF = '';
      if (f.type === 'tier') typeF = `<div class="sec"><h4>Tiers</h4>${f.tiers.map((x, i) => `<div class="rowx" style="grid-template-columns:1fr 1fr 28px;margin-bottom:8px"><div class="fl"><label>From Quantity</label><input type="number" min="2" value="${x.min}" data-dft="${i}.min"></div><div class="fl"><label>Save (%)</label><input type="number" min="0" value="${x.pct}" data-dft="${i}.pct"></div><button class="ic" style="margin-top:22px" data-act="tierDel" data-i="${i}">✕</button></div>`).join('')}<button class="lnk" data-act="tierAdd">+ Add Tier</button><label class="chk" style="margin-top:12px"><input type="checkbox" ${f.samePlan ? 'checked' : ''} data-dfc="samePlan"> Accounts Must Be the Same Plan</label></div>`;
      else if (f.type === 'mix') typeF = `<div class="sec"><h4>Mix and Match</h4><div class="fg2"><div class="fl"><label>Minimum Accounts</label><input type="number" min="2" value="${f.min}" data-df="min"></div><div class="fl"><label>Save (%)</label><input type="number" min="0" value="${f.pct}" data-df="pct"></div></div><div style="display:flex;flex-direction:column;gap:10px;margin-top:12px">${S.plans.map((p) => `<label class="chk"><input type="checkbox" ${f.mixPlans.includes(p.id) ? 'checked' : ''} data-dfm="${p.id}"> ${esc(p.name)}</label>`).join('')}</div></div>`;
      else typeF = `<div class="sec"><h4>What's in the Bundle</h4>${f.items.map((x, i) => `<div class="rowx" style="grid-template-columns:1.4fr 1fr 70px 28px;margin-bottom:8px"><select data-dfi="${i}.plan">${S.plans.map((p) => `<option value="${p.id}" ${p.id === x.plan ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select><select data-dfi="${i}.size">${SIZES.map((s) => `<option value="${s}" ${s === x.size ? 'selected' : ''}>${K(s)}</option>`).join('')}</select><input type="number" min="1" value="${x.qty}" data-dfi="${i}.qty"><button class="ic" data-act="itemDel" data-i="${i}">✕</button></div>`).join('')}<button class="lnk" data-act="itemAdd">+ Add Item</button><div class="fl" style="margin-top:12px"><label>Bundle Price ($)</label><input type="number" min="0" value="${f.price}" data-df="price"><span class="hint">Separately these cost ${money(f.items.reduce((n, x) => n + ((sizeOf(x.plan, +x.size) || {}).price || 0) * x.qty, 0))}.</span></div></div>`;
      body = `<div class="fl"><label>Name</label><input value="${esc(f.name)}" data-df="name"></div>
      <div class="fl"><label>Type</label><div class="seg">${[['fixed', 'Fixed Bundle'], ['tier', 'Quantity Tier'], ['mix', 'Mix and Match']].map(([k, l]) => `<button class="${f.type === k ? 'on' : ''}" data-act="bType" data-k="${k}">${l}</button>`).join('')}</div></div>
      ${typeF}
      <label class="chk"><input type="checkbox" ${f.stacks ? 'checked' : ''} data-dfc="stacks"> Promo Codes Can Stack on Top of This Bundle</label>
      <div class="fl"><label>Status</label><select data-df="status"><option value="draft" ${f.status === 'draft' ? 'selected' : ''}>Draft</option><option value="live" ${f.status === 'live' ? 'selected' : ''}>Live</option><option value="retired" ${f.status === 'retired' ? 'selected' : ''}>Retired</option></select></div>
      <div class="sec"><h4>Offered On</h4><div style="display:flex;flex-direction:column;gap:10px">${S.plans.map((p) => `<label class="chk"><input type="checkbox" ${f.on[p.id] ? 'checked' : ''} data-dfo="${p.id}"> ${esc(p.name)}</label>`).join('')}</div></div>`;
    } else if (d.kind === 'promo') {
      title = f.id ? 'Edit Promotion' : 'New Promotion';
      body = `<div class="fg2"><div class="fl"><label>Name</label><input value="${esc(f.name)}" data-df="name"></div><div class="fl"><label>Type</label><div class="seg">${[['code', 'Code'], ['auto', 'Automatic']].map(([k, l]) => `<button class="${f.kind === k ? 'on' : ''}" data-act="pKind" data-k="${k}">${l}</button>`).join('')}</div></div></div>
      ${f.kind === 'code' ? `<div class="fl"><label>Code</label><input value="${esc(f.code)}" placeholder="e.g. SUMMER25" data-df="code" style="text-transform:uppercase"></div>` : ''}
      <div class="sec"><h4>1 · Who Gets It</h4><div class="fg"><label class="chk"><input type="checkbox" ${f.first ? 'checked' : ''} data-dfc="first"> First Purchase Only</label><label class="chk"><input type="checkbox" ${f.affiliate ? 'checked' : ''} data-dfc="affiliate"> Only Through an Affiliate Link</label>
        <div class="fg2"><div class="fl"><label>Minimum Cart ($)</label><input type="number" min="0" value="${f.minCart || ''}" placeholder="None" data-df="minCart"></div><div class="fl"><label>Countries</label><input value="${esc(f.countries)}" placeholder="All allowed countries" data-df="countries"></div></div></div></div>
      <div class="sec"><h4>2 · What It Touches</h4><div class="fg"><div class="fl"><label>Plans</label><div style="display:flex;flex-wrap:wrap;gap:14px">${S.plans.map((p) => `<label class="chk"><input type="checkbox" ${f.plans.includes(p.id) ? 'checked' : ''} data-dfp="${p.id}"> ${esc(p.name)}</label>`).join('')}</div><span class="hint">None checked means all plans.</span></div>
        <div class="fl"><label>Sizes</label><div style="display:flex;flex-wrap:wrap;gap:14px">${SIZES.map((s) => `<label class="chk"><input type="checkbox" ${f.sizes.includes(s) ? 'checked' : ''} data-dfs="${s}"> ${K(s)}</label>`).join('')}</div><span class="hint">None checked means all sizes.</span></div>
        <div class="fl"><label>Line Types</label><div style="display:flex;flex-wrap:wrap;gap:14px">${[['base', 'Base price'], ['addon', 'Add-ons'], ['reset', 'Resets']].map(([k, l]) => `<label class="chk"><input type="checkbox" ${f.lines[k] ? 'checked' : ''} data-dfl="${k}"> ${l}</label>`).join('')}</div><span class="hint">Unchecked types are never discounted.</span></div></div></div>
      <div class="sec"><h4>3 · How Much</h4><div class="fg2"><div class="fl"><label>Discount</label><select data-df="vtype"><option value="percent" ${f.vtype === 'percent' ? 'selected' : ''}>Percent Off</option><option value="fixed" ${f.vtype === 'fixed' ? 'selected' : ''}>Fixed Amount Off</option><option value="free" ${f.vtype === 'free' ? 'selected' : ''}>Free Add-On</option></select></div>
        ${f.vtype === 'free' ? `<div class="fl"><label>Add-On</label><select data-df="freeAddon">${S.addons.map((a) => `<option value="${a.id}" ${f.freeAddon === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></div>` : `<div class="fl"><label>${f.vtype === 'percent' ? 'Percent (%)' : 'Amount ($)'}</label><input type="number" min="0" value="${f.value}" data-df="value"></div>`}</div></div>
      <div class="sec"><h4>4 · Limits</h4><div class="fg2"><div class="fl"><label>Starts</label><input type="date" value="${f.start}" data-df="start"></div><div class="fl"><label>Ends</label><input type="date" value="${f.end}" data-df="end"></div>
        <div class="fl"><label>Total Uses</label><input type="number" min="0" value="${f.total || ''}" placeholder="Unlimited" data-df="total"></div><div class="fl"><label>Uses per Trader</label><input type="number" min="0" value="${f.perTrader || ''}" placeholder="Unlimited" data-df="perTrader"></div>
        <div class="fl"><label>Max Discount per Order ($)</label><input type="number" min="0" value="${f.maxOff || ''}" placeholder="No Cap" data-df="maxOff"></div></div></div>
      <div class="sec"><h4>5 · Stacking</h4><div class="fg"><div class="fg2"><div class="fl"><label>Priority</label><input type="number" min="1" value="${f.priority}" data-df="priority"><span class="hint">Lower runs first among automatic promotions.</span></div><div></div></div>
        <label class="chk"><input type="checkbox" ${f.exclusive ? 'checked' : ''} data-dfc="exclusive"> Exclusive: Nothing Else Applies When This Does</label>
        <label class="chk"><input type="checkbox" ${f.withBundles ? 'checked' : ''} data-dfc="withBundles"> Can Apply to Lines That Are Already in a Bundle</label></div></div>
      <label class="chk"><input type="checkbox" ${f.status === 'on' ? 'checked' : ''} data-act="pOn"> Active (Pause Without Deleting)</label>`;
    } else if (d.kind === 'rule') {
      title = `New Rule Set Version · ${plan(f.plan).name} ${K(f.size)}`;
      body = `<div class="hint" style="font-size:13px">This creates v${f.version} as a draft. On publish it becomes live for new purchases; the ${f.accounts} accounts on the current version keep their rules.</div>
      <div class="fg2">${[['target', 'Profit Target ($)'], ['daily', 'Daily Loss Limit ($)'], ['dd', 'Max Drawdown ($)'], ['contracts', 'Max Contracts'], ['minDays', 'Minimum Trading Days'], ['consistency', 'Consistency Rule (%)'], ['split', 'Profit Split (%)'], ['payoutMin', 'Minimum Payout ($)']].map(([k, l]) => `<div class="fl"><label>${l}</label><input type="number" min="0" value="${f[k]}" data-df="${k}"></div>`).join('')}
      <div class="fl"><label>Drawdown Type</label><select data-df="ddType">${['Trailing EOD', 'Trailing Intraday', 'Static'].map((x) => `<option ${f.ddType === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div></div>`;
      foot = '<button class="pill" data-act="closeDrw">Cancel</button><button class="pill pri" data-act="saveDrw">Create Draft Version</button>';
    } else if (d.kind === 'sched') {
      const p = plan(S.planId), z = p.sizes[f.i];
      title = `Schedule a Price · ${p.name} ${K(z.size)}`;
      body = `<div class="hint" style="font-size:13px">The new price switches on automatically at 12:00 AM Eastern on the date you pick. Current price: ${money(z.price)}.</div><div class="fg2"><div class="fl"><label>New Price ($)</label><input type="number" min="0" value="${f.price}" data-df="price"></div><div class="fl"><label>Starts On</label><input type="date" value="${f.date}" data-df="date"></div></div>`;
      foot = '<button class="pill" data-act="closeDrw">Cancel</button><button class="pill pri" data-act="saveDrw">Schedule</button>';
    } else if (d.kind === 'newplan') {
      title = 'New Plan';
      body = `<div class="fl"><label>Plan Name</label><input value="${esc(f.name)}" data-df="name"></div><div class="fl"><label>Billing</label><select data-df="billing"><option value="one-time">One-Time</option><option value="monthly" ${f.billing === 'monthly' ? 'selected' : ''}>Monthly</option></select></div><div class="fl"><label>Start From</label><select data-df="copy"><option value="">Blank Plan</option>${S.plans.map((p) => `<option value="${p.id}" ${f.copy === p.id ? 'selected' : ''}>Copy of ${esc(p.name)}</option>`).join('')}</select></div><div class="hint">New plans start as drafts and stay hidden at checkout until you set them live and publish.</div>`;
      foot = '<button class="pill" data-act="closeDrw">Cancel</button><button class="pill pri" data-act="saveDrw">Create Plan</button>';
    }
    const exd = extDrawer(d); if (exd) { title = exd.title; body = exd.body; foot = '<button class="pill" data-act="closeDrw">Cancel</button><button class="pill pri" data-act="saveDrw">' + (exd.foot || 'Save to Draft') + '</button>'; }
    const del = ((d.kind === 'promo' || d.kind === 'bundle' || d.kind === 'addon') && f.id) || (exd && exd.del) ? '<button class="pill dng" data-act="delDrw" style="margin-right:auto">Delete</button>' : '';
    return `<div class="drw-bg" data-act="closeDrw"></div><div class="drw" role="dialog" aria-label="${esc(title)}"><div class="drw-h"><h3>${esc(title)}</h3><button class="ic" style="margin-left:auto" data-act="closeDrw" aria-label="Close">✕</button></div><div class="drw-b">${body}</div><div class="drw-f">${del}${foot}</div></div>`;
  }

  // ---------- side panel ----------
  const INFO = {
    overview: ['What You\'re Looking At', 'The checkout catalog: every plan, size, price, platform, add-on, bundle and promotion traders can buy. Edits go into a draft until you publish.'],
    plans: ['Plans', 'A plan is the root of everything a trader buys. Its sizes, platforms, add-ons and bundles are switched on per plan.'],
    plan: ['Editing a Plan', 'Prices are per size. The floor price is the lowest any combination of discounts can take a size. Scheduled prices switch on by themselves.'],
    availability: ['Availability', 'The same switches as each plan page, side by side. Checkout reads this grid to decide what to show.'],
    rules: ['Rule Sets', 'Rule sets are versioned. A new version applies to new purchases only; existing accounts keep the version they bought.'],
    addons: ['Add-Ons', 'Priced flat or as a percent of the size. Charged once per account in the cart.'],
    bundles: ['Bundles', 'Fixed bundles, quantity tiers and mix and match. Only the single best bundle applies to a cart.'],
    promos: ['Promotions', 'Codes and automatic discounts with explicit targets and exclusions, so a sale can\'t leak onto lines it shouldn\'t touch.'],
    platforms: ['Platforms', 'Platforms run on the simulator adapter for now. The partner is chosen last and plugs in without changing the catalog.'],
    tester: ['Price Tester', 'Runs the real pricing engine against the draft catalog: availability checks, bundles, automatic promotions, then the code.'],
    fees: ['Resets and Fees', 'Everything a trader pays after the first purchase. Promotions that target resets use these prices.'],
    content: ['Checkout Content', 'The words and agreement each plan shows at checkout. Each purchase stores the agreement version the trader accepted.'],
    limits: ['Limits and Restrictions', 'Checked at checkout before payment and again on the server, so a trader never pays for something they can\'t have.'],
    currency: ['Currencies and Tax', 'Prices are set once in US dollars and shown in local currency. Tax stays off until an accountant confirms where it applies.'],
    preview: ['Live Preview', 'Built from the draft catalog and priced by the same engine as the real checkout. What you see here is what traders get after you publish.'],
    campaigns: ['Campaigns', 'Scheduled sales that switch on and back off by themselves. Their price changes still need a second approval.'],
    tests: ['Price Tests', 'Compare two prices by revenue per visitor. Each visitor always sees the same price.'],
    perf: ['Performance', 'Sales, pass rates, refunds and chargebacks per item, and the true cost of every discount.'],
    codes: ['Codes and Affiliates', 'Bulk codes, affiliate codes, a log of every use, and flags when something looks like abuse.'],
    recovery: ['Abandoned Checkout', 'A reminder with a one-time code for traders who left without paying.'],
    integrations: ['Integrations', 'Payment processors, payouts, identity checks and analytics. Keys live in the secrets manager; going live needs a second approval.'],
    roles: ['Permissions', 'What each team role can do in the catalog. Price and rule changes always need a second person to approve.'],
    changes: ['Publishing', 'Publishing needs zero blocking checks. Every version is kept, so you can roll back with one click.']
  };
  function side() {
    const ch = checks(); const [h, p] = INFO[S.view] || INFO.overview;
    const g = (lvl) => ch.filter((x) => x.lvl === lvl);
    const items = [
      ['Blocking Problems', 'Must be fixed before publishing', g('err').length, 'hot', 'changes'],
      ['Warnings', 'Allowed, but worth a look', g('warn').length, 'warm', 'changes'],
      ['Unpublished Changes', 'Saved to the draft, not live yet', S.changes.length, S.changes.length ? 'warm' : '', 'changes'],
      ['Promotions Ending Soon', 'Within the next 10 days', ch.filter((x) => x.lvl === 'info' && / ends /.test(x.text)).length, '', 'promos'],
      ['Scheduled Price Changes', 'Switch on by themselves', S.plans.reduce((n, pl) => n + pl.sizes.filter((z) => z.sched).length, 0), '', 'plans'],
      ['Draft Rule Versions', 'Go live on publish', S.rules.filter((r) => r.status === 'draft').length, '', 'rules'],
      ['Waiting for Approval', 'Price and rule changes', pending().length, 'hot', 'changes'],
      ['Campaigns Coming Up', 'Start within 7 days', S.campaigns.filter((c) => { const d = (new Date(c.start) - NOW) / 864e5; return d >= 0 && d <= 7 && !c.paused; }).length, '', 'campaigns'],
      ['Price Tests Running', 'Check before ending', S.tests.filter((t) => t.status === 'running').length, '', 'tests'],
      ['Codes Flagged', 'Possible code abuse', S.flags.filter((f) => !f.done).length, 'warm', 'codes'],
      ['Integrations to Check', 'Not set up or failing', S.integrations.filter((x) => x.status === 'attention').length, 'warm', 'integrations']
    ];
    return `<h2>${esc(h)}</h2><p>${esc(p)}</p><h5>Worth a Look</h5>${items.map(([t, s, n, cls, v]) => `<button class="att" data-act="go" data-v="${v}"><div><b>${t}</b><small>${s}</small></div><em class="${n ? cls : ''}">${n}</em></button>`).join('')}
    <h5 style="margin-top:24px">Live Version</h5><div class="qrow"><span style="color:var(--mu)">Catalog</span><span>v${S.version}</span></div><div class="qrow"><span style="color:var(--mu)">Last published</span><span>${esc(S.history[0].when)}</span></div><div class="qrow" style="border:0"><span style="color:var(--mu)">Your role</span><span>Owner</span></div>
    <p class="hint" style="margin-top:14px">Sample data: names, prices and rule amounts are placeholders until the real plans are set.</p>`;
  }


  const NAV = () => [['overview', 'Overview'], ['h', 'Catalog'], ['plans', 'Plans', S.plans.length], ['PLANS'], ['availability', 'Availability'], ['rules', 'Rule Sets', S.rules.filter((r) => r.status !== 'retired').length], ['fees', 'Resets and Fees'], ['addons', 'Add-Ons', S.addons.length], ['bundles', 'Bundles', S.bundles.length], ['promos', 'Promotions', S.promos.length], ['codes', 'Codes and Affiliates', S.affiliates.length], ['platforms', 'Platforms', S.platforms.length],
    ['h', 'Checkout'], ['content', 'Checkout Content'], ['limits', 'Limits and Restrictions'], ['currency', 'Currencies and Tax'], ['preview', 'Live Preview'],
    ['h', 'Growth'], ['campaigns', 'Campaigns', S.campaigns.length], ['tests', 'Price Tests', S.tests.filter((t) => t.status === 'running').length], ['perf', 'Performance'], ['recovery', 'Abandoned Checkout'],
    ['h', 'Tools'], ['tester', 'Price Tester'], ['changes', 'Changes and Publishing', S.changes.length], ['integrations', 'Integrations', S.integrations.filter((x) => x.status === 'connected').length], ['roles', 'Permissions']];
  function navHtml() {
    return NAV().map((n) => {
      if (n[0] === 'h') return `<h6>${n[1]}</h6>`;
      if (n[0] === 'PLANS') return S.plans.map((p) => `<button class="ni sub ${S.view === 'plan' && S.planId === p.id ? 'on' : ''}" data-act="openPlan" data-id="${p.id}"><span class="dot" style="background:${p.status === 'live' ? 'var(--ok)' : p.status === 'draft' ? 'var(--wa)' : 'var(--fa)'}"></span>${esc(p.name)}</button>`).join('');
      return `<button class="ni ${S.view === n[0] || (n[0] === 'plans' && S.view === 'plan') ? 'on' : ''}" data-act="go" data-v="${n[0]}">${n[1]}${n[2] != null ? `<i>${n[2]}</i>` : ''}</button>`;
    }).join('');
  }
  function mnavHtml() {
    let out = '', open = false;
    NAV().forEach((n) => {
      if (n[0] === 'h') { if (open) out += '</optgroup>'; out += `<optgroup label="${n[1]}">`; open = true; return; }
      if (n[0] === 'PLANS') { out += S.plans.map((p) => `<option value="p:${p.id}" ${S.view === 'plan' && S.planId === p.id ? 'selected' : ''}>\u2003${esc(p.name)}</option>`).join(''); return; }
      out += `<option value="v:${n[0]}" ${S.view === n[0] ? 'selected' : ''}>${n[1]}${n[2] != null ? ' (' + n[2] + ')' : ''}</option>`;
    });
    return out + (open ? '</optgroup>' : '');
  }
  function render() {
    const c = counts(); const scroll = root.querySelector('.main'); const st = scroll ? scroll.scrollTop : 0;
    const navI = (v, l, n) => `<button class="ni ${S.view === v || (v === 'plans' && S.view === 'plan') ? 'on' : ''}" data-act="go" data-v="${v}">${l}${n != null ? `<i>${n}</i>` : ''}</button>`;
    const views = { overview: vOverview, plans: vPlans, plan: vPlan, availability: vAvailability, rules: vRules, addons: vAddons, bundles: vBundles, promos: vPromos, platforms: vPlatforms, tester: vTester, changes: vChanges, fees: vFees, content: vContent, limits: vLimits, currency: vCurrency, preview: vPreview, campaigns: vCampaigns, tests: vTests, perf: vPerf, codes: vCodes, recovery: vRecovery, roles: vRoles, integrations: vIntegrations };
    root.innerHTML = `<div class="tb"><a class="pill bk" href="AdminHome.dc.html" aria-label="Back to Admin">←<span class="lg"> Back to Admin</span></a><span class="tb-t">Checkout Catalog</span><span class="envchip hm">Editing Draft</span>
      <div class="tb-mid hm"><div class="tb-stats"><div><span>Live Plans</span><b>${c.plans}</b></div><div><span>Sizes on Sale</span><b>${c.sizes}</b></div><div><span>Bundles</span><b>${c.bundles}</b></div><div><span>Live Promotions</span><b>${c.promos}</b></div><div><span>Live Version</span><b>v${S.version}</b></div></div></div>
      <div class="igs hm" aria-label="Payment integrations">${S.integrations.filter((x) => x.group === 'Payments').map(intgDot).join('')}<button class="ig more" data-act="go" data-v="integrations" title="All integrations" aria-label="All integrations"><span>+${S.integrations.filter((x) => x.group !== 'Payments').length}</span></button></div>
      <button class="pill sidebtn" data-act="side" aria-expanded="${S.sideOpen}" aria-label="Worth a Look"><span class="lg">Worth a Look</span><span class="cnt">${checks().filter((x) => x.lvl !== 'info').length + pending().length}</span></button><button class="pill hm" data-act="go" data-v="preview">Live Preview</button><button class="pill pri" data-act="go" data-v="changes"><span class="lg">Review and Publish</span><span class="sm">Publish </span>(${c.changes})</button></div>
    <div class="body"><div class="mnav"><select id="mnavsel" aria-label="Go to section">${mnavHtml()}</select></div><nav class="nav" aria-label="Catalog">${navHtml()}</nav><main class="main">${views[S.view]()}${drawer()}</main><aside class="side ${S.sideOpen ? 'open' : ''}">${S.sideOpen ? '<button class="ic sidex" data-act="side" aria-label="Close">✕</button>' : ''}${side()}</aside>${S.sideOpen ? '<div class="side-bg" data-act="side"></div>' : ''}</div>${S.toast ? `<div class="toast" role="status">${esc(S.toast)}</div>` : ''}`;
    const m = root.querySelector('.main'); if (m) m.scrollTop = st;
  }

  // ---------- events ----------
  const openDrawer = (kind, f) => { S.drawer = { kind, f: JSON.parse(JSON.stringify(f)) }; render(); };
  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el || !root.contains(el)) return;
    if (el.tagName === 'INPUT' && el.type !== 'radio' && el.type !== 'checkbox') return;
    const a = el.dataset.act, id = el.dataset.id, i = +el.dataset.i;
    const p = plan(S.planId);
    const D = S.drawer && S.drawer.f;
    switch (a) {
      case 'go': S.view = el.dataset.v; S.drawer = null; S.sideOpen = false; break;
      case 'side': S.sideOpen = !S.sideOpen; break;
      case 'openPlan': S.view = 'plan'; S.planId = id; S.drawer = null; break;
      case 'goCheck': { const g = JSON.parse(el.dataset.go); if (g[0] === 'plan') { S.view = 'plan'; S.planId = g[1]; } else if (g[0] === 'promo') { S.view = 'promos'; const pr = S.promos.find((x) => x.id === g[1]); openDrawer('promo', pr); return; } else if (g[0] === 'bundle') { S.view = 'bundles'; editBundle(g[1]); return; } else S.view = g[0]; break; }
      case 'sizeActive': { const z = p.sizes[i]; z.active = !z.active; log('Sizes', `${p.name} ${K(z.size)} ${z.active ? 'switched on' : 'switched off'}`); break; }
      case 'planPlat': p.platforms[id] = !p.platforms[id]; log('Platforms', `${plat(id).name} ${p.platforms[id] ? 'added to' : 'removed from'} ${p.name}`); break;
      case 'defPlat': p.defPlatform = id; log('Platforms', `${p.name} default platform set to ${plat(id).name}`); break;
      case 'planAddon': p.addons[id] = !p.addons[id]; log('Add-Ons', `${addon(id).name} ${p.addons[id] ? 'added to' : 'removed from'} ${p.name}`); break;
      case 'planBundle': p.bundles[id] = !p.bundles[id]; log('Bundles', `${S.bundles.find((b) => b.id === id).name} ${p.bundles[id] ? 'offered on' : 'removed from'} ${p.name}`); break;
      case 'mx': { const pl = plan(el.dataset.p), k = el.dataset.k; let on, name;
        if (k === 'size') { const z = sizeOf(pl.id, +id); z.active = !z.active; on = z.active; name = K(z.size); }
        else if (k === 'plat') { pl.platforms[id] = !pl.platforms[id]; on = pl.platforms[id]; name = plat(id).name; }
        else if (k === 'addon') { pl.addons[id] = !pl.addons[id]; on = pl.addons[id]; name = addon(id).name; }
        else { pl.bundles[id] = !pl.bundles[id]; on = pl.bundles[id]; name = S.bundles.find((b) => b.id === id).name; }
        log('Availability', `${name} ${on ? 'switched on for' : 'switched off for'} ${pl.name}`); break; }
      case 'sched': { const z = p.sizes[i]; openDrawer('sched', { i, price: z.price, date: '2026-12-01' }); return; }
      case 'unsched': { const z = p.sizes[i]; z.sched = null; log('Prices', `Cancelled scheduled price for ${p.name} ${K(z.size)}`); break; }
      case 'dupPlan': { const c = JSON.parse(JSON.stringify(p)); c.id = uid('p'); c.name = p.name.replace(']', ' Copy]'); c.slug = p.slug + '-copy'; c.status = 'draft'; c.sort = S.plans.length + 1; S.plans.push(c); c.sizes.forEach((z) => { const r = liveRule(p.id, z.size); if (r) S.rules.push(Object.assign({}, r, { id: uid('r'), plan: c.id, version: 1, status: 'draft', accounts: 0 })); }); S.planId = c.id; log('Plans', `Created ${c.name} as a copy of ${p.name}`); toast('Plan duplicated as a draft'); return; }
      case 'retirePlan': p.status = 'retired'; log('Plans', `${p.name} retired`); toast('Plan retired: hidden at checkout after publish'); return;
      case 'restorePlan': p.status = 'draft'; log('Plans', `${p.name} restored as a draft`); break;
      case 'newPlan': openDrawer('newplan', { name: '[New Plan Name]', billing: 'one-time', copy: '' }); return;
      case 'ruleFilter': S.ruleFilter = el.dataset.k; break;
      case 'promoFilter': S.promoFilter = el.dataset.k; break;
      case 'newRule': { const r = S.rules.find((x) => x.id === id); const max = Math.max(...S.rules.filter((x) => x.plan === r.plan && x.size === r.size).map((x) => x.version)); openDrawer('rule', Object.assign({}, r, { version: max + 1 })); return; }
      case 'delRule': S.rules = S.rules.filter((x) => x.id !== id); log('Rule Sets', 'Discarded a draft rule set version'); break;
      case 'editAddon': { const ad = addon(id) || { id: '', name: '[New Add-On]', pricing: 'flat', value: 0, discountable: true, effect: '', status: 'draft' }; openDrawer('addon', Object.assign({}, ad, { on: Object.fromEntries(S.plans.map((x) => [x.id, !!x.addons[ad.id]])) })); return; }
      case 'editBundle': editBundle(id); return;
      case 'editPromo': { const pr = S.promos.find((x) => x.id === id) || { id: '', name: '[New Promotion]', kind: 'code', code: '', vtype: 'percent', value: 10, freeAddon: 'daily', plans: [], sizes: [], lines: { base: true, addon: false, reset: false }, withBundles: false, first: false, affiliate: false, minCart: 0, countries: '', start: '2026-11-22', end: '', total: 0, perTrader: 1, maxOff: 0, priority: 10, exclusive: false, status: 'on', uses: 0 }; openDrawer('promo', pr); return; }
      case 'bType': D.type = el.dataset.k; if (D.type === 'tier' && !D.tiers) D.tiers = [{ min: 2, pct: 10 }]; if (D.type === 'mix' && !D.mixPlans) { D.mixPlans = []; D.min = 2; D.pct = 10; } if (D.type === 'fixed' && !D.items) { D.items = [{ plan: S.plans[0].id, size: 50000, qty: 2 }]; D.price = 0; } break;
      case 'tierAdd': D.tiers.push({ min: (D.tiers.at(-1) || { min: 1 }).min + 1, pct: 10 }); break;
      case 'tierDel': D.tiers.splice(i, 1); break;
      case 'itemAdd': D.items.push({ plan: S.plans[0].id, size: 50000, qty: 1 }); break;
      case 'itemDel': D.items.splice(i, 1); break;
      case 'pKind': D.kind = el.dataset.k; break;
      case 'pOn': D.status = el.checked ? 'on' : 'off'; return;
      case 'closeDrw': S.drawer = null; break;
      case 'saveDrw': saveDrawer(); return;
      case 'delDrw': { const k = S.drawer.kind; if (k === 'promo') S.promos = S.promos.filter((x) => x.id !== D.id); if (k === 'bundle') { S.bundles = S.bundles.filter((x) => x.id !== D.id); S.plans.forEach((x) => delete x.bundles[D.id]); } if (k === 'addon') { S.addons = S.addons.filter((x) => x.id !== D.id); S.plans.forEach((x) => delete x.addons[D.id]); } if (k === 'camp') S.campaigns = S.campaigns.filter((x) => x.id !== D.id); if (k === 'aff') S.affiliates = S.affiliates.filter((x) => x.id !== D.id); log({ promo: 'Promotions', bundle: 'Bundles', addon: 'Add-Ons', camp: 'Campaigns', aff: 'Affiliates' }[k], `Deleted ${D.name}`); S.drawer = null; toast('Deleted from the draft'); return; }
      case 'platVis': { const x = plat(id); x.visible = !x.visible; log('Platforms', `${x.name} ${x.visible ? 'shown' : 'hidden'} at checkout`); break; }
      case 'tAdd': S.tester.lines.push({ plan: 'pa', size: 50000, platform: 'tradovate', addons: [], qty: 1 }); break;
      case 'tDel': S.tester.lines.splice(i, 1); break;
      case 'tAddon': { const ln = S.tester.lines[i]; ln.addons = el.checked ? [...ln.addons, id] : ln.addons.filter((x) => x !== id); break; }
      case 'tFlag': S.tester[el.dataset.k] = el.checked; break;
      case 'dropChange': S.changes = S.changes.filter((x) => x.id !== id); break;
      case 'discardAll': S.changes = []; toast('Draft list cleared'); return;
      case 'publish': { const n = S.changes.length; S.version += 1; S.history.unshift({ v: S.version, text: S.changes.slice(0, 2).map((x) => x.text).join('; ') + (n > 2 ? `; and ${n - 2} more` : ''), who: ME, when: 'Just now', count: n }); S.changes = []; S.rules.forEach((r) => { if (r.status === 'draft') { S.rules.filter((o) => o.plan === r.plan && o.size === r.size && o.status === 'live').forEach((o) => { o.status = 'retired'; }); r.status = 'live'; } }); toast(`Published v${S.version}. The checkout is updated.`); return; }
      case 'rollback': { const v = +el.dataset.v; S.version += 1; S.history.unshift({ v: S.version, text: `Rolled back to the catalog from v${v}`, who: ME, when: 'Just now', count: 1 }); toast(`Rolled back. v${S.version} matches v${v}.`); return; }
      case 'pvFrom': S.preview.plan = id; S.view = 'preview'; S.drawer = null; break;
      default: { const r = extClick(a, el); if (!r || r === 'noRender') return; }
    }
    render();
  });
  function editBundle(id) { const b = S.bundles.find((x) => x.id === id) || { id: '', name: '[New Bundle]', type: 'tier', tiers: [{ min: 2, pct: 10 }], samePlan: true, stacks: false, status: 'draft', uses: 0 }; openDrawer('bundle', Object.assign({ tiers: [{ min: 2, pct: 10 }], mixPlans: [], min: 2, pct: 10, items: [{ plan: 'pa', size: 50000, qty: 2 }], price: 0, samePlan: true }, b, { on: Object.fromEntries(S.plans.map((x) => [x.id, !!x.bundles[b.id]])) })); }

  root.addEventListener('change', (e) => {
    const el = e.target;
    if (el.id === 'mnavsel') { const [k, v] = el.value.split(':'); if (k === 'p') { S.view = 'plan'; S.planId = v; } else S.view = v; S.drawer = null; S.sideOpen = false; render(); const m = root.querySelector('.main'); if (m) m.scrollTop = 0; return; } const p = plan(S.planId); const D = S.drawer && S.drawer.f;
    const num = (v) => v === '' ? 0 : +v;
    if (el.dataset.bind) {
      if (extChange(el)) { render(); return; }
      const [o, k] = el.dataset.bind.split('.'); const i = +el.dataset.i;
      if (o === 'plan') { const old = p[k]; p[k] = k === 'sort' ? num(el.value) : el.value; log('Plans', `${p.name}: ${k === 'desc' ? 'description' : k} ${k === 'name' ? 'renamed from ' + old : 'changed to ' + (el.value || 'none')}`); }
      else if (o === 'size') { const z = p.sizes[i]; const old = z[k]; z[k] = el.value === '' ? (k === 'compare' ? null : 0) : +el.value; log('Prices', `${p.name} ${K(z.size)} ${k === 'price' ? 'price' : k === 'compare' ? 'compare-at price' : 'floor price'}`, { before: old ? money(old) : 'None', after: z[k] ? money(z[k]) : 'None', approve: k !== 'compare' }); }
      else if (o === 't') { const t = S.tester; if (k === 'code') t.code = el.value; else { const ln = t.lines[i]; if (k === 'plan') { ln.plan = el.value; const pl = plan(el.value); const z = pl.sizes.find((x) => x.active); if (z && !sizeOf(pl.id, ln.size).active) ln.size = z.size; if (!pl.platforms[ln.platform]) ln.platform = pl.defPlatform; } else if (k === 'size' || k === 'qty') ln[k] = +el.value; else ln[k] = el.value; } }
      render(); return;
    }
    if (!D) return;
    if (el.dataset.df) { const k = el.dataset.df; D[k] = el.type === 'number' ? num(el.value) : el.value; if (['pricing', 'vtype', 'copy', 'plan', 'size', 'prefix'].includes(k)) render(); return; }
    if (el.dataset.dfv) { D.vals[el.dataset.dfv] = el.value; return; }
    if (el.dataset.dft2) { D.tg[el.dataset.dft2] = el.checked; return; }
    if (el.dataset.dfa) { const arr = D[el.dataset.dfa]; const v = el.dataset.v; D[el.dataset.dfa] = el.checked ? [...arr, v] : arr.filter((x) => x !== v); return; }
    if (el.dataset.dfr) { const [ri, rk] = el.dataset.dfr.split('.'); D.prices[+ri][rk] = rk === 'plan' ? el.value : num(el.value); return; }
    if (el.dataset.dfc) { D[el.dataset.dfc] = el.checked; return; }
    if (el.dataset.dfo) { D.on[el.dataset.dfo] = el.checked; return; }
    if (el.dataset.dfm) { const id = el.dataset.dfm; D.mixPlans = el.checked ? [...D.mixPlans, id] : D.mixPlans.filter((x) => x !== id); return; }
    if (el.dataset.dfp) { const id = el.dataset.dfp; D.plans = el.checked ? [...D.plans, id] : D.plans.filter((x) => x !== id); return; }
    if (el.dataset.dfs) { const s = +el.dataset.dfs; D.sizes = el.checked ? [...D.sizes, s] : D.sizes.filter((x) => x !== s); return; }
    if (el.dataset.dfl) { D.lines[el.dataset.dfl] = el.checked; return; }
    if (el.dataset.dft) { const [i, k] = el.dataset.dft.split('.'); D.tiers[+i][k] = num(el.value); return; }
    if (el.dataset.dfi) { const [i, k] = el.dataset.dfi.split('.'); D.items[+i][k] = k === 'plan' ? el.value : num(el.value); render(); return; }
  });

  function saveDrawer() {
    const { kind, f } = S.drawer;
    { const r = extSave(kind, f); if (r === 'done') return; if (r) { S.drawer = null; toast('Saved to the draft'); render(); return; } }
    if (kind === 'addon') {
      const { on, ...a } = f; if (!a.id) { a.id = uid('a'); S.addons.push(a); } else Object.assign(addon(a.id), a);
      S.plans.forEach((p) => { p.addons[a.id] = !!on[p.id]; }); log('Add-Ons', `${f.id ? 'Updated' : 'Created'} ${a.name}`);
    } else if (kind === 'bundle') {
      const { on, ...b } = f; if (!b.id) { b.id = uid('b'); S.bundles.push(b); } else Object.assign(S.bundles.find((x) => x.id === b.id), b);
      S.plans.forEach((p) => { p.bundles[b.id] = !!on[p.id]; }); log('Bundles', `${f.id ? 'Updated' : 'Created'} ${b.name}`);
    } else if (kind === 'promo') {
      if (f.kind === 'code') f.code = (f.code || '').toUpperCase().replace(/\s+/g, '');
      if (f.kind === 'code' && S.promos.some((x) => x.id !== f.id && x.kind === 'code' && x.code === f.code)) { toast('That code is already used by another promotion'); return; }
      if (!f.id) { f.id = uid('pr'); S.promos.push(f); } else Object.assign(S.promos.find((x) => x.id === f.id), f);
      log('Promotions', `${S.drawer.f.id && S.promos.find((x) => x.id === f.id) ? 'Saved' : 'Created'} ${f.name}${f.kind === 'code' ? ' (' + f.code + ')' : ''}`);
    } else if (kind === 'rule') {
      const r = Object.assign({}, f, { id: uid('r'), status: 'draft', accounts: 0 }); S.rules.push(r); const prev = liveRule(r.plan, r.size); log('Rule Sets', `Draft v${r.version} for ${plan(r.plan).name} ${K(r.size)}`, { before: prev ? `v${prev.version}: ${money(prev.target)} / ${money(prev.dd)}` : 'None', after: `v${r.version}: ${money(+r.target)} / ${money(+r.dd)}`, approve: true });
    } else if (kind === 'sched') {
      const p = plan(S.planId), z = p.sizes[f.i]; z.sched = { price: +f.price, date: f.date }; log('Prices', `${p.name} ${K(z.size)} scheduled for ${fmtD(f.date)}`, { before: money(z.price), after: money(+f.price), approve: true });
    } else if (kind === 'newplan') {
      const src = f.copy ? plan(f.copy) : null; const id = uid('p');
      const np = src ? Object.assign(JSON.parse(JSON.stringify(src)), { id, name: f.name, slug: f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), status: 'draft', badge: '', sort: S.plans.length + 1, billing: f.billing })
        : { id, name: f.name, slug: f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), badge: '', billing: f.billing, status: 'draft', sort: S.plans.length + 1, desc: '', sizes: SIZES.map((s) => ({ size: s, price: 0, compare: null, floor: 0, active: false, sched: null })), platforms: { tradovate: true, ninja: false, tv: false, rithmic: false }, defPlatform: 'tradovate', addons: {}, bundles: {} };
      S.plans.push(np); np.sizes.forEach((z) => { const r = src && liveRule(src.id, z.size); S.rules.push(Object.assign({}, r || { target: 0, daily: 0, dd: 0, ddType: 'Trailing EOD', contracts: 0, minDays: 5, consistency: 40, split: 90, payoutMin: 250 }, { id: uid('r'), plan: id, size: z.size, version: 1, status: 'draft', accounts: 0 })); });
      log('Plans', `Created ${np.name}${src ? ' from ' + src.name : ''}`); S.view = 'plan'; S.planId = id;
    }
    S.drawer = null; toast('Saved to the draft'); render();
  }

  render();
}
