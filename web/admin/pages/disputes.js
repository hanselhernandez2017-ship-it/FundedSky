
function startBoard(root) {

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
  const XL = (board, hash, label, cls) => `<a class="${cls || 'lnk'}" href="Admin${board}.dc.html${hash ? '#' + hash : ''}">${label}</a>`;
  const UL = (name) => XL('Users', 'user?name=' + encodeURIComponent(name), esc(name));
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
  // ===== Chargebacks and Disputes ===== /*LIVE*/
  const F = window.FSG; const BO = F.BO;
  const PN = { tailoredpay: 'TailoredPay', stripe: 'Stripe', confirmo: 'Confirmo', test: 'Test Mode' };
  const autoEv = (u, o, a) => ({ terms: !!(u && u.agreements && u.agreements.terms), kyc: !!(u && u.kyc_status === 'verified'), logins: !!(u && o && u.last_login && new Date(u.last_login) > new Date(o.paid || o.created)), trades: !!(a && a.some((x) => x.days > 0)), emails: (BO.outbox || []).some((m) => u && m.to_email === u.email && m.status === 'sent') });
  const CB = (BO.disputes || []).slice().sort((a, c) => String(c.opened).localeCompare(String(a.opened))).map((d) => { const o = BO.orders.find((x) => x.code === d.order) || {}; const u = F.user(d.user); const acc = BO.accounts.filter((a) => (o.accounts || []).includes(a.id) || a.id === o.account);
    const left = d.due ? Math.max(0, Math.ceil((new Date(d.due + 'T23:59:59') - Date.now()) / 864e5)) : 14; const st = d.status === 'open' ? ((d.evidence || []).length || d.ev ? 'evidence' : 'new') : d.status === 'accepted' ? 'lost' : d.status;
    return { id: d.id, trader: F.short(u), uid: d.user, order: d.order || '—', amt: d.amount, reason: d.reason, code: d.code || '—', proc: PN[d.provider] || d.provider || '—', provider: d.provider, opened: F.md(d.opened), openedAt: d.opened, due: d.due ? F.md(d.due + 'T12:00:00') : '—', left, st, ev: Object.assign(autoEv(u, o, acc), d.ev || {}), notes: d.evidence || [], closed: d.closed, raw: d }; });
  const EVK = [['terms', 'Terms Accepted at Checkout', 'Time and agreement version', (c) => XL('Compliance', 'docs', 'Agreements')], ['kyc', 'Identity Check Result', 'Only if the trader reached funding', (c) => XL('Users', 'user?id=' + c.uid + '&tab=identity', 'Identity')], ['logins', 'Sign-In History', 'Devices and countries after purchase', (c) => XL('Users', 'user?id=' + c.uid + '&tab=logins', 'Sign-Ins')], ['trades', 'Trading Activity', 'Proof the evaluation was used', (c) => XL('Users', 'user?id=' + c.uid + '&tab=trading', 'Trades')], ['emails', 'Emails Delivered', 'Order confirmation and account login', (c) => XL('Emails', 'logs', 'Email Log')]];
  const WARN = F.st('disputes.warnings', []);
  const MONTHS = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 5 + i); const k = d.toISOString().slice(0, 7); return [d.toLocaleDateString('en-US', { month: 'short' }), CB.filter((c) => c.st === 'won' && String(c.closed || '').startsWith(k)).length, CB.filter((c) => c.st === 'lost' && String(c.closed || '').startsWith(k)).length]; });
  const PROC = ['tailoredpay', 'stripe', 'confirmo'].map((k) => { const paid = F.paid().filter((o) => o.provider === k).length + BO.orders.filter((o) => o.provider === k && o.status === 'refunded').length; const ds = CB.filter((c) => c.provider === k); const dec = ds.filter((c) => c.st === 'won' || c.st === 'lost'); return [PN[k], paid ? ds.length / paid * 100 : 0, k === 'confirmo' ? 0 : 0.9, dec.length ? Math.round(dec.filter((c) => c.st === 'won').length / dec.length * 100) : null, ds.length * 15]; });
  Object.assign(S.set, { autoEv: true, autoRef: false, ewOn: true, refUnder: 50, cbBlock: true, cbPause: true, cbEmail: false }, F.st('disputes.settings', {}));
  F.watch(() => S.set, 'disputes.settings');
  const open = () => CB.filter((c) => ['new', 'evidence'].includes(c.st));
  const evN = (c) => Object.values(c.ev).filter(Boolean).length;
  const stB = (st) => ({ new: b('New', 'err'), evidence: b('Building Evidence', 'draft'), submitted: b('Submitted', 'sched'), won: b('Won', 'live'), lost: b('Lost', 'ended') }[st] || b(st, 'plain'));
  const winRate = () => { const m = MONTHS.reduce((a, x) => [a[0] + x[1], a[1] + x[2]], [0, 0]); return m[0] + m[1] ? m[0] / (m[0] + m[1]) * 100 : 0; };
  const allPaid = F.paid().length + BO.orders.filter((o) => o.status === 'refunded').length;
  const dRate = () => (allPaid ? CB.filter((c) => F.within(c.openedAt, 90)).length / allPaid * 100 : 0);
  function dRow(c) { const p = c.left / 14 * 100; return `<div class="dcard" data-act="openCb" data-id="${c.id}">${VZ.ring(Math.min(100, p), c.left, c.left === 1 ? 'day' : 'days', { s: 64, c: c.left <= 4 ? 'var(--no)' : c.left <= 7 ? 'var(--wa)' : 'var(--sky)' })}<div><b>${c.id} · ${esc(c.trader)} · ${money(c.amt)}</b><span class="hint">${esc(c.reason)} · code ${esc(c.code)} · ${esc(c.proc)}</span><div style="margin-top:8px;max-width:340px">${`<div class="mtw"><div class="mt"><i style="width:${evN(c) / 5 * 100}%;background:${evN(c) === 5 ? 'var(--ok)' : 'var(--sky)'}"></i></div><span>${evN(c)} of 5</span></div>`}</div></div><div class="r" style="gap:8px">${stB(c.st)}<span class="hint nw">Due ${c.due}</span></div></div>`; }
  function vOpen() { const o = open().slice().sort((a, x) => a.left - x.left); const sub = CB.filter((c) => c.st === 'submitted');
    return `${ph('Open Disputes', `Chargebacks that need evidence before the deadline. Evidence is gathered from Users, Risk and Emails automatically. Log a chargeback from an order in ${XL('Finance', 'ledger', 'Finance')}.`)}
      ${tiles([['Open', o.length, money(o.reduce((a, c) => a + c.amt, 0)) + ' at stake'], ['Due This Week', o.filter((c) => c.left <= 7).length, o[0] ? 'Oldest due ' + o[0].due : 'Nothing due', o.some((c) => c.left <= 7) ? 'warn' : ''], ['Win Rate, 6 Months', pct(winRate(), 0), 'Industry is about 30%', 'ok', 'winrate'], ['Early Warnings', WARN.filter((w) => w.st === 'open').length, 'Refund before it becomes a chargeback', '', 'warnings']])}
      ${card('Needs Evidence', 'Sorted by deadline', `<div>${o.map(dRow).join('') || '<div class="empty">No chargebacks need evidence.</div>'}</div>`)}
      ${card('Waiting on the Bank', '', `<div>${sub.map((c) => `<div class="dcard" data-act="openCb" data-id="${c.id}"><span class="b sched">Submitted</span><div><b>${c.id} · ${esc(c.trader)} · ${money(c.amt)}</b><span class="hint">${esc(c.reason)} · usually decided in 30 to 75 days</span></div><span class="hint nw">Sent ${F.md(c.raw.submitted || c.raw.opened)}</span></div>`).join('') || '<div class="empty">Nothing waiting.</div>'}</div>`, '', 'mt14')}`; }
  function vWarnings() { return `${ph('Early Warnings', 'Card networks warn before a chargeback is filed. A refund now costs only the sale. A chargeback adds a $15 fee and counts against your dispute rate.', '<button class="pill" data-act="ewAdd">Log a Warning</button>')}
      <div class="card m0">${table(['Warning', 'Trader', ['Amount', 'num'], 'Reason', 'From', 'Time Left', ''], WARN.map((w, k) => { const hrs = Math.max(0, Math.round(72 - F.hoursSince(w.at))); return [`<span class="mono">${esc(w.id)}</span>`, UL(w.trader, w.uid), money(w.amt), esc(w.reason), `<span class="hint">${esc(w.src)}</span>`, w.st === 'open' ? `<span class="${hrs < 24 ? 'neg' : ''}">${hrs} hours</span>` : '<span class="hint">—</span>', w.st === 'open' ? `<span class="il"><button class="pill sm pri" data-act="ewRef" data-k="${k}">Refund</button><button class="pill sm" data-act="ewFight" data-k="${k}">Let It Go</button></span>` : b(w.st === 'refunded' ? 'Refunded' : 'Left Open', w.st === 'refunded' ? 'live' : 'plain')]; }), { empty: 'No early warnings.' })}</div>`; }
  function vWinrate() { const wr = winRate(); const reasons = {}; CB.forEach((c) => { reasons[c.reason] = (reasons[c.reason] || 0) + 1; }); const ref = WARN.filter((w) => w.st === 'refunded');
    return `${ph('Win Rate', 'How disputes end, by month, reason and processor. Keep the dispute rate under each processor’s limit or the account can be closed.')}
      <div class="two">${card('Overview', '6 months', cb(`<div class="gauges">${VZ.gauge(wr, pct(wr, 0), 'Win rate', { c: 'var(--ok)' })}${VZ.gauge(Math.min(100, dRate() / 0.9 * 100), dRate().toFixed(2) + '%', 'Dispute rate · limit 0.9%', { warn: 60, bad: 85 })}${VZ.gauge(WARN.length ? ref.length / WARN.length * 100 : 0, money(F.sum(ref.map((w) => w.amt))), 'Saved · warnings refunded', { c: 'var(--sky)' })}</div>`))}
      ${card('Won and Lost by Month', '', cb(`${vbars(MONTHS.map((m) => [m[0], m[1], m[2]]), (v) => v + ' disputes', { h: 150 })}<div class="vzleg" style="margin-top:10px"><span><i></i>Won</span><span><i style="background:var(--wa)"></i>Lost</span></div>`))}</div>
      <div class="two mt14">${card('By Reason', 'All time', cb(Object.keys(reasons).length ? hbars(Object.entries(reasons).sort((a, x) => x[1] - a[1]), (v) => v + (v === 1 ? ' dispute' : ' disputes')) : '<div class="empty">No disputes yet.</div>'))}
      ${card('By Processor', '', table(['Processor', 'Dispute Rate', ['Limit', 'num'], ['Win Rate', 'num'], ['Fees Paid', 'num']], PROC.map((p) => [esc(p[0]), p[2] ? `<div class="mtw"><div class="mt"><i style="width:${Math.min(100, p[1] / p[2] * 100).toFixed(0)}%;background:${p[1] / p[2] > 0.8 ? 'var(--no)' : 'var(--sky)'}"></i></div><span>${p[1].toFixed(2)}%</span></div>` : '<span class="hint">No chargebacks on crypto</span>', p[2] ? p[2] + '%' : '—', p[3] != null ? p[3] + '%' : '—', p[2] ? money(p[4]) : '—'])) + `<p class="hint" style="padding:0 16px 14px;margin:0">Processor settings are in ${XL('Finance', 'processor', 'Finance')}.</p>`)}</div>`; }
  function vHistory() { return `${ph('All Disputes', 'Every chargeback, newest first.')}
      <div class="card m0">${table(['Dispute', 'Trader', 'Order', ['Amount', 'num'], 'Reason', 'Processor', 'Opened', 'Status'], CB.map((c) => [`<button class="lnk mono" data-act="openCb" data-id="${c.id}">${c.id}</button>`, UL(c.trader, c.uid), XL('Finance', 'ledger?o=' + c.order, c.order, 'lnk mono'), money(c.amt), `<span class="hint">${esc(c.reason)}</span>`, esc(c.proc), `<span class="hint">${c.opened}</span>`, stB(c.st)]), { empty: 'No chargebacks yet.' })}</div>`; }
  function vSettings() { return `${ph('Dispute Settings', 'How disputes are handled automatically.')}
      <div class="two">${card('Automation', '', cb(`<div class="fg">${sw('autoEv', 'Build Evidence Packs Automatically', 'Pulls terms, sign-ins, trades and emails when a dispute opens')}${sw('ewOn', 'Get Early Warnings', 'From card networks, before a chargeback is filed')}${sw('autoRef', 'Refund Small Warnings Automatically', 'Under the amount below')}<div class="srow"><span>Refund Automatically Under</span><span class="il"><input type="number" value="${S.set.refUnder}" data-bind="set.refUnder" aria-label="Amount" style="width:90px"></span></div></div>`))}
      ${card('After a Chargeback', '', cb(`<div class="fg">${sw('cbBlock', 'Block the Card', `Added to the ${XL('Risk', 'blocks', 'blocklist')}`)}${sw('cbPause', 'Pause the Trader’s Accounts', 'Until the dispute ends')}${sw('cbEmail', 'Email the Trader', `Uses the template in ${XL('Emails', '', 'Emails')}`)}</div>`))}</div>`; }
  const done = (ok) => () => { toast(ok); setTimeout(() => location.reload(), 700); };
  const pack = (c) => { const u = F.user(c.uid) || {}; const o = BO.orders.find((x) => x.code === c.order) || {}; const acc = BO.accounts.filter((a) => (o.accounts || []).includes(a.id));
    return `Evidence for ${c.id}\nOrder ${c.order}, ${money(c.amt, 2)}, paid ${o.paid ? new Date(o.paid).toUTCString() : ''}\nCustomer: ${F.full(u)} <${u.email}>, signed up ${u.created_at ? new Date(u.created_at).toUTCString() : ''} from ${u.country || ''}\n\nTerms accepted: ${u.agreements && u.agreements.terms ? new Date(u.agreements.terms).toUTCString() : 'not recorded'} (Terms of Service at ${location.origin}/terms)\nIdentity check: ${u.kyc_status || 'none'}${u.kyc ? ', ' + u.kyc.name : ''}\nLast sign-in: ${u.last_login ? new Date(u.last_login).toUTCString() : ''}\n\nWhat was delivered:\n${acc.map((a) => `${a.id}: ${F.pname(a)} evaluation, ${a.days} trading days, balance ${money(a.bal, 2)}, status ${a.phase}`).join('\n') || 'No account'}\n\nEmails sent:\n${(BO.outbox || []).filter((m) => m.to_email === u.email).map((m) => `${new Date(m.created_at).toUTCString()} ${m.subject} (${m.status})`).join('\n')}\n\nNotes:\n${c.notes.map((n) => `${n.by}: ${n.text}`).join('\n')}\n`; };
  const APP = { title: 'Chargebacks and Disputes', stats: () => [['Open', open().length], ['Due This Week', open().filter((c) => c.left <= 7).length, open().some((c) => c.left <= 7) ? 'warnt' : ''], ['Win Rate', pct(winRate(), 0)], ['Dispute Rate', dRate().toFixed(2) + '%']],
    areas: [{ h: 'Disputes' }, { id: 'op', n: 'Open Disputes', b: () => open().length || null, bad: true, tabs: [['open', 'Open Disputes']] }, { id: 'ew', n: 'Early Warnings', b: () => WARN.filter((w) => w.st === 'open').length || null, tabs: [['warnings', 'Early Warnings']] }, { id: 'wr', n: 'Win Rate', tabs: [['winrate', 'Win Rate']] }, { id: 'hi', n: 'All Disputes', tabs: [['history', 'All Disputes']] }, { h: 'Setup' }, { id: 'st', n: 'Settings', tabs: [['settings', 'Settings']] }],
    views: { open: vOpen, warnings: vWarnings, winrate: vWinrate, history: vHistory, settings: vSettings },
    search: (q) => CB.filter((c) => (c.id + c.trader + c.order).toLowerCase().includes(q.toLowerCase())).map((c) => [c.id, c.trader + ' · ' + money(c.amt), 'openCb', c.id]), searchPh: 'Find a Dispute or Trader',
    click: (a, el, id, k) => { switch (a) {
      case 'openCb': S.drawer = { id }; return 1;
      case 'evT': { const c = CB.find((x) => x.id === S.drawer.id); c.ev[k] = !c.ev[k]; F.api('/disputes/' + c.id, { ev: c.ev }, 'PUT').catch((e) => toast(e.message)); if (c.st === 'new') c.st = 'evidence'; return 1; }
      case 'note': { const c = CB.find((x) => x.id === S.drawer.id); const t = prompt('Note for the evidence pack:'); if (!t) return 0; F.api('/disputes/' + c.id, { evidence: t }, 'PUT').then(done('Note added')).catch((e) => toast(e.message)); return 0; }
      case 'submitCb': { const c = CB.find((x) => x.id === S.drawer.id); const ln = document.createElement('a'); ln.href = URL.createObjectURL(new Blob([pack(c)], { type: 'text/plain' })); ln.download = c.id + '-evidence.txt'; ln.click(); F.api('/disputes/' + c.id, { status: 'submitted', ev: c.ev }, 'PUT').then(done(`${c.id} marked as sent. Upload the downloaded pack to ${c.proc}.`)).catch((e) => toast(e.message)); S.drawer = null; return 0; }
      case 'acceptCb': { const c = CB.find((x) => x.id === S.drawer.id); if (!confirm(`Accept ${c.id}? ${money(c.amt)} stays with the trader.`)) return 0; F.api('/disputes/' + c.id, { status: 'accepted', closeAccounts: S.set.cbPause }, 'PUT').then(done(`${c.id} accepted`)).catch((e) => toast(e.message)); S.drawer = null; return 0; }
      case 'resolve': { const c = CB.find((x) => x.id === S.drawer.id); F.api('/disputes/' + c.id, { status: k }, 'PUT').then(done(`${c.id} marked ${k}`)).catch((e) => toast(e.message)); S.drawer = null; return 0; }
      case 'ewAdd': { const code = prompt('Order number:'); if (!code) return 0; const o = BO.orders.find((x) => x.code.toLowerCase() === code.trim().toLowerCase()); if (!o) { toast('Order not found'); return 0; } const rs = prompt('Reason given:', 'Cardholder does not recognize') || ''; const src = prompt('From:', 'Card network alert') || ''; F.put('disputes.warnings', [{ id: 'EW-' + (WARN.length + 1), order: o.code, uid: o.user, trader: o.name, amt: o.total, reason: rs, src, at: new Date().toISOString(), st: 'open' }].concat(WARN)).then(done('Warning logged')).catch((e) => toast(e.message)); return 0; }
      case 'ewRef': { const w = WARN[+k]; if (!confirm(`Refund ${money(w.amt, 2)} to ${w.trader} now?`)) return 0; F.api('/orders/' + w.order + '/refund', { note: 'Refunded after an early warning' }).then(() => { const v = WARN.slice(); v[+k] = Object.assign({}, w, { st: 'refunded' }); return F.put('disputes.warnings', v); }).then(done(`${money(w.amt, 2)} refunded. No chargeback.`)).catch((e) => toast(e.message)); return 0; }
      case 'ewFight': { const v = WARN.slice(); v[+k] = Object.assign({}, v[+k], { st: 'left' }); F.put('disputes.warnings', v).then(done('Left open. If it becomes a chargeback it shows up here.')).catch((e) => toast(e.message)); return 0; }
      default: return 0; } },
    route: (hv, P) => { if (P.cb && CB.some((c) => c.id === P.cb)) { S.view = hv || 'open'; S.drawer = { id: P.cb }; } },
    drawer: (d) => { const c = CB.find((x) => x.id === d.id); if (!c) return null; const can = ['new', 'evidence'].includes(c.st); const n = evN(c);
      return { title: `${c.id} · ${c.trader}`, body: `<div class="r" style="gap:14px;margin-bottom:14px">${VZ.ring(can ? Math.min(100, c.left / 14 * 100) : 100, can ? c.left : '—', can ? 'days left' : 'closed', { s: 84, c: can && c.left <= 4 ? 'var(--no)' : 'var(--sky)' })}<div>${stB(c.st)}<p class="hint" style="margin:8px 0 0">${esc(c.reason)} · code ${esc(c.code)}</p></div></div>
        ${kv([['Trader', UL(c.trader, c.uid)], ['Order', XL('Finance', 'ledger?o=' + c.order, c.order, 'lnk mono')], ['Amount', money(c.amt)], ['Processor', esc(c.proc)], ['Opened', c.opened], ['Evidence Due', c.due]])}
        <h4 class="sh" style="margin:18px 0 8px">Evidence Pack · ${n} of 5</h4>${EVK.map(([k, l, s, lk]) => `<div class="srow"><span><label class="chk"><input type="checkbox" ${c.ev[k] ? 'checked' : ''} ${can ? `data-act="evT" data-k="${k}"` : 'disabled'}> <b style="font-weight:500">${l}</b></label><small class="hint" style="display:block;margin:2px 0 0 24px">${s}</small></span>${lk(c)}</div>`).join('')}
        ${c.notes.length ? `<h4 class="sh" style="margin:18px 0 8px">Notes</h4>${tl(c.notes.map((x) => [esc(x.by) + ' · ' + F.when(x.at), esc(x.text)]))}` : ''}
        <p class="hint" style="margin-top:12px">Also on this trader: ${XL('Risk', 'payouts', 'payouts in Risk')} · ${XL('Support', 'inbox?q=open', 'tickets in Support')}</p>`,
        foot: can ? `<button class="pill" data-act="note">Add Note</button><button class="pill dng" data-act="acceptCb">Accept</button><button class="pill pri" data-act="submitCb" ${n < 4 ? 'disabled' : ''}>Send Evidence</button>` : c.st === 'submitted' ? '<button class="pill" data-act="resolve" data-k="lost">Mark Lost</button><button class="pill pri" data-act="resolve" data-k="won">Mark Won</button>' : '' }; } };
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
