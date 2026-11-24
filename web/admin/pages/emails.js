
function startEmails(root) {

  // ===== shared visuals (VZ) =====
  const VZ = (() => {
    const E = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const W = ["x.b.1.k.d.5.q.3.w", "o.2.b.4.4.j.e.1.y.1.u", "r.2.3.8.9.f.u.2.b.a.a.3.1.1.c", "m.2.1.3.1.1.1.2.1.1.1.4.a.d.u.1.6.1.3.k.4.2.e", "7.8.a.7.2.1.3.2.1.4.5.d.h.4.f.2.1.y.4.1.3", "0.2.4.m.1.a.2.1.1.3.5.8.j.a.3.a.1.16", "2.1.2.w.1.1.2.4.6.5.7.3.a.4.2.4.2.1k", "6.t.3.1.5.1.7.3.j.5.1.1l.1.6", "5.8.2.j.7.3.u.5.2.1.2.1e.3.2.5", "9.2.8.g.6.6.n.1.6.2.3.1a.7.2.7", "6.1.d.j.2.8.l.1.4.1.4.1a.8.3.7", "l.i.2.9.i.1.1.3.1.1j.5.1.9", "l.o.4.1.m.1k.1.1.e", "m.o.4.1.k.1l.g", "m.n.1.1.o.6.1.6.1.1.1.4.2.y.h", "m.m.o.5.2.3.1.4.6.2.2.v.4.1.f", "m.k.q.4.3.1.2.1.1.2.1.9.1.r.1.2.5.1.f", "n.i.r.4.5.1.5.9.2.r.2.1.3.1.g", "o.i.r.7.9.z.5.3.g", "p.f.s.a.2.1.5.y.4.1.j", "r.9.2.1.t.n.1.t.n", "q.1.1.5.6.1.r.i.1.6.1.r.o", "r.1.1.4.x.k.1.6.1.1.4.m.n", "u.3.5.2.p.m.1.8.4.8.1.9.q", "u.3.3.1.4.1.n.m.1.7.6.5.3.5.u", "v.6.t.l.2.5.7.4.5.5.5.1.n", "z.4.q.n.1.3.a.2.7.5.4.1.n", "11.2.q.o.d.2.7.1.1.3.4.1.n", "12.1.3.1.1.3.j.q.a.2.7.1.2.1.4.1.o", "15.8.i.p.c.1.h.1.l", "15.a.h.2.1.1.2.h.j.1.1.1.5.2.o", "15.b.o.e.l.1.1.1.3.2.p", "14.c.o.d.n.2.2.3.p", "14.f.l.c.o.2.2.3.1.1.4.3.g", "13.i.k.b.13.3.e", "14.i.j.b.r.2.a.4.d", "15.h.j.b.x.1.9.1.c", "15.g.k.b.10.3.h", "16.e.l.b.3.1.u.4.3.1.e", "17.d.l.a.3.2.t.9.e", "18.c.l.9.4.1.t.b.d", "18.b.n.8.3.2.q.f.c", "18.9.p.8.4.1.q.g.b", "18.9.p.7.x.f.b", "17.9.r.5.y.f.b", "17.8.s.4.z.4.4.7.b", "17.6.26.5.c", "17.6.27.4.c", "17.4.2n.1.1", "16.5.2b.1.9.1.3", "16.4.2l.1.4", "16.4.2q", "16.3.2r", "16.2.2s", "18.2.2q"]; const ST = 2.5; const L0 = 80; const COLS = 144;
    let DOTS = null;
    const dots = () => { if (DOTS) return DOTS; const out = []; W.forEach((row, y) => { let x = 0, land = false; row.split('.').forEach((r) => { const n = parseInt(r, 36); if (land) for (let k = 0; k < n; k++) out.push([x + k, y]); x += n; land = !land; }); }); return (DOTS = out); };
    const CC = { 'United States': [39, -98], 'United Kingdom': [53, -1.5], India: [21, 78], Mexico: [23, -102], Nigeria: [9, 8], Japan: [36.5, 138], Spain: [40, -3.7], Canada: [56, -106], Australia: [-25, 134], Germany: [51, 10], UAE: [24, 54], Singapore: [1.35, 103.8], Brazil: [-10, -52], 'South Korea': [36, 128], Poland: [52, 19], Argentina: [-34, -64], Kenya: [0, 38], Netherlands: [52.2, 5.3], Philippines: [12, 122], Italy: [42.8, 12.5], Ireland: [53.3, -8], Turkey: [39, 35], Sweden: [62, 15], Chile: [-33, -71], France: [46.5, 2.5], Czechia: [49.8, 15.5], Portugal: [39.5, -8], Ghana: [7.9, -1], Norway: [61, 9], Colombia: [4.6, -74], Cyprus: [35, 33], 'South Africa': [-29, 24], Egypt: [27, 30], Vietnam: [16, 107], Indonesia: [-2, 118], Thailand: [15, 101], Pakistan: [30, 70], Russia: [58, 60], China: [35, 104], Morocco: [32, -6], Peru: [-9, -75], 'New Zealand': [-41, 174], Switzerland: [46.8, 8.2], Romania: [45.9, 25], Ukraine: [49, 32], Israel: [31.5, 34.9], 'Saudi Arabia': [24, 45], Malaysia: [3.5, 102], 'Hong Kong': [22.3, 114.2] };
    const XY = (lat, lon) => [((lon + 180) / ST) * 10, ((L0 - lat) / ST) * 10];
    // points: [{n, v, lab, c (optional color var), lat, lon}]  opt: {h, live, arcs:[[from,to]], act, legend}
    function map(points, opt = {}) {
      const w = COLS * 10, h = W.length * 10; const mx = Math.max(1, ...points.map((p) => p.v));
      const pts = points.map((p) => { const ll = p.lat != null ? [p.lat, p.lon] : CC[p.n]; if (!ll) return ''; const [x, y] = XY(ll[0], ll[1]); const r = 6 + Math.sqrt(p.v / mx) * 26; const col = p.c || 'var(--sky)';
        return `<g class="vzpt${opt.live ? ' live' : ''}"${opt.act ? ` data-act="${opt.act}" data-k="${E(p.n)}"` : ''} style="--c:${col}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 1.9).toFixed(1)}" class="halo"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" class="core"/><title>${E(p.n)}: ${E(p.lab != null ? p.lab : p.v)}</title></g>`; }).join('');
      const arcs = (opt.arcs || []).map(([a, b2]) => { const A = CC[a], B = CC[b2]; if (!A || !B) return ''; const [x1, y1] = XY(A[0], A[1]); const [x2, y2] = XY(B[0], B[1]); const mxp = (x1 + x2) / 2, myp = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.25 - 20; return `<path class="vzarc" d="M${x1.toFixed(0)},${y1.toFixed(0)} Q${mxp.toFixed(0)},${myp.toFixed(0)} ${x2.toFixed(0)},${y2.toFixed(0)}"/>`; }).join('');
            return `<div class="vzmap"${opt.mw ? ` style="max-width:${opt.mw}px;margin:0 auto"` : ''}><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${E(opt.label || 'World map')}">${arcs}${pts}</svg></div>`;
    }
    // sparkline
    function spark(v, opt = {}) { const w = opt.w || 120, h = opt.h || 32; const mn = Math.min(...v), mx = Math.max(...v), d = mx - mn || 1; const P = v.map((y, i) => [(i / (v.length - 1)) * w, h - 3 - ((y - mn) / d) * (h - 6)]);
      const line = P.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(''); const col = opt.c || 'var(--sky)';
      return `<svg class="vzsp" viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${line}L${w},${h}L0,${h}Z" fill="${col}" opacity=".12"/><path d="${line}" fill="none" stroke="${col}" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`; }
    // heatmap: rows [label], cols [label], m[r][c], fmt
    function heat(rows, cols, m, fmt, opt = {}) { const mx = Math.max(1, ...m.flat()); const col = opt.c || '124,196,255';
      return `<div class="vzhw"><div class="vzheat${opt.cls ? ' ' + opt.cls : ''}" style="grid-template-columns:${opt.lw || 44}px repeat(${cols.length},minmax(0,1fr))"><span></span>${cols.map((c, i) => `<span class="ch">${opt.skip && i % opt.skip ? '' : E(c)}</span>`).join('')}${rows.map((r, i) => `<span class="rh">${E(r)}</span>${m[i].map((v, j) => `<i style="background:rgba(${col},${(0.06 + 0.94 * (v / mx)).toFixed(2)});color:${v / mx > 0.45 ? '#08080A' : 'var(--t2)'}" title="${E(r)} · ${E(cols[j])}: ${fmt(v)}">${opt.show ? fmt(v) : ''}</i>`).join('')}`).join('')}</div></div>`; }
    // gauge (semicircle) p 0..100
    function gauge(p, big, small, opt = {}) { const R = 52, C = Math.PI * R; const col = opt.c || (p >= (opt.bad || 80) ? 'var(--no)' : p >= (opt.warn || 60) ? 'var(--wa)' : 'var(--sky)');
      return `<div class="vzg"><svg viewBox="0 0 124 70" aria-hidden="true"><path d="M10,64 A52,52 0 0 1 114,64" class="trk"/><path d="M10,64 A52,52 0 0 1 114,64" stroke="${col}" stroke-dasharray="${(C * Math.min(100, p) / 100).toFixed(1)} ${C.toFixed(1)}" class="val"/></svg><b>${big}</b><span>${small || ''}</span></div>`; }
    // ring p 0..100
    function ring(p, big, small, opt = {}) { const R = 40, C = 2 * Math.PI * R; const col = opt.c || 'var(--sky)'; const s = opt.s || 104;
      return `<div class="vzr${s < 80 ? ' sm' : ''}" style="width:${s}px;height:${s}px"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="${R}" class="trk"/><circle cx="50" cy="50" r="${R}" class="val" stroke="${col}" stroke-dasharray="${(C * Math.min(100, p) / 100).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 50 50)"/></svg><div><b>${big}</b>${small ? `<span>${small}</span>` : ''}</div></div>`; }
    // flow (sankey). nodes: [{id, n, col, v(optional), c}], links [{s,t,v}]
    function flow(nodes, links, fmt, opt = {}) { const Wd = 1000, H = opt.h || 300, NW = 12, GAP = opt.gap || 22; const cols = Math.max(...nodes.map((n) => n.col)) + 1; const pw = opt.pow || 1; const sc = (x) => Math.pow(x, pw);
      nodes.forEach((n) => { n._in = links.filter((l) => l.t === n.id).reduce((a, l) => a + l.v, 0); n._out = links.filter((l) => l.s === n.id).reduce((a, l) => a + l.v, 0); n._v = n.v || Math.max(n._in, n._out); });
      const tot = Math.max(...Array.from({ length: cols }, (_, c) => nodes.filter((n) => n.col === c).reduce((a, n) => a + sc(n._v), 0)));
      const maxN = Math.max(...Array.from({ length: cols }, (_, c) => nodes.filter((n) => n.col === c).length)); const k = (H - 20 - GAP * (maxN - 1)) / tot;
      for (let c = 0; c < cols; c++) { let y = 10; nodes.filter((n) => n.col === c).forEach((n) => { n._x = 6 + c * ((Wd - NW - 12) / (cols - 1)); n._y = y; n._h = Math.max(3, sc(n._v) * k); n._so = 0; n._to = 0; y += n._h + GAP; }); }
      const N = Object.fromEntries(nodes.map((n) => [n.id, n]));
      const lp = links.map((l) => { const a = N[l.s], b2 = N[l.t]; const h1 = a._h * l.v / (a._out || 1), h2 = b2._h * l.v / (b2._in || 1); const x1 = a._x + NW, x2 = b2._x, ya = a._y + a._so, yb = b2._y + b2._to; a._so += h1; b2._to += h2; const mx2 = (x1 + x2) / 2;
        return `<path class="vzfl${l.c ? ' ' + l.c : ''}" d="M${x1},${ya.toFixed(1)} C${mx2},${ya.toFixed(1)} ${mx2},${yb.toFixed(1)} ${x2},${yb.toFixed(1)} L${x2},${(yb + h2).toFixed(1)} C${mx2},${(yb + h2).toFixed(1)} ${mx2},${(ya + h1).toFixed(1)} ${x1},${(ya + h1).toFixed(1)} Z"><title>${E(a.n)} → ${E(b2.n)}: ${fmt(l.v)}</title></path>`; }).join('');
      const np = nodes.map((n) => `<rect class="vzfn ${n.c || ''}" x="${n._x}" y="${n._y.toFixed(1)}" width="${NW}" height="${n._h.toFixed(1)}" rx="2"/>`).join('');
      const lab = nodes.map((n) => { const last = n.col === cols - 1; const lx = (last ? n._x - 8 : n._x + NW + 8) / Wd * 100; return `<div class="vzfll ${last ? 'r' : ''}" style="left:${lx.toFixed(2)}%;top:${((n._y + n._h / 2) / H * 100).toFixed(2)}%"><span>${E(n.n)}</span><b>${fmt(n._v)}</b></div>`; }).join('');
      return `<div class="vzflow" style="height:${H}px"><svg viewBox="0 0 ${Wd} ${H}" preserveAspectRatio="none" role="img" aria-label="${E(opt.label || 'Flow')}">${lp}${np}</svg>${lab}</div>`; }
    // funnel steps [[label, value]]
    function funnel(steps, fmt) { const mx = steps[0][1] || 1;
      return `<div class="vzfun">${steps.map(([l, v], i) => `<div class="st"><div class="lb"><span>${E(l)}</span><b>${fmt(v)}</b></div><div class="bar"><i style="width:${(v / mx * 100).toFixed(1)}%"></i></div>${i ? `<em>${(v / steps[i - 1][1] * 100).toFixed(1)}% of previous</em>` : '<em>Start</em>'}</div>`).join('')}</div>`; }
    // network graph. nodes [{id, n, t:'trader'|'device'|'ip'|'card'|'addr', flag}], edges [[a,b]]
    const LAY = {};
    function graph(key, nodes, edges, opt = {}) { const Wd = opt.w || 980, H = opt.h || 420;
      if (!LAY[key]) { let s = 7; const R = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; const P = {}; nodes.forEach((n) => { P[n.id] = [Wd / 2 + (R() - 0.5) * Wd * 0.6, H / 2 + (R() - 0.5) * H * 0.6]; });
        for (let it = 0; it < 320; it++) { const F = {}; nodes.forEach((n) => { F[n.id] = [0, 0]; });
          for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) { const a = P[nodes[i].id], b2 = P[nodes[j].id]; let dx = a[0] - b2[0], dy = a[1] - b2[1]; const d2 = Math.max(80, dx * dx + dy * dy); const f = 5200 / d2; const d = Math.sqrt(d2); F[nodes[i].id][0] += dx / d * f; F[nodes[i].id][1] += dy / d * f; F[nodes[j].id][0] -= dx / d * f; F[nodes[j].id][1] -= dy / d * f; }
          edges.forEach(([u, v]) => { const a = P[u], b2 = P[v]; const dx = b2[0] - a[0], dy = b2[1] - a[1]; const d = Math.sqrt(dx * dx + dy * dy) || 1; const f = (d - 74) * 0.05; F[u][0] += dx / d * f; F[u][1] += dy / d * f; F[v][0] -= dx / d * f; F[v][1] -= dy / d * f; });
          nodes.forEach((n) => { const p = P[n.id]; const t = 1 - it / 340; p[0] += Math.max(-12, Math.min(12, F[n.id][0] + (Wd / 2 - p[0]) * 0.0025)) * t; p[1] += Math.max(-12, Math.min(12, F[n.id][1] + (H / 2 - p[1]) * 0.006)) * t; p[0] = Math.max(70, Math.min(Wd - 70, p[0])); p[1] = Math.max(34, Math.min(H - 34, p[1])); }); }
        LAY[key] = P; }
      const P = LAY[key]; const sel = opt.sel;
      const ed = edges.map(([u, v]) => `<line x1="${P[u][0].toFixed(0)}" y1="${P[u][1].toFixed(0)}" x2="${P[v][0].toFixed(0)}" y2="${P[v][1].toFixed(0)}" class="${sel && (u === sel || v === sel) ? 'hot' : ''}"/>`).join('');
      const nd = nodes.map((n) => { const [x, y] = P[n.id]; const tr = n.t === 'trader'; const cls = `vzgn ${n.t}${n.flag ? ' ' + n.flag : ''}${sel === n.id ? ' sel' : ''}`;
        return `<g class="${cls}"${opt.act ? ` data-act="${opt.act}" data-id="${E(n.id)}"` : ''} transform="translate(${x.toFixed(0)},${y.toFixed(0)})">${tr ? '<circle r="13"/>' : '<rect x="-7" y="-7" width="14" height="14" rx="3"/>'}<text y="${tr ? 28 : -13}">${E(n.n)}</text><title>${E(n.n)}</title></g>`; }).join('');
      return `<div class="vzgraph"><svg viewBox="0 0 ${Wd} ${H}" role="img" aria-label="${E(opt.label || 'Network')}">${ed}${nd}</svg></div>`; }
    // bubble chart: items [{n, x, y, v, c}], axes labels
    function bubbles(items, xl, yl, fx, fy, opt = {}) { const H = opt.h || 260; const xs = items.map((i) => i.x), ys = items.map((i) => i.y); const x0 = Math.min(0, ...xs), x1 = Math.max(...xs) * 1.15, y0 = Math.min(0, ...ys) * 1.4, y1 = Math.max(...ys) * 1.3; const mv = Math.max(...items.map((i) => i.v));
      return `<div class="vzbub" style="height:${H}px"><div class="ar">${y0 < 0 ? `<div class="zero" style="top:${(y1 / (y1 - y0) * 100).toFixed(1)}%"></div>` : ''}${items.map((i) => { const s = 18 + Math.sqrt(i.v / mv) * 54; return `<div class="bb ${i.c || ''}" style="left:${((i.x - x0) / (x1 - x0) * 100).toFixed(1)}%;top:${((y1 - i.y) / (y1 - y0) * 100).toFixed(1)}%;width:${s.toFixed(0)}px;height:${s.toFixed(0)}px" title="${E(i.n)}: ${fx(i.x)} · ${fy(i.y)}"><span>${E(i.n)}</span></div>`; }).join('')}${[y1, 0, y0].filter((t, i) => i !== 2 || y0 < 0).map((t) => `<span class="yt" style="top:${((y1 - t) / (y1 - y0) * 100).toFixed(1)}%">${fy(t)}</span>`).join('')}${[0, 0.5, 1].map((f) => `<span class="xt" style="left:${(f * 100).toFixed(0)}%">${fx(x0 + (x1 - x0) * f)}</span>`).join('')}</div><div class="xl">${E(xl)}</div><div class="yl">${E(yl)}</div></div>`; }
    return { map, spark, heat, gauge, ring, flow, funnel, graph, bubbles, CC };
  })();
  // ---------- senders ----------
  const SENDERS = {
    hello: ['Funded Sky', 'hello@fundedsky.com'],
    security: ['Funded Sky Security', 'security@fundedsky.com'],
    billing: ['Funded Sky Billing', 'billing@fundedsky.com'],
    risk: ['Funded Sky Risk', 'risk@fundedsky.com'],
    payouts: ['Funded Sky Payouts', 'payouts@fundedsky.com'],
    support: ['Funded Sky Support', 'support@fundedsky.com'],
    partners: ['Funded Sky Partners', 'partners@fundedsky.com']
  };
  const SAMPLE = { first_name: 'Jane', account: 'FS-50K-10432', plan: '[Plan B Name]', size: '$50K', platform: 'Tradovate', code: '482913' };
  const MERGE = [['{first_name}', 'First name'], ['{account}', 'Account number'], ['{plan}', 'Plan name'], ['{size}', 'Account size'], ['{platform}', 'Platform'], ['{code}', 'One-time code']];

  // ---------- every email ----------
  // n name · w when it sends · req always on (can't be switched off) · mk marketing (needs consent, has unsubscribe)
  // fr sender · s subject · p preview text · e eyebrow · h headline · a highlighted words · b body · r detail rows
  // c code · st steps · al alert [tone, text] · pg progress [label, value, max, caption] · cta button · n2 small print · sent last 30 days
  const E = {
    // Sign-up and welcome
    confirm: { n: 'Confirm Your Email', w: 'Right after sign-up, with a 6-digit code.', req: 1, fr: 'security', s: 'Your Funded Sky code: {code}', p: 'Enter it to finish creating your account.', e: 'Confirm Your Email', h: "Here's your code,", a: '{first_name}.', b: ["Enter this code on the sign-up screen to confirm it's really you. It works for 10 minutes."], c: '{code}', n2: "Didn't sign up? Ignore this email. No account is created without the code.", sent: 1420 },
    welcome: { n: 'Welcome to Funded Sky', w: 'Once, when a new trader confirms their email.', fr: 'hello', s: 'Welcome to Funded Sky, {first_name}', p: 'Three things worth doing before your first evaluation.', e: "You're In", h: 'Welcome, {first_name}.', a: 'Your account is ready.', b: ['Funded Sky gives you a simulated futures account with clear rules. Pass the evaluation, trade a funded account, and keep up to 90% of the profit.'], st: [['Pick an evaluation', 'Choose the plan and account size that fit how you trade.'], ['Read the rules', 'Profit target, daily loss limit and drawdown, in plain words, on every plan.'], ['Choose your platform', 'Tradovate, NinjaTrader, TradingView or Rithmic. Logins arrive by email.']], cta: 'Choose an Evaluation', sent: 1310 },
    firstbuy: { n: 'Pick Your First Evaluation', w: "2 days after sign-up, if they haven't bought.", mk: 1, fr: 'hello', s: 'Still deciding, {first_name}?', p: 'A simple way to pick the right account size.', e: 'Choosing an Account', h: 'Not sure which size?', a: 'Start with the rules.', b: ["Bigger accounts have bigger targets and more room on drawdown. Most traders pick the size where the daily loss limit matches what they'd risk on a bad day."], r: [['$25K', 'Target $1,500 · Drawdown $1,500'], ['$50K', 'Target $3,000 · Drawdown $2,500'], ['$100K', 'Target $6,000 · Drawdown $3,000']], cta: 'Compare Plans', n2: 'Rule amounts are examples until the real plan rules are set.', sent: 640 },

    // Checkout and orders
    order: { n: 'Order Confirmed', w: 'Right after a payment succeeds.', req: 1, fr: 'billing', s: 'Order confirmed: {plan} {size}', p: 'Your receipt, and what happens next.', e: 'Receipt', h: 'Thanks, {first_name}.', a: 'Your order is confirmed.', b: ['Your evaluation account is being created now. Login details arrive in a separate email, usually within a minute.'], r: [['Order', 'FS-ORD-2291'], ['Plan', '{plan} {size}'], ['Platform', '{platform}'], ['Add-Ons', 'Daily Payouts'], ['Discount', 'AFF10 · −$25.90'], ['Total Paid', '$233.10'], ['Paid With', 'Visa ending 4242']], cta: 'View Order', sent: 690 },
    ready: { n: 'Your Evaluation Is Ready', w: 'When the trading account is created.', req: 1, fr: 'hello', s: 'Your {size} evaluation is ready to trade', p: 'Your {platform} login is inside.', e: 'Account Ready', h: 'Your account is live.', a: 'Time to trade.', b: ['Log in to {platform} with the details below. Your rules are on your dashboard and stay the same until you pass.'], r: [['Account', '{account}'], ['Platform', '{platform}'], ['Username', 'FS10432'], ['Password', 'Set on first login'], ['Server', '[Platform Server]']], cta: 'Open My Dashboard', n2: 'Never share your platform password. Funded Sky will never ask for it.', sent: 688 },
    firstday: { n: 'Your First Trading Day', w: '1 day after the account is ready.', fr: 'hello', s: 'Before your first trade, {first_name}', p: 'The three rules traders break most in week one.', e: 'Day One', h: 'Most first-week breaches', a: 'come from three things.', st: [['The daily loss limit counts open trades', 'A losing open position can break the limit before you close it.'], ['Drawdown follows your best balance', 'It moves up with your end-of-day high and never moves down.'], ['News minutes are restricted', 'No new trades 2 minutes before or after high-impact releases.']], cta: 'See My Rules', sent: 640 },
    payfail: { n: "Payment Didn't Go Through", w: 'When a card payment fails at checkout.', req: 1, fr: 'billing', s: "Your payment didn't go through", p: 'Nothing was charged. Your cart is saved.', e: 'Payment Problem', h: "Your payment didn't go through.", a: 'Nothing was charged.', b: ['Your bank declined the payment. This usually means the card blocks international or online payments. Try another card, or pay with crypto.'], r: [['Reason', 'Declined by bank'], ['Cart', '{plan} {size}'], ['Amount', '$259.00']], cta: 'Try Again', sent: 212 },
    refund: { n: 'Refund on Its Way', w: 'When a refund is issued.', req: 1, fr: 'billing', s: 'Your refund of $149.00 is on its way', p: 'It usually shows up in 5 to 10 business days.', e: 'Refund', h: 'Your refund', a: 'is on its way.', b: ['We sent the refund to the card you paid with. Banks usually show it within 5 to 10 business days. The evaluation account on this order is closed.'], r: [['Amount', '$149.00'], ['Order', 'FS-ORD-2214'], ['Refunded To', 'Visa ending 4242']], cta: 'View Order', sent: 7 },

    // Unfinished checkout
    abandon1: { n: 'Your Account Is Still Waiting', w: '2 hours after leaving checkout, if still unpaid.', mk: 1, fr: 'hello', s: 'Your {size} account is still waiting', p: 'Use your code for 10% off in the next 48 hours.', e: 'Still Deciding?', h: 'You left {plan} {size}', a: 'in your cart.', b: ['Use code BACK-7KQ2 for 10% off. It works once, for you only, for the next 48 hours.'], r: [['Plan', '{plan} {size}'], ['Platform', '{platform}'], ['Price With Code', '$233.10']], cta: 'Finish Checkout', sent: 214 },
    abandon2: { n: 'Last Chance: Code Ends Tonight', w: '1 day later, if still unpaid.', mk: 1, fr: 'hello', s: 'Your 10% code ends tonight', p: 'BACK-7KQ2 stops working at midnight.', e: 'Ends Tonight', h: 'Your code ends', a: 'at midnight.', b: ["After tonight, BACK-7KQ2 stops working and the price goes back to $259. Your cart is saved exactly as you left it."], cta: 'Finish Checkout', sent: 160 },

    // Evaluation progress
    halfway: { n: 'Halfway to Your Target', w: 'When profit reaches 50% of the target.', fr: 'hello', s: "You're halfway to your target", p: '$1,500 of $3,000, and inside every rule.', e: 'Progress', h: 'Halfway there,', a: '{first_name}.', pg: ['Profit Target', 1500, 3000, '$1,500 of $3,000'], b: ["Halfway is where many traders size up and give it back. Your daily loss limit and drawdown haven't changed."], cta: 'View My Account', sent: 180 },
    target: { n: 'Target Reached', w: 'When the target is hit before the minimum trading days.', fr: 'hello', s: 'Target hit. 2 more trading days to go.', p: 'Trade on 2 more days to pass.', e: 'Target Reached', h: 'You hit the target.', a: 'Two more days.', b: ['You need at least 5 trading days to pass. Place at least one trade on each remaining day, and stay inside the rules.'], pg: ['Trading Days', 3, 5, '3 of 5 days'], cta: 'View My Account', sent: 96 },
    dailywarn: { n: 'Close to Your Daily Loss Limit', w: "When today's loss reaches 80% of the limit.", req: 1, fr: 'risk', s: "You're at 80% of today's loss limit", p: 'Another $220 loss ends the evaluation.', e: 'Risk Alert', h: "You're close to today's", a: 'loss limit.', al: ['warn', 'Today: −$880 of the $1,100 limit. Another $220 loss, open or closed, ends the evaluation.'], b: ['The daily limit resets at 5:00 PM ET.'], cta: 'View My Positions', sent: 420 },
    ddwarn: { n: 'Close to Your Max Drawdown', w: 'When the balance is within 20% of the drawdown floor.', req: 1, fr: 'risk', s: 'You are $500 from your drawdown floor', p: 'Below $47,500 the evaluation ends.', e: 'Risk Alert', h: "You're close to", a: 'your max drawdown.', al: ['warn', 'Balance $48,000. The account closes if it falls below $47,500, including open trades.'], b: ['The floor follows your highest end-of-day balance. It never moves down.'], cta: 'View My Positions', sent: 230 },
    consistency: { n: 'Consistency Rule Check', w: 'When one day is over 40% of total profit.', fr: 'risk', s: 'One day is carrying most of your profit', p: 'Spread profit over more days before a payout.', e: 'Payout Rule', h: 'One day is carrying', a: 'most of your profit.', pg: ['Best Day Share', 52, 100, '52% now · 40% or less needed'], b: ["When you request a payout, no single day can be more than 40% of total profit. Spreading profit over more days fixes it."], cta: 'See the Rule', sent: 70 },
    inactive1: { n: "We Haven't Seen You Trade", w: 'After 21 days with no trades.', fr: 'hello', s: 'Your account closes after 30 days without a trade', p: 'One trade keeps it open.', e: 'Inactive Account', h: 'Your account has been quiet', a: 'for 21 days.', b: ['Accounts close after 30 days without a trade. Place one trade in the next 9 days to keep it open.'], cta: 'Open My Dashboard', sent: 55 },
    inactive2: { n: 'Account Closing for Inactivity', w: '7 days later, if still no trades.', req: 1, fr: 'risk', s: '{account} closes in 2 days', p: 'One trade before Nov 24 keeps it open.', e: 'Inactive Account', h: 'Your account closes', a: 'in 2 days.', al: ['warn', 'No trades for 28 days. The account closes on Nov 24 unless a trade is placed.'], cta: 'Open My Dashboard', sent: 30 },

    // Breaches and resets
    breach: { n: 'Your Account Was Closed', w: 'When an evaluation rule is broken.', req: 1, fr: 'risk', s: 'Your {size} evaluation has ended', p: 'What happened, and your options.', e: 'Account Closed', h: 'Your evaluation', a: 'has ended.', b: ['The account went below the max drawdown floor. No more trades can be placed on it. Your trade history stays on your dashboard.'], r: [['Account', '{account}'], ['Rule', 'Max Drawdown'], ['Floor', '$47,500'], ['Balance', '$47,412'], ['Time', 'Nov 21, 11:42 AM ET']], cta: 'Reset This Account', n2: "Think it's a mistake? Reply within 7 days and we'll review the trades.", sent: 260 },
    resetoffer: { n: 'Reset at 50% Off', w: "1 day after a breach, if they haven't reset or bought.", mk: 1, fr: 'hello', s: 'Reset {account} for half price', p: 'Same account, fresh balance, 50% off for 7 days.', e: 'Try Again', h: 'Start again', a: 'for half the price.', b: ['Reset your account to a fresh balance with the same rules. The 50% discount applies automatically for 7 days.'], r: [['Reset Price', '$93.00 → $46.50'], ['Ends', 'Nov 29, 2026']], cta: 'Reset for $46.50', sent: 190 },
    winback: { n: 'Ready for Another Shot?', w: '30 days after a breach, if still no purchase.', mk: 1, fr: 'hello', s: 'Ready for another shot, {first_name}?', p: 'What traders who pass on their second try do differently.', e: 'Another Shot', h: 'Second tries', a: 'pass more often.', b: ['Traders who come back usually trade fewer contracts and stop for the day earlier. Your old dashboard shows where your last account ended.'], cta: 'Choose an Evaluation', sent: 120 },
    resetdone: { n: 'Your Account Is Reset', w: 'When a reset is purchased.', req: 1, fr: 'billing', s: '{account} is reset and ready', p: 'Fresh balance, same rules.', e: 'Reset Complete', h: 'Fresh balance.', a: 'Same rules.', b: ['Your account is back to its starting balance. Trading days start again from zero.'], r: [['Account', '{account}'], ['Balance', '$50,000'], ['Paid', '$46.50']], cta: 'Open My Dashboard', sent: 88 },

    // Passing and funded
    passed: { n: 'You Passed', w: 'When every evaluation rule is met.', req: 1, fr: 'hello', s: 'You passed the {size} evaluation', p: 'Three steps to your funded account.', e: 'Evaluation Passed', h: 'You passed,', a: '{first_name}.', b: ['Three steps to your funded account. Most traders finish them in a day.'], st: [['Verify your identity', 'A passport or ID and a quick selfie. About 3 minutes.'], ['Sign the funded agreement', 'Payout terms and funded rules, in plain words.'], ['Pay the activation fee', 'Only if your plan has one. Then your funded account goes live.']], cta: 'Start Verification', sent: 41 },
    kyc: { n: 'Verify Your Identity', w: "When a passed trader hasn't verified yet.", req: 1, fr: 'security', s: 'One step left: verify your identity', p: 'A photo ID and a selfie. About 3 minutes.', e: 'Identity Check', h: 'Verify your identity', a: 'to get funded.', b: ["We're required to check who we pay. You'll need a passport, ID card or driver's license, and a phone camera."], cta: 'Verify Now', n2: 'Checks are run by our identity partner. We never see your full document number.', sent: 41 },
    kycok: { n: 'Identity Verified', w: 'When the identity check passes.', req: 1, fr: 'security', s: "You're verified, {first_name}", p: 'Next: sign your funded agreement.', e: 'Identity Check', h: "You're verified.", a: 'One more step.', b: ['Your identity check passed. Next, sign your funded agreement.'], cta: 'Sign the Agreement', sent: 37 },
    kycmore: { n: 'We Need One More Document', w: 'When the identity check needs more information.', req: 1, fr: 'security', s: 'We need one more document', p: 'Your photo was hard to read.', e: 'Identity Check', h: 'We need', a: 'one more photo.', al: ['warn', 'The photo of your ID was blurry. Retake it in good light, with all four corners showing.'], cta: 'Upload Again', sent: 6 },
    kycno: { n: "We Couldn't Verify Your Identity", w: 'When the identity check is rejected.', req: 1, fr: 'security', s: "We couldn't verify your identity", p: 'What this means, and how to appeal.', e: 'Identity Check', h: "We couldn't verify", a: 'your identity.', al: ['bad', "The document didn't match the name on your account. Funded accounts can't be opened without a matching ID."], b: ['If you think this is wrong, reply to this email within 14 days.'], sent: 2 },
    agreement: { n: 'Sign Your Funded Agreement', w: 'After the identity check passes.', req: 1, fr: 'hello', s: 'Your funded agreement is ready to sign', p: 'Payout terms and funded rules, in plain words.', e: 'Agreement', h: 'Your agreement', a: 'is ready.', b: ['It covers your profit split, payout schedule and the rules on the funded account. It takes about 5 minutes to read.'], r: [['Profit Split', '90%'], ['First Payout', 'After 5 trading days'], ['Version', 'Funded Agreement v2']], cta: 'Read and Sign', sent: 37 },
    actfee: { n: 'Activation Fee Due', w: 'After signing, on plans with an activation fee.', req: 1, fr: 'billing', s: 'Activate your funded account', p: 'One payment, then you trade.', e: 'Activation', h: 'Pay the activation fee', a: 'and start trading.', r: [['Plan', '{plan} {size}'], ['Activation Fee', '$99.00']], b: ['Plans with the No Activation Fee add-on skip this step.'], cta: 'Pay $99.00', sent: 30 },
    funded: { n: 'Your Funded Account Is Live', w: 'When the funded account is created.', req: 1, fr: 'hello', s: 'Your funded account is live', p: 'Your login, and when your first payout can happen.', e: 'Funded', h: "You're funded,", a: '{first_name}.', b: ['Your funded account is ready on {platform}. Profit you make is paid out at your split.'], r: [['Account', 'FS-F-50K-2207'], ['Platform', '{platform}'], ['Username', 'FSF2207'], ['Profit Split', '90%']], cta: 'Open My Dashboard', sent: 34 },
    certificate: { n: 'Your Funded Certificate', w: '1 day after the funded account goes live.', mk: 1, fr: 'hello', s: 'Your Funded Sky certificate', p: 'A certificate with your name on it, ready to share.', e: 'Certificate', h: 'You earned this.', a: 'Share it.', b: ['Your certificate shows your name, account size and the date you passed. Download it or share it straight to X or LinkedIn.'], cta: 'Get My Certificate', sent: 30 },
    fbreach: { n: 'Your Funded Account Was Closed', w: 'When a funded account rule is broken.', req: 1, fr: 'risk', s: 'Your funded account has been closed', p: 'What happened, and what happens to your profit.', e: 'Account Closed', h: 'Your funded account', a: 'has been closed.', b: ['The account broke the daily loss limit. Profit from before the breach that met the payout rules can still be requested for 30 days.'], r: [['Account', 'FS-F-50K-2207'], ['Rule', 'Daily Loss Limit'], ['Time', 'Nov 20, 2:14 PM ET']], cta: 'View My Account', sent: 6 },

    // Payouts
    eligible: { n: 'You Can Request a Payout', w: 'When a funded account meets the payout rules.', fr: 'payouts', s: 'Your first payout is ready to request', p: '$1,840 available at your 90% split.', e: 'Payout Ready', h: 'You can request', a: 'a payout.', r: [['Available', '$1,840.00'], ['Split', '90%'], ['Paid Through', 'Rise']], cta: 'Request Payout', sent: 48 },
    payreq: { n: 'Payout Request Received', w: 'When a payout is requested.', req: 1, fr: 'payouts', s: 'We got your payout request', p: 'Reviews usually take 1 to 2 business days.', e: 'Payout', h: 'Request received.', a: "We're on it.", r: [['Amount', '$1,840.00'], ['Account', 'FS-F-50K-2207'], ['Requested', 'Nov 22, 10:12 AM ET']], b: ['We check the trades against the payout rules, then send it through Rise.'], sent: 44 },
    payok: { n: 'Payout Approved', w: 'When the review passes.', req: 1, fr: 'payouts', s: 'Your $1,840.00 payout is approved', p: 'It goes out through Rise today.', e: 'Payout', h: 'Approved.', a: 'Sending it today.', r: [['Amount', '$1,840.00'], ['Method', 'Rise · USDC']], sent: 40 },
    paysent: { n: 'Payout Sent', w: 'When Rise confirms the payment.', req: 1, fr: 'payouts', s: '$1,840.00 is on its way to you', p: 'Paid through Rise.', e: 'Payout Sent', h: '$1,840.00', a: 'is on its way.', r: [['Amount', '$1,840.00'], ['Method', 'Rise · USDC'], ['Reference', 'RISE-88412']], b: ['Rise usually shows it in your account within a few hours.'], cta: 'View Payout', sent: 39 },
    paycert: { n: 'Share Your Payout Certificate', w: '3 days after a payout is sent.', mk: 1, fr: 'hello', s: 'Your payout certificate is ready', p: 'Proof of your first payout, ready to share.', e: 'Certificate', h: 'First payout.', a: 'Make it official.', b: ['Your payout certificate shows the amount and date. Share it, or keep it for yourself.'], cta: 'Get My Certificate', sent: 31, off: 1 },
    payhold: { n: 'Payout On Hold', w: 'When a request needs a manual review.', req: 1, fr: 'risk', s: 'Your payout needs a closer look', p: "We'll update you within 3 business days.", e: 'Payout', h: 'Your payout', a: 'is on hold.', al: ['warn', 'Some trades need a manual review against the funded rules. Nothing is needed from you right now.'], sent: 4 },
    risesetup: { n: 'Set Up Payouts with Rise', w: 'When a funded trader has no payout method.', req: 1, fr: 'payouts', s: 'Set up Rise to get paid', p: 'Takes about 5 minutes.', e: 'Payout Method', h: 'Set up Rise', a: 'to get paid.', b: ['Payouts are sent through Rise, in USD or crypto. Create your Rise account with the same email you use here.'], cta: 'Set Up Rise', sent: 12 },
    taxform: { n: 'Tax Form Needed', w: 'Before the first payout, when no tax form is on file.', req: 1, fr: 'payouts', s: 'One form before your first payout', p: 'W-9 for US traders, W-8BEN for everyone else.', e: 'Tax Form', h: 'One form', a: 'before your payout.', b: ['US traders fill in a W-9. Everyone else fills in a W-8BEN. It takes about 3 minutes.'], cta: 'Fill In the Form', sent: 9 },

    // Billing and renewals
    renewsoon: { n: 'Renews in 3 Days', w: '3 days before a monthly plan renews.', fr: 'billing', s: 'Your {plan} renews on Nov 25', p: '$119.00 to Visa ending 4242.', e: 'Renewal', h: 'Your plan renews', a: 'in 3 days.', r: [['Plan', '{plan} {size}'], ['Amount', '$119.00'], ['Card', 'Visa ending 4242'], ['Date', 'Nov 25, 2026']], cta: 'Manage Subscription', sent: 120 },
    renewok: { n: 'Renewal Receipt', w: 'When a monthly renewal succeeds.', req: 1, fr: 'billing', s: 'Receipt: {plan} renewal', p: '$119.00 paid. Your account keeps running.', e: 'Receipt', h: 'Renewed.', a: 'Thanks, {first_name}.', r: [['Plan', '{plan} {size}'], ['Paid', '$119.00'], ['Next Renewal', 'Dec 25, 2026']], cta: 'View Receipt', sent: 410 },
    renewfail1: { n: 'Renewal Payment Failed', w: 'When a renewal payment fails.', req: 1, fr: 'billing', s: "Your renewal didn't go through", p: "We'll try again in 2 days.", e: 'Payment Problem', h: 'Your renewal', a: "didn't go through.", al: ['warn', "We couldn't charge Visa ending 4242. We'll try again on Nov 27. Your account keeps running until then."], cta: 'Update Card', sent: 38 },
    renewfail2: { n: 'Second Try Failed', w: '2 days later, if still unpaid.', req: 1, fr: 'billing', s: 'Second try failed: update your card', p: 'Your account pauses in 3 days.', e: 'Payment Problem', h: 'Update your card', a: 'in the next 3 days.', al: ['bad', 'The second try failed. Your account pauses on Nov 30 if the renewal is still unpaid.'], cta: 'Update Card', sent: 17 },
    renewpause: { n: 'Account Paused for Payment', w: '3 days later, if still unpaid.', req: 1, fr: 'billing', s: '{account} is paused', p: 'Pay the renewal to pick up where you left off.', e: 'Account Paused', h: 'Your account', a: 'is paused.', b: ['No trades can be placed until the renewal is paid. Your balance and progress are kept for 30 days.'], cta: 'Pay $119.00', sent: 9 },
    subcancel: { n: 'Subscription Cancelled', w: 'When a trader cancels a monthly plan.', req: 1, fr: 'billing', s: 'Your subscription is cancelled', p: 'You can trade until Dec 25.', e: 'Cancelled', h: 'Cancelled.', a: 'No more charges.', b: ['You can keep trading until the end of the period you paid for, Dec 25, 2026.'], cta: 'Turn It Back On', sent: 22 },
    cardexp: { n: 'Card Expiring Soon', w: 'When the saved card expires this month.', fr: 'billing', s: 'Your card on file expires this month', p: 'Update it to keep renewals running.', e: 'Billing', h: 'Your card', a: 'expires this month.', b: ['Visa ending 4242 expires at the end of November. Update it before your next renewal on Dec 25.'], cta: 'Update Card', sent: 26 },

    // Account and security
    pwreset: { n: 'Reset Your Password', w: 'When a trader asks to reset their password.', req: 1, fr: 'security', s: 'Reset your Funded Sky password', p: 'The link works for 30 minutes.', e: 'Password', h: 'Reset your password.', a: '', b: ['Use the button below to choose a new password. The link works for 30 minutes and only once.'], cta: 'Choose a New Password', n2: "Didn't ask for this? Ignore this email. Your password won't change.", sent: 160 },
    pwchanged: { n: 'Password Changed', w: 'Right after the password changes.', req: 1, fr: 'security', s: 'Your password was changed', p: "If this wasn't you, lock your account now.", e: 'Security', h: 'Your password', a: 'was changed.', r: [['When', 'Nov 22, 11:04 AM ET'], ['Device', 'Chrome on Windows'], ['Location', 'Miami, US']], cta: "This Wasn't Me", sent: 120 },
    newlogin: { n: 'New Sign-In to Your Account', w: 'When someone signs in from a new device.', req: 1, fr: 'security', s: 'New sign-in from Chrome on Windows', p: 'Miami, US · Nov 22, 9:12 AM ET', e: 'Security', h: 'New sign-in', a: 'to your account.', r: [['Device', 'Chrome on Windows'], ['Location', 'Miami, US'], ['When', 'Nov 22, 9:12 AM ET']], cta: "This Wasn't Me", n2: 'If it was you, there is nothing to do.', sent: 340 },
    twofa: { n: 'Two-Step Login Turned On', w: 'When two-step login is turned on or off.', req: 1, fr: 'security', s: 'Two-step login is on', p: 'Your account is better protected.', e: 'Security', h: 'Two-step login', a: 'is on.', b: ['From now on you will enter a code from your authenticator app when you sign in.'], sent: 60 },
    emailchg: { n: 'Email Address Changed', w: 'Sent to the old address when the email changes.', req: 1, fr: 'security', s: 'Your Funded Sky email was changed', p: "If this wasn't you, tell us right away.", e: 'Security', h: 'Your email', a: 'was changed.', r: [['Old Email', 'j***@gmail.com'], ['New Email', 'j***@proton.me']], cta: "This Wasn't Me", sent: 14 },
    delreq: { n: 'Account Deletion Requested', w: 'When a trader asks to delete their account.', req: 1, fr: 'security', s: 'We got your request to delete your account', p: 'It happens in 14 days. You can cancel until then.', e: 'Account', h: 'Your account will be deleted', a: 'on Dec 6.', b: ['Open evaluations close and personal data is deleted, except records we must keep by law. You can cancel until then.'], cta: 'Keep My Account', sent: 3 },
    export: { n: 'Your Data Export Is Ready', w: 'When a requested data export finishes.', req: 1, fr: 'security', s: 'Your data export is ready', p: 'The download link works for 7 days.', e: 'Account', h: 'Your data', a: 'is ready.', b: ['The file includes your profile, orders, accounts and trade history.'], cta: 'Download', sent: 2 },

    // Rules and compliance
    review: { n: 'Trades Under Review', w: 'When trades are flagged for a manual review.', req: 1, fr: 'risk', s: 'Some of your trades are under review', p: "You can keep trading. We'll update you within 3 business days.", e: 'Review', h: 'Some trades', a: 'are under review.', b: ["Our risk team is checking a few trades against the rules. You can keep trading while we look. We'll email you within 3 business days."], sent: 8 },
    strategy: { n: 'Prohibited Strategy Warning', w: 'When trading matches a prohibited strategy.', req: 1, fr: 'risk', s: 'A warning about your recent trades', p: 'One more time and the account closes.', e: 'Warning', h: 'A warning about', a: 'your recent trades.', al: ['bad', 'Trades on Nov 20 match a prohibited strategy: opposite positions on two accounts at the same time. A second time closes both accounts.'], cta: 'Read the Rules', sent: 5 },
    suspended: { n: 'Account Suspended', w: 'When the risk team suspends an account.', req: 1, fr: 'risk', s: '{account} is suspended', p: 'What this means, and how to appeal.', e: 'Suspended', h: 'Your account', a: 'is suspended.', b: ['Trading is paused while the review finishes. You can reply to this email to explain the trades.'], sent: 2 },
    appeal: { n: 'Appeal Received', w: 'When a trader appeals a decision.', req: 1, fr: 'risk', s: 'We got your appeal', p: 'A different reviewer will decide within 5 business days.', e: 'Appeal', h: 'We got', a: 'your appeal.', b: ["Someone who wasn't part of the first decision will review it within 5 business days."], sent: 3 },
    appealdec: { n: 'Appeal Decision', w: 'When the appeal is decided.', req: 1, fr: 'risk', s: 'The decision on your appeal', p: 'Your account is restored.', e: 'Appeal', h: 'Your account', a: 'is restored.', b: ['After a second review, the trades were within the rules. Your account is open again with the same balance.'], cta: 'Open My Dashboard', sent: 3 },
    news: { n: 'High-Impact News Tomorrow', w: 'The evening before a high-impact release.', fr: 'risk', s: 'Tomorrow 8:30 AM ET: CPI release', p: 'No new trades 2 minutes either side.', e: 'News Rule', h: 'High-impact news', a: 'tomorrow.', r: [['Release', 'CPI'], ['Time', 'Nov 23, 8:30 AM ET'], ['No New Trades', '8:28 to 8:32 AM ET']], cta: 'See the Calendar', sent: 900 },
    holiday: { n: 'Holiday Trading Hours', w: 'A few days before a market holiday.', fr: 'hello', s: 'Thanksgiving trading hours', p: 'Early close on Friday.', e: 'Market Hours', h: 'Thanksgiving', a: 'trading hours.', r: [['Thu, Nov 26', 'Closed'], ['Fri, Nov 27', 'Early close, 1:00 PM ET']], b: ["Days with no trading don't count toward minimum trading days."], sent: 1200 },

    // Platforms
    platswitch: { n: 'Platform Switched', w: 'When a trader moves an account to another platform.', req: 1, fr: 'hello', s: '{account} now runs on NinjaTrader', p: 'Your new login is inside.', e: 'Platform', h: 'Your account moved', a: 'to NinjaTrader.', r: [['Account', '{account}'], ['Platform', 'NinjaTrader'], ['Username', 'FS10432']], cta: 'Open My Dashboard', sent: 15 },
    maint: { n: 'Scheduled Maintenance', w: 'Before planned maintenance.', fr: 'hello', s: 'Planned maintenance on Sunday', p: 'Dashboard offline 2:00 to 3:00 AM ET. Trading is not affected.', e: 'Maintenance', h: 'Planned maintenance', a: 'on Sunday.', r: [['When', 'Sun, Nov 29, 2:00 to 3:00 AM ET'], ['Affected', 'Dashboard and checkout'], ['Not Affected', 'Trading platforms']], sent: 800 },
    outage: { n: 'Platform Issue Update', w: 'When a platform outage affects accounts.', req: 1, fr: 'risk', s: 'Update: Tradovate connection issue', p: 'No account will be closed because of it.', e: 'Incident', h: 'A platform issue', a: 'is affecting trading.', al: ['warn', "Tradovate is having connection problems. No account will be closed for rule breaks caused by the outage."], cta: 'See Status', sent: 0 },

    // Affiliates
    affok: { n: 'Affiliate Application Approved', w: 'When an affiliate application is approved.', req: 1, fr: 'partners', s: "You're a Funded Sky affiliate", p: 'Your code and link are inside.', e: 'Affiliates', h: "You're in.", a: 'Start sharing.', r: [['Code', 'SKY10'], ['Trader Discount', '10%'], ['Commission', '15%']], cta: 'Open Affiliate Dashboard', sent: 3 },
    commission: { n: 'Commission Earned', w: 'When a referred trader buys.', fr: 'partners', s: 'You earned $36.00', p: 'A trader used SKY10.', e: 'Affiliates', h: 'You earned', a: '$36.00.', r: [['Code', 'SKY10'], ['Order', '$240.00 after discounts'], ['Commission', '15% · $36.00']], sent: 63 },
    affstatement: { n: 'Monthly Affiliate Statement', w: 'On the 1st of each month.', req: 1, fr: 'partners', s: 'Your November statement', p: '38 orders · $1,113 owed.', e: 'Statement', h: 'November', a: 'statement.', r: [['Orders', '38'], ['Revenue', '$7,420'], ['Commission Owed', '$1,113']], cta: 'Download Statement', sent: 3 },
    affpaid: { n: 'Commission Paid', w: 'When commission is sent.', req: 1, fr: 'partners', s: '$1,113 commission sent', p: 'Paid through Rise.', e: 'Affiliates', h: '$1,113', a: 'is on its way.', r: [['Amount', '$1,113.00'], ['Method', 'Rise']], sent: 3 },

    // Support
    ticket: { n: 'We Got Your Message', w: 'When a trader opens a support ticket.', req: 1, fr: 'support', s: '[#4812] We got your message', p: 'We usually reply within 4 hours.', e: 'Support', h: 'We got', a: 'your message.', b: ['We usually reply within 4 hours, every day. Reply to this email to add anything.'], r: [['Ticket', '#4812'], ['Subject', 'Payout timing']], sent: 230 },
    reply: { n: 'New Reply from Support', w: 'When support replies to a ticket.', req: 1, fr: 'support', s: '[#4812] New reply from [Support Agent]', p: 'Hi Jane, your payout was approved this morning...', e: 'Support', h: 'New reply', a: 'on ticket #4812.', b: ['"Hi Jane, your payout was approved this morning and goes out through Rise today."'], cta: 'View Conversation', sent: 410 },
    closed: { n: 'Was This Solved?', w: 'When a ticket is closed.', fr: 'support', s: '[#4812] Was this solved?', p: 'One click tells us.', e: 'Support', h: 'Did we solve it?', a: '', b: ['Your ticket is closed. One click tells us how we did.'], cta: 'Yes, Solved', sent: 200 },

    // Marketing and updates
    brief: { n: 'Weekly Futures Brief', w: 'Every Sunday at 6:00 PM ET.', mk: 1, fr: 'hello', s: 'This week: CPI, Fed speakers, and holiday hours', p: 'The 5 things that move futures this week.', e: 'Weekly Brief', h: 'Five things', a: 'that move futures this week.', st: [['CPI on Tuesday', 'The biggest release of the week. News rule applies.'], ['Fed speakers', 'Three on Wednesday. Expect wider ranges.'], ['Thanksgiving hours', 'Closed Thursday, early close Friday.']], cta: 'Read the Full Brief', sent: 2800 },
    sale: { n: 'Sale Announcements', w: 'When a campaign starts, like Black Friday.', mk: 1, fr: 'hello', s: 'Black Friday: 40% off every evaluation', p: 'Code BLACKFRIDAY, through Nov 30.', e: 'Black Friday', h: '40% off', a: 'every evaluation.', b: ['Use code BLACKFRIDAY at checkout, through Nov 30. Works on every plan and size.'], cta: 'Shop the Sale', sent: 0 },
    product: { n: 'Product Updates', w: 'When something new ships.', mk: 1, fr: 'hello', s: "What's new at Funded Sky", p: 'Rithmic is here, and payouts got faster.', e: 'Product Update', h: "What's new", a: 'this month.', st: [['Rithmic accounts', 'Pick Rithmic at checkout on every plan.'], ['Faster payouts', 'Most payouts now go out the same day.']], cta: 'See Everything New', sent: 1900, off: 1 },
    reviewask: { n: 'Leave a Review', w: '2 days after a first payout.', mk: 1, fr: 'hello', s: 'How was your first payout?', p: 'Two minutes, and it helps other traders.', e: 'Your Opinion', h: 'How did we do,', a: '{first_name}?', b: ['A short review helps other traders decide. It takes two minutes.'], cta: 'Leave a Review', sent: 30 }
  };

  // ---------- flows: each lane is one chain of steps ----------
  // T: trigger · E: email · W: wait · I: only if
  const FLOWS = [
    { id: 'signup', name: 'Sign-Up and Welcome', desc: "A new trader's first emails.", lanes: [['T:Trader Signs Up|Email and password, or Google', 'E:confirm', 'W:Code Entered|Usually within a minute', 'E:welcome', 'W:2 Days', "I:Hasn't Bought an Evaluation|Skipped for anyone who bought", 'E:firstbuy']] },
    { id: 'orders', name: 'Checkout and Orders', desc: 'Receipts, account logins and payment problems.', lanes: [['T:Payment Succeeds|Card or crypto', 'E:order', 'W:Account Created|Usually under a minute', 'E:ready', 'W:1 Day', 'E:firstday'], ['T:Payment Fails at Checkout|Declined, blocked or expired card', 'E:payfail'], ['T:Refund Issued|From the admin', 'E:refund']] },
    { id: 'abandon', name: 'Unfinished Checkout', desc: 'A signed-in trader leaves checkout without paying.', lanes: [['T:Trader Leaves Checkout|Signed in, cart not paid', 'W:2 Hours|Set in Abandoned Checkout', "I:Still Hasn't Paid|And has never bought", 'E:abandon1', 'W:1 Day', "I:Still Hasn't Paid", 'E:abandon2']] },
    { id: 'progress', name: 'Evaluation Progress', desc: 'Milestones and risk warnings while a trader is in an evaluation.', lanes: [['T:Profit Reaches 50% of Target', 'E:halfway'], ['T:Target Hit Before Minimum Days', 'E:target'], ['T:Daily Loss Reaches 80% of Limit|Open and closed trades', 'E:dailywarn'], ['T:Balance Within 20% of Drawdown Floor', 'E:ddwarn'], ['T:One Day Over 40% of Profit', 'E:consistency'], ['T:21 Days Without a Trade', 'E:inactive1', 'W:7 Days', 'I:Still No Trades', 'E:inactive2']] },
    { id: 'breach', name: 'Breaches and Resets', desc: 'When an evaluation ends, and bringing traders back.', lanes: [['T:Evaluation Rule Broken|Drawdown, daily loss or another rule', 'E:breach', 'W:1 Day', "I:Hasn't Reset or Bought", 'E:resetoffer', 'W:30 Days', "I:Still Hasn't Bought", 'E:winback'], ['T:Reset Purchased', 'E:resetdone']] },
    { id: 'funded', name: 'Passing and Funded', desc: 'From passing the evaluation to a live funded account.', lanes: [['T:Evaluation Passed|Every rule met', 'E:passed', 'I:Identity Not Verified', 'E:kyc', 'W:Identity Check Passes', 'E:kycok', 'E:agreement', 'W:Agreement Signed', 'I:Plan Has an Activation Fee', 'E:actfee', 'W:Fee Paid', 'E:funded', 'W:1 Day', 'E:certificate'], ['T:Identity Check Needs More', 'E:kycmore'], ['T:Identity Check Rejected', 'E:kycno'], ['T:Funded Rule Broken', 'E:fbreach']] },
    { id: 'payouts', name: 'Payouts', desc: 'Every step of getting paid.', lanes: [['T:Payout Requested', 'E:payreq', 'W:Review|Usually 1 to 2 business days', 'E:payok', 'W:Sent by Rise', 'E:paysent', 'W:3 Days', 'E:paycert', 'W:2 Days', 'I:First Payout', 'E:reviewask'], ['T:Payout Rules Met', 'E:eligible'], ['T:Request Needs Manual Review', 'E:payhold'], ['T:No Payout Method', 'E:risesetup'], ['T:No Tax Form on File', 'E:taxform']] },
    { id: 'billing', name: 'Billing and Renewals', desc: 'Monthly plans: renewals, failed payments and cancellations.', lanes: [['T:Renewal Payment Fails', 'E:renewfail1', 'W:2 Days', 'I:Still Unpaid', 'E:renewfail2', 'W:3 Days', 'I:Still Unpaid', 'E:renewpause'], ['T:3 Days Before Renewal', 'E:renewsoon'], ['T:Renewal Succeeds', 'E:renewok'], ['T:Subscription Cancelled', 'E:subcancel'], ['T:Card Expires This Month', 'E:cardexp']] },
    { id: 'security', name: 'Account and Security', desc: 'Sign-in, password and account changes. These always send.', lanes: [['T:Password Reset Requested', 'E:pwreset'], ['T:Password Changed', 'E:pwchanged'], ['T:Sign-In From a New Device', 'E:newlogin'], ['T:Two-Step Login Changed', 'E:twofa'], ['T:Email Address Changed', 'E:emailchg'], ['T:Deletion Requested', 'E:delreq'], ['T:Data Export Finished', 'E:export']] },
    { id: 'rules', name: 'Rules and Compliance', desc: 'Reviews, warnings, appeals and trading-hours notices.', lanes: [['T:Trades Flagged', 'E:review'], ['T:Prohibited Strategy Detected', 'E:strategy'], ['T:Account Suspended', 'E:suspended'], ['T:Appeal Submitted', 'E:appeal', 'W:Decision Made|Within 5 business days', 'E:appealdec'], ['T:Evening Before High-Impact News|From the economic calendar', 'E:news'], ['T:3 Days Before a Market Holiday', 'E:holiday']] },
    { id: 'platforms', name: 'Platforms', desc: 'Platform changes, maintenance and outages.', lanes: [['T:Account Moved to Another Platform', 'E:platswitch'], ['T:Maintenance Scheduled', 'E:maint'], ['T:Platform Outage|Sent from the admin', 'E:outage']] },
    { id: 'affiliates', name: 'Affiliates', desc: 'Emails to affiliates, not traders.', lanes: [['T:Application Approved', 'E:affok'], ['T:Referred Trader Buys', 'E:commission'], ['T:1st of the Month', 'E:affstatement', 'W:Commission Sent', 'E:affpaid']] },
    { id: 'support', name: 'Support', desc: 'Ticket updates.', lanes: [['T:Ticket Opened', 'E:ticket'], ['T:Support Replies', 'E:reply'], ['T:Ticket Closed', 'E:closed']] },
    { id: 'marketing', name: 'Newsletters and Sales', desc: 'Only sent to traders who said yes to marketing emails.', lanes: [['T:Every Sunday, 6:00 PM ET', 'E:brief'], ['T:Campaign Starts|From Campaigns in the Checkout Catalog', 'E:sale'], ['T:Something New Ships|Sent from the admin', 'E:product']] }
  ];

  const ME = '[Your Name]';
  const XL = (board, hash, label, cls) => `<a class="${cls || 'lnk'}" href="Admin${board}.dc.html${hash ? '#' + hash : ''}">${label}</a>`;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fill = (t) => String(t == null ? '' : t).replace(/\{(\w+)\}/g, (m, k) => SAMPLE[k] != null ? SAMPLE[k] : m);
  const fe = (t) => esc(fill(t));
  const num = (n) => Math.round(n).toLocaleString('en-US');
  const rng = (seed) => { let h = 2166136261; for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; };
  let seq = 500; const uid = (p) => p + (++seq);
  const CHEV = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

  // stats per email
  Object.entries(E).forEach(([id, e]) => {
    const r = rng(id); e.id = id; e.on = !e.off; e.v = 1 + Math.floor(r() * 4);
    const base = e.req ? (e.fr === 'security' ? 0.78 : 0.64) : e.mk ? 0.34 : 0.52;
    e.open = Math.round((base + (r() - 0.5) * 0.12) * 100); e.click = e.cta ? Math.max(2, Math.round(e.open * (0.18 + r() * 0.22))) : Math.round(e.open * 0.04);
    e.bounce = +(0.3 + r() * 0.9).toFixed(1); e.unsub = e.mk ? +(0.2 + r() * 0.6).toFixed(1) : 0;
    e.hist = [];
  });
  const flowOf = (id) => FLOWS.find((f) => f.lanes.some((l) => l.includes('E:' + id)));
  const emailsIn = (f) => f.lanes.flat().filter((x) => x.startsWith('E:')).map((x) => E[x.slice(2)]);
  const isOn = (e) => e.req || (e.on && !(flowOf(e.id) || {}).paused);
  const totals = () => { const all = Object.values(E); const sent = all.reduce((a, e) => a + e.sent, 0); const w = (k) => Math.round(all.reduce((a, e) => a + e.sent * e[k], 0) / Math.max(1, sent)); return { sent, today: Math.round(sent / 30 * 0.42), week: Math.round(sent / 30 * 7.1), open: w('open'), click: w('click'), failed: 141 }; };
  const flowStats = (f) => { const es = emailsIn(f); const sent = es.reduce((a, e) => a + e.sent, 0); const w = (k) => sent ? Math.round(es.reduce((a, e) => a + e.sent * e[k], 0) / sent) : 0; return { sent, open: w('open'), click: w('click') }; };

  const S = {
    view: 'flow', flow: 'signup', sel: 'welcome', open: { signup: true }, tab: 'preview', dev: 'desktop', full: false, panel: false,
    edit: null, who: { q: '', f: 'all', row: -1 }, range: 30, toast: '',
    logs: { status: 'all', q: '', em: 'all', row: null },
    rules: { quiet: true, qFrom: '21:00', qTo: '08:00', capDay: '1', capWeek: '3', pauseMk: false, noMkAfterBreach: true, test: false, testTo: '[your-email]@fundedsky.com', failover: true },
    brand: { address: '[Company Address]', support: 'support@fundedsky.com', legal: 'All Funded Sky accounts trade in a simulated environment. Nothing in this email is investment advice.', x: 'x.com/fundedsky', ig: '', discord: 'discord.gg/[invite]' },
    supp: [],
    focus: null
  };

  // suppression list
  [['m***@outlook.com', 'Bounced', 'Mailbox does not exist', 'Nov 21'], ['k***@yahoo.com', 'Complained', 'Marked as spam', 'Nov 20'], ['t***@gmail.com', 'Unsubscribed', 'Marketing only', 'Nov 20'], ['a***@proton.me', 'Unsubscribed', 'Marketing only', 'Nov 19'], ['r***@hotmail.com', 'Bounced', 'Domain not found', 'Nov 18'], ['d***@icloud.com', 'Unsubscribed', 'Marketing only', 'Nov 17'], ['j***@gmx.de', 'Bounced', 'Mailbox full, 3 tries', 'Nov 16'], ['s***@gmail.com', 'Complained', 'Marked as spam', 'Nov 14'], ['p***@mail.ru', 'Unsubscribed', 'Marketing only', 'Nov 12'], ['l***@outlook.com', 'Bounced', 'Mailbox does not exist', 'Nov 10']].forEach(([a, k, why, d]) => S.supp.push({ a, k, why, d }));

  // recipients and logs
  const MAILS = ['j***@gmail.com', 'm***@outlook.com', 'a***@proton.me', 'd***@yahoo.com', 'k***@icloud.com', 'r***@gmail.com', 'c***@hotmail.com', 's***@gmail.com', 'b***@gmx.de', 'e***@outlook.com', 'n***@gmail.com', 'o***@yahoo.com'];
  const TIMES = ['Today, 12:41 PM', 'Today, 12:02 PM', 'Today, 11:18 AM', 'Today, 10:55 AM', 'Today, 9:30 AM', 'Today, 8:12 AM', 'Yesterday, 9:41 PM', 'Yesterday, 6:20 PM', 'Yesterday, 3:20 PM', 'Yesterday, 11:05 AM', 'Nov 20, 7:44 PM', 'Nov 20, 2:10 PM', 'Nov 19, 5:02 PM', 'Nov 19, 9:15 AM'];
  const recipients = (e) => { const r = rng('who' + e.id); const n = Math.min(14, Math.max(e.sent ? 4 : 0, e.sent)); const out = []; for (let i = 0; i < n; i++) { const x = r(); const st = x < e.bounce / 40 + 0.03 ? 'Bounced' : x < 0.03 + e.click / 100 ? 'Clicked' : x < 0.03 + e.open / 100 ? 'Opened' : 'Delivered'; out.push({ t: '[Trader] #' + (1043 - i * 3 - Math.floor(r() * 3)), to: MAILS[(i + Math.floor(r() * 5)) % MAILS.length], when: TIMES[i], st }); } return out; };
  const REASONS = ['Mailbox does not exist', 'Mailbox full', 'Suppressed: unsubscribed from marketing', 'Domain not found', 'Rejected as spam by the receiving server', 'Suppressed: earlier bounce'];
  const LOGS = (() => { const r = rng('logs'); const ids = Object.keys(E).filter((k) => E[k].sent > 0); const out = []; for (let i = 0; i < 64; i++) { const e = E[ids[Math.floor(Math.pow(r(), 1.6) * ids.length)]]; const x = r(); const st = x < 0.06 ? 'Failed' : x < 0.1 ? 'Bounced' : x < 0.12 ? 'Complaint' : x < 0.3 ? 'Clicked' : x < 0.62 ? 'Opened' : 'Delivered'; const mins = 2 + i * 23 + Math.floor(r() * 18); const d = new Date(Date.UTC(2026, 10, 22, 17, 58) - mins * 60000); const hh = d.getUTCHours() - 5; const day = hh < 0 ? 'Yesterday' : 'Today'; const h24 = (hh + 24) % 24; const when = `${day}, ${((h24 + 11) % 12) + 1}:${String(d.getUTCMinutes()).padStart(2, '0')} ${h24 >= 12 ? 'PM' : 'AM'}`; out.push({ id: 'msg_' + (9000000 + Math.floor(r() * 999999)).toString(36), e: e.id, to: MAILS[Math.floor(r() * MAILS.length)], t: '[Trader] #' + (1043 - Math.floor(r() * 40)), when, st, why: ['Failed', 'Bounced'].includes(st) ? REASONS[Math.floor(r() * REASONS.length)] : st === 'Complaint' ? 'Marked as spam by the recipient' : '' }); } return out; })();
  const STB = { Delivered: 'plain', Opened: 'sched', Clicked: 'live', Bounced: 'err', Failed: 'err', Complaint: 'draft', Suppressed: 'ret' };

  // ---------- email preview ----------
  const GROUP_LABEL = { signup: 'Welcome', orders: 'Orders', abandon: 'Checkout', progress: 'Evaluation', breach: 'Evaluation', funded: 'Funded', payouts: 'Payouts', billing: 'Billing', security: 'Security', rules: 'Rules', platforms: 'Platforms', affiliates: 'Affiliates', support: 'Support', marketing: 'News' };
  function emailHtml(e, dev) {
    const f = flowOf(e.id) || {}; const paras = [].concat(e.b || []).filter(Boolean);
    const money = (v) => '$' + Number(v).toLocaleString('en-US');
    const pg = e.pg ? `<div class="em-pg"><div class="em-pgh"><span>${esc(e.pg[0])}</span><b>${e.pg[2] === 100 ? e.pg[1] + '%' : e.pg[2] > 100 ? money(e.pg[1]) + ' of ' + money(e.pg[2]) : e.pg[1] + ' of ' + e.pg[2]}</b></div><div class="em-bar"><i style="width:${Math.min(100, e.pg[1] / e.pg[2] * 100)}%"></i></div><div class="em-pgs">${esc(e.pg[3])}</div></div>` : '';
    return `<div class="em ${dev === 'phone' ? 'ph' : ''}">
      <div class="em-top"><span class="em-logo">fundedsky<i>futures</i></span><span class="em-lab">${esc(GROUP_LABEL[f.id] || 'Funded Sky')}</span></div>
      <div class="em-b">
        ${e.e ? `<div class="em-eb">${fe(e.e)}</div>` : ''}
        <h1>${fe(e.h)}${e.a ? ` <span>${fe(e.a)}</span>` : ''}</h1>
        ${e.al ? `<div class="em-al ${e.al[0]}">${fe(e.al[1])}</div>` : ''}
        ${paras.map((p) => `<p>${fe(p)}</p>`).join('')}
        ${e.c ? `<div class="em-code">${fe(e.c)}</div>` : ''}
        ${pg}
        ${e.r ? `<div class="em-rows">${e.r.map(([k, v]) => `<div><span>${fe(k)}</span><b>${fe(v)}</b></div>`).join('')}</div>` : ''}
        ${e.st ? `<div class="em-steps">${e.st.map(([t, d], i) => `<div class="em-s"><span class="em-n">${i + 1}</span><div><b>${fe(t)}</b><p>${fe(d)}</p></div></div>`).join('')}</div>` : ''}
        ${e.cta ? `<div class="em-ctaw"><span class="em-cta">${fe(e.cta)}</span></div>` : ''}
        ${e.n2 ? `<div class="em-n2">${fe(e.n2)}</div>` : ''}
      </div>
      <div class="em-foot">
        <div>${e.mk ? '<u>Unsubscribe</u> · <u>Email Preferences</u>' : "You're getting this because you have a Funded Sky account. It's about your account, so it can't be turned off."}</div>
        <div>Funded Sky · ${esc(S.brand.address)} · ${esc(S.brand.support)}</div>
        <div>${esc(S.brand.legal)}</div>
      </div></div>`;
  }

  // ---------- nav ----------
  const TOOLS = [['logs', 'Email Logs'], ['domain', 'Sending Domain'], ['rules', 'Sending Rules'], ['brand', 'Brand and Footer'], ['supp', 'Suppression List']];
  function navHtml() {
    let h = '<h6>Flows</h6>';
    FLOWS.forEach((f) => {
      const es = emailsIn(f); const on = es.filter(isOn).length; const open = S.open[f.id];
      h += `<button class="ng ${S.view === 'flow' && S.flow === f.id ? 'on' : ''} ${open ? 'open' : ''}" data-act="flow" data-id="${f.id}" aria-expanded="${!!open}"><span class="chv">${CHEV}</span><span class="ngt">${esc(f.name)}</span><i>${on} of ${es.length} On</i></button>`;
      if (open) h += `<div class="ngl">${es.map((e) => `<button class="ni sub ${S.view === 'flow' && S.sel === e.id ? 'on' : ''}" data-act="pick" data-id="${e.id}"><span class="dot" style="background:${e.draft ? 'var(--wa)' : isOn(e) ? 'var(--ok)' : 'var(--fa)'}"></span><span class="nit">${esc(e.n)}</span></button>`).join('')}</div>`;
    });
    h += '<h6>Tools</h6>' + TOOLS.map(([v, l]) => `<button class="ni ${S.view === v ? 'on' : ''}" data-act="go" data-v="${v}">${l}${v === 'logs' ? `<i>${LOGS.filter((x) => ['Failed', 'Bounced'].includes(x.st)).length}</i>` : v === 'supp' ? `<i>${S.supp.length}</i>` : ''}</button>`).join('');
    return h;
  }
  function mnavHtml() {
    let h = '<optgroup label="Flows">' + FLOWS.map((f) => `<option value="f:${f.id}" ${S.view === 'flow' && S.flow === f.id ? 'selected' : ''}>${esc(f.name)} (${emailsIn(f).filter(isOn).length} of ${emailsIn(f).length} On)</option>`).join('') + '</optgroup>';
    return h + '<optgroup label="Tools">' + TOOLS.map(([v, l]) => `<option value="v:${v}" ${S.view === v ? 'selected' : ''}>${l}</option>`).join('') + '</optgroup>';
  }

  // ---------- flow canvas ----------
  function node(step, f, li, last) {
    const [k, rest] = [step[0], step.slice(2)];
    if (k === 'E') {
      const e = E[rest]; const on = isOn(e);
      const tag = e.req ? 'Always On' : e.draft ? 'Draft' : on ? 'On' : 'Off';
      return `<button class="nd ndm ${S.sel === e.id ? 'sel' : ''} ${on ? '' : 'off'}" data-act="pick" data-id="${e.id}"><div class="k"><i></i>${e.mk ? 'Marketing Email' : 'Email'}<span class="tg ${e.req ? 'lock' : on ? 'on' : ''}">${tag}</span></div><h4>${esc(e.n)}</h4><p>${esc(e.w)}</p><div class="st"><div><span>Sent</span><b>${num(e.sent)}</b></div><div><span>Opened</span><b>${e.sent ? e.open + '%' : '—'}</b></div><div><span>Clicked</span><b>${e.sent ? e.click + '%' : '—'}</b></div></div></button>`;
    }
    const [t, sub] = rest.split('|');
    if (k === 'T') return `<div class="nd trg"><div class="k"><i></i>Trigger</div><h4>${esc(t)}</h4>${sub ? `<p>${esc(sub)}</p>` : ''}</div>`;
    return `<div class="nd wt"><div class="k"><i></i>${k === 'W' ? 'Wait' : 'Only If'}</div><h4>${esc(t)}</h4>${sub ? `<p>${esc(sub)}</p>` : ''}</div>`;
  }
  function vFlow() {
    const f = FLOWS.find((x) => x.id === S.flow); const st = flowStats(f); const opt = emailsIn(f).filter((e) => !e.req).length;
    const lanes = f.lanes.map((l, li) => `<div class="lane">${l.map((s, i) => node(s, f, li, i === l.length - 1)).join('<div class="cn"></div>')}<div class="cn"></div><div class="nd end"><span>Flow Ends</span><button class="lnk" data-act="addEmail" data-id="${f.id}" data-i="${li}">+ Add Email</button></div></div>`).join('');
    return `<div class="fh"><div class="fht"><h1>${esc(f.name)}</h1><p>${esc(f.desc)}</p></div><div class="fhr"><div class="ms"><span>Sent</span><b>${num(st.sent)}</b></div><div class="ms"><span>Opened</span><b>${st.open}%</b></div><div class="ms"><span>Clicked</span><b>${st.click}%</b></div>${opt ? `<label class="wf">Whole Flow<button class="sw ${f.paused ? '' : 'on'}" data-act="flowOn" data-id="${f.id}" role="switch" aria-checked="${!f.paused}" aria-label="Whole flow on or off"></button></label>` : '<span class="b plain lock" title="Every email here is required">Always On</span>'}</div></div>
      ${f.paused ? '<div class="fbar">This flow is paused. Always-on emails in it still send.</div>' : ''}
      <div class="cv"><div class="lanes ${f.lanes.length === 1 ? 'one' : ''}">${lanes}</div></div>`;
  }

  // ---------- email panel ----------
  const cur = () => E[S.sel];
  const draftOf = (e) => (S.edit && S.edit.id === e.id ? S.edit.f : e);
  function panel() {
    const e = cur(); if (!e) return '';
    const tabs = [['preview', 'Preview'], ['numbers', 'Numbers'], ['who', 'Who Got It'], ['edit', 'Edit']];
    const body = { preview: tPreview, numbers: tNumbers, who: tWho, edit: tEdit }[S.tab](e);
    return `<div class="ep-h"><div class="ep-t"><div class="ep-tt"><h2>${esc(e.n)}</h2><p>${esc(e.w)}</p></div>${e.req ? '<span class="b plain lock" title="Required: this email always sends">Always On</span>' : `<button class="sw ${e.on ? 'on' : ''}" data-act="emOn" data-id="${e.id}" role="switch" aria-checked="${e.on}" aria-label="Email on or off"></button>`}<button class="ic epx" data-act="closePanel" aria-label="Close">✕</button></div>
      <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button class="${S.tab === k ? 'on' : ''}" data-act="tab" data-k="${k}" role="tab" aria-selected="${S.tab === k}">${l}${k === 'edit' && S.edit && S.edit.id === e.id ? '<i class="udot"></i>' : ''}</button>`).join('')}</div></div>
      <div class="ep-b">${body}</div>`;
  }
  const sender = (e) => SENDERS[e.fr] || SENDERS.hello;
  function inbox(d) { const s = sender(d); return `<div class="inbox"><div><span>From</span><b>${esc(s[0])} <em>&lt;${esc(s[1])}&gt;</em></b></div><div><span>Subject</span><b>${fe(d.s)}</b></div><div><span>Preview Text</span><b class="mu">${fe(d.p)}</b></div></div>`; }
  function tPreview(e) {
    const d = draftOf(e);
    return `<div class="pvact"><button class="pill" data-act="test">Send Me a Test</button><button class="pill" data-act="full">Open Full Size</button><div class="seg" role="group" aria-label="Preview size"><button class="${S.dev === 'desktop' ? 'on' : ''}" data-act="dev" data-k="desktop">Desktop</button><button class="${S.dev === 'phone' ? 'on' : ''}" data-act="dev" data-k="phone">Phone</button></div></div>
      ${d !== e ? '<div class="unsaved">Showing unsaved changes from Edit.</div>' : ''}
      ${inbox(d)}<div class="pvw ${S.dev}">${emailHtml(d, S.dev)}</div>`;
  }
  function tNumbers(e) {
    const k = S.range / 30; const sent = Math.round(e.sent * k); const del = Math.round(sent * (1 - e.bounce / 100));
    const r = rng('bars' + e.id + S.range); const n = S.range === 7 ? 7 : S.range === 30 ? 30 : 45; const vals = Array.from({ length: n }, () => 0.25 + r() * 0.75); const mx = Math.max(...vals);
    const tile = (l, v, s) => `<div class="tile"><span>${l}</span><b>${v}</b>${s ? `<small>${s}</small>` : ''}</div>`;
    const links = e.cta ? [[e.cta, Math.round(e.click * 0.82)], ['Logo', Math.round(e.click * 0.1)], [e.mk ? 'Email Preferences' : 'Help Center', Math.round(e.click * 0.08)]] : [];
    return `<div class="seg" style="margin-bottom:14px">${[7, 30, 90].map((d) => `<button class="${S.range === d ? 'on' : ''}" data-act="range" data-k="${d}">${d} Days</button>`).join('')}</div>
      <div class="tiles t3">${tile('Sent', num(sent))}${tile('Delivered', sent ? ((del / sent) * 100).toFixed(1) + '%' : '—', num(del))}${tile('Opened', sent ? e.open + '%' : '—', num(del * e.open / 100))}${tile('Clicked', sent ? e.click + '%' : '—', num(del * e.click / 100))}${tile('Bounced', sent ? e.bounce + '%' : '—', num(sent * e.bounce / 100))}${e.mk ? tile('Unsubscribed', e.unsub + '%', num(del * e.unsub / 100)) : tile('Spam Reports', '0.0%', '0')}</div>
      <div class="card"><div class="ch"><h3>Sent per Day</h3><span class="lab">Last ${S.range} Days</span></div><div class="cb">${sent ? `<div class="bars">${vals.map((v) => `<i style="height:${Math.round(v / mx * 100)}%"></i>`).join('')}</div>` : '<div class="empty">Nothing sent in this period.</div>'}</div></div>
      ${links.length ? `<div class="card"><div class="ch"><h3>Links Clicked</h3><span class="lab">Share of Clicks</span></div><table class="t"><tbody>${links.map(([l, v]) => `<tr><td>${fe(l)}</td><td class="num">${v}%</td></tr>`).join('')}</tbody></table></div>` : ''}
      <div class="card m0"><div class="ch"><h3>Opened On</h3></div><div class="cb"><div class="split"><i style="width:64%"></i></div><div class="splitl"><span>Phone 64%</span><span>Desktop 36%</span></div></div></div>`;
  }
  function tWho(e) {
    const all = recipients(e); const q = S.who.q.toLowerCase();
    const list = all.filter((x) => (S.who.f === 'all' || x.st.toLowerCase() === S.who.f) && (!q || (x.t + x.to).toLowerCase().includes(q)));
    const tl = (x) => { const ev = [['Sent', x.when]]; if (x.st === 'Bounced') ev.push(['Bounced', 'Mailbox does not exist']); else { ev.push(['Delivered', 'A few seconds later']); if (x.st !== 'Delivered') ev.push(['Opened', 'Within the hour']); if (x.st === 'Clicked') ev.push(['Clicked', e.cta ? fill(e.cta) : 'Link']); } return `<div class="tl">${ev.map(([a, b]) => `<div><i></i><b>${a}</b><span>${esc(b)}</span></div>`).join('')}</div>`; };
    return `<div class="whof"><input type="search" placeholder="Search Trader or Email" value="${esc(S.who.q)}" data-live="who.q" data-key="whoq" aria-label="Search recipients"><div class="seg">${[['all', 'All'], ['opened', 'Opened'], ['clicked', 'Clicked'], ['bounced', 'Bounced']].map(([k, l]) => `<button class="${S.who.f === k ? 'on' : ''}" data-act="whoF" data-k="${k}">${l}</button>`).join('')}</div></div>
      <div class="card m0 tsc"><table class="t whot"><thead><tr><th>Trader</th><th>Sent</th><th>Status</th></tr></thead><tbody>${list.length ? list.map((x, i) => `<tr class="lk" data-act="whoRow" data-i="${i}"><td><b>${esc(x.t)}</b><div class="hint mono">${esc(x.to)}</div></td><td class="nw">${esc(x.when)}</td><td><span class="b ${STB[x.st]}">${x.st}</span></td></tr>${S.who.row === i ? `<tr class="tlr"><td colspan="3">${tl(x)}</td></tr>` : ''}`).join('') : '<tr><td colspan="3" class="empty">No one matches.</td></tr>'}</tbody></table></div>
      <p class="hint">Addresses are masked. Open Email Logs for every message.</p>`;
  }
  function tEdit(e) {
    const d = draftOf(e); const ed = !!(S.edit && S.edit.id === e.id);
    const fld = (k, l, ph, ta) => `<div class="fl"><label>${l}</label>${ta ? `<textarea data-live="ef.${k}" data-key="ef${k}" placeholder="${esc(ph || '')}">${esc([].concat(d[k] || []).join('\n\n'))}</textarea>` : `<input value="${esc(d[k] || '')}" data-live="ef.${k}" data-key="ef${k}" placeholder="${esc(ph || '')}">`}</div>`;
    return `<div class="fg">
      <div class="fg2"><div class="fl"><label>From</label><select data-bind="ef.fr">${Object.entries(SENDERS).map(([k, [n, a]]) => `<option value="${k}" ${d.fr === k ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div><div class="fl"><label>Type</label><div class="seg">${[['tx', 'Account Email'], ['mk', 'Marketing']].map(([k, l]) => `<button class="${(d.mk ? 'mk' : 'tx') === k ? 'on' : ''}" data-act="efType" data-k="${k}" ${e.req ? 'disabled' : ''}>${l}</button>`).join('')}</div></div></div>
      ${fld('w', 'When It Sends', 'Describe the trigger')}
      ${fld('s', 'Subject')}${fld('p', 'Preview Text', 'Shown next to the subject in the inbox')}
      <div class="fg2">${fld('e', 'Small Heading')}${fld('cta', 'Button Text', 'No button')}</div>
      <div class="fg2">${fld('h', 'Headline')}${fld('a', 'Highlighted Words', 'Shown in sky blue')}</div>
      ${fld('b', 'Body', 'Leave a blank line between paragraphs', true)}
      ${fld('n2', 'Small Print', 'Optional')}
      ${d.r || d.st || d.c || d.pg || d.al ? `<div class="hint">This email also has ${[d.r && 'a details table', d.st && 'numbered steps', d.c && 'a one-time code', d.pg && 'a progress bar', d.al && 'a warning box'].filter(Boolean).join(', ')}, filled in automatically for each trader.</div>` : ''}
      <div class="fl"><label>Merge Fields</label><div class="chips">${MERGE.map(([t, l]) => `<button class="chip" data-act="copyMerge" data-k="${t}" title="${l}">${t}</button>`).join('')}</div><span class="hint">Click to copy, then paste into any field above.</span></div>
      <div class="edact"><button class="pill pri" data-act="saveEdit" ${ed ? '' : 'disabled'}>Save Changes</button><button class="pill" data-act="discardEdit" ${ed ? '' : 'disabled'}>Discard</button>${e.custom ? '<button class="pill dng" data-act="delEmail">Delete Email</button>' : ''}<span class="hint" style="margin-left:auto">${ed ? 'Unsaved changes' : 'Version ' + e.v}</span></div>
      <div class="sec"><h4>Live Preview</h4>${inbox(d)}<div class="pvw desktop">${emailHtml(d, 'desktop')}</div></div>
      <div class="card m0"><div class="ch"><h3>Version History</h3></div><table class="t"><tbody>${[...e.hist, { v: Math.max(1, e.v - e.hist.length), who: ME, when: 'Nov 3, 2026', text: e.custom ? 'Created' : 'Wording at launch' }].slice(0, 6).map((h) => `<tr><td class="nw mono">v${h.v}</td><td>${esc(h.text)}<div class="hint">${esc(h.who)} · ${esc(h.when)}</div></td></tr>`).join('')}</tbody></table></div>
    </div>`;
  }

  // ---------- tool views ----------
  function vLogs() {
    const L = S.logs; const q = L.q.toLowerCase();
    const list = LOGS.filter((x) => (L.status === 'all' || x.st === L.status) && (L.em === 'all' || x.e === L.em) && (!q || (x.to + x.t + x.id + E[x.e].n).toLowerCase().includes(q)));
    const T = totals(); const bnc = Math.round(T.sent * 0.006); const tot = { Delivered: T.sent - T.failed - bnc, Opened: Math.round(T.sent * T.open / 100), Clicked: Math.round(T.sent * T.click / 100), Bounced: bnc, Failed: T.failed, Complaint: 6 };
    return `<div class="ph"><div><h1>Email Logs</h1><p>Every email sent in the last 30 days, with what happened to it. Failed and bounced emails can be sent again.</p></div></div>
      <div class="tiles t6">${[['Delivered', 'Delivered'], ['Opened', 'Opened'], ['Clicked', 'Clicked'], ['Bounced', 'Bounced'], ['Failed', 'Failed'], ['Complaint', 'Spam Reports']].map(([k, l]) => `<button class="tile lk ${L.status === k ? 'sel' : ''}" data-act="logF" data-k="${k}"><span>${l}</span><b>${num(tot[k])}</b><small>${L.status === k ? 'Filtering below' : 'Last 30 days'}</small></button>`).join('')}</div>
      <div class="card"><div class="ch lgf"><input type="search" placeholder="Search Email, Trader or Message ID" value="${esc(L.q)}" data-live="logs.q" data-key="logq" aria-label="Search logs"><select data-bind="logs.em" aria-label="Email">${'<option value="all">All Emails</option>' + Object.values(E).filter((e) => e.sent).sort((a, b) => a.n.localeCompare(b.n)).map((e) => `<option value="${e.id}" ${L.em === e.id ? 'selected' : ''}>${esc(e.n)}</option>`).join('')}</select><div class="r"><div class="seg">${['all', 'Failed', 'Bounced'].map((k) => `<button class="${L.status === k ? 'on' : ''}" data-act="logF" data-k="${k}">${k === 'all' ? 'All' : k}</button>`).join('')}</div></div></div>
        <div class="tsc"><table class="t"><thead><tr><th>When</th><th>Trader</th><th>Email</th><th>Status</th><th>Details</th><th></th></tr></thead><tbody>${list.length ? list.map((x) => `<tr class="lk" data-act="logRow" data-id="${x.id}"><td class="nw">${esc(x.when)}</td><td class="nw"><b>${esc(x.t)}</b><div class="hint mono">${esc(x.to)}</div></td><td class="nw">${esc(E[x.e].n)}</td><td><span class="b ${STB[x.st]}">${x.st === 'Complaint' ? 'Spam Report' : x.st}</span></td><td class="hint">${esc(x.why || '—')}</td><td class="num nw">${['Failed', 'Bounced'].includes(x.st) ? `<button class="lnk" data-act="resend" data-id="${x.id}">Send Again</button>` : ''}</td></tr>`).join('') : '<tr><td colspan="6" class="empty">No emails match.</td></tr>'}</tbody></table></div></div>
      <p class="hint">Logs are kept for 30 days. Message IDs match the ones in [Email Provider].</p>`;
  }
  function logDrawer() {
    const x = LOGS.find((l) => l.id === S.logs.row); if (!x) return ''; const e = E[x.e];
    const ev = [['Queued', x.when], ['Sent to [Email Provider]', 'Same second']];
    if (x.st === 'Failed') ev.push(['Failed', x.why]); else if (x.st === 'Bounced') ev.push(['Bounced', x.why]); else { ev.push(['Delivered', 'A few seconds later']); if (['Opened', 'Clicked', 'Complaint'].includes(x.st)) ev.push(['Opened', 'Within the hour']); if (x.st === 'Clicked') ev.push(['Clicked', fill(e.cta || 'Link')]); if (x.st === 'Complaint') ev.push(['Spam Report', 'The address was added to the Suppression List']); }
    return `<div class="drw-bg" data-act="closeLog"></div><div class="drw" role="dialog" aria-label="Message details"><div class="drw-h"><h3>${esc(e.n)}</h3><button class="ic" data-act="closeLog" style="margin-left:auto" aria-label="Close">✕</button></div><div class="drw-b">
      <div class="sec"><h4>Message</h4><div class="kv"><div><span>To</span><b class="mono">${esc(x.to)}</b></div><div><span>Trader</span><b>${esc(x.t)}</b></div><div><span>Subject</span><b>${fe(e.s)}</b></div><div><span>From</span><b>${esc(sender(e)[1])}</b></div><div><span>Message ID</span><b class="mono">${x.id}</b></div><div><span>Status</span><b><span class="b ${STB[x.st]}">${x.st === 'Complaint' ? 'Spam Report' : x.st}</span></b></div></div></div>
      <div class="sec"><h4>What Happened</h4><div class="tl">${ev.map(([a, b]) => `<div><i></i><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('')}</div></div>
      <div class="sec"><h4>Email</h4><div class="pvw desktop">${emailHtml(e, 'desktop')}</div></div>
    </div><div class="drw-f">${['Failed', 'Bounced'].includes(x.st) ? `<button class="pill pri" data-act="resend" data-id="${x.id}">Send Again</button>` : ''}<button class="pill" data-act="viewEmail" data-id="${x.e}">Open This Email</button><button class="pill" data-act="closeLog">Close</button></div></div>`;
  }
  function vDomain() {
    const R = S.rules;
    const dns = [['TXT', 'mail.fundedsky.com', 'v=spf1 include:[provider-spf] ~all', 'SPF'], ['CNAME', 'fs1._domainkey.mail.fundedsky.com', 'fs1.dkim.[provider].com', 'DKIM'], ['CNAME', 'fs2._domainkey.mail.fundedsky.com', 'fs2.dkim.[provider].com', 'DKIM'], ['MX', 'bounce.mail.fundedsky.com', 'feedback-smtp.[provider].com', 'Return Path'], ['TXT', '_dmarc.fundedsky.com', 'v=DMARC1; p=quarantine; rua=mailto:dmarc@fundedsky.com', 'DMARC']];
    return `<div class="ph"><div><h1>Sending Domain</h1><p>Where emails come from, and the records that keep them out of spam folders. All domains are listed in ${XL('Settings', 'domains', 'Settings')}.</p></div></div>
      <div class="two">
        <div class="card m0"><div class="ch"><h3>Provider</h3></div><div class="cb fg">
          <div class="prov"><span class="imono">EM</span><div><b>[Email Provider]</b><div class="hint">Primary · sends every email</div></div><span class="b live">Connected</span></div>
          <div class="prov"><span class="imono">BK</span><div><b>[Backup Provider]</b><div class="hint">Takes over if the primary fails</div></div><span class="b ret">Not Set Up</span></div>
          <label class="chk"><input type="checkbox" ${R.failover ? 'checked' : ''} data-bind="rules.failover"> Switch to the Backup Automatically After 3 Failed Sends in a Row</label>
          <button class="pill" data-act="goIntg" style="justify-self:start">Manage Keys in Integrations</button>
        </div></div>
        <div class="card m0"><div class="ch"><h3>Domain</h3><div class="r"><span class="b live">Verified</span></div></div><div class="cb"><div class="kv"><div><span>Domain</span><b class="mono">mail.fundedsky.com</b></div><div><span>Verified</span><b>Nov 2, 2026</b></div><div><span>Daily Limit</span><b>50,000</b></div><div><span>Sent Today</span><b>${num(totals().today)}</b></div></div></div></div>
      </div>
      <div class="card" style="margin-top:14px"><div class="ch"><h3>DNS Records</h3><span class="lab">Add These at Your Domain Host</span><div class="r"><button class="pill sm" data-act="checkDns">Check Again</button></div></div><div class="tsc"><table class="t"><thead><tr><th>Purpose</th><th>Type</th><th>Host</th><th>Value</th><th>Status</th><th></th></tr></thead><tbody>${dns.map(([t, h, v, p]) => `<tr><td class="nw"><b>${p}</b></td><td class="mono">${t}</td><td class="mono nw">${h}</td><td class="mono dnsv">${esc(v)}</td><td><span class="b live">Verified</span></td><td class="num"><button class="lnk" data-act="copy" data-k="${esc(v)}">Copy</button></td></tr>`).join('')}</tbody></table></div></div>
      <div class="card"><div class="ch"><h3>Sender Addresses</h3><span class="lab">Replies Go to Support</span></div><div class="tsc"><table class="t"><thead><tr><th>Name</th><th>Address</th><th>Used For</th><th class="num">Emails</th></tr></thead><tbody>${Object.entries(SENDERS).map(([k, [n, a]]) => { const c = Object.values(E).filter((e) => e.fr === k); return `<tr><td class="nw"><b>${esc(n)}</b></td><td class="mono">${a}</td><td>${esc(c.slice(0, 3).map((e) => e.n).join(', '))}${c.length > 3 ? ` and ${c.length - 3} more` : ''}</td><td class="num">${c.length}</td></tr>`; }).join('')}</tbody></table></div></div>`;
  }
  function vRules() {
    const R = S.rules; const mk = Object.values(E).filter((e) => e.mk);
    return `<div class="ph"><div><h1>Sending Rules</h1><p>Limits on marketing emails. Account emails, like codes, receipts and risk alerts, always send right away. Customer segments for campaigns come from ${XL('Analytics', 'segments', 'Analytics')}.</p></div></div>
      <div class="card ${R.pauseMk ? 'warnc' : ''}"><div class="ch"><h3>Pause All Marketing</h3><span class="lab">${mk.length} Marketing Emails</span><div class="r"><button class="sw ${R.pauseMk ? 'on' : ''}" data-act="rule" data-k="pauseMk" role="switch" aria-checked="${R.pauseMk}" aria-label="Pause all marketing"></button></div></div><div class="cb hint">Stops every marketing email at once, for example during an outage. Account emails keep sending.</div></div>
      <div class="two">
        <div class="card m0"><div class="ch"><h3>Quiet Hours</h3><div class="r"><button class="sw ${R.quiet ? 'on' : ''}" data-act="rule" data-k="quiet" role="switch" aria-checked="${R.quiet}" aria-label="Quiet hours"></button></div></div><div class="cb fg"><div class="fg2"><div class="fl"><label>From</label><input type="time" value="${R.qFrom}" data-bind="rules.qFrom"></div><div class="fl"><label>Until</label><input type="time" value="${R.qTo}" data-bind="rules.qTo"></div></div><span class="hint">In each trader's own time zone. Marketing emails due in quiet hours wait until morning.</span></div></div>
        <div class="card m0"><div class="ch"><h3>How Often</h3></div><div class="cb fg"><div class="fg2"><div class="fl"><label>Most Marketing Emails per Day</label><select data-bind="rules.capDay">${['1', '2', '3'].map((v) => `<option ${R.capDay === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div><div class="fl"><label>Most per Week</label><select data-bind="rules.capWeek">${['2', '3', '5', '7'].map((v) => `<option ${R.capWeek === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div><label class="chk"><input type="checkbox" ${R.noMkAfterBreach ? 'checked' : ''} data-bind="rules.noMkAfterBreach"> No Marketing for 24 Hours After an Account Closes</label></div></div>
      </div>
      <div class="card" style="margin-top:14px"><div class="ch"><h3>Test Mode</h3><span class="lab">${R.test ? 'On: No Trader Gets Anything' : 'Off'}</span><div class="r"><button class="sw ${R.test ? 'on' : ''}" data-act="rule" data-k="test" role="switch" aria-checked="${R.test}" aria-label="Test mode"></button></div></div><div class="cb fg"><div class="fl"><label>Send Everything To</label><input value="${esc(R.testTo)}" data-bind="rules.testTo"></div><span class="hint">Every email, account emails included, goes to this inbox instead of the trader. Use it on staging, never in production.</span></div></div>`;
  }
  function vBrand() {
    const B = S.brand;
    return `<div class="ph"><div><h1>Brand and Footer</h1><p>The header and footer every email shares. Changes apply to all ${Object.keys(E).length} emails. Logo and colors come from ${XL('Settings', 'brand', 'Settings')}.</p></div></div>
      <div class="two wl"><div class="card m0"><div class="ch"><h3>Footer</h3></div><div class="cb fg">
        <div class="fl"><label>Company Address</label><input value="${esc(B.address)}" data-live="brand.address" data-key="baddr"><span class="hint">Required by anti-spam laws in most countries.</span></div>
        <div class="fl"><label>Support Email</label><input value="${esc(B.support)}" data-live="brand.support" data-key="bsup"></div>
        <div class="fl"><label>Legal Line</label><textarea data-live="brand.legal" data-key="blegal">${esc(B.legal)}</textarea></div>
        <div class="fg2"><div class="fl"><label>X</label><input value="${esc(B.x)}" data-live="brand.x" data-key="bx"></div><div class="fl"><label>Discord</label><input value="${esc(B.discord)}" data-live="brand.discord" data-key="bd"></div></div>
        <div class="fl"><label>Header</label><div class="brandrow"><span class="em-logo">fundedsky<i>futures</i></span><span class="hint">Logo and sky accent come from the Funded Sky design system.</span></div></div>
      </div></div>
      <div class="card m0"><div class="ch"><h3>Preview</h3><span class="lab">Welcome to Funded Sky</span></div><div class="cb"><div class="pvw desktop">${emailHtml(E.welcome, 'desktop')}</div></div></div></div>`;
  }
  function vSupp() {
    const c = (k) => S.supp.filter((x) => x.k === k).length;
    return `<div class="ph"><div><h1>Suppression List</h1><p>Addresses that won't get some or all emails. Bounces and spam reports are added automatically.</p></div></div>
      <div class="tiles t3">${[['Bounced', 'Get nothing until removed'], ['Complained', 'Get account emails only'], ['Unsubscribed', 'Get account emails only']].map(([k, s]) => `<div class="tile"><span>${k === 'Complained' ? 'Spam Reports' : k}</span><b>${c(k)}</b><small>${s}</small></div>`).join('')}</div>
      <div class="card"><div class="ch"><h3>Addresses</h3><div class="r addr"><input placeholder="name@example.com" data-key="suppadd" id="suppadd" aria-label="Address to add"><button class="pill sm" data-act="suppAdd">Add Address</button></div></div><div class="tsc"><table class="t"><thead><tr><th>Address</th><th>Reason</th><th>Details</th><th>Added</th><th></th></tr></thead><tbody>${S.supp.length ? S.supp.map((x, i) => `<tr><td class="mono">${esc(x.a)}</td><td><span class="b ${x.k === 'Bounced' ? 'err' : x.k === 'Complained' ? 'draft' : 'plain'}">${x.k === 'Complained' ? 'Spam Report' : x.k}</span></td><td class="hint">${esc(x.why)}</td><td class="nw">${esc(x.d)}</td><td class="num"><button class="lnk" data-act="suppDel" data-i="${i}">Remove</button></td></tr>`).join('') : '<tr><td colspan="5" class="empty">No suppressed addresses.</td></tr>'}</tbody></table></div></div>
      <p class="hint">Removing a bounced address lets the next email try again. Only remove spam reports if the trader asks.</p>`;
  }
  function fullModal() {
    if (!S.full) return ''; const d = draftOf(cur());
    return `<div class="mdl-bg" data-act="closeFull"></div><div class="mdl" role="dialog" aria-label="Full size preview"><div class="mdl-h"><b>${esc(d.n)}</b><div class="seg">${[['desktop', 'Desktop'], ['phone', 'Phone']].map(([k, l]) => `<button class="${S.dev === k ? 'on' : ''}" data-act="dev" data-k="${k}">${l}</button>`).join('')}</div><button class="ic" data-act="closeFull" aria-label="Close">✕</button></div><div class="mdl-b">${inbox(d)}<div class="pvw ${S.dev} big">${emailHtml(d, S.dev)}</div></div></div>`;
  }

  // ---------- render ----------
  const toast = (t) => { S.toast = t; render(); clearTimeout(toast.t); toast.t = setTimeout(() => { S.toast = ''; render(); }, 2400); };
  function render() {
    const T = totals(); const m = root.querySelector('.main'); const st = m ? m.scrollTop : 0; const pb = root.querySelector('.ep-b'); const pst = pb ? pb.scrollTop : 0;
    const views = { flow: vFlow, logs: vLogs, domain: vDomain, rules: vRules, brand: vBrand, supp: vSupp };
    const isFlow = S.view === 'flow';
    root.innerHTML = `<div class="tb"><a class="pill bk" href="AdminHome.dc.html" aria-label="Back to Admin">←<span class="lg"> Back to Admin</span></a><span class="tb-t">Emails</span>
      <div class="tb-mid hm"><div class="tb-stats"><div><span>Sent Today</span><b>${num(T.today)}</b></div><div><span>7 Days</span><b>${num(T.week)}</b></div><div><span>30 Days</span><b>${num(T.sent)}</b></div><div><span>Opened</span><b>${T.open}%</b></div><div><span>Clicked</span><b>${T.click}%</b></div><div><span>Failed</span><b class="bad">${T.failed}</b></div></div></div>
      <div class="igs hm"><button class="ig" data-act="go" data-v="domain" title="[Email Provider]: connected" aria-label="Email provider"><span>EM</span><i style="background:var(--ok)"></i></button><button class="sendw" data-act="go" data-v="domain">Sending with [Email Provider]</button></div>
      ${S.rules.test ? '<span class="envchip">Test Mode</span>' : S.rules.pauseMk ? '<span class="envchip">Marketing Paused</span>' : ''}
      <button class="pill ${S.view === 'logs' ? 'act' : ''}" data-act="go" data-v="logs">Email Logs</button></div>
    <div class="body ${isFlow ? '' : 'wide'}"><div class="mnav"><select id="mnavsel" aria-label="Go to section">${mnavHtml()}</select></div><nav class="nav" aria-label="Email flows">${navHtml()}</nav><main class="main ${isFlow ? 'flowv' : ''}">${(views[S.view] || views[(S.view = 'flow')])()}${S.view === 'logs' ? logDrawer() : ''}</main>${isFlow ? `<div class="ep-bg ${S.panel ? 'open' : ''}" data-act="closePanel"></div><aside class="ep ${S.panel ? 'open' : ''}" aria-label="Email details">${panel()}</aside>` : ''}</div>
    ${fullModal()}${S.toast ? `<div class="toast" role="status">${esc(S.toast)}</div>` : ''}`;
    const m2 = root.querySelector('.main'); if (m2) m2.scrollTop = st; const pb2 = root.querySelector('.ep-b'); if (pb2) pb2.scrollTop = pst;
    if (S.focus) { const el = root.querySelector(`[data-key="${S.focus.k}"]`); if (el) { el.focus(); try { el.setSelectionRange(S.focus.s, S.focus.s); } catch (x) { /* not a text field */ } } S.focus = null; }
  }

  // ---------- events ----------
  const startEdit = (e) => { if (!S.edit || S.edit.id !== e.id) S.edit = { id: e.id, f: JSON.parse(JSON.stringify(e)) }; return S.edit.f; };
  root.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]'); if (!el || !root.contains(el)) return;
    if (el.tagName === 'INPUT' && el.type !== 'checkbox') return;
    const a = el.dataset.act, id = el.dataset.id, k = el.dataset.k, i = +el.dataset.i; const e = cur();
    switch (a) {
      case 'go': S.view = el.dataset.v; S.logs.row = null; S.panel = false; break;
      case 'flow': { S.panel = false; if (S.view === 'flow' && S.flow === id) S.open[id] = !S.open[id]; else { S.open = { [id]: true }; S.flow = id; S.view = 'flow'; const first = emailsIn(FLOWS.find((f) => f.id === id))[0]; if (first) { S.sel = first.id; S.who.row = -1; } } break; }
      case 'pick': { const f = flowOf(id); S.view = 'flow'; if (S.flow !== f.id) S.open = {}; S.flow = f.id; S.open[f.id] = true; S.sel = id; S.panel = true; S.who.row = -1; if (S.edit && S.edit.id !== id) S.edit = null; if (S.tab === 'edit' && !E[id].custom) S.tab = S.tab; break; }
      case 'closePanel': S.panel = false; break;
      case 'tab': S.tab = k; break;
      case 'emOn': { const x = E[id]; x.on = !x.on; if (x.draft && x.on) x.draft = false; toast(`${x.n} ${x.on ? 'turned on' : 'turned off'}`); return; }
      case 'flowOn': { const f = FLOWS.find((x) => x.id === id); f.paused = !f.paused; toast(f.paused ? `${f.name} paused. Always-on emails still send.` : `${f.name} is on`); return; }
      case 'dev': S.dev = k; break;
      case 'test': toast(`Test of "${e.n}" sent to ${S.rules.testTo}`); return;
      case 'full': S.full = true; break;
      case 'closeFull': S.full = false; break;
      case 'range': S.range = +k; break;
      case 'whoF': S.who.f = k; S.who.row = -1; break;
      case 'whoRow': S.who.row = S.who.row === i ? -1 : i; break;
      case 'efType': if (e.req) return; startEdit(e).mk = k === 'mk' ? 1 : 0; break;
      case 'copyMerge': try { navigator.clipboard.writeText(k); } catch (x) { /* clipboard blocked */ } toast(`Copied ${k}`); return;
      case 'saveEdit': { if (!S.edit) return; const f = S.edit.f; const keep = { id: e.id, sent: e.sent, open: e.open, click: e.click, bounce: e.bounce, unsub: e.unsub, on: e.on, hist: e.hist, custom: e.custom, draft: e.draft, req: e.req };
        Object.assign(e, f, keep); e.v += 1; e.hist.unshift({ v: e.v, who: ME, when: 'Just now', text: 'Edited wording' }); S.edit = null; toast(`Saved. Version ${e.v} sends from now on.`); return; }
      case 'discardEdit': S.edit = null; break;
      case 'delEmail': { const f = flowOf(e.id); f.lanes.forEach((l) => { const j = l.indexOf('E:' + e.id); if (j >= 0) l.splice(j, 1); }); delete E[e.id]; S.sel = (emailsIn(f)[0] || {}).id; S.edit = null; S.tab = 'preview'; toast('Email deleted'); return; }
      case 'addEmail': { const f = FLOWS.find((x) => x.id === id); const nid = uid('custom'); E[nid] = { id: nid, n: '[New Email]', w: 'Set when this sends', fr: 'hello', s: '[Subject]', p: '[Preview text]', e: '[Small Heading]', h: '[Headline]', a: '', b: ['[Body]'], cta: '', sent: 0, open: 0, click: 0, bounce: 0, unsub: 0, on: false, draft: true, custom: true, v: 1, hist: [] }; f.lanes[i].push('E:' + nid); S.sel = nid; S.tab = 'edit'; S.panel = true; startEdit(E[nid]); toast('New email added as a draft. It stays off until you turn it on.'); return; }
      case 'logF': S.logs.status = S.logs.status === k ? 'all' : k; break;
      case 'logRow': S.logs.row = id; break;
      case 'closeLog': S.logs.row = null; break;
      case 'resend': { const x = LOGS.find((l) => l.id === id); if (S.supp.some((s) => s.a === x.to && s.k !== 'Unsubscribed')) { toast(`${x.to} is on the Suppression List. Remove it first.`); return; } x.st = 'Delivered'; x.why = 'Sent again by ' + ME; toast('Sent again'); return; }
      case 'viewEmail': S.view = 'flow'; S.flow = flowOf(id).id; S.open = { [S.flow]: true }; S.sel = id; S.panel = true; S.tab = 'preview'; S.logs.row = null; break;
      case 'goIntg': toast('Opens Integrations in the Checkout Catalog'); return;
      case 'checkDns': toast('All 5 records verified'); return;
      case 'copy': try { navigator.clipboard.writeText(k); } catch (x) { /* clipboard blocked */ } toast('Copied'); return;
      case 'rule': S.rules[k] = !S.rules[k]; break;
      case 'suppDel': { const x = S.supp.splice(i, 1)[0]; toast(`${x.a} removed`); return; }
      case 'suppAdd': { const inp = root.querySelector('#suppadd'); const v = (inp.value || '').trim(); if (!/^\S+@\S+\.\S+$/.test(v)) { toast('Enter a full email address'); return; } S.supp.unshift({ a: v, k: 'Unsubscribed', why: 'Added by ' + ME, d: 'Nov 22' }); toast(`${v} added`); return; }
      default: return;
    }
    render();
  });
  root.addEventListener('input', (ev) => {
    const el = ev.target; const lv = el.dataset && el.dataset.live; if (!lv) return;
    const [o, k] = lv.split('.');
    if (o === 'ef') { const f = startEdit(cur()); f[k] = k === 'b' ? el.value.split(/\n\s*\n/) : el.value; }
    else if (o === 'who') { S.who.q = el.value; S.who.row = -1; }
    else if (o === 'logs') S.logs.q = el.value;
    else if (o === 'brand') S.brand[k] = el.value;
    S.focus = { k: el.dataset.key, s: el.selectionStart };
    render();
  });
  root.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.id === 'mnavsel') { const [t, v] = el.value.split(':'); if (t === 'f') { S.view = 'flow'; S.flow = v; S.open = { [v]: true }; const first = emailsIn(FLOWS.find((f) => f.id === v))[0]; if (first) S.sel = first.id; S.panel = false; } else S.view = v; render(); const m = root.querySelector('.main'); if (m) m.scrollTop = 0; return; }
    const b = el.dataset.bind; if (!b) return; const [o, k] = b.split('.');
    if (o === 'ef') startEdit(cur())[k] = el.value;
    else if (o === 'logs') S.logs[k] = el.value;
    else if (o === 'rules') S.rules[k] = el.type === 'checkbox' ? el.checked : el.value;
    render();
  });
  document.addEventListener('keydown', (ev) => { if (!root.isConnected) return; if (ev.key === 'Escape') { if (S.full) S.full = false; else if (S.logs.row) S.logs.row = null; else if (S.panel) S.panel = false; else return; render(); } });

  function ROUTE(hv, P) { if (hv) S.view = hv; if (P.flow) { S.flow = P.flow; S.open[P.flow] = true; } }
  // deep links: Board.dc.html#view?key=value
  const DEEP = () => { try { const raw = decodeURIComponent((location.hash || '').slice(1)); if (!raw) return; const [hv, hq] = raw.split('?'); const P = {}; (hq || '').split('&').forEach((kv) => { const [k, v] = kv.split('='); if (k) P[k] = v || ''; }); ROUTE(hv, P); } catch (e) { /* no deep link */ } };
  DEEP();
  window.addEventListener('hashchange', () => { if (!root.isConnected) return; if ('drawer' in S) S.drawer = null; DEEP(); render(); const mm = root.querySelector('.main'); if (mm) mm.scrollTop = 0; });
  render();

}
