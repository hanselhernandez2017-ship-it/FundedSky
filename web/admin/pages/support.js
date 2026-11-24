
function startSupport(root) {

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
  const ME = '[Your Name]';
  const AGENTS = [
    { id: 'me', name: ME, role: 'Lead', st: 'online', limit: 500, open: 0, solved: 64, frt: 14, csat: 96 },
    { id: 'a2', name: '[Agent 2]', role: 'Agent', st: 'online', limit: 150, open: 0, solved: 81, frt: 11, csat: 94 },
    { id: 'a3', name: '[Agent 3]', role: 'Agent', st: 'away', limit: 150, open: 0, solved: 58, frt: 19, csat: 92 },
    { id: 'a4', name: '[Risk Reviewer]', role: 'Risk', st: 'online', limit: 0, open: 0, solved: 22, frt: 42, csat: 88 },
    { id: 'a5', name: '[Agent 5]', role: 'Agent', st: 'offline', limit: 150, open: 0, solved: 47, frt: 16, csat: 95 }
  ];
  const CATS = { payouts: 'Payouts', breach: 'Breach Dispute', billing: 'Billing and Refunds', kyc: 'Identity Check', platform: 'Platform and Login', rules: 'Rules Question', account: 'Account Changes', affiliates: 'Affiliates', risk: 'Risk Flag' };
  const CH = { email: 'Email', chat: 'Live Chat', discord: 'Discord' };
  const PRI = { urgent: ['Urgent', 'var(--no)'], high: ['High', 'var(--wa)'], normal: ['Normal', 'var(--mu)'], low: ['Low', 'var(--fa)'] };
  const STS = { open: 'Open', pending: 'Waiting on Trader', hold: 'On Hold', solved: 'Solved' };

  const TRADERS = {
    t1043: { id: '1043', name: 'Jane D.', email: 'j***@gmail.com', country: 'United States', tz: 'ET', joined: 'Mar 2026', spend: 1248, orders: 6, kyc: 'Verified', payouts: [2, 3120], csat: 5, accts: [['FS-F-50K-2207', 'Funded · $50K', 'Active', '$51,840', '+$1,840'], ['FS-50K-10432', '[Plan B Name] $50K', 'Active', '$51,240', '+$1,240'], ['FS-25K-09811', '[Plan A Name] $25K', 'Closed', '$23,410', 'Drawdown']], flags: [] },
    t1031: { id: '1031', name: 'Marcus T.', email: 'm***@outlook.com', country: 'United Kingdom', tz: 'GMT', joined: 'Aug 2026', spend: 612, orders: 3, kyc: 'Not Started', payouts: [0, 0], accts: [['FS-100K-10388', '[Plan B Name] $100K', 'Closed', '$96,912', 'Drawdown'], ['FS-50K-10201', '[Plan B Name] $50K', 'Active', '$50,420', '+$420']], flags: [] },
    t1027: { id: '1027', name: 'Priya S.', email: 'p***@proton.me', country: 'India', tz: 'IST', joined: 'Oct 2026', spend: 169, orders: 1, kyc: 'Not Started', payouts: [0, 0], accts: [['FS-50K-10399', '[Plan B Name] $50K', 'Active', '$50,000', '$0']], flags: [] },
    t1019: { id: '1019', name: 'Diego R.', email: 'd***@yahoo.com', country: 'Mexico', tz: 'CT', joined: 'Sep 2026', spend: 508, orders: 4, kyc: 'Verified', payouts: [0, 0], accts: [['FS-25K-10310', '[Plan A Name] $25K', 'Active', '$25,610', '+$610']], flags: [] },
    t1012: { id: '1012', name: 'Amara O.', email: 'a***@gmail.com', country: 'Nigeria', tz: 'WAT', joined: 'Jun 2026', spend: 438, orders: 3, kyc: 'Rejected', payouts: [0, 0], accts: [['FS-50K-09870', '[Plan B Name] $50K', 'Passed', '$53,100', '+$3,100']], flags: [] },
    t1008: { id: '1008', name: 'Kenji M.', email: 'k***@icloud.com', country: 'Japan', tz: 'JST', joined: 'Nov 2026', spend: 79, orders: 1, kyc: 'Not Started', payouts: [0, 0], accts: [['FS-25K-10421', '[Plan C Name] $25K', 'Active', '$25,000', '$0']], flags: [] },
    t0996: { id: '0996', name: 'Sofia L.', email: 's***@gmail.com', country: 'Spain', tz: 'CET', joined: 'Feb 2026', spend: 2310, orders: 11, kyc: 'Verified', payouts: [4, 7480], accts: [['FS-F-100K-1984', 'Funded · $100K', 'Active', '$104,200', '+$4,200'], ['FS-100K-10011', '[Plan B Name] $100K', 'Passed', '$106,050', '+$6,050']], flags: [] },
    t0988: { id: '0988', name: 'Liam K.', email: 'l***@hotmail.com', country: 'Canada', tz: 'ET', joined: 'Jul 2026', spend: 1184, orders: 7, kyc: 'Verified', payouts: [1, 960], accts: [['FS-50K-10290', '[Plan B Name] $50K', 'Active', '$50,880', '+$880'], ['FS-50K-10291', '[Plan B Name] $50K', 'Active', '$49,120', '−$880']], flags: ['Opposite trades on two accounts'] },
    t0975: { id: '0975', name: 'Noah B.', email: 'n***@gmail.com', country: 'Australia', tz: 'AEST', joined: 'May 2026', spend: 357, orders: 2, kyc: 'Verified', payouts: [0, 0], accts: [['FS-50K-10414', '[Plan B Name] $50K', 'Active', '$50,000', 'Reset today']], flags: [] },
    t0960: { id: '0960', name: '[Affiliate Name 2]', email: 'c***@gmail.com', country: 'United States', tz: 'PT', joined: 'Jan 2026', spend: 0, orders: 0, kyc: 'Verified', payouts: [0, 0], accts: [], flags: [], affiliate: 'TRADEWITHX' },
    t0951: { id: '0951', name: 'Elena V.', email: 'e***@outlook.com', country: 'Germany', tz: 'CET', joined: 'Apr 2026', spend: 248, orders: 2, kyc: 'Not Started', payouts: [0, 0], accts: [['FS-25K-10102', '[Plan C Name] $25K', 'Cancelled', '$25,300', '+$300']], flags: [] },
    t0942: { id: '0942', name: 'Omar H.', email: 'o***@yahoo.com', country: 'United Arab Emirates', tz: 'GST', joined: 'Sep 2026', spend: 259, orders: 1, kyc: 'Not Started', payouts: [0, 0], accts: [['FS-100K-10405', '[Plan B Name] $100K', 'Active', '$100,640', '+$640']], flags: [] }
  };

  // f: t trader · a agent · n internal note · s system
  const TICKETS = [
    { id: 4815, subj: "My account was closed but I never hit the drawdown", cat: 'breach', pri: 'urgent', st: 'open', ch: 'email', tr: 't1031', ag: 'me', sla: -12, age: '2h', review: 'BR-212', msgs: [
      { f: 't', t: 'Today, 10:41 AM', b: "Hi, my $100K account FS-100K-10388 was closed this morning for max drawdown. My balance never went below $97,000 on my side. I think there's a mistake. Can someone check?" },
      { f: 's', t: 'Today, 10:42 AM', b: 'Linked to breach review BR-212 automatically.' },
      { f: 'n', who: ME, t: 'Today, 11:05 AM', b: 'Open position on NQ at 10:02 dipped to $96,912 before he closed it. Floor counts open P&L. Sending to the risk reviewer to confirm before we reply.' }
    ] },
    { id: 4830, subj: 'Reset paid but my balance is still the old one', cat: 'billing', pri: 'urgent', st: 'open', ch: 'chat', tr: 't0975', ag: null, sla: 6, age: '24m', msgs: [
      { f: 't', t: 'Today, 12:18 PM', b: 'I paid $46.50 for the reset 20 minutes ago and Tradovate still shows the closed account. Market is open, I need to trade.' },
      { f: 's', t: 'Today, 12:18 PM', b: 'Order FS-ORD-2302 paid. Reset job finished on our side at 12:01 PM. Platform sync shows Pending.' }
    ] },
    { id: 4816, subj: "Can't log in to Tradovate with the details you sent", cat: 'platform', pri: 'high', st: 'open', ch: 'email', tr: 't1027', ag: 'a2', sla: 18, age: '41m', msgs: [
      { f: 't', t: 'Today, 12:01 PM', b: 'It says invalid credentials. I copied the username FS10399 exactly. Do I need a different server?' }
    ] },
    { id: 4817, subj: 'I was charged twice for one evaluation', cat: 'billing', pri: 'high', st: 'open', ch: 'email', tr: 't1019', ag: null, sla: 44, age: '1h', msgs: [
      { f: 't', t: 'Today, 11:30 AM', b: 'My bank shows two charges of $99 on Nov 21 but I only have one account. Please refund one.' },
      { f: 's', t: 'Today, 11:30 AM', b: 'Two payments found: FS-ORD-2287 (paid, account created) and FS-ORD-2288 (paid, no account: checkout was submitted twice).' }
    ] },
    { id: 4827, subj: "Rise payout hasn't arrived after 3 days", cat: 'payouts', pri: 'high', st: 'open', ch: 'email', tr: 't0996', ag: 'me', sla: 70, age: '3h', msgs: [
      { f: 't', t: 'Today, 9:52 AM', b: 'My $2,140 payout was marked Sent on Nov 19 but nothing in Rise yet. Reference RISE-88102.' },
      { f: 'a', who: ME, t: 'Today, 10:20 AM', b: "Hi Sofia, thanks for the reference. I've asked Rise to trace it and will update you today." },
      { f: 'n', who: ME, t: 'Today, 10:21 AM', b: 'Opened a trace with Rise, case #R-5521.' }
    ] },
    { id: 4818, subj: 'Identity check rejected, my passport is valid', cat: 'kyc', pri: 'normal', st: 'open', ch: 'email', tr: 't1012', ag: null, sla: 132, age: '2h', msgs: [
      { f: 't', t: 'Today, 10:40 AM', b: "I passed the evaluation and the identity check said my document didn't match. My passport is valid until 2031. My account name is my nickname, maybe that's why?" }
    ] },
    { id: 4819, subj: 'Is trading allowed during CPI tomorrow?', cat: 'rules', pri: 'normal', st: 'open', ch: 'chat', tr: 't1008', ag: null, sla: 9, age: '6m', msgs: [
      { f: 't', t: 'Today, 12:36 PM', b: 'Can I hold a position through the CPI release tomorrow, or do I have to close it?' }
    ] },
    { id: 4821, subj: 'Consistency rule: why is my payout blocked?', cat: 'rules', pri: 'normal', st: 'pending', ch: 'email', tr: 't1043', ag: 'me', sla: null, age: '1d', msgs: [
      { f: 't', t: 'Yesterday, 4:12 PM', b: 'I requested a payout and it says consistency rule not met. What does that mean?' },
      { f: 'a', who: ME, t: 'Yesterday, 4:40 PM', b: 'Hi Jane, on funded accounts no single day can be more than 40% of total profit when you request a payout. Your best day is 52% right now. A couple more profitable days will bring it under 40%. Want me to show you the numbers?' }
    ] },
    { id: 4822, subj: 'Please move my account to NinjaTrader', cat: 'account', pri: 'normal', st: 'open', ch: 'discord', tr: 't0942', ag: null, sla: 210, age: '3h', msgs: [
      { f: 't', t: 'Today, 9:40 AM', b: "Hey, I picked Tradovate by mistake. Can you switch FS-100K-10405 to NinjaTrader? I haven't traded much." }
    ] },
    { id: 4823, subj: 'Missing commission for 3 referrals', cat: 'affiliates', pri: 'low', st: 'open', ch: 'email', tr: 't0960', ag: null, sla: 600, age: '5h', msgs: [
      { f: 't', t: 'Today, 7:50 AM', b: "Three of my followers bought with TRADEWITHX on Nov 18 but my dashboard only shows 18 uses, not 21." }
    ] },
    { id: 4825, subj: 'BLACKFRIDAY code says expired', cat: 'billing', pri: 'normal', st: 'open', ch: 'chat', tr: 't0951', ag: 'a2', sla: 22, age: '12m', msgs: [
      { f: 't', t: 'Today, 12:30 PM', b: 'I tried BLACKFRIDAY at checkout and it says the code is not active.' }
    ] },
    { id: 4829, subj: 'Why are my two accounts flagged?', cat: 'risk', pri: 'high', st: 'hold', ch: 'email', tr: 't0988', ag: 'a4', sla: null, age: '1d', msgs: [
      { f: 't', t: 'Yesterday, 2:05 PM', b: 'I got a warning email about my trades. I trade two accounts with different strategies, is that not allowed?' },
      { f: 'n', who: '[Risk Reviewer]', t: 'Yesterday, 3:30 PM', b: 'Opposite positions on 10290 and 10291 within 2 seconds, 6 times on Nov 20. Matches hedging across accounts. Holding until the review is done.' }
    ] },
    { id: 4820, subj: "Refund please, I haven't placed any trade", cat: 'billing', pri: 'normal', st: 'open', ch: 'email', tr: 't0951', ag: null, sla: 300, age: '4h', msgs: [
      { f: 't', t: 'Today, 8:55 AM', b: "I bought a $25K account yesterday but changed my mind. I haven't traded at all. Can I get a refund?" }
    ] },
    { id: 4824, subj: 'What time does the daily loss reset?', cat: 'rules', pri: 'low', st: 'solved', ch: 'discord', tr: 't1027', ag: 'a3', sla: null, age: '1d', csat: 5, msgs: [
      { f: 't', t: 'Yesterday, 9:10 AM', b: 'When does the daily loss limit reset?' },
      { f: 'a', who: '[Agent 3]', t: 'Yesterday, 9:14 AM', b: 'It resets at 5:00 PM ET every trading day.' }
    ] },
    { id: 4812, subj: 'When will my payout be approved?', cat: 'payouts', pri: 'normal', st: 'solved', ch: 'email', tr: 't1043', ag: 'me', sla: null, age: '2d', csat: 5, msgs: [
      { f: 't', t: 'Nov 20, 9:02 AM', b: 'I requested my first payout yesterday. How long does approval take?' },
      { f: 'a', who: ME, t: 'Nov 20, 9:30 AM', b: 'Hi Jane, your payout was approved this morning and goes out through Rise today.' }
    ] },
    { id: 4808, subj: 'How do I get my funded certificate?', cat: 'account', pri: 'low', st: 'solved', ch: 'chat', tr: 't0996', ag: 'a2', sla: null, age: '3d', csat: 4, msgs: [
      { f: 't', t: 'Nov 19, 6:10 PM', b: 'Where can I download my certificate?' },
      { f: 'a', who: '[Agent 2]', t: 'Nov 19, 6:12 PM', b: 'It is on your dashboard under Achievements, and we also emailed it to you.' }
    ] }
  ];

  const MACROS = [
    { id: 'm1', name: 'Breach Explained: Drawdown Counts Open Trades', cat: 'breach', uses: 41, body: "Hi {first_name}, thanks for reaching out. The max drawdown counts open positions too, not only closed trades. On {account}, an open position took the balance below the floor at the time shown in your dashboard, which ended the evaluation. I've attached the trade timeline. If you'd like to try again, you can reset this account from your dashboard." },
    { id: 'm2', name: 'Payout Timeline', cat: 'payouts', uses: 63, body: "Hi {first_name}, payouts are reviewed within 1 to 2 business days. Once approved, Rise usually shows the money within a few hours. We'll email you at each step." },
    { id: 'm3', name: 'Platform Login Steps', cat: 'platform', uses: 88, body: "Hi {first_name}, please log in at the platform's own login page with the username from your Your Evaluation Is Ready email, and choose the password on first login. If you still can't get in, reply with a screenshot of the error and we'll fix it right away." },
    { id: 'm4', name: 'Duplicate Charge Refunded', cat: 'billing', uses: 17, body: "Hi {first_name}, you're right, checkout was submitted twice. I've refunded the second charge. Banks usually show it within 5 to 10 business days." },
    { id: 'm5', name: 'Refund Policy: No Trades Placed', cat: 'billing', uses: 22, body: "Hi {first_name}, since no trades were placed on {account} and it's within 14 days, we can refund it. The account will be closed. I've started the refund now." },
    { id: 'm6', name: 'Identity Check: Name Mismatch', cat: 'kyc', uses: 12, body: "Hi {first_name}, the identity check needs the name on your account to match your ID. I've updated your account name to match your passport. Please start the check again from your dashboard." },
    { id: 'm7', name: 'News Rule', cat: 'rules', uses: 54, body: "Hi {first_name}, you can hold positions through high-impact news. The rule is that no new trades can be opened or closed in the 2 minutes before and after the release. The economic calendar on your dashboard shows each one." },
    { id: 'm8', name: 'Consistency Rule', cat: 'rules', uses: 39, body: "Hi {first_name}, on funded accounts no single day can be more than 40% of total profit when you request a payout. Spreading profit across more days fixes it, and your dashboard shows your current share." },
    { id: 'm9', name: 'Platform Switch Done', cat: 'account', uses: 15, body: "Hi {first_name}, {account} now runs on the new platform. Your new login is in the email we just sent. Your balance and trading days carried over." },
    { id: 'm10', name: 'Promo Code Not Active Yet', cat: 'billing', uses: 9, body: "Hi {first_name}, that code starts on Nov 24 at midnight ET. If you buy before then, reply with your order number and we'll apply the difference once the sale starts." }
  ];

  const REVIEWS = [
    { id: 'BR-212', tk: 4815, tr: 't1031', acct: 'FS-100K-10388', rule: 'Max Drawdown', limit: 'Floor $97,000', when: 'Nov 22, 10:02 AM ET', claim: 'Says the balance never went below $97,000.', st: 'open', first: null, trades: [['10:00:12', 'NQ', 'Buy', 2, '21,104.25', '—', '$97,840', '$97,000'], ['10:02:41', 'NQ', 'Open P&L', 2, '21,072.00', '−$928', '$96,912', '$97,000'], ['10:03:05', 'NQ', 'Sell', 2, '21,079.50', '−$990', '$96,850', 'Closed']] },
    { id: 'BR-209', tk: 4801, tr: 't1043', acct: 'FS-25K-09811', rule: 'Max Drawdown', limit: 'Floor $23,500', when: 'Nov 18, 2:44 PM ET', claim: 'Asked for a second look at slippage on a stop order.', st: 'upheld', first: '[Risk Reviewer]', second: ME, trades: [['14:44:02', 'ES', 'Sell Stop', 1, '5,980.25', '−$412', '$23,410', '$23,500']] },
    { id: 'BR-205', tk: 4790, tr: 't0996', acct: 'FS-100K-10011', rule: 'Daily Loss Limit', limit: '$2,200', when: 'Nov 15, 9:31 AM ET', claim: 'Platform froze during the open and the stop never filled.', st: 'reinstated', first: '[Risk Reviewer]', second: ME, trades: [['09:30:58', 'NQ', 'Buy', 3, '20,880.00', '—', '$104,100', '—'], ['09:31:40', 'NQ', 'Open P&L', 3, '20,842.50', '−$2,250', '$101,850', 'Limit hit']] }
  ];

  const ARTICLES = [
    { id: 'h1', cat: 'Rules', t: 'How the Max Drawdown Works', views: 4820, help: 91, st: 'Published', up: 'Nov 12', body: 'The max drawdown is the lowest your balance can go, counting open trades. It follows your highest end-of-day balance and never moves down.' },
    { id: 'h2', cat: 'Rules', t: 'The Daily Loss Limit', views: 3911, help: 88, st: 'Published', up: 'Nov 12', body: 'The daily loss limit is the most you can lose in one trading day, open and closed trades together. It resets at 5:00 PM ET.' },
    { id: 'h3', cat: 'Rules', t: 'Trading Around High-Impact News', views: 2240, help: 84, st: 'Published', up: 'Nov 3', body: 'No new trades in the 2 minutes before and after high-impact releases. You can hold positions through them.' },
    { id: 'h4', cat: 'Rules', t: 'The Consistency Rule for Payouts', views: 1890, help: 72, st: 'Published', up: 'Oct 28', body: 'When you request a payout, no single day can be more than 40% of total profit.' },
    { id: 'h5', cat: 'Payouts', t: 'How and When You Get Paid', views: 3102, help: 93, st: 'Published', up: 'Nov 10', body: 'Payouts are reviewed in 1 to 2 business days and sent through Rise.' },
    { id: 'h6', cat: 'Payouts', t: 'Setting Up Rise', views: 1450, help: 89, st: 'Published', up: 'Oct 30', body: 'Create your Rise account with the same email you use for Funded Sky.' },
    { id: 'h7', cat: 'Platforms', t: 'Logging In to Tradovate', views: 2780, help: 81, st: 'Published', up: 'Nov 8', body: 'Use the username from your Your Evaluation Is Ready email and choose a password on first login.' },
    { id: 'h8', cat: 'Platforms', t: 'Switching Platforms', views: 610, help: 86, st: 'Published', up: 'Oct 20', body: 'You can switch platform once per account before your first trade.' },
    { id: 'h9', cat: 'Billing', t: 'Refund Policy', views: 1980, help: 77, st: 'Published', up: 'Nov 1', body: 'Accounts with no trades can be refunded within 14 days of purchase.' },
    { id: 'h10', cat: 'Billing', t: 'Resets: What Happens to Your Account', views: 1320, help: 90, st: 'Published', up: 'Nov 5', body: 'A reset brings the account back to its starting balance with the same rules. Trading days start from zero.' },
    { id: 'h11', cat: 'Getting Funded', t: 'Identity Check: What You Need', views: 990, help: 83, st: 'Published', up: 'Nov 2', body: 'A passport, ID card or driver’s license with the same name as your account, and a phone camera.' },
    { id: 'h12', cat: 'Getting Funded', t: 'Activation Fee Explained', views: 540, help: 79, st: 'Draft', up: 'Nov 21', body: 'Some plans have a one-time activation fee when your funded account opens.' }
  ];

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const XL = (board, hash, label, cls) => `<a class="${cls || 'lnk'}" href="Admin${board}.dc.html${hash ? '#' + hash : ''}">${label}</a>`;
  const money = (v) => '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const rng = (seed) => { let h = 2166136261; for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; };
  const mins = (m) => m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ' ' + (m % 60) + 'm' : ''}` : m + 'm';
  const agent = (id) => AGENTS.find((a) => a.id === id);
  const tr = (t) => TRADERS[t.tr];
  const first = (t) => tr(t).name.split(' ')[0].replace('[', '');
  let seq = 4831; let tick = 0;

  const S = {
    view: 'inbox', q: 'open', sel: 4815, search: '', sort: 'sla', mconv: false, ctx: false, toast: '', drawer: null,
    compose: { mode: 'reply', text: '' }, review: 'BR-212', range: 30, helpCat: 'all', focus: null,
    set: { email: true, chatDash: true, chatCheckout: true, discord: true, h247: false, wk: ['08:00', '22:00'], we: ['10:00', '18:00'], sla: { urgent: [15, 240], high: [60, 480], normal: [240, 1440], low: [480, 2880] }, assign: 'round', maxOpen: '25', autoClose: '3', csat: true, afterHours: true, ahText: "Thanks for reaching out. We're offline right now and reply first thing at 8:00 AM ET. Risk alerts and payouts keep running.", linkReview: true, escalate: 'chargeback, lawyer, fraud, scam', route: { breach: 'Risk', risk: 'Risk', billing: 'Agents', payouts: 'Leads', kyc: 'Agents', platform: 'Agents', rules: 'Agents', account: 'Agents', affiliates: 'Leads' } }
  };

  // ---------- queues ----------
  const isOpen = (t) => t.st !== 'solved';
  const late = (t) => isOpen(t) && t.sla != null && t.sla < 15;
  const QUEUES = [['open', 'All Open', (t) => isOpen(t)], ['mine', 'Assigned to Me', (t) => isOpen(t) && t.ag === 'me'], ['unassigned', 'Unassigned', (t) => isOpen(t) && !t.ag], ['late', 'Late or Due Soon', late], ['pending', 'Waiting on Trader', (t) => t.st === 'pending'], ['hold', 'On Hold', (t) => t.st === 'hold'], ['solved', 'Solved', (t) => t.st === 'solved']];
  const qfn = (q) => { const x = QUEUES.find((z) => z[0] === q); if (x) return x[2]; const [k, v] = q.split(':'); return k === 'cat' ? (t) => isOpen(t) && t.cat === v : (t) => isOpen(t) && t.ch === v; };
  const qname = (q) => { const x = QUEUES.find((z) => z[0] === q); if (x) return x[1]; const [k, v] = q.split(':'); return k === 'cat' ? CATS[v] : CH[v]; };
  const list = () => { const s = S.search.toLowerCase(); const l = TICKETS.filter(qfn(S.q)).filter((t) => !s || (t.subj + ' ' + tr(t).name + ' #' + t.id + ' ' + tr(t).email).toLowerCase().includes(s));
    const pr = { urgent: 0, high: 1, normal: 2, low: 3 };
    return l.sort((a, b) => S.sort === 'new' ? b.id - a.id : S.sort === 'old' ? a.id - b.id : ((a.sla == null ? 1e6 : a.sla) - (b.sla == null ? 1e6 : b.sla)) || pr[a.pri] - pr[b.pri]); };
  const cur = () => TICKETS.find((t) => t.id === S.sel);
  const slaChip = (t) => t.sla == null || !isOpen(t) ? '' : t.sla < 0 ? `<span class="b err plain">Late ${mins(-t.sla)}</span>` : t.sla <= 30 ? `<span class="b draft plain">Due in ${mins(t.sla)}</span>` : `<span class="sla">Due in ${mins(t.sla)}</span>`;
  const stats = () => { const o = TICKETS.filter(isOpen); return { open: o.length, un: o.filter((t) => !t.ag).length, late: o.filter((t) => t.sla != null && t.sla < 0).length, frt: '14m', solved: 38 + TICKETS.filter((t) => t.solvedNow).length, csat: 94 }; };

  // ---------- nav ----------
  const TOOLS = [['reviews', 'Breach Reviews'], ['macros', 'Saved Replies'], ['help', 'Help Center'], ['reports', 'Reports'], ['team', 'Team'], ['settings', 'Settings']];
  function navHtml() {
    const qi = (q, l, n, dot) => `<button class="ni ${S.view === 'inbox' && S.q === q ? 'on' : ''}" data-act="queue" data-k="${q}">${dot ? `<span class="dot" style="background:${dot}"></span>` : ''}<span class="nit">${l}</span><i class="${q === 'late' && n ? 'bad' : ''}">${n}</i></button>`;
    let h = '<h6>Inbox</h6>' + QUEUES.map(([q, l, f]) => qi(q, l, TICKETS.filter(f).length)).join('');
    h += '<h6>Topics</h6>' + Object.entries(CATS).map(([k, l]) => qi('cat:' + k, l, TICKETS.filter(qfn('cat:' + k)).length)).join('');
    h += '<h6>Channels</h6>' + Object.entries(CH).map(([k, l]) => qi('ch:' + k, l, TICKETS.filter(qfn('ch:' + k)).length)).join('');
    h += '<h6>Tools</h6>' + TOOLS.map(([v, l]) => `<button class="ni ${S.view === v ? 'on' : ''}" data-act="go" data-v="${v}"><span class="nit">${l}</span>${v === 'reviews' ? `<i>${REVIEWS.filter((r) => r.st === 'open' || r.st === 'second').length}</i>` : v === 'macros' ? `<i>${MACROS.length}</i>` : ''}</button>`).join('');
    return h;
  }
  function mnavHtml() {
    const o = (v, l) => `<option value="${v}" ${(S.view === 'inbox' && 'q:' + S.q === v) || 'v:' + S.view === v ? 'selected' : ''}>${l}</option>`;
    return '<optgroup label="Inbox">' + QUEUES.map(([q, l, f]) => o('q:' + q, `${l} (${TICKETS.filter(f).length})`)).join('') + '</optgroup><optgroup label="Topics">' + Object.entries(CATS).map(([k, l]) => o('q:cat:' + k, `${l} (${TICKETS.filter(qfn('cat:' + k)).length})`)).join('') + '</optgroup><optgroup label="Channels">' + Object.entries(CH).map(([k, l]) => o('q:ch:' + k, l)).join('') + '</optgroup><optgroup label="Tools">' + TOOLS.map(([v, l]) => o('v:' + v, l)).join('') + '</optgroup>';
  }

  // ---------- inbox ----------
  function vList() {
    const l = list();
    return `<div class="lh"><div class="lht"><h2>${esc(qname(S.q))}</h2><span class="hint">${l.length} ${l.length === 1 ? 'Ticket' : 'Tickets'}</span></div>
      <input type="search" placeholder="Search Subject, Trader or #Number" value="${esc(S.search)}" data-live="search" data-key="srch" aria-label="Search tickets">
      <div class="seg">${[['sla', 'Due First'], ['new', 'Newest'], ['old', 'Oldest']].map(([k, n]) => `<button class="${S.sort === k ? 'on' : ''}" data-act="sort" data-k="${k}">${n}</button>`).join('')}</div></div>
      <div class="tkl">${l.length ? l.map((t) => { const T = tr(t); const last = t.msgs.filter((m) => m.f !== 's').at(-1); const ag = agent(t.ag);
        return `<button class="tk ${S.sel === t.id ? 'sel' : ''}" data-act="open" data-id="${t.id}"><div class="tk1"><span class="pd" style="background:${PRI[t.pri][1]}" title="${PRI[t.pri][0]} priority"></span><b>${esc(T.name)}</b><span class="tkn">#${t.id}</span><span class="tkt">${t.age}</span></div><div class="tks">${esc(t.subj)}</div><div class="tkp">${last.f === 'n' ? 'Note: ' : last.f === 'a' ? 'You: ' : ''}${esc(last.b)}</div><div class="tkm"><span class="b plain">${CATS[t.cat]}</span><span class="chn">${CH[t.ch]}</span>${slaChip(t)}<span class="tka">${t.st === 'solved' ? 'Solved' : ag ? esc(ag.name) : 'Unassigned'}</span></div></button>`; }).join('') : '<div class="empty">Nothing here. Nice work.</div>'}</div>`;
  }
  function vConv() {
    const t = cur(); if (!t) return '<div class="empty" style="margin:auto">Pick a ticket.</div>';
    const T = tr(t); const rv = t.review && REVIEWS.find((r) => r.id === t.review);
    const sel = (bind, opts, val, lab) => `<label class="cs"><span>${lab}</span><select data-bind="${bind}">${opts.map(([v, l]) => `<option value="${v}" ${v === val ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
    const msg = (m) => m.f === 's' ? `<div class="ms-s">${esc(m.b)}<span>${esc(m.t)}</span></div>` : `<div class="ms ms-${m.f}"><div class="msh"><b>${m.f === 't' ? esc(T.name) : esc(m.who)}</b>${m.f === 'n' ? '<span class="b draft plain">Internal Note</span>' : ''}<span class="mst">${esc(m.t)}</span></div><div class="msb">${esc(m.b)}</div></div>`;
    const C = S.compose;
    return `<div class="cvh"><button class="ic cvb" data-act="back" aria-label="Back to tickets">←</button><div class="cvt"><h1>${esc(t.subj)}</h1><div class="cvm"><span>#${t.id}</span><span>${CH[t.ch]}</span><span>${esc(T.name)} · ${esc(T.email)}</span>${slaChip(t)}</div></div><button class="pill sm ctxbtn" data-act="ctx">Trader</button></div>
      <div class="cvc">${sel('t.st', Object.entries(STS), t.st, 'Status')}${sel('t.pri', Object.entries(PRI).map(([k, v]) => [k, v[0]]), t.pri, 'Priority')}${sel('t.ag', [['', 'Unassigned'], ...AGENTS.map((a) => [a.id, a.name])], t.ag || '', 'Assignee')}${sel('t.cat', Object.entries(CATS), t.cat, 'Topic')}</div>
      ${rv ? `<button class="rvb" data-act="goReview" data-id="${rv.id}"><span class="b ${rv.st === 'open' ? 'draft' : rv.st === 'second' ? 'sched' : rv.st === 'reinstated' ? 'live' : 'plain'}">${rv.st === 'open' ? 'Needs Review' : rv.st === 'second' ? 'Waiting for Second Reviewer' : rv.st === 'reinstated' ? 'Reinstated' : 'Closure Upheld'}</span><span>Breach review ${rv.id} · ${esc(rv.rule)} on ${rv.acct}</span><b>Open Review →</b></button>` : ''}
      <div class="thr">${t.msgs.map(msg).join('')}</div>
      <div class="cmp ${C.mode === 'note' ? 'note' : ''}"><div class="cmpt"><div class="tabs sm">${[['reply', 'Reply'], ['note', 'Internal Note']].map(([k, l]) => `<button class="${C.mode === k ? 'on' : ''}" data-act="cmode" data-k="${k}">${l}</button>`).join('')}</div><select data-bind="macro" aria-label="Insert a saved reply"><option value="">Insert Saved Reply</option>${MACROS.slice().sort((a, b) => (b.cat === t.cat) - (a.cat === t.cat) || b.uses - a.uses).map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select></div>
        <textarea data-live="compose" data-key="cmp" placeholder="${C.mode === 'note' ? 'Only your team sees notes' : `Reply to ${esc(first(t))}`}">${esc(C.text)}</textarea>
        <div class="cmpf"><span class="hint">${C.mode === 'note' ? 'Not sent to the trader' : t.ch === 'email' ? 'Sends from support@fundedsky.com' : t.ch === 'chat' ? 'Sends in the live chat, and by email if they left' : 'Sends as a Discord direct message'}</span>${C.mode === 'note' ? '<button class="pill pri" data-act="send" data-k="note">Add Note</button>' : '<button class="pill" data-act="send" data-k="reply">Send</button><button class="pill pri" data-act="send" data-k="solve">Send and Solve</button>'}</div></div>`;
  }
  function vCtx() {
    const t = cur(); if (!t) return ''; const T = tr(t);
    const others = TICKETS.filter((x) => x.tr === t.tr && x.id !== t.id);
    const ast = (s) => s === 'Active' ? 'live' : s === 'Passed' ? 'sched' : s === 'Closed' ? 'err' : 'plain';
    const acts = [['refund', 'Issue a Refund'], ['reset', 'Give a Free Reset'], ['extend', 'Add Trading Days'], ['switch', 'Switch Platform'], ['login', 'Resend Platform Login'], ['pw', 'Send Password Reset Link'], ['review', 'Open a Breach Review']];
    return `<div class="cxh"><span class="av">${esc(T.name.replace(/[^A-Za-z ]/g, '').split(' ').map((w) => w[0]).join('').slice(0, 2) || 'T')}</span><div class="cxt"><b>${esc(T.name)}</b><div class="hint">Trader #${T.id} · <span class="mono">${esc(T.email)}</span></div></div><button class="ic cxx" data-act="ctx" aria-label="Close">✕</button></div>
      <div class="cxb">
      <div class="cxkv"><div><span>Country</span><b>${esc(T.country)} · ${T.tz}</b></div><div><span>Joined</span><b>${T.joined}</b></div><div><span>Identity Check</span><b><span class="b ${T.kyc === 'Verified' ? 'live' : T.kyc === 'Rejected' ? 'err' : 'plain'}">${T.kyc}</span></b></div>${T.affiliate ? `<div><span>Affiliate Code</span><b class="mono">${T.affiliate}</b></div>` : ''}</div>
      <div class="cxg"><div><span>Spent</span><b>${money(T.spend)}</b></div><div><span>Orders</span><b>${T.orders}</b></div><div><span>Payouts</span><b>${T.payouts[0] ? money(T.payouts[1]) : '—'}</b></div></div>
      ${T.flags.length ? `<div class="cxf">${T.flags.map((f) => `<div><span class="b err plain">Risk Flag</span>${esc(f)}</div>`).join('')}</div>` : ''}
      <h5>Accounts</h5>${T.accts.length ? `<div class="cxa">${T.accts.map(([id, p, s, bal, pl]) => `<div><div class="cxa1"><span class="mono">${id}</span><span class="b ${ast(s)}">${s}</span></div><div class="cxa2"><span>${esc(p)}</span><span>${bal} · <em class="${pl.startsWith('+') ? 'up' : pl.startsWith('−') || pl === 'Drawdown' ? 'dn' : ''}">${pl}</em></span></div></div>`).join('')}</div>` : '<div class="hint">No trading accounts. This is an affiliate.</div>'}
      <div class="il" style="flex-wrap:wrap;margin-top:12px">${XL('Users', 'user?name=' + encodeURIComponent(T.name), 'Full Profile in Users', 'pill sm')}${T.accts.length ? XL('Risk', 'traders', 'Risk Profile', 'pill sm') : ''}</div><h5>Actions</h5><div class="cxq">${acts.map(([k, l]) => `<button class="qa" data-act="action" data-k="${k}">${l}<span>›</span></button>`).join('')}</div>
      <h5>Other Tickets</h5>${others.length ? others.map((o) => `<button class="cxo" data-act="open" data-id="${o.id}"><span>${esc(o.subj)}</span><span class="b ${o.st === 'solved' ? 'plain' : 'sched'}">${STS[o.st]}</span></button>`).join('') : '<div class="hint">No other tickets.</div>'}
      <h5>Recent Emails</h5><div class="cxe">${['Your Evaluation Is Ready · Nov 18', 'New Sign-In to Your Account · Nov 20', 'Close to Your Max Drawdown · Today'].map((e) => `<div>${e}</div>`).join('')}<span class="hint">From the ${XL('Emails', 'logs', 'Emails back office')}.</span></div>
      </div>`;
  }

  // ---------- reviews ----------
  function vReviews() {
    const r = REVIEWS.find((x) => x.id === S.review) || REVIEWS[0]; const T = TRADERS[r.tr];
    const lab = { open: ['Needs Review', 'draft'], second: ['Waiting for Second Reviewer', 'sched'], upheld: ['Closure Upheld', 'plain'], reinstated: ['Reinstated', 'live'] };
    return `<div class="ph"><div><h1>Breach Reviews</h1><p>Traders who dispute a closed account. Every decision needs two people: one decides, a second confirms. The original breach and trades are in ${XL('Risk', 'breaches', 'Risk')}; formal complaints go to ${XL('Compliance', 'complaints', 'Compliance')}.</p></div></div>
      <div class="two wl2 rvw"><div class="card m0"><div class="ch"><h3>Reviews</h3><span class="lab">${REVIEWS.filter((x) => ['open', 'second'].includes(x.st)).length} Open</span></div>${REVIEWS.map((x) => `<button class="rvi ${x.id === r.id ? 'sel' : ''}" data-act="pickReview" data-id="${x.id}"><div><b>${x.id} · ${esc(x.rule)}</b><div class="hint">${esc(TRADERS[x.tr].name)} · <span class="mono">${x.acct}</span> · ${esc(x.when)}</div></div><span class="b ${lab[x.st][1]}">${lab[x.st][0]}</span></button>`).join('')}</div>
      <div class="card m0"><div class="ch"><h3>${r.id}</h3><span class="lab">${esc(T.name)} · Ticket #${r.tk}</span><div class="r"><span class="b ${lab[r.st][1]}">${lab[r.st][0]}</span></div></div><div class="cb fg">
        <div class="kv"><div><span>Account</span><b class="mono">${r.acct}</b></div><div><span>Rule</span><b>${esc(r.rule)}</b></div><div><span>Limit</span><b>${esc(r.limit)}</b></div><div><span>Closed</span><b>${esc(r.when)}</b></div><div><span>Trader Says</span><b>${esc(r.claim)}</b></div></div>
        <div class="card m0"><div class="ch"><h3>Trades Around the Breach</h3><span class="lab">From the Platform Feed</span></div><div class="tsc"><table class="t"><thead><tr><th>Time ET</th><th>Symbol</th><th>Event</th><th class="num">Qty</th><th class="num">Price</th><th class="num">P&amp;L</th><th class="num">Balance</th><th class="num">Floor</th></tr></thead><tbody>${r.trades.map((x, i) => `<tr class="${i === r.trades.length - 1 || /Limit|Open P/.test(x[2]) && x[6] < x[7] ? '' : ''}">${x.map((v, j) => `<td class="${j >= 3 ? 'num' : ''} ${j === 0 ? 'mono' : ''} ${j === 6 && /\$9[0-6]/.test(v) ? 'dn' : ''}">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
        ${r.st === 'open' ? `<div class="fl"><label>Decision Note</label><textarea data-bind="rvnote" placeholder="What the trades show, in plain words. The trader sees a version of this."></textarea></div><div class="edact"><button class="pill" data-act="decide" data-k="upheld">Uphold the Closure</button><button class="pill pri" data-act="decide" data-k="reinstated">Reinstate the Account</button></div>`
          : r.st === 'second' ? `<div class="sec"><h4>${r.decision === 'reinstated' ? 'Reinstate' : 'Uphold'}, proposed by ${esc(r.first)}</h4><p class="hint" style="margin:0 0 12px">${esc(r.note || 'No note.')}</p><div class="edact"><button class="pill pri" data-act="confirmReview">Confirm as [Risk Reviewer]</button><button class="pill" data-act="rejectReview">Send Back</button></div></div>`
          : `<div class="hint">Decided by ${esc(r.first)}, confirmed by ${esc(r.second)}.${r.st === 'reinstated' ? ' The account was restored with its balance before the breach.' : ''}</div>`}
        <button class="lnk" data-act="openTicket" data-id="${r.tk}" style="justify-self:start">Open Ticket #${r.tk}</button>
      </div></div></div>`;
  }
  // ---------- macros ----------
  function vMacros() {
    return `<div class="ph"><div><h1>Saved Replies</h1><p>Answers your team sends often. Merge fields fill in the trader's name and account.</p></div><div class="act"><button class="pill" data-act="editMacro" data-id="">+ New Saved Reply</button></div></div>
      <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Name</th><th>Topic</th><th>Starts With</th><th class="num">Used</th></tr></thead><tbody>${MACROS.slice().sort((a, b) => b.uses - a.uses).map((m) => `<tr class="lk" data-act="editMacro" data-id="${m.id}"><td class="nw"><b>${esc(m.name)}</b></td><td class="nw"><span class="b plain">${CATS[m.cat]}</span></td><td class="hint mtrunc">${esc(m.body.slice(0, 90))}…</td><td class="num">${m.uses}</td></tr>`).join('')}</tbody></table></div></div>
      <p class="hint">Merge fields: {first_name}, {account}, {agent}.</p>`;
  }
  // ---------- help center ----------
  function vHelp() {
    const cats = ['all', ...new Set(ARTICLES.map((a) => a.cat))]; const l = ARTICLES.filter((a) => S.helpCat === 'all' || a.cat === S.helpCat);
    const views = ARTICLES.reduce((s, a) => s + a.views, 0); const help = Math.round(ARTICLES.reduce((s, a) => s + a.help, 0) / ARTICLES.length);
    const asked = [['Reset paid, platform still shows old account', 14, 'billing'], ['Two charges for one evaluation', 9, 'billing'], ['Changing the name on my account', 7, 'kyc']];
    return `<div class="ph"><div><h1>Help Center</h1><p>Articles traders read before they write to you. Shown at help.fundedsky.com and inside the chat widget.</p></div><div class="act"><button class="pill" data-act="editArticle" data-id="">+ New Article</button></div></div>
      <div class="tiles"><div class="tile"><span>Articles</span><b>${ARTICLES.filter((a) => a.st === 'Published').length}</b><small>${ARTICLES.filter((a) => a.st === 'Draft').length} in draft</small></div><div class="tile"><span>Views</span><b>${views.toLocaleString('en-US')}</b><small>Last 30 days</small></div><div class="tile"><span>Found It Helpful</span><b>${help}%</b><small>Average across articles</small></div><div class="tile"><span>Questions Answered</span><b>1,240</b><small>Read an article, then didn't write in</small></div></div>
      <div class="card"><div class="ch"><h3>Asked Often, No Article Yet</h3><span class="lab">From Tickets This Week</span></div><div class="tsc"><table class="t askt"><tbody>${asked.map(([q, n, c]) => `<tr><td><b>${esc(q)}</b></td><td class="nw hint">${n} Tickets</td><td class="num"><button class="lnk" data-act="draftFrom" data-k="${esc(q)}">Write Article</button></td></tr>`).join('')}</tbody></table></div></div>
      <div class="card"><div class="ch"><h3>Articles</h3><div class="r"><div class="seg">${cats.map((c) => `<button class="${S.helpCat === c ? 'on' : ''}" data-act="helpCat" data-k="${esc(c)}">${c === 'all' ? 'All' : esc(c)}</button>`).join('')}</div></div></div><div class="tsc"><table class="t"><thead><tr><th>Title</th><th>Section</th><th>Status</th><th class="num">Views</th><th class="num">Helpful</th><th>Updated</th></tr></thead><tbody>${l.map((a) => `<tr class="lk" data-act="editArticle" data-id="${a.id}"><td class="nw"><b>${esc(a.t)}</b></td><td class="nw">${esc(a.cat)}</td><td><span class="b ${a.st === 'Published' ? 'live' : 'draft'}">${a.st}</span></td><td class="num">${a.views.toLocaleString('en-US')}</td><td class="num ${a.help < 80 ? 'warnt' : ''}">${a.help}%</td><td class="nw">${a.up}</td></tr>`).join('')}</tbody></table></div></div>
      <p class="hint">Articles under 80% helpful are marked in amber. Rule amounts must match the live rule sets in the Checkout Catalog.</p>`;
  }
  // ---------- reports ----------
  function vReports() {
    const k = S.range / 30; const r = rng('rep' + S.range); const n = S.range === 7 ? 7 : S.range === 30 ? 30 : 45; const vals = Array.from({ length: n }, () => 0.35 + r() * 0.65); const mx = Math.max(...vals);
    const byCat = [['payouts', 312, '11m', '6h', 95], ['rules', 288, '9m', '2h', 96], ['platform', 241, '8m', '1h', 93], ['billing', 198, '13m', '9h', 91], ['breach', 96, '16m', '1d 4h', 71], ['kyc', 74, '18m', '14h', 88], ['account', 66, '12m', '5h', 95], ['risk', 21, '31m', '2d', 64], ['affiliates', 18, '42m', '1d', 90]];
    return `<div class="ph"><div><h1>Reports</h1><p>How fast the team answers, what traders write about, and how happy they are with the answer.</p></div><div class="act"><div class="seg">${[7, 30, 90].map((d) => `<button class="${S.range === d ? 'on' : ''}" data-act="range" data-k="${d}">${d} Days</button>`).join('')}</div></div></div>
      <div class="tiles t6"><div class="tile"><span>New Tickets</span><b>${Math.round(1314 * k).toLocaleString('en-US')}</b><small>${Math.round(43.8 * k * 30 / S.range)} a day</small></div><div class="tile"><span>Solved</span><b>${Math.round(1281 * k).toLocaleString('en-US')}</b><small>97% of new</small></div><div class="tile"><span>First Reply</span><b>14m</b><small>Median · target 1h</small></div><div class="tile"><span>Time to Solve</span><b>4h 20m</b><small>Median</small></div><div class="tile"><span>Satisfaction</span><b>94%</b><small>${Math.round(412 * k)} ratings</small></div><div class="tile"><span>Missed Targets</span><b class="bad">3.1%</b><small>Replies after the deadline</small></div></div>
      <div class="two wl"><div class="card m0"><div class="ch"><h3>Tickets per Day</h3><span class="lab">Last ${S.range} Days</span></div><div class="cb"><div class="bars">${vals.map((v) => `<i style="height:${Math.round(v / mx * 100)}%"></i>`).join('')}</div></div></div>
      <div class="card m0"><div class="ch"><h3>Channels</h3></div><div class="cb fg">${[['Email', 58], ['Live Chat', 34], ['Discord', 8]].map(([c, p]) => `<div><div class="rowl"><span>${c}</span><b>${p}%</b></div><div class="split"><i style="width:${p}%"></i></div></div>`).join('')}</div></div></div>
      <div class="two" style="margin-top:14px"><div class="card m0"><div class="ch"><h3>Reply Targets</h3><span class="lab">Last ${S.range} days</span></div><div class="cb"><div class="gauges">${[[94, 'Replied within 1 hour'], [88, 'Solved within 24 hours'], [92, 'Happy with the answer']].map(([p, l]) => `<div class="cdn1">${VZ.ring(p, p + '%', '', { s: 96, c: p >= 90 ? 'var(--ok)' : 'var(--wa)' })}<span class="hint">${l}</span></div>`).join('')}</div></div></div>
      <div class="card m0"><div class="ch"><h3>How Traders Feel</h3><span class="lab">From ratings and ticket wording, by week</span></div><div class="cb">${(() => { const v = [71, 74, 72, 76, 73, 69, 75, 78, 77, 80, 79, 82]; return `<div class="vzrow" style="margin-bottom:10px"><div class="mstat"><span>This Week</span><b>82 of 100</b></div><div class="mstat"><span>12 Weeks Ago</span><b>71 of 100</b></div></div>${VZ.spark(v, { h: 80, c: 'var(--ok)' })}<p class="hint" style="margin:8px 0 0">Dip in week 6 was the payout delay from ${XL('Health', 'incidents', 'incident INC-21')}.</p>`; })()}</div></div></div>
      <div class="card" style="margin-top:14px"><div class="ch"><h3>When Tickets Come In</h3><span class="lab">Eastern Time · use this to plan shifts in ${XL('Team', 'members', 'Team')}</span></div><div class="cb">${(() => { const g = rng('spheat'); const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; const hrs = Array.from({ length: 24 }, (_, h) => `${h % 12 || 12}${h < 12 ? 'a' : 'p'}`); const m = days.map((d, i) => hrs.map((_, h) => Math.round((h >= 9 && h <= 12 ? 8 : h >= 13 && h <= 17 ? 6 : h >= 18 && h <= 22 ? 4 : 1) * (i >= 5 ? 0.6 : i === 0 ? 1.3 : 1) * (0.7 + g() * 0.6)))); return VZ.heat(days, hrs, m, (v) => v + ' tickets', { skip: 3, cls: 'tall' }); })()}</div></div>
      <div class="card" style="margin-top:14px"><div class="ch"><h3>By Topic</h3></div><div class="tsc"><table class="t"><thead><tr><th>Topic</th><th class="num">Tickets</th><th class="num">First Reply</th><th class="num">Time to Solve</th><th class="num">Satisfaction</th></tr></thead><tbody>${byCat.map(([c, v, f, s, cs]) => `<tr><td class="nw"><b>${CATS[c]}</b></td><td class="num">${Math.round(v * k)}</td><td class="num">${f}</td><td class="num">${s}</td><td class="num ${cs < 80 ? 'warnt' : ''}">${cs}%</td></tr>`).join('')}</tbody></table></div></div>
      <div class="card"><div class="ch"><h3>By Person</h3></div><div class="tsc"><table class="t"><thead><tr><th>Name</th><th class="num">Solved</th><th class="num">First Reply</th><th class="num">Satisfaction</th></tr></thead><tbody>${AGENTS.map((a) => `<tr><td class="nw"><b>${esc(a.name)}</b></td><td class="num">${Math.round(a.solved * k * 4)}</td><td class="num">${a.frt}m</td><td class="num">${a.csat}%</td></tr>`).join('')}</tbody></table></div></div>
      <p class="hint">Breach disputes and risk flags score lowest on satisfaction, as expected: most end with the closure upheld. Sample numbers.</p>`;
  }
  // ---------- team ----------
  function vTeam() {
    return `<div class="ph"><div><h1>Team</h1><p>Who answers tickets, what they can do, and how much they can refund without a second person. Staff accounts and roles are managed in ${XL('Team', 'members', 'Team and Approvals')}.</p></div><div class="act"><button class="pill" data-act="invite">+ Invite Someone</button></div></div>
      <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Name</th><th>Role</th><th>Status</th><th class="num">Open Now</th><th class="num">Solved, 30 Days</th><th class="num">First Reply</th><th class="num">Satisfaction</th><th>Refund Limit ($)</th></tr></thead><tbody>${AGENTS.map((a, i) => `<tr><td class="nw"><b>${esc(a.name)}</b></td><td class="nw">${a.role}</td><td><select data-bind="ag.st" data-i="${i}" aria-label="Status" class="stsel">${[['online', 'Online'], ['away', 'Away'], ['offline', 'Offline']].map(([v, l]) => `<option value="${v}" ${a.st === v ? 'selected' : ''}>${l}</option>`).join('')}</select></td><td class="num">${TICKETS.filter((t) => isOpen(t) && t.ag === a.id).length}</td><td class="num">${a.solved * 4}</td><td class="num">${a.frt}m</td><td class="num">${a.csat}%</td><td><input type="number" min="0" value="${a.limit}" data-bind="ag.limit" data-i="${i}" aria-label="Refund limit"></td></tr>`).join('')}</tbody></table></div></div>
      <div class="tiles t3">${[['Agent', 'Replies, free resets, platform switches, refunds up to their limit.'], ['Lead', 'Everything agents do, plus approving refunds over an agent\'s limit and editing saved replies.'], ['Risk', 'Breach reviews, account holds and risk flags. Can confirm another reviewer\'s decision.']].map(([r, d]) => `<div class="tile"><span>${r}</span><b style="font-size:16px;margin:6px 0 4px">${AGENTS.filter((a) => a.role === r).length} ${AGENTS.filter((a) => a.role === r).length === 1 ? 'Person' : 'People'}</b><small>${d}</small></div>`).join('')}</div>`;
  }
  // ---------- settings ----------
  function vSettings() {
    const C = S.set; const sw = (k, l) => `<div class="srow"><span>${l}</span><button class="sw ${C[k] ? 'on' : ''}" data-act="setT" data-k="${k}" role="switch" aria-checked="${!!C[k]}" aria-label="${esc(l)}"></button></div>`;
    const opt = (v, list) => list.map(([a, b]) => `<option value="${a}" ${String(v) === String(a) ? 'selected' : ''}>${b}</option>`).join('');
    const SLA = [[15, '15m'], [30, '30m'], [60, '1h'], [120, '2h'], [240, '4h'], [480, '8h'], [1440, '1 Day'], [2880, '2 Days']];
    return `<div class="ph"><div><h1>Settings</h1><p>Where traders can reach you, when, how fast you answer, and who gets each ticket.</p></div></div>
      <div class="two"><div class="card m0"><div class="ch"><h3>Channels</h3></div><div class="cb">${sw('email', 'Email · support@fundedsky.com')}${sw('chatDash', 'Live Chat on the Dashboard')}${sw('chatCheckout', 'Live Chat on Checkout')}${sw('discord', 'Discord · #support')}</div></div>
      <div class="card m0"><div class="ch"><h3>Hours</h3><span class="lab">Eastern Time</span></div><div class="cb fg">${sw('h247', 'Open 24/7')}${C.h247 ? '' : `<div class="fg2"><div class="fl"><label>Weekdays</label><div class="rowx" style="grid-template-columns:1fr 1fr"><input type="time" value="${C.wk[0]}" data-bind="set.wk.0"><input type="time" value="${C.wk[1]}" data-bind="set.wk.1"></div></div><div class="fl"><label>Weekends</label><div class="rowx" style="grid-template-columns:1fr 1fr"><input type="time" value="${C.we[0]}" data-bind="set.we.0"><input type="time" value="${C.we[1]}" data-bind="set.we.1"></div></div></div>`}<span class="hint">Response targets only count open hours.</span></div></div></div>
      <div class="two" style="margin-top:14px"><div class="card m0"><div class="ch"><h3>Response Targets</h3></div><div class="tsc"><table class="t"><thead><tr><th>Priority</th><th>First Reply</th><th>Solved Within</th></tr></thead><tbody>${Object.entries(PRI).map(([k, [l, c]]) => `<tr><td class="nw"><span class="il" style="gap:8px"><span class="pd" style="background:${c}"></span><b>${l}</b></span></td><td><select data-bind="set.sla.${k}.0">${opt(C.sla[k][0], SLA)}</select></td><td><select data-bind="set.sla.${k}.1">${opt(C.sla[k][1], SLA)}</select></td></tr>`).join('')}</tbody></table></div></div>
      <div class="card m0"><div class="ch"><h3>Who Gets Each Ticket</h3></div><div class="cb fg"><div class="fl"><label>Assign</label><div class="seg">${[['round', 'In Turn'], ['least', 'Least Busy'], ['manual', 'Manually']].map(([k, l]) => `<button class="${C.assign === k ? 'on' : ''}" data-act="setAssign" data-k="${k}">${l}</button>`).join('')}</div></div><div class="fl"><label>Most Open Tickets per Person</label><select data-bind="set.maxOpen">${opt(C.maxOpen, [['15', '15'], ['25', '25'], ['40', '40']])}</select></div>
        <table class="t rtt"><tbody>${Object.entries(C.route).map(([k, v]) => `<tr><td>${CATS[k]}</td><td><select data-bind="set.route.${k}">${opt(v, [['Agents', 'Agents'], ['Leads', 'Leads'], ['Risk', 'Risk']])}</select></td></tr>`).join('')}</tbody></table></div></div></div>
      <div class="card" style="margin-top:14px"><div class="ch"><h3>Automations</h3></div><div class="cb fg">
        <div class="srow"><span>Close Tickets Waiting on the Trader After</span><select data-bind="set.autoClose" style="width:140px">${opt(C.autoClose, [['2', '2 Days'], ['3', '3 Days'], ['5', '5 Days'], ['7', '7 Days']])}</select></div>
        ${sw('csat', 'Ask for a Rating When a Ticket Is Solved')}${sw('linkReview', 'Open a Breach Review When a Trader Disputes a Closure')}${sw('afterHours', 'Send an Auto-Reply Outside Hours')}
        ${C.afterHours ? `<div class="fl"><label>Auto-Reply</label><textarea data-bind="set.ahText">${esc(C.ahText)}</textarea></div>` : ''}
        <div class="fl"><label>Make Urgent When a Message Mentions</label><input value="${esc(C.escalate)}" data-bind="set.escalate"><span class="hint">Comma separated. Chargeback threats also notify Billing.</span></div>
      </div></div>`;
  }

  // ---------- drawers ----------
  function drawer() {
    if (!S.drawer) return ''; const { kind, f } = S.drawer; const t = cur(); const T = t ? tr(t) : null;
    const accts = T ? T.accts.map((a) => [a[0], `${a[0]} · ${a[1]}`]) : [];
    const opt = (v, l) => l.map(([a, b]) => `<option value="${esc(a)}" ${String(v) === String(a) ? 'selected' : ''}>${esc(b)}</option>`).join('');
    let title, body, save = 'Save';
    if (kind === 'refund') { title = 'Issue a Refund'; save = f.amount > agent('me').limit ? 'Send for Approval' : 'Refund ' + money(f.amount || 0);
      body = `<div class="fl"><label>Order</label><select data-df="order">${opt(f.order, f.orders.map((o) => [o[0], `${o[0]} · ${o[1]} · ${money(o[2])}`]))}</select></div><div class="fl"><label>Amount ($)</label><input type="number" min="0" value="${f.amount}" data-df="amount"></div><div class="fl"><label>Reason</label><select data-df="reason">${opt(f.reason, [['dup', 'Charged Twice'], ['notrade', 'No Trades Placed'], ['tech', 'Platform Problem on Our Side'], ['good', 'Goodwill']])}</select></div><label class="chk"><input type="checkbox" ${f.close ? 'checked' : ''} data-dfc="close"> Close the Account on This Order</label><div class="hint">Your limit is ${money(agent('me').limit)}. Larger refunds go to a Lead to approve. Refunds go back to the original card or wallet.</div>`; }
    else if (kind === 'reset') { title = 'Give a Free Reset'; save = 'Reset Account'; body = `<div class="fl"><label>Account</label><select data-df="acct">${opt(f.acct, accts)}</select></div><div class="fl"><label>Reason</label><select data-df="reason">${opt(f.reason, [['outage', 'Platform Outage'], ['error', 'Our Mistake'], ['good', 'Goodwill']])}</select></div><div class="hint">The account goes back to its starting balance with the same rule set. Logged on the ticket.</div>`; }
    else if (kind === 'extend') { title = 'Add Trading Days'; save = 'Add Days'; body = `<div class="fl"><label>Account</label><select data-df="acct">${opt(f.acct, accts)}</select></div><div class="fl"><label>Extra Days Before Inactivity Closes It</label><select data-df="days">${opt(f.days, [['7', '7 Days'], ['14', '14 Days'], ['30', '30 Days']])}</select></div>`; }
    else if (kind === 'switch') { title = 'Switch Platform'; save = 'Switch'; body = `<div class="fl"><label>Account</label><select data-df="acct">${opt(f.acct, accts)}</select></div><div class="fl"><label>New Platform</label><select data-df="plat">${opt(f.plat, [['NinjaTrader', 'NinjaTrader'], ['Tradovate', 'Tradovate'], ['TradingView', 'TradingView'], ['Rithmic', 'Rithmic']])}</select></div><div class="hint">Allowed once per account. Balance and trading days carry over, and the trader gets the Platform Switched email.</div>`; }
    else if (kind === 'macro') { title = f.id ? 'Edit Saved Reply' : 'New Saved Reply'; body = `<div class="fl"><label>Name</label><input value="${esc(f.name)}" data-df="name"></div><div class="fl"><label>Topic</label><select data-df="cat">${opt(f.cat, Object.entries(CATS))}</select></div><div class="fl"><label>Reply</label><textarea data-df="body" style="height:200px">${esc(f.body)}</textarea><span class="hint">Use {first_name}, {account} and {agent}.</span></div>`; }
    else if (kind === 'article') { title = f.id ? 'Edit Article' : 'New Article'; body = `<div class="fl"><label>Title</label><input value="${esc(f.t)}" data-df="t"></div><div class="fl"><label>Section</label><select data-df="cat">${opt(f.cat, [...new Set(ARTICLES.map((a) => a.cat))].map((c) => [c, c]))}</select></div><div class="fl"><label>Article</label><textarea data-df="body" style="height:240px">${esc(f.body)}</textarea></div><div class="fl"><label>Status</label><div class="seg">${['Published', 'Draft'].map((s) => `<button class="${f.st === s ? 'on' : ''}" data-act="artSt" data-k="${s}">${s}</button>`).join('')}</div></div>`; }
    else if (kind === 'new') { title = 'New Ticket'; save = 'Create Ticket'; body = `<div class="fl"><label>Trader</label><select data-df="tr">${opt(f.tr, Object.entries(TRADERS).map(([k, v]) => [k, `${v.name} · #${v.id}`]))}</select></div><div class="fl"><label>Subject</label><input value="${esc(f.subj)}" data-df="subj"></div><div class="fg2"><div class="fl"><label>Topic</label><select data-df="cat">${opt(f.cat, Object.entries(CATS))}</select></div><div class="fl"><label>Priority</label><select data-df="pri">${opt(f.pri, Object.entries(PRI).map(([k, v]) => [k, v[0]]))}</select></div></div><div class="fl"><label>First Message</label><textarea data-df="body" style="height:140px" placeholder="Sent to the trader by email">${esc(f.body)}</textarea></div>`; }
    else if (kind === 'invite') { title = 'Invite Someone'; save = 'Send Invite'; body = `<div class="fl"><label>Email</label><input value="${esc(f.email)}" data-df="email" placeholder="name@fundedsky.com"></div><div class="fl"><label>Role</label><select data-df="role">${opt(f.role, [['Agent', 'Agent'], ['Lead', 'Lead'], ['Risk', 'Risk']])}</select></div><div class="hint">They sign in with two-step login before they can see any trader.</div>`; }
    return `<div class="drw-bg" data-act="closeDrw"></div><div class="drw" role="dialog" aria-label="${esc(title)}"><div class="drw-h"><h3>${title}</h3><button class="ic" data-act="closeDrw" style="margin-left:auto" aria-label="Close">✕</button></div><div class="drw-b">${body}</div><div class="drw-f">${kind === 'macro' && f.id ? '<button class="pill dng" data-act="delMacro" style="margin-right:auto">Delete</button>' : ''}<button class="pill" data-act="closeDrw">Cancel</button><button class="pill pri" data-act="saveDrw">${save}</button></div></div>`;
  }

  // ---------- render ----------
  const toast = (x) => { S.toast = x; render(); clearTimeout(toast.t); toast.t = setTimeout(() => { S.toast = ''; render(); }, 2600); };
  function render() {
    const st = stats(); const keep = {}; ['.tkl', '.thr', '.main', '.cxb'].forEach((s) => { const el = root.querySelector(s); if (el) keep[s] = el.scrollTop; });
    const views = { reviews: vReviews, macros: vMacros, help: vHelp, reports: vReports, team: vTeam, settings: vSettings };
    const inbox = S.view === 'inbox'; const online = AGENTS.filter((a) => a.st === 'online').length;
    root.innerHTML = `<div class="tb"><a class="pill bk" href="AdminHome.dc.html" aria-label="Back to Admin">←<span class="lg"> Back to Admin</span></a><span class="tb-t">Support</span>
      <div class="tb-mid hm"><div class="tb-stats"><div><span>Open</span><b>${st.open}</b></div><div><span>Unassigned</span><b>${st.un}</b></div><div><span>Late</span><b class="${st.late ? 'bad' : ''}">${st.late}</b></div><div><span>First Reply</span><b>${st.frt}</b></div><div><span>Solved Today</span><b>${st.solved}</b></div><div><span>Satisfaction</span><b>${st.csat}%</b></div></div></div>
      <div class="igs hm">${[['EM', 'Email', S.set.email], ['LC', 'Live Chat', S.set.chatDash || S.set.chatCheckout], ['DC', 'Discord', S.set.discord]].map(([m, l, on]) => `<button class="ig" data-act="go" data-v="settings" title="${l}: ${on ? 'on' : 'off'}" aria-label="${l}"><span>${m}</span><i style="background:${on ? 'var(--ok)' : 'var(--fa)'}"></i></button>`).join('')}<span class="onl"><i></i>${online} Online</span></div>
      <button class="pill" data-act="newTicket">+ New Ticket</button></div>
    <div class="body ${inbox ? 'inbox' : 'wide'} ${S.mconv ? 'mconv' : ''}"><div class="mnav"><select id="mnavsel" aria-label="Go to section">${mnavHtml()}</select></div><nav class="nav" aria-label="Support">${navHtml()}</nav>
      ${inbox ? `<section class="tl1" aria-label="Tickets">${vList()}</section><section class="cv1" aria-label="Conversation">${vConv()}</section><div class="cx-bg ${S.ctx ? 'open' : ''}" data-act="ctx"></div><aside class="cx ${S.ctx ? 'open' : ''}" aria-label="Trader">${vCtx()}</aside>` : `<main class="main">${views[S.view]()}</main>`}
    </div>${drawer()}${S.toast ? `<div class="toast" role="status">${esc(S.toast)}</div>` : ''}`;
    Object.entries(keep).forEach(([s, v]) => { const el = root.querySelector(s); if (el) el.scrollTop = v; });
    if (S.scrollThread) { const th = root.querySelector('.thr'); if (th) th.scrollTop = th.scrollHeight; S.scrollThread = false; }
    if (S.focus) { const el = root.querySelector(`[data-key="${S.focus.k}"]`); if (el) { el.focus(); try { el.setSelectionRange(S.focus.s, S.focus.s); } catch (x) { /* not text */ } } S.focus = null; }
  }

  const sysMsg = (t, b) => { t.msgs.push({ f: 's', t: 'Just now', b }); S.scrollThread = true; };
  const fillMacro = (m, t) => m.body.replace(/\{first_name\}/g, first(t)).replace(/\{account\}/g, (tr(t).accts[0] || ['your account'])[0]).replace(/\{agent\}/g, ME);

  // ---------- events ----------
  root.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]'); if (!el || !root.contains(el)) return;
    if (el.tagName === 'INPUT' && el.type !== 'checkbox') return;
    const a = el.dataset.act, k = el.dataset.k, id = el.dataset.id; const t = cur(); const D = S.drawer && S.drawer.f;
    switch (a) {
      case 'queue': S.drawer = null; S.view = 'inbox'; S.q = k; S.mconv = false; { const l = list(); if (l.length && !l.some((x) => x.id === S.sel)) S.sel = l[0].id; } break;
      case 'go': S.drawer = null; S.view = el.dataset.v; S.ctx = false; break;
      case 'open': S.view = 'inbox'; S.sel = +id; S.mconv = true; S.ctx = false; S.compose = { mode: 'reply', text: '' }; S.scrollThread = true; break;
      case 'back': S.mconv = false; break;
      case 'ctx': S.ctx = !S.ctx; break;
      case 'sort': S.sort = k; break;
      case 'cmode': S.compose.mode = k; break;
      case 'send': { const txt = S.compose.text.trim(); if (!txt) { toast(k === 'note' ? 'Write a note first' : 'Write a reply first'); return; }
        if (k === 'note') { t.msgs.push({ f: 'n', who: ME, t: 'Just now', b: txt }); S.compose.text = ''; S.scrollThread = true; toast('Note added'); return; }
        t.msgs.push({ f: 'a', who: ME, t: 'Just now', b: txt }); if (!t.ag) t.ag = 'me'; t.sla = null;
        if (k === 'solve') { t.st = 'solved'; t.solvedNow = true; if (S.set.csat) sysMsg(t, 'Solved by ' + ME + '. Rating request sent.'); } else t.st = 'pending';
        S.compose = { mode: 'reply', text: '' }; S.scrollThread = true; toast(k === 'solve' ? `Sent to ${tr(t).name} and solved` : `Sent to ${tr(t).name}. Waiting on their reply.`); return; }
      case 'action': {
        const T = tr(t); const acct = (T.accts[0] || [''])[0];
        if (k === 'login') { if (!acct) { toast('No trading account'); return; } sysMsg(t, `${ME} resent the platform login for ${acct}.`); toast('Platform login sent'); return; }
        if (k === 'pw') { sysMsg(t, `${ME} sent a password reset link.`); toast('Password reset link sent'); return; }
        if (k === 'review') { if (t.review) { S.view = 'reviews'; S.review = t.review; break; } if (!acct) { toast('No trading account'); return; } const rid = 'BR-' + (213 + REVIEWS.length); REVIEWS.unshift({ id: rid, tk: t.id, tr: t.tr, acct, rule: 'Max Drawdown', limit: '—', when: 'Today', claim: t.subj, st: 'open', first: null, trades: [['—', '—', 'Waiting for the platform feed', '—', '—', '—', '—', '—']] }); t.review = rid; sysMsg(t, `Breach review ${rid} opened by ${ME}.`); toast(`Breach review ${rid} opened`); return; }
        if (!acct && k !== 'refund') { toast('No trading account'); return; }
        const orders = t.cat === 'billing' && t.id === 4817 ? [['FS-ORD-2288', 'Duplicate, no account', 99], ['FS-ORD-2287', T.accts[0][1], 99]] : [['FS-ORD-' + (2200 + +T.id % 97), (T.accts[0] || ['', 'Order'])[1], T.id === '0975' ? 46.5 : 169]];
        const f = { refund: { orders, order: orders[0][0], amount: orders[0][2], reason: t.id === 4817 ? 'dup' : 'notrade', close: t.id !== 4817 }, reset: { acct, reason: 'error' }, extend: { acct, days: '7' }, switch: { acct, plat: 'NinjaTrader' } }[k];
        S.drawer = { kind: k, f }; break; }
      case 'closeDrw': S.drawer = null; break;
      case 'artSt': D.st = k; break;
      case 'saveDrw': saveDrawer(); return;
      case 'delMacro': { const i = MACROS.findIndex((m) => m.id === D.id); MACROS.splice(i, 1); S.drawer = null; toast('Saved reply deleted'); return; }
      case 'goReview': S.view = 'reviews'; S.review = id; break;
      case 'pickReview': S.review = id; break;
      case 'decide': { const r = REVIEWS.find((x) => x.id === S.review); r.decision = k; r.first = ME; r.note = S.rvnote || ''; r.st = 'second'; S.rvnote = ''; const tk = TICKETS.find((x) => x.id === r.tk); if (tk) { tk.msgs.push({ f: 'n', who: ME, t: 'Just now', b: `Proposed: ${k === 'reinstated' ? 'reinstate the account' : 'uphold the closure'}. Waiting for a second reviewer.` }); } toast('Sent to a second reviewer'); return; }
      case 'confirmReview': { const r = REVIEWS.find((x) => x.id === S.review); r.st = r.decision; r.second = '[Risk Reviewer]'; const tk = TICKETS.find((x) => x.id === r.tk); if (tk) { tk.msgs.push({ f: 's', t: 'Just now', b: `${r.id} decided: ${r.st === 'reinstated' ? 'account reinstated' : 'closure upheld'}. Confirmed by [Risk Reviewer].` }); } toast(r.st === 'reinstated' ? 'Account reinstated. Reply to the trader from the ticket.' : 'Closure upheld. Reply to the trader from the ticket.'); return; }
      case 'rejectReview': { const r = REVIEWS.find((x) => x.id === S.review); r.st = 'open'; r.first = null; toast('Sent back for another look'); return; }
      case 'openTicket': S.view = 'inbox'; S.q = 'open'; S.sel = +id; S.mconv = true; S.scrollThread = true; if (!TICKETS.find((x) => x.id === +id)) { toast('That ticket is solved and archived'); S.sel = TICKETS[0].id; } break;
      case 'editMacro': { const m = MACROS.find((x) => x.id === id) || { id: '', name: '[New Saved Reply]', cat: 'rules', body: 'Hi {first_name}, ', uses: 0 }; S.drawer = { kind: 'macro', f: { ...m } }; break; }
      case 'editArticle': { const x = ARTICLES.find((z) => z.id === id) || { id: '', t: '[New Article]', cat: 'Rules', body: '', st: 'Draft', views: 0, help: 0, up: 'Nov 22' }; S.drawer = { kind: 'article', f: { ...x } }; break; }
      case 'draftFrom': S.drawer = { kind: 'article', f: { id: '', t: k, cat: 'Billing', body: '', st: 'Draft', views: 0, help: 0, up: 'Nov 22' } }; break;
      case 'helpCat': S.helpCat = k; break;
      case 'range': S.range = +k; break;
      case 'invite': S.drawer = { kind: 'invite', f: { email: '', role: 'Agent' } }; break;
      case 'newTicket': S.drawer = { kind: 'new', f: { tr: 't1043', subj: '', cat: 'account', pri: 'normal', body: '' } }; break;
      case 'setT': S.set[k] = !S.set[k]; break;
      case 'setAssign': S.set.assign = k; break;
      default: return;
    }
    render();
  });
  function saveDrawer() {
    const { kind, f } = S.drawer; const t = cur();
    if (kind === 'refund') { const amt = +f.amount || 0; if (!amt) { toast('Enter an amount'); return; } if (amt > agent('me').limit) { sysMsg(t, `Refund of ${money(amt)} on ${f.order} sent to a Lead for approval.`); toast('Sent for approval'); } else { sysMsg(t, `${ME} refunded ${money(amt)} on ${f.order}${f.close ? ' and closed the account' : ''}.`); toast(`Refunded ${money(amt)}`); } }
    else if (kind === 'reset') { sysMsg(t, `${ME} gave a free reset on ${f.acct}.`); toast('Account reset'); }
    else if (kind === 'extend') { sysMsg(t, `${ME} added ${f.days} days to ${f.acct}.`); toast(`${f.days} days added`); }
    else if (kind === 'switch') { sysMsg(t, `${ME} moved ${f.acct} to ${f.plat}. Platform Switched email sent.`); toast(`Moved to ${f.plat}`); }
    else if (kind === 'macro') { if (f.id) Object.assign(MACROS.find((m) => m.id === f.id), f); else MACROS.push({ ...f, id: 'm' + (++seq) }); toast('Saved reply saved'); }
    else if (kind === 'article') { if (f.id) Object.assign(ARTICLES.find((x) => x.id === f.id), f, { up: 'Nov 22' }); else ARTICLES.push({ ...f, id: 'h' + (++seq) }); toast(f.st === 'Published' ? 'Article published' : 'Saved as a draft'); }
    else if (kind === 'new') { if (!f.subj.trim()) { toast('Add a subject'); return; } const nid = ++seq; TICKETS.unshift({ id: nid, subj: f.subj, cat: f.cat, pri: f.pri, st: f.body ? 'pending' : 'open', ch: 'email', tr: f.tr, ag: 'me', sla: f.body ? null : S.set.sla[f.pri][0], age: 'Now', msgs: f.body ? [{ f: 'a', who: ME, t: 'Just now', b: f.body }] : [{ f: 's', t: 'Just now', b: `Ticket opened by ${ME}.` }] }); S.view = 'inbox'; S.q = 'open'; S.sel = nid; S.mconv = true; toast(`Ticket #${nid} created`); }
    else if (kind === 'invite') { if (!/^\S+@\S+\.\S+$/.test(f.email)) { toast('Enter a full email address'); return; } toast(`Invite sent to ${f.email}`); }
    S.drawer = null; render();
  }
  root.addEventListener('input', (ev) => {
    const el = ev.target; const lv = el.dataset && el.dataset.live; if (!lv) return;
    if (lv === 'compose') { S.compose.text = el.value; return; }
    if (lv === 'search') { S.search = el.value; S.focus = { k: 'srch', s: el.selectionStart }; render(); }
  });
  root.addEventListener('change', (ev) => {
    const el = ev.target; const t = cur();
    if (el.id === 'mnavsel') { S.drawer = null; S.ctx = false; const v = el.value; if (v.startsWith('q:')) { S.view = 'inbox'; S.q = v.slice(2); S.mconv = false; const l = list(); if (l.length && !l.some((x) => x.id === S.sel)) S.sel = l[0].id; } else S.view = v.slice(2); render(); return; }
    if (S.drawer && el.dataset.df) { S.drawer.f[el.dataset.df] = el.type === 'number' ? +el.value : el.value; if (['amount', 'order'].includes(el.dataset.df)) { if (el.dataset.df === 'order') { const o = S.drawer.f.orders.find((x) => x[0] === el.value); S.drawer.f.amount = o[2]; } render(); } return; }
    if (S.drawer && el.dataset.dfc) { S.drawer.f[el.dataset.dfc] = el.checked; return; }
    const b = el.dataset.bind; if (!b) return;
    if (b === 'macro') { const m = MACROS.find((x) => x.id === el.value); if (m) { S.compose.text = (S.compose.text ? S.compose.text + '\n\n' : '') + fillMacro(m, t); m.uses += 1; S.compose.mode = 'reply'; S.focus = { k: 'cmp', s: S.compose.text.length }; } render(); return; }
    if (b === 'rvnote') { S.rvnote = el.value; return; }
    const p = b.split('.');
    if (p[0] === 't') { const old = t[p[1]]; t[p[1]] = el.value || null; const lab = { st: 'Status', pri: 'Priority', ag: 'Assignee', cat: 'Topic' }[p[1]]; const val = p[1] === 'st' ? STS[el.value] : p[1] === 'pri' ? PRI[el.value][0] : p[1] === 'ag' ? (agent(el.value) || { name: 'Unassigned' }).name : CATS[el.value]; sysMsg(t, `${ME} changed ${lab.toLowerCase()} to ${val}.`); if (p[1] === 'st' && el.value === 'solved') t.solvedNow = true; void old; }
    else if (p[0] === 'ag') { const a = AGENTS[+el.dataset.i]; a[p[1]] = p[1] === 'limit' ? +el.value : el.value; }
    else if (p[0] === 'set') { let o = S.set; for (let i = 1; i < p.length - 1; i++) o = o[p[i]]; const last = p[p.length - 1]; o[last] = /^\d+$/.test(el.value) && p[1] === 'sla' ? +el.value : el.value; }
    render();
  });
  document.addEventListener('keydown', (ev) => { if (!root.isConnected) return; if (ev.key === 'Escape') { if (S.drawer) S.drawer = null; else if (S.ctx) S.ctx = false; else return; render(); } });

  function ROUTE(hv, P) { const ok = ['inbox', 'reviews', 'macros', 'help', 'reports', 'team', 'settings']; if (ok.includes(hv)) S.view = hv; if (P.q) S.q = P.q; if (P.t) S.sel = +P.t; if (P.review) { S.view = 'reviews'; S.review = P.review; } }
  // deep links: Board.dc.html#view?key=value
  const DEEP = () => { try { const raw = decodeURIComponent((location.hash || '').slice(1)); if (!raw) return; const [hv, hq] = raw.split('?'); const P = {}; (hq || '').split('&').forEach((kv) => { const [k, v] = kv.split('='); if (k) P[k] = v || ''; }); ROUTE(hv, P); } catch (e) { /* no deep link */ } };
  DEEP();
  window.addEventListener('hashchange', () => { if (!root.isConnected) return; if ('drawer' in S) S.drawer = null; DEEP(); render(); const mm = root.querySelector('.main'); if (mm) mm.scrollTop = 0; });
  render();

}
