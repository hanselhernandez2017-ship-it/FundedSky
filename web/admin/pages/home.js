
function startBoard(root) {

  // ===== shared visuals (VZ) =====
  const VZ = (() => {
    const E = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const W = ["x.b.1.k.d.5.q.3.w", "o.2.b.4.4.j.e.1.y.1.u", "r.2.3.8.9.f.u.2.b.a.a.3.1.1.c", "m.2.1.3.1.1.1.2.1.1.1.4.a.d.u.1.6.1.3.k.4.2.e", "7.8.a.7.2.1.3.2.1.4.5.d.h.4.f.2.1.y.4.1.3", "0.2.4.m.1.a.2.1.1.3.5.8.j.a.3.a.1.16", "2.1.2.w.1.1.2.4.6.5.7.3.a.4.2.4.2.1k", "6.t.3.1.5.1.7.3.j.5.1.1l.1.6", "5.8.2.j.7.3.u.5.2.1.2.1e.3.2.5", "9.2.8.g.6.6.n.1.6.2.3.1a.7.2.7", "6.1.d.j.2.8.l.1.4.1.4.1a.8.3.7", "l.i.2.9.i.1.1.3.1.1j.5.1.9", "l.o.4.1.m.1k.1.1.e", "m.o.4.1.k.1l.g", "m.n.1.1.o.6.1.6.1.1.1.4.2.y.h", "m.m.o.5.2.3.1.4.6.2.2.v.4.1.f", "m.k.q.4.3.1.2.1.1.2.1.9.1.r.1.2.5.1.f", "n.i.r.4.5.1.5.9.2.r.2.1.3.1.g", "o.i.r.7.9.z.5.3.g", "p.f.s.a.2.1.5.y.4.1.j", "r.9.2.1.t.n.1.t.n", "q.1.1.5.6.1.r.i.1.6.1.r.o", "r.1.1.4.x.k.1.6.1.1.4.m.n", "u.3.5.2.p.m.1.8.4.8.1.9.q", "u.3.3.1.4.1.n.m.1.7.6.5.3.5.u", "v.6.t.l.2.5.7.4.5.5.5.1.n", "z.4.q.n.1.3.a.2.7.5.4.1.n", "11.2.q.o.d.2.7.1.1.3.4.1.n", "12.1.3.1.1.3.j.q.a.2.7.1.2.1.4.1.o", "15.8.i.p.c.1.h.1.l", "15.a.h.2.1.1.2.h.j.1.1.1.5.2.o", "15.b.o.e.l.1.1.1.3.2.p", "14.c.o.d.n.2.2.3.p", "14.f.l.c.o.2.2.3.1.1.4.3.g", "13.i.k.b.13.3.e", "14.i.j.b.r.2.a.4.d", "15.h.j.b.x.1.9.1.c", "15.g.k.b.10.3.h", "16.e.l.b.3.1.u.4.3.1.e", "17.d.l.a.3.2.t.9.e", "18.c.l.9.4.1.t.b.d", "18.b.n.8.3.2.q.f.c", "18.9.p.8.4.1.q.g.b", "18.9.p.7.x.f.b", "17.9.r.5.y.f.b", "17.8.s.4.z.4.4.7.b", "17.6.26.5.c", "17.6.27.4.c", "17.4.2n.1.1", "16.5.2b.1.9.1.3", "16.4.2l.1.4", "16.4.2q", "16.3.2r", "16.2.2s", "18.2.2q"]; const ST = 2.5; const L0 = 80; const COLS = 144;
    let DOTS = null;
    const dots = () => { if (DOTS) return DOTS; const out = []; W.forEach((row, y) => { let x = 0, land = false; row.split('.').forEach((r) => { const n = parseInt(r, 36); if (land) for (let k = 0; k < n; k++) out.push([x + k, y]); x += n; land = !land; }); }); return (DOTS = out); };
    const CC = { 'United States': [39, -98], 'United Kingdom': [53, -1.5], India: [21, 78], Mexico: [23, -102], Nigeria: [9, 8], Japan: [36.5, 138], Spain: [40, -3.7], Canada: [56, -106], Australia: [-25, 134], Germany: [51, 10], UAE: [24, 54], Singapore: [1.35, 103.8], Brazil: [-10, -52], 'South Korea': [36, 128], Poland: [52, 19], Argentina: [-34, -64], Kenya: [0, 38], Netherlands: [52.2, 5.3], Philippines: [12, 122], Italy: [42.8, 12.5], Ireland: [53.3, -8], Turkey: [39, 35], Sweden: [62, 15], Chile: [-33, -71], France: [46.5, 2.5], Czechia: [49.8, 15.5], Portugal: [39.5, -8], Ghana: [7.9, -1], Norway: [61, 9], Colombia: [4.6, -74], Cyprus: [35, 33], 'South Africa': [-29, 24], Egypt: [27, 30], Vietnam: [16, 107], Indonesia: [-2, 118], Thailand: [15, 101], Pakistan: [30, 70], Russia: [58, 60], China: [35, 104], Morocco: [32, -6], Peru: [-9, -75], 'New Zealand': [-41, 174], Switzerland: [46.8, 8.2], Romania: [45.9, 25], Ukraine: [49, 32], Israel: [31.5, 34.9], 'Saudi Arabia': [24, 45], Malaysia: [3.5, 102], 'Hong Kong': [22.3, 114.2], "Venezuela": [7, -66], "Ecuador": [-1.5, -78], "Bangladesh": [24, 90], "Taiwan": [23.7, 121], "Greece": [39, 22], "Austria": [47.5, 14.5], "Belgium": [50.6, 4.6], "Denmark": [56, 10], "Finland": [64, 26], "United Arab Emirates": [24, 54], "Qatar": [25.3, 51.2], "Jamaica": [18.1, -77.3], "Dominican Republic": [18.8, -70.2], "Puerto Rico": [18.2, -66.5], "Costa Rica": [9.9, -84], "Panama": [8.5, -80], "Guatemala": [15.5, -90.3], "Uruguay": [-32.5, -56], "Paraguay": [-23, -58], "Bolivia": [-17, -65], "Ethiopia": [9, 40], "Tanzania": [-6, 35], "Uganda": [1.3, 32.3], "Cameroon": [6, 12], "Senegal": [14.5, -14.5], "Hungary": [47.2, 19.5], "Serbia": [44, 21], "Croatia": [45.1, 15.2], "Bulgaria": [42.7, 25.5], "Slovakia": [48.7, 19.7], "Lithuania": [55.2, 23.9], "Latvia": [56.9, 24.6], "Estonia": [58.6, 25], "Iceland": [65, -18], "Sri Lanka": [7.9, 80.8], "Nepal": [28, 84], "Kazakhstan": [48, 67], "Malta": [35.9, 14.4], "Luxembourg": [49.8, 6.1], "Trinidad and Tobago": [10.7, -61.2], "Bahamas": [24.3, -76.6], "Barbados": [13.2, -59.5] };
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
  // ===== shared admin kit (part A: helpers) =====
  const ME = '[Your Name]';
  const RV2 = '[Second Reviewer]';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = (v, d) => (v < 0 ? '−' : '') + '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  const kmoney = (v) => { const a = Math.abs(v); const s = v < 0 ? '−' : ''; return a >= 1e6 ? `${s}$${(a / 1e6).toFixed(2)}M` : a >= 1e4 ? `${s}$${(a / 1e3).toFixed(1)}K` : money(v); };
  const num = (v) => Math.round(v).toLocaleString('en-US');
  const pct = (v, d = 1) => (isFinite(v) ? v.toFixed(d) : '0') + '%';
  const rng = (seed) => { let h = 2166136261; for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; };
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = (ago) => { const d = new Date(2026, 10, 22 - ago); return `${MON[d.getMonth()]} ${d.getDate()}${d.getFullYear() !== 2026 ? ', ' + d.getFullYear() : ''}`; };
  const S = { view: null, drawer: null, toast: '', focus: null, set: {}, sel: {} };
  const LOG = [];
  const audit = (what, det) => LOG.unshift(['Just now', ME, what, det || '']);
  const b = (t, c) => `<span class="b ${c || 'plain'}">${t}</span>`;
  const ph = (t, p, act = '') => `<div class="ph"><div><h1>${t}</h1><p>${p}</p></div>${act ? `<div class="act">${act}</div>` : ''}</div>`;
  const card = (title, lab, body, extra = '', cls = '') => `<div class="card m0 ${cls}"><div class="ch"><h3>${title}</h3>${lab !== '' && lab != null ? `<span class="lab">${lab}</span>` : ''}${extra}</div>${body}</div>`;
  const r = (h) => `<div class="r">${h}</div>`;
  const cb = (h, cls = '') => `<div class="cb ${cls}">${h}</div>`;
  const tiles = (arr, cls = 't4') => `<div class="tiles ${cls}">${arr.map(([l, v, s, c, go]) => `<${go ? `button class="tile lk" data-act="go" data-v="${go}"` : 'div class="tile"'}><span>${l}</span><b class="${c || ''}">${v}</b><small>${s || ''}</small></${go ? 'button' : 'div'}>`).join('')}</div>`;
  const kv = (pairs) => `<div class="kv">${pairs.map(([k, v, c]) => `<div><span>${k}</span><b class="${c || ''}">${v}</b></div>`).join('')}</div>`;
  const sw = (k, l, sub) => `<div class="srow"><span>${l}${sub ? `<small class="hint" style="display:block;margin-top:2px">${sub}</small>` : ''}</span><button class="sw ${S.set[k] ? 'on' : ''}" role="switch" aria-checked="${!!S.set[k]}" aria-label="${esc(l)}" data-act="setT" data-k="${k}"></button></div>`;
  const seg = (key, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${String(S[key]) === String(v) ? 'on' : ''}" data-act="segv" data-k="${key}" data-v="${v}">${l}</button>`).join('')}</div>`;
  const sel = (bind, opts, cur, label, w) => `<select data-bind="${bind}" aria-label="${esc(label)}"${w ? ` style="width:${w}px"` : ''}>${opts.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(cur) === String(v) ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`;
  const fld = (id, label, val, attrs = '') => `<div class="fl"><label for="${id}">${label}</label><input id="${id}" value="${esc(val)}" ${attrs}></div>`;
  // table: head = ['Name', ['Amount','num'], ...]; rows = arrays of cell html; opts.row(i) -> attrs
  const table = (head, rows, opts = {}) => `<div class="tsc"><table class="t ${opts.cls || ''}"><thead><tr>${head.map((h) => { const [l, c] = Array.isArray(h) ? h : [h, '']; return `<th class="${c}">${l}</th>`; }).join('')}</tr></thead><tbody>${rows.length ? rows.map((row, i) => `<tr ${opts.row ? opts.row(i) : ''}>${row.map((c, j) => { const h = head[j]; const cls = Array.isArray(h) ? h[1] : ''; return `<td class="${cls}${cls.includes('num') ? ' nw' : ''}">${c}</td>`; }).join('')}</tr>`).join('') : `<tr><td colspan="${head.length}"><div class="empty">${opts.empty || 'Nothing here.'}</div></td></tr>`}</tbody></table></div>`;
  const hbars = (items, fmt, color) => { const mx = Math.max(1, ...items.map((x) => x[1])); return items.map((x) => `<div><div class="rowl"><span>${x[0]}</span><b>${fmt(x[1])}${x[2] ? `<em class="hint"> · ${x[2]}</em>` : ''}</b></div><div class="split"><i style="width:${x[1] / mx * 100}%${color ? ';background:' + color : ''}"></i></div></div>`).join(''); };
  const meter = (p, c) => `<div class="mtw"><div class="mt"><i style="width:${Math.min(100, p)}%;background:${c || 'var(--sky)'}"></i></div><span>${Math.round(p)}%</span></div>`;
  const tl = (items) => `<div class="tl2">${items.map((e) => `<div><i></i><div><b>${e[0]}</b><p>${e[1]}</p></div></div>`).join('')}</div>`;
  const XL = (board, hash, label, cls) => `<a class="${cls || 'lnk'}" href="/admin/${board.toLowerCase()}${hash ? '#' + hash : ''}">${label}</a>`;
  const UL = (name, uid) => XL('Users', uid != null && uid !== '' ? 'user?id=' + encodeURIComponent(uid) : 'user?name=' + encodeURIComponent(name), esc(name)); // by user ID, so two people with the same name never share a link
  const CHARTS = {};
  const nice = (v) => { if (v <= 0) return 1; const e = Math.pow(10, Math.floor(Math.log10(v))); const f = v / e; return [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => f <= s) * e; };
  function lineChart(id, labels, sers, fmt, opt = {}) {
    const H = opt.h || 220; const vals = sers.flatMap((s) => s.v.filter((x) => x != null)); const max = nice(Math.max(...vals, 0) * 1.08); const n = labels.length;
    const X = (i) => (n === 1 ? 50 : i / (n - 1) * 100); const Y = (v) => 100 - v / max * 100; CHARTS[id] = { labels, sers, fmt };
    const path = (v) => v.map((y, i) => (y == null ? null : `${X(i).toFixed(2)},${Y(y).toFixed(2)}`)).filter(Boolean).join(' ');
    const xt = Array.from({ length: Math.min(n, 6) }, (_, k) => Math.round(k * (n - 1) / Math.max(1, Math.min(n, 6) - 1)));
    return `<div class="chw" data-chart="${id}" style="height:${H + 26}px"><div class="cha" style="height:${H}px">${[0, 1, 2, 3, 4].map((g) => `<div class="gl" style="top:${g * 25}%"><span>${fmt(max * (1 - g / 4))}</span></div>`).join('')}<svg viewBox="0 0 100 100" preserveAspectRatio="none" class="lc">${sers.map((s, k) => `${k === 0 && !s.dash ? `<polygon class="ar" points="0,100 ${path(s.v)} 100,100"/>` : ''}<polyline class="ln ${s.cls || ''}" points="${path(s.v)}" vector-effect="non-scaling-stroke"/>`).join('')}</svg><div class="chx" style="display:none"></div><div class="tip" style="display:none"></div></div><div class="xl">${xt.map((i) => `<span style="left:${X(i)}%">${esc(labels[i])}</span>`).join('')}</div></div>`;
  }
  function vbars(items, fmt, opt = {}) { const mx = Math.max(1, ...items.map((x) => Math.max(x[1], x[2] || 0)));
    return `<div class="vb" style="height:${opt.h || 200}px">${items.map((x) => `<div title="${esc(x[0])}: ${fmt(x[1])}${x[2] != null ? ' · ' + fmt(x[2]) : ''}"><div class="vbb"><i style="height:${x[1] / mx * 100}%"></i>${x[2] != null ? `<i class="b2" style="height:${x[2] / mx * 100}%"></i>` : ''}</div><span>${esc(x[0])}</span></div>`).join('')}</div>`; }
  const series30 = (seed, base, vol, grow) => { const g = rng(seed); return Array.from({ length: 30 }, (_, k) => Math.round(base * (1 + (grow || 0) * k / 30) * (0.85 + g() * 0.3))); };
  const days30 = Array.from({ length: 30 }, (_, k) => day(29 - k));
  // ===== Admin Home ===== /*LIVE*/
  const F = window.FSG; const BO = F.BO;
  const M = (() => { const P = F.paid(); const ev = BO.accounts.filter((a) => a.kind === 'evaluation'); const fu = BO.accounts.filter((a) => a.kind === 'funded');
    const owed = BO.payouts.filter((p) => ['requested', 'approved'].includes(p.status)).reduce((s, p) => s + p.amount, 0);
    const liab = fu.filter((a) => !['breached', 'closed'].includes(a.phase)).reduce((s, a) => s + Math.max(0, a.avail || 0), 0) + owed;
    const revS = F.series(P, 'paid', (o) => o.total, 60); const rev30 = revS.slice(30); const prev30 = F.sum(revS.slice(0, 30));
    const C0 = BO.counts || {};
    return { P, ev, fu, owed, liab, revS, rev30, prev30: C0.revPrev30 != null ? C0.revPrev30 : prev30, r30: C0.rev30 != null ? C0.rev30 : F.sum(rev30), revToday: C0.revToday, nToday: C0.paidToday, today: P.filter((o) => F.today(o.paid)), liveEval: ev.filter((a) => a.phase === 'active'), liveFund: fu.filter((a) => a.phase === 'active' || a.phase === 'review') }; })();
  const plat = [...new Set(M.liveEval.map((a) => a.platform))];
  const fundedS = F.daysIso(30).map((d) => BO.accounts.filter((a) => a.kind === 'funded' && a.created && F.isoET(a.created) <= d && (!a.breached || F.isoET(a.breached) > d) && (!a.closed || F.isoET(a.closed) > d)).length);
  const evalS = F.daysIso(30).map((d) => BO.accounts.filter((a) => a.kind === 'evaluation' && a.created && F.isoET(a.created) <= d && (!a.breached || F.isoET(a.breached) > d) && (!a.passed || F.isoET(a.passed) > d)).length);
  // Daily liability snapshots the server records each night (store.analytics.liab); today is the live figure
  const liabS = (() => { const H = F.st('analytics.liab', []); const days = F.daysIso(30); let last = null; const v = days.map((d, i) => { if (i === days.length - 1) return M.liab; const x = H.find((y) => y.d === d); if (x) last = x.v; return last; }); const known = v.filter((x) => x != null); return known.length >= 2 ? v.map((x) => (x == null ? known[0] : x)) : null; })();
  const visS = F.series(BO.users.filter((u) => u.last_login), 'last_login', null, 30);
  const ord = (n) => `${n} ${n === 1 ? 'order' : 'orders'}`;
  // Totals come from the server's counts (the lists the board loads are capped)
  const CN = BO.counts || {}; const cnt = (k, list) => (CN[k] != null ? CN[k] : list.length);
  const BC = { users: `${num(cnt('traders', BO.users.filter((u) => u.role === 'trader')))} Users`, risk: () => `${num(((BO.store || {})['risk.alerts'] || []).filter((x) => ['new', 'investigating', 'second'].includes(x.st)).length)} Open Alerts` };
  const BOARDS = [
    ['AdminUsers.dc.html', 'Users', 'Every customer, KYC and account changes', `${num(cnt('traders', BO.users.filter((u) => u.role === 'trader')))} Users`], ['AdminRisk.dc.html', 'Risk', 'Limits, alerts, payout reviews and plan profit', `${num(cnt('toReview', BO.payouts.filter((p) => p.status === 'requested')))} Payouts to Review`],
    ['AdminFinance.dc.html', 'Finance and Payouts', 'Sending payouts, the ledger and reconciliation', `${kmoney(BO.payouts.filter((p) => p.status === 'approved').reduce((s, p) => s + p.amount, 0))} Ready to Send`], ['AdminPlatforms.dc.html', 'Trading Platforms', 'Opening accounts, funded handoff and data licenses', `${num(cnt('evalLive', M.liveEval) + cnt('fundedLive', M.liveFund))} Live Accounts`],
    ['AdminSupport.dc.html', 'Support', 'Tickets, breach reviews and the help center', `${num(cnt('openTickets', BO.tickets.filter((t) => t.status === 'open')))} Open Tickets`], ['AdminEmails.dc.html', 'Emails', 'Every email the system sends', `${num(cnt('emails', BO.outbox || []))} Emails`],
    ['AdminAnalytics.dc.html', 'Analytics', 'Revenue, customers, marketing and forecasts', `${kmoney(M.r30)} Revenue in 30 Days`], ['AdminCatalog.dc.html', 'Catalog', 'Plans, sizes, prices and checkout', `${BO.catalog.plans.filter((p) => p.active).length} Plans`],
    ['AdminAffiliates.dc.html', 'Affiliates', 'Applications, codes, commissions and payouts', `${BO.users.filter((u) => u.settings && u.settings.affApplied && !((BO.lists && BO.lists.affiliates) || []).some((x) => x.user === u.id)).length} Applications`], ['AdminCompliance.dc.html', 'Compliance and Tax', 'Tax forms, monitoring, complaints and legal documents', `${BO.users.filter((u) => BO.accounts.some((a) => a.kind === 'funded' && a.user === u.id) && u.tax_status !== 'on_file').length} Missing Tax Forms`],
    ['AdminCompetitions.dc.html', 'Competitions', 'Trading contests, leaderboards and prizes', `${(((BO.content || {}).competitions) || BO.contentDefault.competitions).filter((c) => c.st === 'live').length} Running`], ['AdminRewards.dc.html', 'Certificates and Rewards', 'Certificates, credits and referrals', `${num(cnt('withCredits', BO.users.filter((u) => u.points > 0)))} With Credits`], ['AdminPacks.dc.html', 'Packs and Credits', 'Packs, cards, odds, credit bundles and checkout rewards', (((BO.settings || {}).flags || {}).packs === false) ? 'Switched Off' : 'On Sale'],
    ['AdminContent.dc.html', 'Announcements and Content', 'Banners, release notes and website pages', `${((BO.lists && BO.lists.announcements) || []).filter((a) => a.live && (!a.ends || new Date(a.ends) > new Date())).length} Live Banners`], ['AdminTeam.dc.html', 'Team and Approvals', 'Staff, roles, security and two-person approvals', `${cnt('staff', BO.users.filter((u) => u.role !== 'trader'))} Staff`],
    ['AdminSettings.dc.html', 'Settings', 'Company, integrations, webhooks and maintenance', `${(BO.integrations || []).filter((x) => x.enabled).length} Services Connected`], ['AdminFraud.dc.html', 'Fraud and Multi-Accounting', 'Linked traders, shared devices, cards and sign-up velocity', 'Linked Traders'], ['AdminDisputes.dc.html', 'Chargebacks and Disputes', 'Deadlines, evidence packs, early warnings and win rate', `${(BO.disputes || []).filter((d) => d.status === 'open').length} Open Disputes`], ['AdminHealth.dc.html', 'System Health', 'Uptime, background jobs, webhooks, errors and incidents', `${(BO.integrations || []).filter((x) => x.enabled && x.status !== 'live').length} Services Need Attention`]];
  const oldest = (rows, key) => { const t = rows.map((r) => r[key]).filter(Boolean).sort()[0]; if (!t) return 'Today'; const h = F.hoursSince(t); return h < 1 ? Math.max(1, Math.round(h * 60)) + ' minutes' : h < 48 ? Math.round(h) + (Math.round(h) === 1 ? ' hour' : ' hours') : Math.round(h / 24) + ' days'; };
  const T = { req: BO.payouts.filter((p) => p.status === 'requested'), appr: BO.payouts.filter((p) => p.status === 'approved'), kyc: BO.users.filter((u) => u.kyc_status === 'submitted'), tk: BO.tickets.filter((t) => t.status === 'open'), aff: BO.users.filter((u) => u.settings && u.settings.affApplied && !((BO.lists && BO.lists.affiliates) || []).some((x) => x.user === u.id)), tax: BO.users.filter((u) => BO.accounts.some((a) => a.kind === 'funded' && a.user === u.id) && u.tax_status !== 'on_file'), cb: (BO.disputes || []).filter((d) => d.status === 'open'), // Risk Alerts is the Risk board's own open list (new, investigating, waiting for a second reviewer); accounts close to a limit are a separate row
    alerts: ((BO.store || {})['risk.alerts'] || []).filter((x) => ['new', 'investigating', 'second'].includes(x.st)), near: BO.accounts.filter((a) => a.phase === 'active' && a.dll && a.today < 0 && -a.today / a.dll >= 0.8), passed: BO.accounts.filter((a) => a.phase === 'passed'), hooks: (BO.hooks || []).filter((h) => !h.ok && F.within(h.created_at, 1)) };
  const TODO = [
    { n: 'Risk Alerts', c: T.alerts.length, old: oldest(T.alerts, 'first'), to: 'AdminRisk.dc.html#alerts', board: 'Risk', sev: 'hi' },
    { n: 'Accounts Near Their Daily Loss Limit', c: T.near.length, old: 'Today', to: 'AdminRisk.dc.html#accounts', board: 'Risk', sev: 'hi' },
    { n: 'Payouts to Review', c: cnt('toReview', T.req), old: oldest(T.req, 'requested'), to: 'AdminRisk.dc.html#payouts', board: 'Risk', sev: 'md' },
    { n: 'Payouts Ready to Send', c: cnt('toSend', T.appr), old: oldest(T.appr, 'approved'), to: 'AdminFinance.dc.html#queue', board: 'Finance and Payouts', sev: 'md' },
    { n: 'KYC Reviews', c: cnt('kycQueue', T.kyc), old: oldest(T.kyc.map((u) => ({ at: u.kyc && u.kyc.at })), 'at'), to: 'AdminUsers.dc.html#kycq', board: 'Users', sev: 'md' },
    { n: 'Passed, Waiting for a Funded Account', c: cnt('passedWaiting', T.passed), old: oldest(T.passed, 'passed'), to: 'AdminPlatforms.dc.html#handoff', board: 'Trading Platforms', sev: 'md' },
    { n: 'Open Support Tickets', c: cnt('openTickets', T.tk), old: oldest(T.tk, 'created'), to: 'AdminSupport.dc.html#inbox?q=open', board: 'Support', sev: 'md' },
    { n: 'Affiliate Applications', c: T.aff.length, old: oldest(T.aff, 'created_at'), to: 'AdminAffiliates.dc.html#apps', board: 'Affiliates', sev: 'lo' },
    { n: 'Missing Tax Forms', c: BO.taxOn ? T.tax.length : 0, old: 'Before next payout', to: 'AdminCompliance.dc.html#forms', board: 'Compliance and Tax', sev: 'lo' },
    { n: 'Chargebacks Needing Evidence', c: T.cb.length, old: T.cb.some((d) => d.due) ? 'Due ' + F.md(T.cb.filter((d) => d.due).map((d) => d.due).sort()[0]) : 'Open', to: 'AdminDisputes.dc.html#open', board: 'Chargebacks and Disputes', sev: 'hi' },
    { n: 'Failed Webhooks', c: T.hooks.length, old: 'Today', to: 'AdminHealth.dc.html#hooks', board: 'System Health', sev: 'md' }].filter((x) => x.c > 0);
  const svcRow = (name, id, extra) => { const x = F.integ(id); return [name, !x.enabled ? 'off' : x.status === 'live' ? 'ok' : 'warn', x.enabled ? 100 : 0, !x.enabled ? 'Not connected yet' : x.status === 'live' ? '' : (x.lastError || 'Not tested yet'), extra]; };
  const SVC = [['Website and Checkout', 'ok', 100], ['Trader Dashboard', 'ok', 100], svcRow('Cards · TailoredPay', 'tailoredpay'), svcRow('Backup Cards · Stripe', 'stripe'), svcRow('Crypto Payments · Confirmo', 'confirmo'), ['Trading Platforms', 'off', 0, 'Not connected. Accounts use the simulated feed'], ['Simulated Trade Feed', 'ok', 100], svcRow('Identity · Sumsub', 'sumsub'), svcRow('Tax Forms · Track1099', 'track1099'), svcRow('Email · Resend', 'resend'), svcRow('Payouts · Rise', 'rise')];
  const bad = () => SVC.filter((s) => s[1] === 'warn');
  const comps = ((BO.content || {}).competitions) || BO.contentDefault.competitions;
  const UPC = [].concat(T.appr.length ? [[F.md(Date.now() + 864e5), 'Payout Batch', `${T.appr.length} payouts, ${kmoney(T.appr.reduce((s, p) => s + p.amount, 0))}`]] : [],
    (BO.catalog.promos || []).filter((p) => p.active && p.ends && new Date(p.ends) > new Date()).map((p) => [F.md(p.ends + 'T12:00:00'), `${p.name} Ends`, `${p.pct}% off with ${p.code}`]),
    comps.filter((c) => c.st === 'upcoming').slice(0, 2).map((c) => [c.start, `${c.n} Starts`, c.size]),
    [['Jan 31', '1099-NEC Forms Due', `For US traders paid $600 or more in ${new Date().getFullYear()}`]]).slice(0, 5);
  const ACTL = { Risk: 'Risk#audit', Finance: 'Finance#batches', Users: 'Users#audit', Support: 'Support#inbox', Platforms: 'Platforms#setup', Team: 'Team#audit', Content: 'Content#ann', Settings: 'Settings#del', Catalog: 'Catalog#', Disputes: 'Disputes#open' };
  const boardOf = (a) => /^payout|^order|^refund/.test(a) ? 'Finance' : /^account|^trade|breach/.test(a) ? 'Risk' : /^user|^kyc|tax/.test(a) ? 'Users' : /^ticket/.test(a) ? 'Support' : /^content|^list\.ann/.test(a) ? 'Content' : /^catalog/.test(a) ? 'Catalog' : /^dispute/.test(a) ? 'Disputes' : /^staff/.test(a) ? 'Team' : 'Settings';
  const words = (a) => a.replace(/[._]/g, ' ').replace(/^./, (c) => c.toUpperCase());
  const ACT = [].concat((BO.audit || []).map((a) => [boardOf(a.action), `${a.by} · ${words(a.action)}${a.target ? ' · ' + a.target : ''}`, F.ago(a.at) === 'Just now' ? 'Just now' : F.ago(a.at) + (/min|hour/.test(F.ago(a.at)) ? ' ago' : ''), a.at]),
    M.P.slice(0, 30).map((o) => ['Finance', `Order ${o.code} paid: ${o.name}, ${money(o.total, 2)}`, F.ago(o.paid) + (/min|hour/.test(F.ago(o.paid)) ? ' ago' : ''), o.paid]),
    BO.users.filter((u) => u.role === 'trader').slice(0, 30).map((u) => ['Users', `${F.full(u)} signed up from ${u.country || 'an unknown country'}`, F.ago(u.created_at) + (/min|hour/.test(F.ago(u.created_at)) ? ' ago' : ''), u.created_at]))
    .sort((a, c) => new Date(c[3]) - new Date(a[3])).slice(0, 60);
  const GEO = ((BO.live || {}).geo || []).map((g) => ({ ...g, v: g.orders + g.signups + g.payouts + g.logins + g.trades })).filter((g) => g.v).sort((a, c) => c.v - a.v);
  const geoLab = (g) => [[g.orders, 'order'], [g.signups, 'sign-up'], [g.logins, 'trader signed in', 'traders signed in'], [g.trades, 'trade'], [g.payouts, 'payout request']].filter((x) => x[0]).map(([n, a, b]) => `${n} ${n === 1 ? a : b || a + 's'}`).join(' · ');
  const geo = GEO.map((g) => [g.country, g.v]);
  S.af = 'all';
  const rev30 = M.rev30;
  const sp = (v) => (v ? `<span class="tsp" style="display:block">${VZ.spark(v, { h: 28 })}</span>` : '');
  const delta = () => { if (!M.prev30) return 'No sales in the 30 days before'; const d = (M.r30 - M.prev30) / M.prev30 * 100; return `<span class="dl ${d >= 0 ? 'up' : 'dn'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(1)}%</span> vs previous`; };
  function vToday() { const open = TODO.reduce((s, x) => s + x.c, 0); const P = BO.live || {};
    return `${ph(F.greet(), `${F.longDate()}. ${open} ${open === 1 ? 'thing' : 'things'} across the back office ${open === 1 ? 'needs' : 'need'} a person.`)}
      ${tiles([['Revenue Today', money(M.revToday != null ? M.revToday : F.sum(M.today.map((o) => o.total))), XL('Analytics', 'overview', `${ord(M.nToday != null ? M.nToday : M.today.length)} today`) + sp(M.rev30)], ['Revenue, 30 Days', kmoney(M.r30), delta() + '<span class="hint" style="display:block">Paid orders, refunded ones left out</span>' + sp(M.revS.slice(30))], ['Payout Liability', kmoney(M.liab), XL('Analytics', 'liab', 'If everyone asked today') + sp(liabS)], ['Funded Accounts', num(cnt('fundedLive', M.liveFund)), XL('Risk', 'accounts', `${CN.fundedProfit != null ? CN.fundedProfit : M.liveFund.filter((a) => a.bal > a.start).length} in profit`) + sp(fundedS)], ['Active Evaluations', num(cnt('evalLive', M.liveEval)), XL('Platforms', 'accounts', `Across ${plat.length} ${plat.length === 1 ? 'platform' : 'platforms'}`) + sp(evalS)], ['On the Site Now', `<output id="hvis">${num(P.online || 0)}</output>`, `${P.checkout || 0} in checkout` + sp(visS)]], 't6')}
      <div class="two wl2 eq"><div class="card m0"><div class="ch"><h3>Needs a Person</h3><span class="lab">${open}</span></div>${TODO.length ? TODO.map((x) => `<a class="ali" href="${x.to}"><span class="b plain ${x.sev === 'hi' ? 'err' : x.sev === 'md' ? 'draft' : ''}">${x.c}</span><div><b>${x.n}</b><div class="hint">${x.board} · Oldest ${x.old}</div></div><span class="chev">›</span></a>`).join('') : '<div class="empty">Nothing needs a person right now.</div>'}</div>
      <div class="hcol"><div class="card m0"><div class="ch"><h3>System Status</h3>${bad().length ? b(bad().length + ' Need Attention', 'draft') : b('All Normal', 'live')}${r(XL('Health', 'overview', 'System Health'))}</div>${cb(bad().map((s) => `<div class="ubn warn" style="margin:0 0 10px"><span>${s[0]}: ${esc(s[3])}</span>${XL('Settings', 'int', 'Open', 'pill sm')}</div>`).join('') + `<div class="dots">${SVC.map((s) => `<span title="${esc(s[0] + (s[3] ? ': ' + s[3] : ''))}"><i class="${s[1]}"></i>${esc(s[0].replace(/ · .*$/, ''))}</span>`).join('')}</div>`)}</div>
      <div class="card"><div class="ch"><h3>Coming Up</h3></div>${cb(UPC.map((u) => `<div class="upc"><span>${u[0]}</span><div><b>${esc(u[1])}</b><div class="hint">${esc(u[2])}</div></div></div>`).join(''))}</div></div></div>
      <div class="two wl" style="margin-top:14px">${card('Today Around the World', 'Orders, sign-ups, sign-ins, trades and payouts · Eastern Time', `<div class="cb">${VZ.map(GEO.map((g) => ({ n: g.country, v: g.v, lab: geoLab(g) })), { live: true, label: 'Activity today' })}${GEO.length ? `<div class="kv geo" style="margin-top:12px">${GEO.slice(0, 6).map((g) => `<div><span title="${esc(g.country)}">${esc(g.country)}</span><b title="${esc(geoLab(g))}">${esc(geoLab(g))}</b></div>`).join('')}</div>` : '<p class="hint" style="margin:12px 0 0">No trader activity yet today.</p>'}</div>`, r(XL('Analytics', 'geo', 'Countries')))}${card('Back Office Pulse', 'Events per minute, last hour', cb(`${(() => { const v = P.pulse || Array(60).fill(0); const mx = Math.max(4, ...v); return `<div class="pulse">${v.map((x) => `<i style="height:${Math.max(2, x / mx * 100)}%"></i>`).join('')}</div><div class="kv" style="margin-top:14px">${[['Orders', num(M.today.length)], ['Sign-Ups', num(BO.users.filter((u) => F.today(u.created_at)).length)], ['Trades Checked', num(P.trades24 || 0)], ['Alerts Raised', num(T.alerts.length)]].map(([k, x]) => `<div><span>${k}</span><b>${x}</b></div>`).join('')}</div>`; })()}`), r(XL('Health', 'overview', 'System Health')))}</div>
      <div class="two" style="margin-top:14px">${card('Revenue', 'Last 30 Days', cb(lineChart('hrev', days30, [{ v: rev30, name: 'Revenue' }], kmoney, { h: 200 })), r('<a class="lnk" href="AdminAnalytics.dc.html">Open Analytics</a>'))}
      ${card('Latest Across the Back Office', '', cb(ACT.slice(0, 6).map((x) => `<div class="feedr">${XL(ACTL[x[0]].split('#')[0], ACTL[x[0]].split('#')[1], x[0], 'b plain')}<span>${esc(x[1])}</span><span class="hint nw">${x[2]}</span></div>`).join('') || '<div class="empty">Nothing yet.</div>'), r('<button class="lnk" data-act="go" data-v="activity">All Activity</button>'))}</div>`; }
  function vBoards() { const q = (S.bq || '').toLowerCase();
    return `${ph('All Boards', 'Every part of the back office. Open one to work in it.')}<div class="fbar"><input type="search" placeholder="Find a Board" value="${esc(S.bq || '')}" data-live="bq" data-key="bq" aria-label="Find a board" style="max-width:320px"></div>
      <div class="bgr">${BOARDS.filter((x) => !q || (x[1] + x[2]).toLowerCase().includes(q)).map((x) => `<a class="rcard" href="${x[0]}"><div class="rh"><b>${x[1]}</b><span class="chev">›</span></div><span class="hint">${x[2]}</span><span class="bn">${x[3]}</span></a>`).join('') || '<div class="empty">No board matches.</div>'}</div>`; }
  const INC = (BO.lists && BO.lists.incidents) || [];
  function vStatus() { const since = BO.users.map((u) => u.created_at).sort()[0];
    const up = (s) => Array.from({ length: 60 }, (_, k) => { const d = Date.now() - (59 - k) * 864e5; if (since && d < new Date(since) - 864e5) return ''; if (s[1] === 'off') return ''; const hit = INC.some((x) => x.service === s[0] && F.isoET(x.at) === F.isoET(d)); return hit ? 'bad' : 'ok'; });
    return `${ph('System Status', 'Every service the business depends on, checked every minute. Bars show the last 60 days.', XL('Health', 'overview', 'Open System Health', 'pill') + XL('Settings', 'status', 'Public Status Page', 'pill'))}
      <div class="card m0">${SVC.map((s) => `<div class="svc"><div><b>${s[0]}</b><span class="hint">${esc(s[3] || 'Working normally')}</span></div><div class="upb">${up(s).map((c, k) => `<i class="${k === 59 && s[1] === 'warn' ? 'warn' : c}"></i>`).join('')}</div>${s[1] === 'ok' ? b('Normal', 'live') : s[1] === 'off' ? b('Not Connected', 'ret') : b('Needs Attention', 'draft')}</div>`).join('')}</div>
      <div class="card" style="margin-top:14px"><div class="ch"><h3>Past Problems</h3></div>${table(['When', 'Service', 'What Happened', ['Lasted', 'num']], INC.map((x) => [F.md(x.at), esc(x.service || ''), esc(x.text || x.t || ''), esc(x.lasted || '—')]), { empty: 'No problems recorded.' })}</div>`; }
  function vActivity() { const L = ACT.filter((x) => S.af === 'all' || x[0] === S.af);
    return `${ph('Activity', 'The latest actions across every board. Full history is in each board\'s audit log.')}
      <div class="card m0"><div class="ch lgf">${seg('af', [['all', 'All'], ...[...new Set(ACT.map((x) => x[0]))].map((x) => [x, x])])}</div>${table(['When', 'Board', 'What Happened'], L.map((x) => [`<span class="hint nw">${x[2]}</span>`, XL(ACTL[x[0]].split('#')[0], ACTL[x[0]].split('#')[1], x[0], 'b plain'), esc(x[1])]), { empty: 'Nothing yet.' })}</div>`; }
  const APP = { title: 'Admin', home: true, searchPh: 'Find a Board',
    search: (q) => BOARDS.filter((x) => (x[1] + x[2]).toLowerCase().includes(q.toLowerCase())).slice(0, 7).map((x) => [x[1], x[2], 'open', x[0]]),
    stats: () => [['Needs a Person', TODO.reduce((s, x) => s + x.c, 0), TODO.length ? 'warnt' : ''], ['Revenue Today', money(M.revToday != null ? M.revToday : F.sum(M.today.map((o) => o.total)))], ['Payout Liability', kmoney(M.liab)], ['Systems', bad().length ? bad().length + ' Need Attention' : 'Normal', bad().length ? 'warnt' : '']],
    right: () => `<span class="livec hm"><i></i>Live</span><span class="pill nb">${ME}</span>`,
    areas: [{ h: 'Admin' }, { id: 'today', n: 'Today', b: () => TODO.reduce((s, x) => s + x.c, 0), tabs: [['today', 'Today']] }, { id: 'boards', n: 'All Boards', b: () => BOARDS.length, tabs: [['boards', 'All Boards']] }, { id: 'status', n: 'System Status', b: () => bad().length || null, bad: true, tabs: [['status', 'System Status']] }, { id: 'activity', n: 'Activity', tabs: [['activity', 'Activity']] }],
    views: { today: vToday, boards: vBoards, status: vStatus, activity: vActivity },
    click: (a, el, id) => { if (a === 'open') { location.href = id; return 0; } return 0; },
    tick: () => {} };
  setInterval(async () => { if (!root.isConnected) return; await F.reload(); const e = root.querySelector('#hvis'); if (e) e.textContent = num((BO.live || {}).online || 0); }, 60000);
  // ===== shared admin kit (part B: shell, render, events) =====
  const AREAS = APP.areas;
  const areaOf = (v) => AREAS.find((x) => x.tabs && x.tabs.some((t) => t[0] === v)) || AREAS.find((x) => x.tabs);
  const lastTab = {};
  if (!S.view) S.view = AREAS.find((x) => x.tabs).tabs[0][0];
  const badgeOf = (f) => { const c = f && f(); return c == null || c === 0 ? null : c; };
  const navHtml = () => { const c = areaOf(S.view); return AREAS.map((x) => { if (x.h) return `<h6>${x.h}</h6>`; const n = badgeOf(x.b); return `<button class="ni ${c === x ? 'on' : ''}" data-act="area" data-k="${x.id}">${x.n}${n != null ? `<i class="${x.bad ? 'bad' : ''}">${n}</i>` : ''}</button>`; }).join(''); };
  const mnavHtml = () => { const c = areaOf(S.view); let o = ''; let open = false; AREAS.forEach((x) => { if (x.h) { if (open) o += '</optgroup>'; o += `<optgroup label="${x.h}">`; open = true; } else { const n = badgeOf(x.b); o += `<option value="a:${x.id}" ${c === x ? 'selected' : ''}>${x.n}${n != null ? ' (' + n + ')' : ''}</option>`; } }); return o + (open ? '</optgroup>' : ''); };
  const subtabs = () => { const x = areaOf(S.view); lastTab[x.id] = S.view; if (x.tabs.length < 2) return ''; return `<div class="subt" role="tablist" aria-label="${x.n}">${x.tabs.map((t) => { const n = badgeOf(t[2]); return `<button role="tab" aria-selected="${S.view === t[0]}" class="${S.view === t[0] ? 'on' : ''}" data-act="go" data-v="${t[0]}">${t[1]}${n != null ? `<i class="${t[3] ? 'bad' : ''}">${n}</i>` : ''}</button>`; }).join('')}</div>`; };
  function drawer() { if (!S.drawer) return ''; const d = APP.drawer(S.drawer); if (!d) return '';
    return `<div class="drw-bg" data-act="closeDrw"></div><div class="drw ${d.wide ? 'wide' : ''}" role="dialog" aria-label="${esc(d.title)}"><div class="drw-h"><h3>${esc(d.title)}</h3><button class="ic" data-act="closeDrw" style="margin-left:auto" aria-label="Close">✕</button></div><div class="drw-b fg">${d.body}</div>${d.foot ? `<div class="drw-f">${d.foot}</div>` : ''}</div>`; }
  function toast(x) { S.toast = x; render(); clearTimeout(toast.t); toast.t = setTimeout(() => { S.toast = ''; render(); }, 2700); }
  function render() {
    const keep = {}; ['.main', '.drw-b'].forEach((s) => { const el = root.querySelector(s); if (el) keep[s] = el.scrollTop; });
    const st = APP.stats ? APP.stats() : [];
    const q = S.gq || ''; const res = q.length > 1 && APP.search ? APP.search(q) : null;
    root.innerHTML = `<div class="tb">${APP.home ? '' : `<a class="pill bk" href="AdminHome.dc.html" aria-label="Back to Admin">←<span class="lg"> Back to Admin</span></a>`}<span class="tb-t">${APP.title}</span>
      ${st.length ? `<div class="tb-mid hm"><div class="tb-stats">${st.map(([l, v, c]) => `<div><span>${l}</span><b class="${c || ''}">${v}</b></div>`).join('')}</div></div>` : '<div class="tb-mid"></div>'}
      ${APP.right ? APP.right() : ''}</div>
    ${APP.banner ? APP.banner() : ''}
    <div class="body"><div class="mnav"><select id="mnavsel" aria-label="Go to section">${mnavHtml()}</select></div><nav class="nav" aria-label="${esc(APP.title)}">${navHtml()}</nav><main class="main">${subtabs()}${APP.views[S.view]()}</main></div>
    ${drawer()}${S.toast ? `<div class="toast" role="status">${esc(S.toast)}</div>` : ''}`;
    Object.entries(keep).forEach(([s, v]) => { const el = root.querySelector(s); if (el) el.scrollTop = v; });
    if (S.focus) { const el = root.querySelector(`[data-key="${S.focus.k}"]`); if (el) { el.focus(); try { el.setSelectionRange(S.focus.s, S.focus.s); } catch (x) { /* not text */ } } S.focus = null; }
  }
  const setPath = (path, v) => { const ks = path.split('.'); let o = S; ks.slice(0, -1).forEach((k) => { o = o[k] = o[k] || {}; }); o[ks[ks.length - 1]] = v; };
  root.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-stop]')) return;
    const el = ev.target.closest('[data-act]'); if (!el || !root.contains(el)) return;
    if (el.tagName === 'INPUT' && el.type !== 'checkbox') return;
    const a = el.dataset.act, k = el.dataset.k, id = el.dataset.id;
    switch (a) {
      case 'go': S.view = el.dataset.v; S.drawer = null; S.gq = ''; break;
      case 'area': { const x = AREAS.find((y) => y.id === k); S.view = lastTab[x.id] || x.tabs[0][0]; S.drawer = null; const m = root.querySelector('.main'); if (m) m.scrollTop = 0; break; }
      case 'closeDrw': S.drawer = null; break;
      case 'setT': S.set[k] = !S.set[k]; audit('Setting Changed', k); break;
      case 'segv': S[k] = el.dataset.v; break;
      case 'msg': toast(el.dataset.msg); return;
      case 'selT': { const g = el.dataset.g; S.sel[g] = S.sel[g] || new Set(); if (S.sel[g].has(id)) S.sel[g].delete(id); else S.sel[g].add(id); break; }
      default: { const res = APP.click(a, el, id, k); if (!res) return; }
    }
    render();
  });
  root.addEventListener('input', (ev) => { const el = ev.target; const lv = el.dataset.live; if (!lv) return; setPath(lv, el.value); S.focus = { k: el.dataset.key, s: el.selectionStart }; render(); });
  root.addEventListener('change', (ev) => { const el = ev.target;
    if (el.id === 'mnavsel') { const x = AREAS.find((y) => 'a:' + y.id === el.value); if (!x) return; S.view = lastTab[x.id] || x.tabs[0][0]; S.drawer = null; render(); const m = root.querySelector('.main'); if (m) m.scrollTop = 0; return; }
    if (APP.change && APP.change(el)) { render(); return; }
    const bd = el.dataset.bind; if (!bd) return;
    if (el.dataset.quiet) { setPath(bd, el.type === 'number' ? +el.value : el.value); return; }
    setPath(bd, el.type === 'number' ? +el.value : el.type === 'checkbox' ? el.checked : el.value); if (bd.startsWith('set.')) audit('Setting Changed', bd.slice(4)); render(); });
  root.addEventListener('mousemove', (ev) => { const w = ev.target.closest('.chw'); if (!w) return; const c = CHARTS[w.dataset.chart]; if (!c) return; const area = w.querySelector('.cha'); const rc = area.getBoundingClientRect();
    const n = c.labels.length; const f = Math.max(0, Math.min(1, (ev.clientX - rc.left) / rc.width)); const i = Math.round(f * (n - 1)); const x = n === 1 ? 50 : i / (n - 1) * 100;
    const ln = area.querySelector('.chx'), tp = area.querySelector('.tip'); ln.style.display = 'block'; ln.style.left = x + '%';
    tp.innerHTML = `<span>${esc(c.labels[i])}</span>${c.sers.map((s, k) => (s.v[i] == null ? '' : `<div><i class="${k ? 'l2' : 'l1'}"></i>${esc(s.name || '')}<b>${c.fmt(s.v[i])}</b></div>`)).join('')}`; tp.style.display = 'block'; tp.style.left = x + '%'; tp.classList.toggle('lft', x > 65); });
  root.addEventListener('mouseout', (ev) => { const w = ev.target.closest && ev.target.closest('.chw'); if (!w || w.contains(ev.relatedTarget)) return; w.querySelectorAll('.chx,.tip').forEach((e) => { e.style.display = 'none'; }); });
  document.addEventListener('keydown', (ev) => { if (!root.isConnected) return; if (ev.key === 'Escape' && (S.drawer || S.gq)) { S.drawer = null; S.gq = ''; render(); } });
  function ROUTE(hv, P) { if (APP.views[hv]) S.view = hv; if (APP.route) APP.route(hv, P); }
  // deep links: Board.dc.html#view?key=value
  const DEEP = () => { try { const raw = decodeURIComponent((location.hash || '').slice(1)); if (!raw) return; const [hv, hq] = raw.split('?'); const P = {}; (hq || '').split('&').forEach((kv) => { const [k, v] = kv.split('='); if (k) P[k] = v || ''; }); ROUTE(hv, P); } catch (e) { /* no deep link */ } };
  DEEP();
  window.addEventListener('hashchange', () => { if (!root.isConnected) return; if ('drawer' in S) S.drawer = null; DEEP(); render(); const mm = root.querySelector('.main'); if (mm) mm.scrollTop = 0; });
  if (APP.tick) { const tk = setInterval(() => { if (!root.isConnected) { clearInterval(tk); return; } APP.tick(); }, 3000); }
  render();

}
