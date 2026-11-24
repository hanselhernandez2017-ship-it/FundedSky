
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
      { name: 'Australia GST', on: false, inclusive: true }, { name: 'Canada GST/HST', on: false, inclusive: false }, { name: 'US sales tax', on: false, inclusive: false }
    ],
    recovery: { on: true, delay: 2, pct: 10, expiry: 48, oneTime: true, firstOnly: true, sent: 214, opened: 131, recovered: 37, revenue: 6290 },
    roles: { names: ['Owner', 'Finance', 'Marketing', 'Support', 'Risk'], caps: ['View the catalog', 'Edit plans and sizes', 'Change prices', 'Change rule sets', 'Create promotions and codes', 'Manage affiliates', 'Run price tests and campaigns', 'Approve price and rule changes', 'Publish', 'Export and import'],
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
  const perfOf = (p, z) => { const f = S.perfRange / 30; const base = { pa: 1, pb: 1.6, pc: 0.8 }[p.id] || 0.5; const o = Math.round((z.size / 25000 <= 2 ? 22 : 14) * base * f); return { orders: o, revenue: o * z.price, pass: [14, 11, 9, 7][SIZES.indexOf(z.size)], refunds: Math.round(o * 0.03), cb: Math.round(o * 0.012) }; };

  function vFees() {
    const rows = S.plans.map((p) => p.sizes.filter((z) => z.active).map((z) => { const f = S.fees[p.id][z.size]; return `<tr><td class="nw"><b>${esc(p.name)}</b></td><td>${K(z.size)}</td><td class="num">${money(z.price)}</td>
      <td style="width:120px"><input type="number" min="0" value="${f.reset || ''}" placeholder="None" data-bind="fee.reset" data-p="${p.id}" data-s="${z.size}" aria-label="Reset price"></td>
      <td style="width:120px"><input type="number" min="0" value="${f.activation || ''}" placeholder="None" data-bind="fee.activation" data-p="${p.id}" data-s="${z.size}" aria-label="Activation fee"></td>
      <td style="width:120px">${p.billing === 'monthly' ? `<input type="number" min="0" value="${f.renewal || ''}" data-bind="fee.renewal" data-p="${p.id}" data-s="${z.size}" aria-label="Monthly renewal">` : '<span class="hint">One-time plan</span>'}</td>
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
    <div class="card m0"><div class="ch"><h3>How It Looks</h3><span class="lab">Plan card at checkout</span></div><div class="cb">
      <div style="border:1px solid var(--ln);border-radius:12px;padding:18px;background:var(--bg)"><div style="display:flex;align-items:center;gap:8px"><b style="font-size:17px">${esc(p.name)}</b>${p.badge ? `<span class="b sched plain">${esc(p.badge)}</span>` : ''}</div><div style="color:var(--mu);font-size:13px;margin:4px 0 12px">${esc(c.tagline)}</div>
      <ul style="margin:0;padding:0;list-style:none;display:grid;gap:8px">${c.bullets.map((b) => `<li style="display:flex;gap:8px;font-size:13.5px;color:var(--t2)"><span style="color:var(--sky)">✓</span>${esc(b)}</li>`).join('')}</ul>
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--ln2);font-size:12.5px;color:var(--mu)">I agree to the <span style="color:var(--sky)">${esc(c.agreement)}</span></div></div>
      <div style="margin-top:14px">${c.faq.map((f) => `<div class="qrow" style="flex-direction:column;gap:2px"><b style="font-size:13.5px">${esc(f.q)}</b><span style="color:var(--mu);font-size:13px">${esc(f.a)}</span></div>`).join('')}</div>
    </div></div></div>`;
  }

  function vLimits() {
    const L = S.limits;
    const rows = S.plans.map((p) => { const l = L.plans[p.id]; const pct = l.cap ? Math.min(100, l.sold / l.cap * 100) : 0; return `<tr><td class="nw"><b>${esc(p.name)}</b></td><td style="width:130px"><input type="number" min="0" value="${l.perTrader || ''}" placeholder="No limit" data-bind="lim.perTrader" data-p="${p.id}" aria-label="Max per trader"></td>
      <td style="width:130px"><input type="number" min="0" value="${l.cap || ''}" placeholder="No cap" data-bind="lim.cap" data-p="${p.id}" aria-label="Monthly cap"></td>
      <td style="min-width:180px">${l.cap ? `<div style="display:flex;align-items:center;gap:10px"><span style="flex:1;height:6px;border-radius:3px;background:#26262A;overflow:hidden"><span style="display:block;height:6px;width:${pct}%;background:${pct > 90 ? 'var(--no)' : 'var(--sky)'}"></span></span><span class="nw" style="font-size:12.5px">${l.sold} / ${l.cap}</span></div>` : `<span class="hint">${l.sold} sold, no cap</span>`}</td>
      <td style="min-width:200px"><input value="${esc(l.countries)}" placeholder="Same as global" data-bind="lim.countries" data-p="${p.id}" aria-label="Extra blocked countries"></td></tr>`; }).join('');
    return `<div class="ph"><div><h1>Limits and Restrictions</h1><p>Enforced at checkout before payment, and again by the server. These match the restrictions in the risk plan.</p></div></div>
    <div class="card"><div class="ch"><h3>Every Trader</h3></div><div class="cb fg"><div class="fg3">
      <div class="fl"><label>Max Active Evaluations</label><input type="number" min="0" value="${L.maxActive}" data-bind="lim.maxActive"></div>
      <div class="fl"><label>Max Funded Accounts</label><input type="number" min="0" value="${L.maxFunded}" data-bind="lim.maxFunded"></div>
      <div class="fl"><label>Max Total Funded Balance ($)</label><input type="number" min="0" value="${L.maxFundedBalance}" data-bind="lim.maxFundedBalance"></div></div>
      <div class="fl"><label>Blocked Countries</label><input value="${esc(L.blocked)}" data-bind="lim.blocked"><span class="hint">Checked at sign-up, checkout, KYC and payout. Set by your lawyer.</span></div>
      <label class="chk"><input type="checkbox" ${L.vpn ? 'checked' : ''} data-act="limVpn"> Block checkout when a VPN or proxy hides the trader's country</label></div></div>
    <div class="card"><div class="ch"><h3>Per Plan</h3><span class="lab">Caps reset on the 1st of each month</span></div><div class="tsc"><table class="t"><thead><tr><th>Plan</th><th>Max per Trader</th><th>Monthly Sales Cap</th><th>Sold This Month</th><th>Extra Blocked Countries</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <p class="hint">When a trader hits a limit, checkout explains why and the option is shown as unavailable instead of failing at payment.</p>`;
  }

  function vCurrency() {
    const ex = sizeOf('pb', 100000).price;
    const rows = S.currencies.map((c, i) => `<tr><td class="swc">${c.mode === 'base' ? '<span class="b live plain">Base</span>' : sw(c.on, 'curOn', `data-i="${i}"`, 'Sell in ' + c.code)}</td><td><b>${c.code}</b> <span class="hint">${c.name}</span></td>
      <td style="width:170px">${c.mode === 'base' ? '<span class="hint">All prices are set in USD</span>' : `<select data-bind="cur.mode" data-i="${i}"><option value="auto" ${c.mode === 'auto' ? 'selected' : ''}>Convert daily</option><option value="fixed" ${c.mode === 'fixed' ? 'selected' : ''}>Fixed rate</option></select>`}</td>
      <td style="width:110px">${c.mode === 'base' ? '' : `<input type="number" step="0.01" value="${c.rate}" data-bind="cur.rate" data-i="${i}" ${c.mode === 'auto' ? 'disabled' : ''} aria-label="Rate">`}</td>
      <td style="width:150px">${c.mode === 'base' ? '' : `<select data-bind="cur.round" data-i="${i}"><option value=".99" ${c.round === '.99' ? 'selected' : ''}>End in .99</option><option value="1" ${c.round === '1' ? 'selected' : ''}>Whole number</option><option value="5" ${c.round === '5' ? 'selected' : ''}>Nearest 5</option></select>`}</td>
      <td class="num nw">${cm(c, curPrice(c, ex))}</td></tr>`).join('');
    const tx = S.tax.map((t, i) => `<tr><td class="swc">${sw(t.on, 'taxOn', `data-i="${i}"`, 'Collect ' + t.name)}</td><td><b>${t.name}</b></td><td><label class="chk"><input type="checkbox" ${t.inclusive ? 'checked' : ''} data-act="taxInc" data-i="${i}"> Prices include tax</label></td></tr>`).join('');
    return `<div class="ph"><div><h1>Currencies and Tax</h1><p>Show prices in a trader's own currency and collect tax where required. Prices are still set once, in US dollars.</p></div></div>
    <div class="card"><div class="ch"><h3>Currencies</h3><span class="lab">Example: [Plan B Name] $100K at ${money(ex)}</span></div><div class="tsc"><table class="t"><thead><tr><th>Sell In</th><th>Currency</th><th>Rate</th><th>Rate Value</th><th>Rounding</th><th class="num">Example Price</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <div class="card"><div class="ch"><h3>Tax Collection</h3><span class="lab">Off until confirmed</span></div><div class="tsc"><table class="t"><tbody>${tx}</tbody></table></div></div>
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
      <div><div class="lab" style="margin-bottom:8px;font-size:12.5px;color:var(--mu)">Choose Your Account</div><div style="display:flex;flex-wrap:wrap;gap:8px">${plans.map((x) => chip(x.id === p.id, 'pvPlan', `data-id="${x.id}"`, esc(x.name) + (x.badge ? ` <span class="b sched plain" style="margin-left:6px">${esc(x.badge)}</span>` : ''), x.billing === 'monthly' ? 'Monthly' : 'One-time')).join('')}</div></div>
      <div><div class="lab" style="margin-bottom:8px;font-size:12.5px;color:var(--mu)">Account Size</div><div style="display:flex;flex-wrap:wrap;gap:8px">${sizes.map((x) => chip(x.size === pv.size, 'pvSize', `data-s="${x.size}"`, K(x.size), (x.compare ? `<s style="color:var(--fa)">${money(x.compare)}</s> ` : '') + money(x.price))).join('')}</div></div>
      <div><div class="lab" style="margin-bottom:8px;font-size:12.5px;color:var(--mu)">Platform</div><div style="display:flex;flex-wrap:wrap;gap:8px">${plats.map((x) => chip(x.id === pv.platform, 'pvPlat', `data-id="${x.id}"`, x.name)).join('')}</div></div>
      ${ads.length ? `<div><div class="lab" style="margin-bottom:8px;font-size:12.5px;color:var(--mu)">Add-Ons</div><div style="display:grid;gap:8px">${ads.map((a) => `<label class="chk" style="padding:12px 14px;border:1px solid var(--ln);border-radius:10px;justify-content:space-between"><span style="display:flex;gap:8px;align-items:center"><input type="checkbox" ${pv.addons.includes(a.id) ? 'checked' : ''} data-act="pvAddon" data-id="${a.id}"> ${esc(a.name)}</span><span style="color:var(--mu)">+${money(a.pricing === 'flat' ? a.value : z.price * a.value / 100)}</span></label>`).join('')}</div></div>` : ''}
    </div>`;
    const right = `<div style="border:1px solid var(--ln);border-radius:12px;padding:16px;background:var(--p2)"><b style="font-size:15px">Your Order</b>
      <div style="display:flex;align-items:center;gap:10px;margin:12px 0"><span style="font-size:13px;color:var(--mu)">How Many?</span><button class="ic" data-act="pvQty" data-d="-1" style="border:1px solid var(--ln)">−</button><b>${pv.qty}</b><button class="ic" data-act="pvQty" data-d="1" style="border:1px solid var(--ln)">+</button></div>
      ${q.comps.map((c) => `<div class="qrow"><span>${esc(c.label)}</span><span>${money(c.amt)}</span></div>`).join('')}
      ${q.savings.map(([l, v]) => `<div class="qrow sv"><span>${esc(l)}</span><span>−${money(v)}</span></div>`).join('')}
      <div class="qrow tot"><span>Total</span><span>${money(q.total)}</span></div>
      <input value="${esc(pv.code)}" placeholder="Promo code" data-bind="pv.code" style="margin-top:8px" aria-label="Promo code">
      <div style="margin-top:12px;height:44px;border-radius:4px;background:#fff;color:#111113;display:grid;place-items:center;font-weight:600">Continue to Payment</div>
      ${q.msgs.filter((m) => m[0] !== '✓').map(([, m]) => `<div class="msg"><i style="color:var(--no)">✕</i><span>${esc(m)}</span></div>`).join('')}</div>`;
    return `<div class="ph"><div><h1>Live Preview</h1><p>The checkout exactly as traders will see it after you publish, built from the draft catalog and priced by the real engine.</p></div>
    <div class="act"><label class="chk"><input type="checkbox" ${pv.drafts ? 'checked' : ''} data-act="pvDrafts"> Include draft plans</label><div class="seg"><button class="${!mob ? 'on' : ''}" data-act="pvDev" data-k="desktop">Desktop</button><button class="${mob ? 'on' : ''}" data-act="pvDev" data-k="phone">Phone</button></div></div></div>
    <div style="display:flex;justify-content:center"><div style="width:100%;max-width:${mob ? '390px' : '1040px'};border:1px solid var(--ln);border-radius:${mob ? '28px' : '14px'};background:var(--bg);overflow:hidden;transition:max-width .2s">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--ln)"><span style="display:flex;align-items:center;gap:6px"><b style="font-size:19px;letter-spacing:-.045em">fundedsky</b><span style="background:#7CC4FF;color:#08080A;font-weight:600;font-size:13px;padding:2px 5px 3px;border-radius:4px;line-height:1">futures</span></span><span style="font-size:12.5px;color:var(--mu)">Secure Checkout</span></div>
      <div style="padding:${mob ? '16px' : '24px'};display:grid;grid-template-columns:${mob ? '1fr' : 'minmax(0,1.5fr) minmax(0,1fr)'};gap:20px;align-items:start">${left}${right}</div></div></div>`;
  }

  function vCampaigns() {
    const rows = S.campaigns.map((c) => { const [st, cls] = campState(c); const parts = [c.promos.length && c.promos.map((x) => (S.promos.find((p) => p.id === x) || {}).name).join(', '), c.prices.length && c.prices.length + ' price change' + (c.prices.length > 1 ? 's' : ''), c.bundlesOn.length && c.bundlesOn.length + ' bundle' + (c.bundlesOn.length > 1 ? 's' : '') + ' on'].filter(Boolean).join(' · '); return `<tr class="lk" data-act="editCamp" data-id="${c.id}"><td class="nw"><b>${esc(c.name)}</b></td><td><span class="b ${cls}">${st}</span></td><td class="nw">${fmtDT(c.start)}</td><td class="nw">${fmtDT(c.end)}</td><td>${esc(parts) || '—'}</td><td>${c.revert ? 'Switches back automatically' : 'Stays on'}</td></tr>`; }).join('');
    return `<div class="ph"><div><h1>Campaigns</h1><p>Prepare a sale in advance: promotions, temporary prices and bundles that switch on at a set time and switch back when it ends. No one has to be awake to press Publish.</p></div><div class="act"><button class="pill" data-act="editCamp" data-id="">+ New Campaign</button></div></div>
    <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Campaign</th><th>Status</th><th>Starts</th><th>Ends</th><th>What Changes</th><th>When It Ends</th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="empty">No campaigns yet.</td></tr>'}</tbody></table></div></div>
    <p class="hint">Times are Eastern. A campaign's price changes still need a second approval before it's scheduled.</p>`;
  }

  function vTests() {
    const rows = S.tests.map((t) => { const ca = conv(t.ba, t.va), cb = conv(t.bb, t.vb); const ra = t.ba * t.a / t.va, rb = t.bb * t.b / t.vb; const lead = rb > ra ? 'B' : 'A'; const n = Math.min(t.va, t.vb); const sure = n > 1500 ? 'Enough visitors to decide' : 'Keep running'; return `<tr><td class="nw"><b>${esc(t.name)}</b><div class="hint">${esc(plan(t.plan).name)} ${K(t.size)} · since ${t.start}</div></td><td><span class="b ${t.status === 'running' ? 'live' : 'ended'}">${t.status === 'running' ? 'Running' : 'Ended'}</span></td>
      <td class="num nw">A ${money(t.a)}<div class="hint">${t.va.toLocaleString()} visitors · ${ca.toFixed(1)}% buy</div></td><td class="num nw">B ${money(t.b)}<div class="hint">${t.vb.toLocaleString()} visitors · ${cb.toFixed(1)}% buy</div></td>
      <td class="num nw">${money(ra)} vs ${money(rb)}<div class="hint">revenue per visitor</div></td><td class="nw">${t.status === 'running' ? `<b style="color:var(--ok)">${lead} leads</b><div class="hint">${sure}</div>` : esc(t.applied || '')}</td>
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
    const ad = S.addons.map((a) => { const n = Math.round({ reset: 41, daily: 27, noact: 19, split: 9 }[a.id] * f || 5); return `<tr><td><b>${esc(a.name)}</b></td><td class="num">${n}</td><td class="num">${money(n * (a.pricing === 'flat' ? a.value : 2.2 * a.value))}</td></tr>`; }).join('');
    return `<div class="ph"><div><h1>Performance</h1><p>What each part of the catalog sells, and what discounts cost. Use it before changing a price or launching a sale.</p></div><div class="act"><div class="seg">${[7, 30, 90].map((d) => `<button class="${S.perfRange === d ? 'on' : ''}" data-act="perfRange" data-k="${d}">${d} Days</button>`).join('')}</div></div></div>
    <div class="tiles"><div class="tile"><span>Orders</span><b>${tot.o}</b><small>Last ${S.perfRange} days</small></div><div class="tile"><span>Revenue</span><b>${money(tot.r)}</b><small>Before refunds</small></div><div class="tile"><span>Refund Rate</span><b>${(tot.rf / Math.max(1, tot.o) * 100).toFixed(1)}%</b><small>${tot.rf} refunds</small></div><div class="tile"><span>Chargeback Rate</span><b>${(tot.cb / Math.max(1, tot.o) * 100).toFixed(1)}%</b><small>Card networks penalize above 1%</small></div></div>
    <div class="card"><div class="ch"><h3>By Plan and Size</h3></div><div class="tsc"><table class="t"><thead><tr><th>Plan</th><th>Size</th><th class="num">Orders</th><th class="num">Revenue</th><th class="num">Pass Rate</th><th class="num">Refunds</th><th class="num">Chargebacks</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <div class="two"><div class="card m0"><div class="ch"><h3>Promotions</h3><span class="lab">What a discount cost vs. what it brought in</span></div><div class="tsc"><table class="t"><thead><tr><th>Promotion</th><th class="num">Uses</th><th class="num">Discount Given</th><th class="num">Revenue</th><th class="num">New Traders</th><th class="num">Cost</th></tr></thead><tbody>${pr}</tbody></table></div></div>
    <div class="card m0"><div class="ch"><h3>Add-Ons</h3></div><div class="tsc"><table class="t"><thead><tr><th>Add-On</th><th class="num">Sold</th><th class="num">Revenue</th></tr></thead><tbody>${ad}</tbody></table></div></div></div>
    <p class="hint" style="margin-top:14px">Sample numbers until real orders exist.</p>`;
  }

  function vCodes() {
    const ba = S.batches.map((b) => `<tr><td class="nw"><b class="mono">${esc(b.prefix)}-XXXX</b></td><td>${esc((S.promos.find((p) => p.id === b.promo) || {}).name || '—')}</td><td class="num">${b.count}</td><td class="num">${b.usesEach}</td><td class="num">${b.used} / ${b.count}</td><td class="nw">${b.created}</td><td class="nw"><button class="lnk" data-act="batchExport" data-id="${b.id}">Download CSV</button></td></tr>`).join('');
    const af = S.affiliates.map((a) => `<tr class="lk" data-act="editAff" data-id="${a.id}"><td class="nw"><b>${esc(a.name)}</b></td><td class="mono">${esc(a.code)}</td><td><span class="b ${a.status === 'active' ? 'live' : 'ret'}">${a.status === 'active' ? 'Active' : 'Paused'}</span></td><td class="num">${a.pct}%</td><td class="num">${a.commission}%</td><td class="num">${a.uses}</td><td class="num">${money(a.revenue)}</td><td class="num">${money(a.revenue * a.commission / 100)}</td></tr>`).join('');
    const lg = S.codeLog.map((l) => `<tr><td class="mono nw">${esc(l.code)}</td><td class="nw">${esc(l.trader)}</td><td class="mono nw">${esc(l.order)}</td><td class="num">−${money(l.off)}</td><td class="nw" style="color:var(--mu)">${esc(l.when)}</td></tr>`).join('');
    const fl = S.flags.map((f, i) => `<div class="att" style="cursor:default"><div><b>${esc(f.text)}</b><small class="mono">${esc(f.codes)}</small></div>${f.done ? '<span class="b live">Reviewed</span>' : `<button class="pill sm" data-act="flagDone" data-i="${i}">Mark Reviewed</button>`}</div>`).join('');
    return `<div class="ph"><div><h1>Codes and Affiliates</h1><p>Unique codes in bulk, a code for every affiliate, a log of every use, and flags when codes look abused.</p></div><div class="act"><button class="pill" data-act="newBatch">+ Generate Codes</button><button class="pill" data-act="editAff" data-id="">+ New Affiliate</button></div></div>
    <div class="card"><div class="ch"><h3>Affiliates</h3><span class="lab">Commission is paid on the amount after discounts</span></div><div class="tsc"><table class="t"><thead><tr><th>Affiliate</th><th>Code</th><th>Status</th><th class="num">Trader Discount</th><th class="num">Commission</th><th class="num">Uses</th><th class="num">Revenue</th><th class="num">Owed</th></tr></thead><tbody>${af}</tbody></table></div></div>
    <div class="two"><div class="card m0"><div class="ch"><h3>Unique Code Batches</h3></div><div class="tsc"><table class="t"><thead><tr><th>Codes</th><th>Promotion</th><th class="num">Count</th><th class="num">Uses Each</th><th class="num">Used</th><th>Created</th><th></th></tr></thead><tbody>${ba || '<tr><td colspan="7" class="empty">No batches yet.</td></tr>'}</tbody></table></div></div>
    <div class="card m0"><div class="ch"><h3>Possible Abuse</h3><span class="lab">${S.flags.filter((f) => !f.done).length} open</span></div><div class="cb" style="padding:4px 16px">${fl}</div></div></div>
    <div class="card" style="margin-top:14px"><div class="ch"><h3>Recent Code Uses</h3></div><div class="tsc"><table class="t"><thead><tr><th>Code</th><th>Trader</th><th>Order</th><th class="num">Discount</th><th>When</th></tr></thead><tbody>${lg}</tbody></table></div></div>`;
  }

  function vRecovery() {
    const r = S.recovery;
    return `<div class="ph"><div><h1>Abandoned Checkout</h1><p>When a signed-in trader leaves checkout without paying, send a reminder with a one-time code.</p></div><div class="act">${sw(r.on, 'recOn', '', 'Recovery emails on')}<span class="hint">${r.on ? 'On' : 'Off'}</span></div></div>
    <div class="tiles"><div class="tile"><span>Emails Sent</span><b>${r.sent}</b><small>Last 30 days</small></div><div class="tile"><span>Opened</span><b>${Math.round(r.opened / r.sent * 100)}%</b><small>${r.opened} opens</small></div><div class="tile"><span>Recovered</span><b>${r.recovered}</b><small>${(r.recovered / r.sent * 100).toFixed(1)}% of sent</small></div><div class="tile"><span>Recovered Revenue</span><b>${money(r.revenue)}</b><small>After the code discount</small></div></div>
    <div class="card"><div class="ch"><h3>Settings</h3></div><div class="cb fg"><div class="fg3">
      <div class="fl"><label>Send After (Hours)</label><input type="number" min="1" value="${r.delay}" data-bind="rec.delay"></div>
      <div class="fl"><label>Discount (%)</label><input type="number" min="0" value="${r.pct}" data-bind="rec.pct"><span class="hint">0 sends a plain reminder with no code</span></div>
      <div class="fl"><label>Code Expires After (Hours)</label><input type="number" min="1" value="${r.expiry}" data-bind="rec.expiry"></div></div>
      <label class="chk"><input type="checkbox" ${r.oneTime ? 'checked' : ''} data-act="recFlag" data-k="oneTime"> Each code works once, for that trader only</label>
      <label class="chk"><input type="checkbox" ${r.firstOnly ? 'checked' : ''} data-act="recFlag" data-k="firstOnly"> Only for traders who have never bought</label>
      <div class="hint">The code follows normal stacking: it never applies on top of another code and never goes below a size's floor price.</div></div></div>
    <div class="card"><div class="ch"><h3>Email Preview</h3></div><div class="cb"><div style="max-width:520px;border:1px solid var(--ln);border-radius:12px;padding:20px;background:var(--bg)"><b style="font-size:16px">Your account is still waiting</b><p style="color:var(--t2);font-size:14px;line-height:1.55;margin:8px 0 14px">You left [Plan B Name] $100K in your cart.${r.pct ? ` Use code <b class="mono" style="color:var(--sky)">BACK-XXXX</b> for ${r.pct}% off in the next ${r.expiry} hours.` : ''}</p><span style="display:inline-block;background:#fff;color:#111113;font-weight:600;padding:10px 16px;border-radius:4px">Finish Checkout</span></div></div></div>`;
  }

  function vRoles() {
    const R = S.roles;
    return `<div class="ph"><div><h1>Permissions</h1><p>Who on the team can do what in the catalog. Owners can do everything; every action is still recorded with who did it.</p></div></div>
    <div class="card"><div class="tsc"><table class="mx"><thead><tr><th>Can</th>${R.names.map((n) => `<th>${n}</th>`).join('')}</tr></thead><tbody>${R.caps.map((c, ci) => `<tr><td>${c}</td>${R.names.map((n) => n === 'Owner' ? '<td><button type="button" class="ck on na" aria-pressed="true" aria-label="Owner always">✓</button></td>' : `<td><button type="button" class="ck ${R.grid[n][ci] ? 'on' : ''}" aria-pressed="${!!R.grid[n][ci]}" aria-label="${esc(c)} for ${n}" data-act="roleCk" data-r="${n}" data-c="${ci}">✓</button></td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
    <p class="hint">Price and rule changes need someone with "Approve price and rule changes" other than the person who made them.</p>`;
  }

  // Rewritten changes view with before/after and approvals
  vChanges = function () {
    const ch = checks(); const errs = ch.filter((x) => x.lvl === 'err'); const pend = pending();
    const can = S.changes.length && !errs.length && !pend.length;
    return `<div class="ph"><div><h1>Changes and Publishing</h1><p>Every edit sits in a draft. Price and rule changes need a second person to approve them. Publishing switches everything on at once as a new version you can roll back to.</p></div>
    <div class="act"><button class="pill" data-act="exportCat">Export</button><button class="pill" data-act="importCat">Import</button><button class="pill" data-act="discardAll" ${S.changes.length ? '' : 'disabled'}>Discard All</button><button class="pill pri" data-act="publish" ${can ? '' : 'disabled'}>Publish v${S.version + 1}</button></div></div>
    ${pend.length ? `<div class="card" style="border-color:rgba(242,196,109,.45)"><div class="cb" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><span class="b draft">${pend.length} Waiting for Approval</span><span style="color:var(--t2);font-size:13.5px">Price and rule changes can't be published until ${APPROVER} approves them.</span><button class="pill sm" style="margin-left:auto" data-act="approveAll">Approve All as ${APPROVER}</button></div></div>` : ''}
    <div class="card"><div class="ch"><h3>Unpublished Changes</h3><span class="lab">${S.changes.length}</span></div><div class="tsc"><table class="t"><thead><tr><th>Area</th><th>Change</th><th>Before</th><th>After</th><th>Approval</th><th>By</th><th></th></tr></thead><tbody>${S.changes.map((x) => `<tr><td><span class="b plain">${esc(x.area)}</span></td><td style="min-width:260px">${esc(x.text)}<div class="hint">${esc(x.when)}</div></td><td class="nw" style="color:var(--no)">${x.before != null ? esc(x.before) : '—'}</td><td class="nw" style="color:var(--ok)">${x.after != null ? esc(x.after) : '—'}</td>
      <td class="nw">${x.approve ? (x.approved ? `<span class="b live">Approved</span><div class="hint">${APPROVER}</div>` : `<button class="pill sm" data-act="approveOne" data-id="${x.id}">Approve</button>`) : '<span class="hint">Not needed</span>'}</td><td class="nw" style="color:var(--mu)">${esc(x.who)}</td><td><button class="ic" title="Discard this change" data-act="dropChange" data-id="${x.id}">✕</button></td></tr>`).join('') || '<tr><td colspan="7" class="empty">No draft changes. The checkout matches v' + S.version + '.</td></tr>'}</tbody></table></div></div>
    <div class="two"><div class="card m0"><div class="ch"><h3>Checks Before Publish</h3><div class="r">${errs.length ? `<span class="b err">${errs.length} Blocking</span>` : '<span class="b live">Ready</span>'}</div></div><div class="cb" style="padding:6px 16px">${ch.map((x) => `<div class="msg"><i style="color:${x.lvl === 'err' ? 'var(--no)' : x.lvl === 'warn' ? 'var(--wa)' : 'var(--sky)'}">${x.lvl === 'err' ? '✕' : x.lvl === 'warn' ? '!' : 'i'}</i><span>${esc(x.text)} <button class="lnk" data-act="goCheck" data-go="${esc(JSON.stringify(x.go))}">Fix</button></span></div>`).join('') || '<div class="empty">Everything checks out.</div>'}</div></div>
    <div class="card m0"><div class="ch"><h3>Version History</h3><span class="lab">Live: v${S.version}</span></div><div class="tsc"><table class="t"><tbody>${S.history.map((h) => `<tr><td class="nw"><span class="mono">v${h.v}</span>${h.v === S.version ? ' <span class="b live" style="margin-left:8px">Live</span>' : ''}</td><td>${esc(h.text)}<div class="hint">${esc(h.who)} · ${esc(h.when)}</div></td><td class="nw">${h.v !== S.version ? `<button class="lnk" data-act="rollback" data-v="${h.v}">Roll Back</button>` : ''}</td></tr>`).join('')}</tbody></table></div></div></div>
    <p class="hint" style="margin-top:14px">Changes never touch orders already placed: each order line and account keeps the prices and rules it was sold with.</p>`;
  };

  function extDrawer(d) {
    const f = d.f;
    if (d.kind === 'camp') {
      return { title: f.id ? 'Edit Campaign' : 'New Campaign', body: `<div class="fl"><label>Name</label><input value="${esc(f.name)}" data-df="name"></div>
        <div class="fg2"><div class="fl"><label>Starts (Eastern)</label><input type="datetime-local" value="${f.start}" data-df="start"></div><div class="fl"><label>Ends (Eastern)</label><input type="datetime-local" value="${f.end}" data-df="end"></div></div>
        <div class="sec"><h4>Promotions to Switch On</h4><div style="display:flex;flex-direction:column;gap:10px">${S.promos.map((p) => `<label class="chk"><input type="checkbox" ${f.promos.includes(p.id) ? 'checked' : ''} data-dfa="promos" data-v="${p.id}"> ${esc(p.name)}${p.kind === 'code' ? ' (' + p.code + ')' : ''}</label>`).join('')}</div></div>
        <div class="sec"><h4>Temporary Prices</h4>${f.prices.map((x, i) => `<div class="rowx" style="grid-template-columns:1.3fr 1fr 100px 28px;margin-bottom:8px"><select data-dfr="${i}.plan">${S.plans.map((p) => `<option value="${p.id}" ${p.id === x.plan ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select><select data-dfr="${i}.size">${SIZES.map((s) => `<option value="${s}" ${s === +x.size ? 'selected' : ''}>${K(s)}</option>`).join('')}</select><input type="number" min="0" value="${x.price}" data-dfr="${i}.price" aria-label="Price"><button class="ic" data-act="campPDel" data-i="${i}">✕</button></div>`).join('')}<button class="lnk" data-act="campPAdd">+ Add Price</button></div>
        <div class="sec"><h4>Bundles to Switch On</h4><div style="display:flex;flex-direction:column;gap:10px">${S.bundles.map((b) => `<label class="chk"><input type="checkbox" ${f.bundlesOn.includes(b.id) ? 'checked' : ''} data-dfa="bundlesOn" data-v="${b.id}"> ${esc(b.name)}</label>`).join('')}</div></div>
        <label class="chk"><input type="checkbox" ${f.revert ? 'checked' : ''} data-dfc="revert"> Switch everything back automatically when it ends</label>
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
