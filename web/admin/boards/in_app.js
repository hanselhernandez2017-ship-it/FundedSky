  const ME = '[Your Name]';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = (v, sign) => (v < 0 ? '−' : sign && v > 0 ? '+' : '') + '$' + Math.abs(Math.round(v)).toLocaleString('en-US');
  const kmoney = (v) => { const a = Math.abs(v); const s = v < 0 ? '−' : ''; return a >= 1e6 ? s + '$' + (a / 1e6).toFixed(2) + 'M' : a >= 1e4 ? s + '$' + (a / 1e3).toFixed(1) + 'K' : money(v); };
  const pct = (v, d = 0) => (v * 100).toFixed(d) + '%';
  const K = (n) => '$' + n / 1000 + 'K';

  // ---------- plan and size data, last 90 days ----------
  // sold: evaluations sold · price list price · disc average discount · refund, cb rates · pass of sold · funded of passed · paid of funded
  // avgPay average total payouts per paid trader · resets per sold · resetP reset price · addon add-on revenue per sold · act activation fee · months (monthly plans: average months paid)
  const PLANS = [
    { id: 'pa', name: '[Plan A Name]', billing: 'One-Time', sizes: [
      { size: 25000, sold: 186, price: 99, disc: 0.14, refund: 0.02, cb: 0.004, pass: 0.10, funded: 0.86, paid: 0.52, avgPay: 980, resets: 0.42, resetP: 54, addon: 9, act: 99 },
      { size: 50000, sold: 226, price: 149, disc: 0.15, refund: 0.02, cb: 0.004, pass: 0.088, funded: 0.88, paid: 0.50, avgPay: 1460, resets: 0.38, resetP: 82, addon: 14, act: 99 }] },
    { id: 'pb', name: '[Plan B Name]', billing: 'One-Time', badge: 'Most Popular', sizes: [
      { size: 50000, sold: 288, price: 169, disc: 0.16, refund: 0.018, cb: 0.003, pass: 0.115, funded: 0.9, paid: 0.55, avgPay: 1640, resets: 0.46, resetP: 93, addon: 31, act: 99 },
      { size: 100000, sold: 214, price: 259, disc: 0.17, refund: 0.016, cb: 0.004, pass: 0.112, funded: 0.9, paid: 0.57, avgPay: 2760, resets: 0.41, resetP: 142, addon: 44, act: 149 },
      { size: 150000, sold: 126, price: 349, disc: 0.18, refund: 0.015, cb: 0.006, pass: 0.121, funded: 0.91, paid: 0.62, avgPay: 4980, resets: 0.36, resetP: 192, addon: 52, act: 149 }] },
    { id: 'pc', name: '[Plan C Name]', billing: 'Monthly', sizes: [
      { size: 25000, sold: 142, price: 79, disc: 0.1, refund: 0.025, cb: 0.008, pass: 0.094, funded: 0.84, paid: 0.48, avgPay: 940, resets: 0.3, resetP: 43, addon: 6, act: 0, months: 2.3 },
      { size: 50000, sold: 104, price: 119, disc: 0.12, refund: 0.024, cb: 0.009, pass: 0.104, funded: 0.86, paid: 0.53, avgPay: 1880, resets: 0.27, resetP: 65, addon: 9, act: 0, months: 1.9 },
      { size: 100000, sold: 55, price: 189, disc: 0.14, refund: 0.022, cb: 0.011, pass: 0.142, funded: 0.88, paid: 0.6, avgPay: 3420, resets: 0.22, resetP: 104, addon: 12, act: 0, months: 1.7 }] }
  ];
  const COST = { proc: 4.2, procFix: 0.3, platEval: 7, platFunded: 85, data: 3.5, kyc: 1.9, affShare: 34, affRate: 15, cbFee: 25 };
  const COST_LABELS = { proc: ['Card Processing (%)', 'Of every payment'], procFix: ['Card Processing per Payment ($)', 'Fixed part of each charge'], platEval: ['Platform Fee per Evaluation ($)', 'Simulator seat for the evaluation'], platFunded: ['Platform Fee per Funded Account ($)', 'Per funded account, for its lifetime'], data: ['Market Data per Account ($)', 'Exchange data passed through'], kyc: ['Identity Check per Trader ($)', 'Charged per check'], affShare: ['Sales Through Affiliates (%)', 'Share of evaluation revenue'], affRate: ['Affiliate Commission (%)', 'Paid on the amount after discounts'], cbFee: ['Chargeback Fee ($)', 'Charged by the processor per dispute'] };

  // ---------- economics ----------
  function econ(p, z, over) {
    const c = Object.assign({}, z, over || {}); const k = S.range / 90;
    const sold = c.sold * k; const net = c.price * (1 - c.disc); const months = c.months || 1;
    const evalRev = sold * net * months; const resetRev = sold * c.resets * c.resetP; const addonRev = sold * c.addon;
    const passed = sold * c.pass; const funded = passed * c.funded; const paidN = funded * c.paid; const actRev = funded * (c.act || 0);
    const gross = evalRev + resetRev + addonRev + actRev;
    const refunds = evalRev * c.refund; const cbs = evalRev * c.cb; const cbFees = sold * c.cb * COST.cbFee;
    const payments = sold * (months + c.resets) + funded;
    const proc = gross * COST.proc / 100 + payments * COST.procFix;
    const platform = sold * (1 + c.resets) * COST.platEval + funded * COST.platFunded; const data = sold * COST.data; const kyc = passed * COST.kyc;
    const aff = evalRev * COST.affShare / 100 * COST.affRate / 100;
    const payouts = paidN * c.avgPay * (over && over.split ? over.split / 90 : 1);
    const revenue = gross - refunds - cbs;
    const costs = cbFees + proc + platform + data + kyc + aff;
    const profit = revenue - costs - payouts;
    return { sold, passed, funded, paidN, evalRev, resetRev, addonRev, actRev, gross, refunds, cbs, cbFees, proc, platform, data, kyc, aff, payouts, revenue, costs, profit, margin: revenue ? profit / revenue : 0, payRatio: revenue ? payouts / revenue : 0, perSold: sold ? profit / sold : 0 };
  }
  const sum = (arr) => arr.reduce((t, e) => { Object.keys(e).forEach((k) => { t[k] = (t[k] || 0) + e[k]; }); return t; }, {});
  const planTotal = (p) => { const t = sum(p.sizes.map((z) => econ(p, z))); t.margin = t.revenue ? t.profit / t.revenue : 0; t.payRatio = t.revenue ? t.payouts / t.revenue : 0; t.perSold = t.profit / t.sold; return t; };
  const allTotal = () => { const t = sum(PLANS.map(planTotal)); t.margin = t.profit / t.revenue; t.payRatio = t.payouts / t.revenue; return t; };
  const health = (m) => m >= 0.3 ? ['Profitable', 'live'] : m >= 0.1 ? ['Thin Margin', 'draft'] : m >= 0 ? ['Break-Even', 'draft'] : ['Losing Money', 'err'];
  const mcol = (m) => m >= 0.3 ? 'rgba(95,211,155,.22)' : m >= 0 ? 'rgba(242,196,109,.2)' : 'rgba(242,119,127,.24)';
  const cells = () => PLANS.flatMap((p) => p.sizes.map((z) => ({ p, z, e: econ(p, z) })));

  const S = { view: 'overview', range: 90, plan: 'pb', size: 150000, toast: '', lab: null, drawer: null };
  const curPlan = () => PLANS.find((p) => p.id === S.plan); const curSize = () => curPlan().sizes.find((z) => z.size === S.size) || curPlan().sizes[0];

  // ---------- nav ----------
  const NAV = [['h', 'Insights'], ['overview', 'Overview'], ['matrix', 'Plans and Sizes'], ['detail', 'Plan Detail'], ['cohorts', 'Cohorts'], ['addons', 'Add-Ons and Resets'], ['promos', 'Discounts and Affiliates'], ['h', 'Model'], ['costs', 'Cost Assumptions'], ['lab', 'Price Lab']];
  const navHtml = () => NAV.map((n) => n[0] === 'h' ? `<h6>${n[1]}</h6>` : `<button class="ni ${S.view === n[0] ? 'on' : ''}" data-act="go" data-v="${n[0]}">${n[1]}${n[0] === 'matrix' ? `<i class="${cells().some((c) => c.e.margin < 0) ? 'bad' : ''}">${cells().filter((c) => c.e.margin < 0.1).length || ''}</i>` : ''}</button>`).join('');
  const mnavHtml = () => { let o = '', open = false; NAV.forEach((n) => { if (n[0] === 'h') { if (open) o += '</optgroup>'; o += `<optgroup label="${n[1]}">`; open = true; } else o += `<option value="${n[0]}" ${S.view === n[0] ? 'selected' : ''}>${n[1]}</option>`; }); return o + '</optgroup>'; };
  const rangeSeg = () => `<div class="seg">${[[30, '30 Days'], [90, '90 Days'], [365, '12 Months']].map(([d, l]) => `<button class="${S.range === d ? 'on' : ''}" data-act="range" data-k="${d}">${l}</button>`).join('')}</div>`;

  // ---------- overview ----------
  function findings() {
    const cs = cells().sort((a, b) => a.e.margin - b.e.margin); const out = [];
    cs.filter((c) => c.e.margin < 0.1).forEach((c) => out.push(['bad', `${c.p.name} ${K(c.z.size)} ${c.e.margin < 0 ? 'loses' : 'barely makes'} ${money(Math.abs(c.e.perSold))} per evaluation sold`, `Payouts take ${pct(c.e.payRatio)} of its revenue. ${c.p.billing === 'Monthly' ? 'Traders pay for fewer months than the funded payouts cost.' : 'The price is low for the payouts this size produces.'}`, c]));
    const best = cs[cs.length - 1]; out.push(['good', `${best.p.name} ${K(best.z.size)} is the most profitable size`, `${pct(best.e.margin)} margin, ${money(best.e.perSold)} profit per evaluation sold.`, best]);
    const resetShare = cells().reduce((s, c) => s + c.e.resetRev, 0) / allTotal().revenue; out.push(['info', `Resets bring in ${pct(resetShare)} of revenue`, 'They cost almost nothing to provide. Keeping the Reset After Breach discount moderate protects this.', null]);
    return out;
  }
  function vOverview() {
    const T = allTotal(); const ps = PLANS.map((p) => ({ p, t: planTotal(p) })); const mx = Math.max(...ps.map((x) => x.t.revenue));
    return `<div class="ph"><div><h1>Plan Insights</h1><p>Which plans and sizes make money once payouts, fees, refunds, chargebacks and discounts are counted. Sample numbers.</p></div><div class="act">${rangeSeg()}</div></div>
      <div class="tiles t6"><div class="tile"><span>Revenue</span><b>${kmoney(T.revenue)}</b><small>After refunds and chargebacks</small></div><div class="tile"><span>Payouts to Traders</span><b>${kmoney(T.payouts)}</b><small>${pct(T.payRatio)} of revenue</small></div><div class="tile"><span>Costs</span><b>${kmoney(T.costs)}</b><small>Fees, platforms, data, checks</small></div><div class="tile"><span>Profit</span><b class="${T.profit < 0 ? 'dn' : 'up'}">${kmoney(T.profit)}</b><small>${pct(T.margin)} margin</small></div><div class="tile"><span>Evaluations Sold</span><b>${Math.round(T.sold).toLocaleString('en-US')}</b><small>${money(T.profit / T.sold)} profit each</small></div><div class="tile"><span>Reached a Payout</span><b>${pct(T.paidN / T.sold, 1)}</b><small>Of evaluations sold</small></div></div>
      <div class="two wl"><div class="card m0"><div class="ch"><h3>By Plan</h3><span class="lab"><i class="lgd lr"></i>Revenue <i class="lgd lp"></i>Payouts <i class="lgd lc"></i>Costs</span></div><div class="cb fg">${ps.map(({ p, t }) => `<button class="pbar" data-act="openPlan" data-id="${p.id}"><div class="pbh"><b>${esc(p.name)}</b><span class="hint">${p.billing}</span><span class="b ${health(t.margin)[1]}">${health(t.margin)[0]}</span><b class="${t.profit < 0 ? 'dn' : 'up'}">${kmoney(t.profit)}</b></div><div class="stk" title="Revenue ${kmoney(t.revenue)}"><i class="r" style="width:${t.revenue / mx * 100}%"></i></div><div class="stk"><i class="p" style="width:${t.payouts / mx * 100}%"></i><i class="c" style="width:${t.costs / mx * 100}%"></i></div><div class="pbf"><span>Revenue ${kmoney(t.revenue)}</span><span>Payouts ${kmoney(t.payouts)} · Costs ${kmoney(t.costs)}</span><span>${pct(t.margin)} margin</span></div></button>`).join('')}</div></div>
      <div class="card m0"><div class="ch"><h3>What Stands Out</h3></div><div class="cb fd">${findings().map(([k, h, d, c]) => `<div class="fnd ${k}"><i></i><div><b>${esc(h)}</b><p>${esc(d)}</p>${c ? `<div class="edact"><button class="lnk" data-act="openCell" data-id="${c.p.id}" data-k="${c.z.size}">See the Numbers</button>${c.e.margin < 0.1 ? `<button class="lnk" data-act="toLab" data-id="${c.p.id}" data-k="${c.z.size}">Try a Fix in the Price Lab</button>` : ''}</div>` : ''}</div></div>`).join('')}</div></div></div>
      <div class="card" style="margin-top:14px"><div class="ch"><h3>Every Plan and Size</h3><span class="lab">Sorted by profit per evaluation sold</span></div><div class="tsc">${cellTable(cells().sort((a, b) => b.e.perSold - a.e.perSold))}</div></div>`;
  }
  function cellTable(list) {
    return `<table class="t"><thead><tr><th>Plan</th><th>Size</th><th class="num">Sold</th><th class="num">Revenue</th><th class="num">Payouts</th><th class="num">Costs</th><th class="num">Profit</th><th class="num">Margin</th><th class="num">Profit per Sale</th><th class="num">Payouts / Revenue</th><th>Health</th></tr></thead><tbody>${list.map(({ p, z, e }) => `<tr class="lk" data-act="openCell" data-id="${p.id}" data-k="${z.size}"><td class="nw"><b>${esc(p.name)}</b></td><td class="nw">${K(z.size)}</td><td class="num">${Math.round(e.sold)}</td><td class="num">${kmoney(e.revenue)}</td><td class="num">${kmoney(e.payouts)}</td><td class="num">${kmoney(e.costs)}</td><td class="num nw ${e.profit < 0 ? 'dn' : 'up'}"><b>${kmoney(e.profit)}</b></td><td class="num">${pct(e.margin)}</td><td class="num nw ${e.perSold < 0 ? 'dn' : ''}">${money(e.perSold)}</td><td class="num ${e.payRatio > 0.6 ? 'warnt' : ''}">${pct(e.payRatio)}</td><td><span class="b ${health(e.margin)[1]}">${health(e.margin)[0]}</span></td></tr>`).join('')}</tbody></table>`;
  }
  // ---------- matrix ----------
  function vMatrix() {
    const sizes = [25000, 50000, 100000, 150000]; const metric = S.metric || 'margin';
    const val = (e) => metric === 'margin' ? pct(e.margin) : metric === 'per' ? money(e.perSold) : metric === 'pay' ? pct(e.payRatio) : pct(e.paidN / e.sold, 1);
    return `<div class="ph"><div><h1>Plans and Sizes</h1><p>Every size of every plan side by side. Green makes money, amber is thin, red loses money. Click a cell for the full breakdown.</p></div><div class="act">${rangeSeg()}</div></div>
      <div class="card"><div class="ch"><h3>Heat Map</h3><div class="r"><div class="seg">${[['margin', 'Margin'], ['per', 'Profit per Sale'], ['pay', 'Payouts / Revenue'], ['reach', 'Reached a Payout']].map(([k, l]) => `<button class="${metric === k ? 'on' : ''}" data-act="metric" data-k="${k}">${l}</button>`).join('')}</div></div></div>
      <div class="cb tsc"><table class="hmap"><thead><tr><th></th>${sizes.map((s) => `<th>${K(s)}</th>`).join('')}<th>Whole Plan</th></tr></thead><tbody>${PLANS.map((p) => { const t = planTotal(p); return `<tr><th><b>${esc(p.name)}</b><span class="hint">${p.billing}</span></th>${sizes.map((s) => { const z = p.sizes.find((x) => x.size === s); if (!z) return '<td><div class="hc na">Not Sold</div></td>'; const e = econ(p, z); return `<td><button class="hc" style="background:${mcol(e.margin)}" data-act="openCell" data-id="${p.id}" data-k="${s}"><b>${val(e)}</b><span>${kmoney(e.profit)} profit · ${Math.round(e.sold)} sold</span></button></td>`; }).join('')}<td><div class="hc tot" style="background:${mcol(t.margin)}"><b>${metric === 'margin' ? pct(t.margin) : metric === 'per' ? money(t.perSold) : metric === 'pay' ? pct(t.payRatio) : pct(t.paidN / t.sold, 1)}</b><span>${kmoney(t.profit)} profit</span></div></td></tr>`; }).join('')}</tbody></table></div></div>
      <div class="lgnd"><span><i style="background:rgba(95,211,155,.5)"></i>30% Margin or More</span><span><i style="background:rgba(242,196,109,.5)"></i>0% to 30%</span><span><i style="background:rgba(242,119,127,.55)"></i>Losing Money</span></div>`;
  }
  // ---------- detail ----------
  function vDetail() {
    const p = curPlan(), z = curSize(), e = econ(p, z);
    const fun = [['Evaluations Sold', e.sold], ['Passed', e.passed], ['Funded', e.funded], ['Reached a Payout', e.paidN]]; const f0 = fun[0][1];
    const water = [['Evaluation Revenue', e.evalRev, 'in'], ['Resets', e.resetRev, 'in'], ['Add-Ons', e.addonRev, 'in'], ['Activation Fees', e.actRev, 'in'], ['Refunds', -e.refunds, 'out'], ['Chargebacks', -(e.cbs + e.cbFees), 'out'], ['Card Processing', -e.proc, 'out'], ['Platform Fees', -e.platform, 'out'], ['Market Data', -e.data, 'out'], ['Identity Checks', -e.kyc, 'out'], ['Affiliate Commission', -e.aff, 'out'], ['Payouts to Traders', -e.payouts, 'out']].filter((x) => Math.round(x[1]) !== 0);
    const wmx = Math.max(...water.map((x) => Math.abs(x[1]))); const per = (v) => money(v / e.sold);
    const r = (() => { let s = 7; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; })(); const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const tr = months.map((m, i) => { const g = 0.75 + i * 0.06 + r() * 0.08; return [m, e.revenue / 3 * g, (e.payouts + e.costs) / 3 * (0.8 + r() * 0.35)]; }); const tmx = Math.max(...tr.flatMap((x) => [x[1], x[2]]));
    return `<div class="ph"><div><h1>${esc(p.name)} ${K(z.size)}</h1><p>${p.billing}${p.billing === 'Monthly' ? `, ${z.months} months paid on average` : ''} · list price ${money(z.price)} · average discount ${pct(z.disc)} · rule set from the Checkout Catalog.</p></div><div class="act"><select data-bind="plan" aria-label="Plan">${PLANS.map((x) => `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select><div class="seg">${p.sizes.map((x) => `<button class="${x.size === z.size ? 'on' : ''}" data-act="size" data-k="${x.size}">${K(x.size)}</button>`).join('')}</div></div></div>
      <div class="tiles t6"><div class="tile"><span>Profit</span><b class="${e.profit < 0 ? 'dn' : 'up'}">${kmoney(e.profit)}</b><small><span class="b ${health(e.margin)[1]} plain">${health(e.margin)[0]}</span></small></div><div class="tile"><span>Margin</span><b>${pct(e.margin)}</b><small>Profit / revenue</small></div><div class="tile"><span>Profit per Sale</span><b class="${e.perSold < 0 ? 'dn' : ''}">${money(e.perSold)}</b><small>Each evaluation sold</small></div><div class="tile"><span>Payouts / Revenue</span><b class="${e.payRatio > 0.6 ? 'warnt' : ''}">${pct(e.payRatio)}</b><small>Target under 55%</small></div><div class="tile"><span>Average Payout</span><b>${money(z.avgPay)}</b><small>Per trader who got paid</small></div><div class="tile"><span>Break-Even Price</span><b>${money(breakEven(p, z))}</b><small>List price ${money(z.price)}</small></div></div>
      <div class="two"><div class="card m0"><div class="ch"><h3>From Sale to Payout</h3><span class="lab">${S.range === 365 ? '12 Months' : S.range + ' Days'}</span></div><div class="cb fg">${fun.map(([l, v], i) => `<div><div class="rowl"><span>${l}</span><b>${Math.round(v).toLocaleString('en-US')}${i ? ` <em>${pct(v / f0, 1)}</em>` : ''}</b></div><div class="split"><i style="width:${Math.max(1.5, v / f0 * 100)}%"></i></div></div>`).join('')}<p class="hint" style="margin:4px 0 0">Pass rate ${pct(z.pass, 1)} · ${pct(z.funded)} of passed traders get funded · ${pct(z.paid)} of funded traders reach a payout.</p></div></div>
      <div class="card m0"><div class="ch"><h3>Revenue and Spend by Month</h3><span class="lab"><i class="lgd lr"></i>Revenue <i class="lgd lp"></i>Payouts and Costs</span></div><div class="cb"><div class="wbars">${tr.map(([m, a, b]) => `<div class="wb"><div class="wbb"><i style="height:${a / tmx * 100}%"></i><i class="p" style="height:${b / tmx * 100}%"></i></div><span>${m}</span><small class="${b > a ? 'dn' : ''}">${b > a ? '−' : '+'}${kmoney(Math.abs(a - b)).replace('−', '')}</small></div>`).join('')}</div></div></div></div>
      <div class="card" style="margin-top:14px"><div class="ch"><h3>Where Each Dollar Goes</h3><span class="lab">Totals and per evaluation sold</span></div><div class="cb"><div class="wf">${water.map(([l, v, k]) => `<div class="wfr"><span>${l}</span><div class="wfb"><i class="${k}" style="width:${Math.abs(v) / wmx * 100}%"></i></div><b class="${v < 0 ? 'dn' : ''}">${money(v, 1)}</b><em>${per(v)}</em></div>`).join('')}<div class="wfr tot"><span>Profit</span><div class="wfb"></div><b class="${e.profit < 0 ? 'dn' : 'up'}">${money(e.profit, 1)}</b><em>${per(e.profit)}</em></div></div></div></div>
      <div class="edact"><button class="pill" data-act="toLab" data-id="${p.id}" data-k="${z.size}">Try Changes in the Price Lab</button></div>`;
  }
  function breakEven(p, z) { let lo = 0, hi = 2000; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (econ(p, z, { price: m }).profit > 0) hi = m; else lo = m; } return Math.ceil(hi); }
  // ---------- cohorts ----------
  function vCohorts() {
    const rows = [['May 2026', [0, 8, 22, 34, 43, 49, 53]], ['Jun 2026', [0, 9, 24, 37, 46, 51]], ['Jul 2026', [0, 7, 21, 33, 41]], ['Aug 2026', [0, 10, 26, 39]], ['Sep 2026', [0, 9, 23]], ['Oct 2026', [0, 11]], ['Nov 2026', [0]]];
    const col = (v) => v >= 60 ? 'rgba(242,119,127,.35)' : v >= 45 ? 'rgba(242,196,109,.28)' : v >= 25 ? 'rgba(124,196,255,.22)' : 'rgba(124,196,255,.08)';
    return `<div class="ph"><div><h1>Cohorts</h1><p>Traders grouped by the month they first bought. Each cell is payouts so far as a share of what that group paid, including resets and renewals.</p></div></div>
      <div class="card"><div class="ch"><h3>Payouts as a Share of Revenue, Over Time</h3><span class="lab">All Plans</span></div><div class="cb tsc"><table class="hmap co"><thead><tr><th class="lft">First Bought</th><th>Traders</th>${[0, 1, 2, 3, 4, 5, 6].map((m) => `<th>Month ${m + 1}</th>`).join('')}</tr></thead><tbody>${rows.map(([m, v], i) => `<tr><th><b>${m}</b></th><td class="hint">${[412, 448, 471, 498, 516, 540, 391][i]}</td>${[0, 1, 2, 3, 4, 5, 6].map((j) => `<td>${v[j] != null ? `<div class="hc sm" style="background:${col(v[j])}"><b>${v[j]}%</b></div>` : '<div class="hc sm na"></div>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
      <div class="two"><div class="card m0"><div class="ch"><h3>How to Read It</h3></div><div class="cb"><p class="lead">Payouts arrive weeks after a sale: traders need time to pass, get funded and trade. A group usually settles around <b>50 to 55%</b> by month six. If a newer group climbs faster than older ones did at the same age, the rules or prices for what they bought are too easy.</p></div></div>
      <div class="card m0"><div class="ch"><h3>Watch</h3></div><div class="cb"><div class="fnd bad"><i></i><div><b>August is running hot</b><p>39% by month four, against 34 to 37% for earlier groups. Most of the difference comes from [Plan C Name] $100K, sold with the Back to School discount.</p></div></div></div></div></div>`;
  }
  // ---------- add-ons ----------
  function vAddons() {
    const A = [['Free Reset', 0.21, 31.2, 4180, 0.6, 'Raises the pass rate slightly; most traders who use it still fail.'], ['Daily Payouts', 0.14, 54.6, 5320, -3.1, 'Paid traders withdraw sooner and more often, before the consistency rule catches big single days.'], ['No Activation Fee', 0.17, 79, 7420, -1.4, 'Waives $99 to $149 per funded trader, so it pays only when fewer than half of buyers get funded.'], ['Bigger Split', 0.08, 37.8, 1640, -4.8, 'Raises every payout by the extra split. Profitable only on plans with low payout rates.']];
    const k = S.range / 90; const resetRev = cells().reduce((s, c) => s + c.e.resetRev, 0);
    return `<div class="ph"><div><h1>Add-Ons and Resets</h1><p>What each extra brings in, and what it costs later in payouts. An add-on that sells well can still lose money.</p></div><div class="act">${rangeSeg()}</div></div>
      <div class="tiles"><div class="tile"><span>Reset Revenue</span><b>${kmoney(resetRev)}</b><small>${pct(resetRev / allTotal().revenue)} of all revenue</small></div><div class="tile"><span>Resets per Evaluation</span><b>0.38</b><small>Average across plans</small></div><div class="tile"><span>Add-On Revenue</span><b>${kmoney(18560 * k)}</b><small>All add-ons</small></div><div class="tile"><span>Add-On Attach Rate</span><b>29%</b><small>Orders with at least one</small></div></div>
      <div class="card"><div class="ch"><h3>Add-Ons</h3><span class="lab">Revenue minus the extra payouts and fees they cause</span></div><div class="tsc"><table class="t"><thead><tr><th>Add-On</th><th class="num">Bought With</th><th class="num">Average Price</th><th class="num">Revenue</th><th class="num">Extra Payouts per Sale</th><th class="num">Net per Sale</th><th>Verdict</th><th>Why</th></tr></thead><tbody>${A.map(([n, att, avg, rev, netPer, why]) => { const extra = avg - netPer - avg * 0.06; return `<tr><td class="nw"><b>${n}</b></td><td class="num">${pct(att)}</td><td class="num">${money(avg)}</td><td class="num">${kmoney(rev * k)}</td><td class="num">${money(extra)}</td><td class="num nw ${netPer < 0 ? 'dn' : 'up'}"><b>${money(netPer, 1)}</b></td><td><span class="b ${netPer < 0 ? 'err' : 'live'}">${netPer < 0 ? 'Costs Money' : 'Pays Off'}</span></td><td class="hint why">${why}</td></tr>`; }).join('')}</tbody></table></div></div>
      <div class="card"><div class="ch"><h3>Resets by Plan and Size</h3></div><div class="tsc"><table class="t"><thead><tr><th>Plan</th><th>Size</th><th class="num">Reset Price</th><th class="num">Resets per Evaluation</th><th class="num">Reset Revenue</th><th class="num">Share of Size Revenue</th></tr></thead><tbody>${cells().map(({ p, z, e }) => `<tr><td class="nw"><b>${esc(p.name)}</b></td><td>${K(z.size)}</td><td class="num">${money(z.resetP)}</td><td class="num">${z.resets.toFixed(2)}</td><td class="num">${kmoney(e.resetRev)}</td><td class="num">${pct(e.resetRev / e.revenue)}</td></tr>`).join('')}</tbody></table></div></div>
      <p class="hint">Add-on effects are estimated by comparing traders who bought each add-on with similar traders who didn't. Sample numbers.</p>`;
  }
  // ---------- promotions ----------
  function vPromos() {
    const k = S.range / 90;
    const P = [['Black Friday', 'BLACKFRIDAY', 'Scheduled', 0, 0, 0, 0], ['Affiliate Code', 'AFF10', 'Live', 290, 4120, 31000, 0.38], ['Reset After Breach', 'Automatic', 'Live', 180, 7960, 9300, 0.71], ['150K Perk', 'Automatic', 'Live', 28, 1530, 6950, 0.12], ['Back to School', 'SCHOOL25', 'Ended', 212, 11400, 28600, 0.22]];
    const AF = [['[Affiliate Name 1]', 'SKY10', 38, 7420, 1113, 0.42], ['[Affiliate Name 2]', 'TRADEWITHX', 21, 4130, 826, 0.81], ['[Affiliate Name 3]', 'FUTURESPRO', 4, 690, 69, 0.3]];
    return `<div class="ph"><div><h1>Discounts and Affiliates</h1><p>What each discount and affiliate cost, and whether the traders they brought in paid back more than they took out.</p></div><div class="act">${rangeSeg()}</div></div>
      <div class="card"><div class="ch"><h3>Discounts</h3></div><div class="tsc"><table class="t"><thead><tr><th>Promotion</th><th>Code</th><th>Status</th><th class="num">Orders</th><th class="num">Discount Given</th><th class="num">Revenue After Discount</th><th class="num">New Traders</th><th class="num">Cost per $1 of Revenue</th></tr></thead><tbody>${P.map(([n, c, s, o, d, r, nw]) => `<tr><td class="nw"><b>${n}</b></td><td class="mono">${c}</td><td><span class="b ${s === 'Live' ? 'live' : s === 'Scheduled' ? 'sched' : 'plain'}">${s}</span></td><td class="num">${Math.round(o * k)}</td><td class="num">${kmoney(d * k)}</td><td class="num">${kmoney(r * k)}</td><td class="num">${o ? pct(nw) : '—'}</td><td class="num ${r && d / r > 0.4 ? 'warnt' : ''}">${r ? '$' + (d / r).toFixed(2) : '—'}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="card"><div class="ch"><h3>Affiliates</h3><span class="lab">Payouts ratio: payouts to their traders / revenue from their traders</span></div><div class="tsc"><table class="t"><thead><tr><th>Affiliate</th><th>Code</th><th class="num">Orders</th><th class="num">Revenue</th><th class="num">Commission</th><th class="num">Payouts Ratio</th><th>Verdict</th></tr></thead><tbody>${AF.map(([n, c, o, r, cm, pr]) => `<tr><td class="nw"><b>${n}</b></td><td class="mono">${c}</td><td class="num">${Math.round(o * k)}</td><td class="num">${kmoney(r * k)}</td><td class="num">${kmoney(cm * k)}</td><td class="num ${pr > 0.6 ? 'dn' : ''}">${pct(pr)}</td><td><span class="b ${pr > 0.6 ? 'err' : 'live'}">${pr > 0.6 ? 'Losing Money' : 'Profitable'}</span></td></tr>`).join('')}</tbody></table></div></div>
      <div class="fnd bad"><i></i><div><b>TRADEWITHX traders are paid out 81 cents per dollar they spend</b><p>Their followers pass at twice the normal rate and several are in the copy-trading alert RK-1181 in Risk. Worth reviewing before the next commission run.</p></div></div>`;
  }
  // ---------- costs ----------
  function vCosts() {
    const T = allTotal();
    return `<div class="ph"><div><h1>Cost Assumptions</h1><p>The costs behind every number here. Change one and every plan's profit updates. Real figures replace these once billing data is connected.</p></div></div>
      <div class="two wl"><div class="card m0"><div class="ch"><h3>Costs</h3><div class="r"><button class="lnk" data-act="costReset">Reset to Defaults</button></div></div><div class="cb"><div class="fg2">${Object.entries(COST_LABELS).map(([k, [l, h]]) => `<div class="fl"><label>${l}</label><input type="number" min="0" step="0.1" value="${COST[k]}" data-bind="cost.${k}"><span class="hint">${h}</span></div>`).join('')}</div></div></div>
      <div class="card m0"><div class="ch"><h3>Where the Money Went</h3><span class="lab">${S.range === 365 ? '12 Months' : S.range + ' Days'}</span></div><div class="cb">${[['Payouts to Traders', T.payouts], ['Platform Fees', T.platform], ['Card Processing', T.proc], ['Refunds', T.refunds], ['Affiliate Commission', T.aff], ['Market Data', T.data], ['Chargebacks', T.cbs + T.cbFees], ['Identity Checks', T.kyc]].map(([l, v]) => `<div class="cbr"><div class="rowl"><span>${l}</span><b>${kmoney(v)} <em>${pct(v / T.gross, 1)}</em></b></div><div class="split"><i style="width:${v / T.gross * 100}%"></i></div></div>`).join('')}<div class="kv" style="margin-top:12px"><div><span>Gross Revenue</span><b>${kmoney(T.gross)}</b></div><div><span>Profit</span><b class="${T.profit < 0 ? 'dn' : 'up'}">${kmoney(T.profit)} · ${pct(T.margin)}</b></div></div></div></div></div>`;
  }
  // ---------- price lab ----------
  function vLab() {
    const p = curPlan(), z = curSize(); const L = S.lab && S.lab.key === p.id + z.size ? S.lab : (S.lab = { key: p.id + z.size, price: z.price, disc: Math.round(z.disc * 100), act: z.act || 0, split: 90, resetP: z.resetP, pass: +(z.pass * 100).toFixed(1) });
    const cur = econ(p, z); const nw = econ(p, z, { price: +L.price, disc: +L.disc / 100, act: +L.act, split: +L.split, resetP: +L.resetP, pass: +L.pass / 100, sold: z.sold * Math.pow(z.price / Math.max(1, +L.price), 0.8) });
    const inp = (k, l, h) => `<div class="fl"><label>${l}</label><input type="number" min="0" step="any" value="${L[k]}" data-bind="lab.${k}">${h ? `<span class="hint">${h}</span>` : ''}</div>`;
    const row = (l, a, b, f, goodUp) => { const d = b - a; const good = goodUp ? d > 0 : d < 0; return `<tr><td><b>${l}</b></td><td class="num">${f(a)}</td><td class="num">${f(b)}</td><td class="num ${Math.abs(d) < 1e-9 ? '' : good ? 'up' : 'dn'}">${Math.abs(d) < 1e-9 ? '—' : (d > 0 ? '+' : '−') + f(Math.abs(d))}</td></tr>`; };
    return `<div class="ph"><div><h1>Price Lab</h1><p>Try a new price, discount, split or fee for one size and see the profit before changing anything. Higher prices sell a little less; the model accounts for that.</p></div><div class="act"><select data-bind="plan" aria-label="Plan">${PLANS.map((x) => `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select><div class="seg">${p.sizes.map((x) => `<button class="${x.size === z.size ? 'on' : ''}" data-act="size" data-k="${x.size}">${K(x.size)}</button>`).join('')}</div></div></div>
      <div class="two wl2"><div class="card m0"><div class="ch"><h3>Try</h3><div class="r"><button class="lnk" data-act="labReset">Back to Current</button></div></div><div class="cb fg"><div class="fg2">${inp('price', 'List Price ($)', `Now ${money(z.price)} · break-even ${money(breakEven(p, z))}`)}${inp('disc', 'Average Discount (%)', `Now ${pct(z.disc)}`)}${inp('split', 'Profit Split (%)', 'Now 90%')}${inp('act', 'Activation Fee ($)', `Now ${money(z.act || 0)}`)}${inp('resetP', 'Reset Price ($)', `Now ${money(z.resetP)}`)}${inp('pass', 'Pass Rate (%)', 'Change it to test stricter or easier rules')}</div></div></div>
      <div class="card m0"><div class="ch"><h3>${esc(p.name)} ${K(z.size)}</h3><span class="lab">${S.range === 365 ? '12 Months' : S.range + ' Days'}</span></div><div class="tsc"><table class="t"><thead><tr><th></th><th class="num">Now</th><th class="num">With Changes</th><th class="num">Difference</th></tr></thead><tbody>${row('Evaluations Sold', cur.sold, nw.sold, (v) => Math.round(v).toLocaleString('en-US'), true)}${row('Revenue', cur.revenue, nw.revenue, kmoney, true)}${row('Payouts', cur.payouts, nw.payouts, kmoney, false)}${row('Costs', cur.costs, nw.costs, kmoney, false)}${row('Profit', cur.profit, nw.profit, kmoney, true)}${row('Margin', cur.margin * 100, nw.margin * 100, (v) => v.toFixed(0) + '%', true)}${row('Profit per Sale', cur.perSold, nw.perSold, money, true)}</tbody></table></div><div class="cb"><span class="b ${health(nw.margin)[1]}">${health(nw.margin)[0]}</span><div class="edact" style="margin-top:12px"><button class="pill sm" data-act="labSend">Send to Checkout Catalog as a Draft</button></div></div></div></div>`;
  }

  // ---------- render ----------
  const toast = (x) => { S.toast = x; render(); clearTimeout(toast.t); toast.t = setTimeout(() => { S.toast = ''; render(); }, 2600); };
  function render() {
    const T = allTotal(); const m = root.querySelector('.main'); const st = m ? m.scrollTop : 0;
    const views = { overview: vOverview, matrix: vMatrix, detail: vDetail, cohorts: vCohorts, addons: vAddons, promos: vPromos, costs: vCosts, lab: vLab };
    root.innerHTML = `<div class="tb"><a class="pill bk" href="Dashboard.dc.html" aria-label="Back to Admin">←<span class="lg"> Back to Admin</span></a><span class="tb-t">Plan Insights</span>
      <div class="tb-mid hm"><div class="tb-stats"><div><span>Revenue</span><b>${kmoney(T.revenue)}</b></div><div><span>Payouts</span><b>${kmoney(T.payouts)}</b></div><div><span>Profit</span><b class="${T.profit < 0 ? 'bad' : 'good'}">${kmoney(T.profit)}</b></div><div><span>Margin</span><b>${pct(T.margin)}</b></div><div><span>Losing Sizes</span><b class="${cells().some((c) => c.e.margin < 0) ? 'bad' : ''}">${cells().filter((c) => c.e.margin < 0).length}</b></div></div></div>
      <span class="envchip hm">${S.range === 365 ? 'Last 12 Months' : 'Last ' + S.range + ' Days'}</span><button class="pill" data-act="export">Export CSV</button></div>
    <div class="body"><div class="mnav"><select id="mnavsel" aria-label="Go to section">${mnavHtml()}</select></div><nav class="nav" aria-label="Insights">${navHtml()}</nav><main class="main">${views[S.view]()}</main></div>${S.toast ? `<div class="toast" role="status">${esc(S.toast)}</div>` : ''}`;
    const m2 = root.querySelector('.main'); if (m2) m2.scrollTop = st;
  }
  root.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]'); if (!el || !root.contains(el)) return;
    const a = el.dataset.act, k = el.dataset.k, id = el.dataset.id;
    switch (a) {
      case 'go': S.view = el.dataset.v; break;
      case 'range': S.range = +k; break;
      case 'metric': S.metric = k; break;
      case 'openPlan': S.plan = id; S.size = PLANS.find((p) => p.id === id).sizes[0].size; S.view = 'detail'; break;
      case 'openCell': S.plan = id; S.size = +k; S.view = 'detail'; { const m = root.querySelector('.main'); if (m) m.scrollTop = 0; } break;
      case 'toLab': S.plan = id; S.size = +k; S.view = 'lab'; break;
      case 'size': S.size = +k; break;
      case 'labReset': S.lab = null; break;
      case 'labSend': { const p = curPlan(), z = curSize(); toast(`Draft price for ${p.name} ${K(z.size)} sent to the Checkout Catalog. It needs approval there.`); return; }
      case 'costReset': Object.assign(COST, { proc: 4.2, procFix: 0.3, platEval: 7, platFunded: 85, data: 3.5, kyc: 1.9, affShare: 34, affRate: 15, cbFee: 25 }); toast('Costs reset'); return;
      case 'export': toast('Exported plan and size numbers as CSV'); return;
      default: return;
    }
    render();
  });
  root.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.id === 'mnavsel') { S.view = el.value; render(); const m = root.querySelector('.main'); if (m) m.scrollTop = 0; return; }
    const b = el.dataset.bind; if (!b) return;
    if (b === 'plan') { S.plan = el.value; S.size = curPlan().sizes.some((z) => z.size === S.size) ? S.size : curPlan().sizes[0].size; }
    else if (b.startsWith('cost.')) COST[b.slice(5)] = +el.value || 0;
    else if (b.startsWith('lab.')) S.lab[b.slice(4)] = el.value;
    render();
  });

  render();
