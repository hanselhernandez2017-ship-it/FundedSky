
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
  // ===== Team and Approvals ===== /*LIVE*/
  const F = window.FSG; const BO = F.BO;
  const BLINK = { Finance: ['Finance', 'batches'], Users: ['Users', 'changes'], Risk: ['Risk', 'alerts'], Catalog: ['Catalog', 'changes'] };
  const RN = { admin: 'Admin', finance: 'Finance', risk: 'Risk', support: 'Support' };
  const BOARD_OF = { close: 'Risk', reinstate: 'Risk', adjust: 'Risk', ban: 'Users', unban: 'Users', kyc: 'Users', kycok: 'Users', email: 'Users' };
  const DET = { close: 'Closes the account and tells the trader', reinstate: 'Opens the account again', adjust: 'Changes the account balance. The trader sees it on their dashboard.', ban: 'Signs the user out and blocks sign-in', unban: 'The user can sign in again', kyc: 'The trader is told why', kycok: 'Unlocks payouts for this trader', email: 'Signs the user out. Sign-in emails and password resets go to the new address.' };
  // Approve shows only where your role may be the second person (the server checks this too)
  const APPR = (BO.approvals || []).map((x) => ({ id: x.key, gen: true, what: x.desc, board: BOARD_OF[x.kind] || 'Risk', det: DET[x.kind] || '', by: x.byName, when: F.when(x.at), st: 'waiting', me: !!x.canApprove, other: x.by !== BO.me.id && !x.canApprove, mineAsk: x.by === BO.me.id })).concat(F.st('batches', []).map((x) => ({ id: x.id, what: `Send Payout Batch ${x.id}`, board: 'Finance', det: `${x.n} ${x.n === 1 ? 'payout' : 'payouts'}, ${money(x.amount)}`, by: x.byName, when: F.when(x.at), st: x.status === 'waiting' ? 'waiting' : 'approved', me: x.by !== BO.me.id && F.can('finance'), who: x.approver || (x.status !== 'waiting' ? 'Under the limit' : '') })));
  // The two-person rules the server enforces. Deleting personal data, roles and maintenance mode are admin-only instead.
  const RULES = [['Changing Prices or Rules', 'Catalog', 'Any Admin', 'price'], ['Payout Batches Above ' + money(F.st('finance.settings', {}).twoAbove || 5000) + ' a Day', 'Finance', 'Any Admin or Finance', 'batch'], ['Single Payout Above ' + money(F.st('risk.settings', {}).payoutTwo || 5000), 'Risk', 'Any Admin, Risk or Finance', 'payout'], ['Closing or Reinstating an Account', 'Risk', 'Any Admin or Risk', 'close'], ['Adjusting an Account Balance', 'Risk', 'Any Admin or Risk', 'adjust'], ['Banning a User', 'Users', 'Any Admin, Support or Risk', 'ban'], ['Lifting a Ban', 'Users', 'Any Admin, Support or Risk', 'unban'], ['Rejecting KYC', 'Users', 'Any Admin, Support or Risk', 'kyc'], ['Approving KYC by Hand', 'Users', 'Any Admin, Support or Risk', 'kycok'], ['Changing a Trader\'s Email', 'Users', 'Any Admin or Support', 'email']];
  const RON = F.st('team.rules', {});
  const staff = BO.users.filter((u) => u.role !== 'trader');
  const roleOf = (u) => RN[u.role] || u.role;
  const MEM = staff.map((u) => [F.full(u), u.email, roleOf(u), null, F.dayLabel(u.last_login), 'Password', u.id, u.status || 'active']);
  const INVS = F.st('team.invites', []);
  const INV = INVS.map((x) => [x.email, RN[x.role] || x.role, x.byName, F.md(x.at), new Date(x.at) > new Date(Date.now() - 7 * 864e5) ? `Expires ${F.md(new Date(new Date(x.at).getTime() + 7 * 864e5))}` : 'Expired']);
  const BOARDS = ['Users', 'Risk', 'Finance', 'Platforms', 'Support', 'Emails', 'Analytics', 'Catalog', 'Affiliates', 'Compliance', 'Competitions', 'Rewards', 'Content', 'Settings', 'Team'];
  // E = edit, S = some actions (listed in the hint), V = view. Kept in step with the role checks in server/admin.js.
  const ROLES = { Admin: 'E'.repeat(15), Finance: 'SSEVSVEVSVVVVVS', Risk: 'EESSSVESVEVVVVS', Support: 'ESSSEEEVVSEEEVS' };
  const ua = (s) => { s = s || ''; const br = /Edg/.test(s) ? 'Edge' : /Chrome/.test(s) ? 'Chrome' : /Firefox/.test(s) ? 'Firefox' : /Safari/.test(s) ? 'Safari' : 'Browser'; const os = /iPhone/.test(s) ? 'iPhone' : /Android/.test(s) ? 'Android' : /Mac/.test(s) ? 'Mac' : /Windows/.test(s) ? 'Windows' : /Linux/.test(s) ? 'Linux' : 'a computer'; return `${br} on ${os}`; };
  const SESSR = (BO.staffSessions || []).filter((s) => F.within(s.seen_at, 14));
  const SESS = SESSR.map((s) => [F.full(F.user(s.user_id)), ua(s.ua), s.ip || '—', F.ago(s.seen_at) === 'Just now' ? 'Now' : F.ago(s.seen_at) + (/min|hour/.test(F.ago(s.seen_at)) ? ' ago' : ''), s.user_id === BO.me.id, s.user_id]);
  const SEC = (BO.staffSessions || []).filter((s) => F.within(s.created_at, 30)).map((s) => [F.when(s.created_at), F.full(F.user(s.user_id)), 'Signed in', `${ua(s.ua)} · ${s.ip || 'unknown address'}`, 'plain']).concat((BO.audit || []).filter((a) => /^staff\.|^settings\.|^integration\./.test(a.action)).map((a) => [F.when(a.at), a.by, a.action.startsWith('staff') ? 'Access changed' : 'Setting changed', a.target || a.action, 'draft'])).slice(0, 60);
  const BOARDOF = (a) => (a = a.replace(/^ui\./, ''), /^payout|^order|^refund|^store\.finance|^batch/.test(a) ? 'Finance' : /^account|^trade|^dispute/.test(a) ? 'Risk' : /^user|^kyc|^coupon/.test(a) ? 'Users' : /^staff|^store\.team/.test(a) ? 'Team' : /^content|^list\.ann/.test(a) ? 'Content' : 'Settings');
  const AL = { Finance: 'Finance#batches', Risk: 'Risk#audit', Users: 'Users#audit', Team: 'Team#audit', Content: 'Content#ann', Settings: 'Settings#del' };
  const words = (a) => a.replace(/^ui\./, '').replace(/[._]/g, ' ').replace(/^./, (c) => c.toUpperCase());
  const AUD = (BO.audit || []).map((a) => [F.when(a.at), a.by, BOARDOF(a.action), words(a.action), a.target || '']);
  Object.assign(S.set, { sso: false, twofa: false, ipOnly: false, timeout: '30', newDevice: true }, F.st('team.security', {}));
  if (F.can()) F.watch(() => S.set, 'team.security');
  S.af = 'waiting'; S.aub = 'all'; S.role = 'Support';
  const waiting = () => APPR.filter((x) => x.st === 'waiting');
  const mine = () => waiting().filter((x) => x.me);
  function apRow(x) { return `<div class="alr ${x.st === 'waiting' ? '' : 'resolved'}">${XL(BLINK[x.board][0], BLINK[x.board][1], x.board, 'b plain')}<div><b>${x.what}</b><p class="hint">${esc(x.det)}</p><span class="hint">${XL(BLINK[x.board][0], BLINK[x.board][1], 'Open in ' + x.board)} · Asked by ${esc(x.by)} · ${x.when}${x.who ? ` · ${x.st === 'approved' ? 'Approved' : 'Declined'} by ${esc(x.who)}` : ''}${x.note ? ' · ' + esc(x.note) : ''}</span></div><div class="il">${x.st === 'waiting' ? (x.gen ? (x.me ? `${F.can() ? `<button class="pill sm" data-act="apprNo" data-id="${esc(x.id)}">Decline</button>` : ''}<button class="pill pri sm" data-act="apprOk" data-id="${esc(x.id)}">Approve</button>` : x.other ? `<span class="b sched">Needs ${esc(BLINK[x.board] ? x.board : 'Another Role')} Reviewer</span>${F.can() ? `<button class="lnk" data-act="apprNo" data-id="${esc(x.id)}">Decline</button>` : ''}` : `<span class="b sched">Waiting for Someone Else</span><button class="lnk" data-act="apprNo" data-id="${esc(x.id)}">Cancel</button>`) : x.me ? `<button class="pill pri sm" data-act="approve" data-id="${x.id}">Approve</button>` : b(x.by === F.me() ? 'Waiting for Someone Else' : 'Needs Finance', 'sched')) : x.st === 'approved' ? b('Approved', 'live') : b('Declined', 'err')}</div></div>`; }
  function vMine() { return `${ph('Waiting for You', 'Big decisions need two people: the one who asked and one other. You cannot approve your own request.')}
      <div class="card m0">${mine().map(apRow).join('') || '<div class="empty">Nothing waiting for you.</div>'}</div>`; }
  function vAll() { const L = APPR.filter((x) => S.af === 'all' || (S.af === 'waiting' ? x.st === 'waiting' : x.st !== 'waiting'));
    return `${ph('All Approvals', 'Every two-person decision across the back office.')}<div class="card m0"><div class="ch lgf">${seg('af', [['waiting', 'Waiting'], ['done', 'Decided'], ['all', 'All']])}</div>${L.map(apRow).join('') || '<div class="empty">None.</div>'}</div>`; }
  function vApRules() { return `${ph('Approval Rules', 'Which actions need a second person, and who can be that person.')}
      <div class="card m0">${table(['Action', 'Board', 'Second Person Can Be', 'On'], RULES.map((x) => [`<b>${x[0]}</b>`, x[1], `<span class="hint">${x[2]}</span>`, F.can() ? `<button class="sw ${RON[x[3]] === false ? '' : 'on'}" role="switch" aria-checked="${RON[x[3]] !== false}" aria-label="${esc(x[0])}" data-act="ruleT" data-k="${x[3]}"></button>` : RON[x[3]] === false ? b('Off', 'ended') : b('On', 'live')]))}</div>
      <p class="hint">Deleting personal data, changing roles and maintenance mode are for admins only.${F.can() ? '' : ' Only admins can change these rules.'}</p>`; }
  function vMembers() { return `${ph('Team', 'Everyone with access to the back office.', F.can() ? '<button class="pill pri" data-act="invite">Invite Staff</button>' : '')}
      <div class="card m0">${table(['Name', 'Email', 'Role', 'Two-Step Login', 'Signs In With', 'Last Active', ''], MEM.map((m) => { const self = m[6] === BO.me.id; return [`<b>${esc(m[0])}</b>${m[6] === BO.me.id ? ' <span class="hint">(you)</span>' : ''}${m[7] === 'suspended' ? ' ' + b('Suspended', 'err') : m[7] === 'banned' ? ' ' + b('Banned', 'err') : ''}`, `<span class="hint">${esc(m[1])}</span>`, self || !F.can() ? m[2] : `<select data-team="${m[6]}" aria-label="Role for ${esc(m[0])}" style="width:160px">${Object.entries(RN).map(([k2, r]) => `<option value="${k2}" ${r === m[2] ? 'selected' : ''}>${r}</option>`).join('')}</select>`, (() => { const on = ((BO.staffMfa || []).find((x) => x.id === m[6]) || {}).mfa_on; return `${on ? b('On', 'live') : b('Not Set Up Yet', 'draft')}${on && F.can() && m[6] !== BO.me.id ? ` <button class="lnk" data-act="mfaReset" data-id="${m[6]}">Reset</button>` : ''}`; })(), m[5], `<span class="hint">${m[4]}</span>`, self || !F.can() ? '' : `<button class="lnk" data-act="remove" data-id="${m[6]}">Remove</button>`]; }))}</div>`; }
  function vInvites() { return `${ph('Invitations', 'People invited who have not joined yet. They get their role as soon as they sign up with this email.')}<div class="card m0">${table(['Email', 'Role', 'Invited By', 'Sent', 'Status', ''], INV.map((x, k) => [esc(x[0]), x[1], esc(x[2]), x[3], `<span class="hint">${x[4]}</span>`, `<div class="il"><a class="pill sm" href="mailto:${esc(x[0])}?subject=${encodeURIComponent('Join the Funded Sky back office')}&body=${encodeURIComponent('Sign up at ' + location.origin + '/signup with this email address and you will get back office access.')}">Resend</a><button class="lnk" data-act="revoke" data-k="${k}">Cancel</button></div>`]), { empty: 'No open invitations.' })}</div>`; }
  function vRoles() { const lv = { E: ['Edit', 'live'], S: ['Some Actions', 'draft'], V: ['View', 'sched'], N: ['No Access', 'ended'] };
    return `${ph('Roles and Permissions', 'What each role can do on each board. Sensitive actions also follow the approval rules. Some Actions means, for example: Support can reset accounts, edit the blocklist, refund up to their limit and open disputes; Finance can add notes, notify users, set tax status and reply to tickets; Risk can approve payouts and propose catalog changes. Every role can save analytics settings and send reports to staff.')}
      <div class="card m0">${table(['Board', ...Object.keys(ROLES).map((r) => [r, 'cen'])], BOARDS.map((bd, i) => [`<b>${bd}</b>`, ...Object.keys(ROLES).map((r) => { const c = ROLES[r][i]; return b(lv[c][0], lv[c][1]); })]), { cls: 'matrix' })}</div>`; }
  const NETS = F.st('team.networks', []);
  // Only admins can change these, so other roles see the values without switches
  const swr = (k, l, sub) => (F.can() ? sw(k, l, sub) : `<div class="srow"><span>${l}${sub ? `<small class="hint" style="display:block;margin-top:2px">${sub}</small>` : ''}</span>${S.set[k] ? b('On', 'live') : b('Off', 'ended')}</div>`);
  function vSignin() { const sw = swr; return `${ph('Sign-In and Security', 'How staff sign in to the back office.')}
      <div class="two">${card('Sign-In', '', cb(`<div class="fg">${sw('sso', 'Sign In With Your Identity Provider', 'Single sign-on for every staff account')}${`<div class="srow"><span>Two-Step Login for Every Staff Account<span class="hint" style="display:block">Always on. Each person sets it up with an authenticator app the first time they sign in.</span></span><span class="b live">On</span></div>`}${sw('newDevice', 'Email Staff When They Sign In From a New Device')}<div class="srow"><span>Sign Out After</span>${F.can() ? sel('set.timeout', [['15', '15 Minutes'], ['30', '30 Minutes'], ['60', '1 Hour']], S.set.timeout, 'Timeout', 160) : `<span>${{ 15: '15 Minutes', 30: '30 Minutes', 60: '1 Hour' }[S.set.timeout] || S.set.timeout + ' Minutes'}</span>`}</div></div>`))}
      ${card('Allowed Networks', '', cb(`<div class="fg">${sw('ipOnly', 'Only Allow Sign-In From These Networks', 'Office and VPN addresses')}${NETS.map((x, k) => `<div class="srow"><span class="mono">${esc(x)}</span>${F.can() ? `<button class="lnk" data-act="netDel" data-k="${k}">Remove</button>` : ''}</div>`).join('')}${F.can() ? '<div class="addr"><input id="netin" placeholder="IP Address or Range" aria-label="IP address"><button class="pill sm" data-act="netAdd">Add</button></div>' : ''}<p class="hint" style="margin:0">One address like 203.0.113.7 or a range like 203.0.113.0/24. While this is on, you cannot remove the network you are on now.</p></div>`))}</div>${F.can() ? '' : '<p class="hint">Only admins can change sign-in and security settings.</p>'}`; }
  function vSessions() { return `${ph('Active Sessions', 'Staff signed in during the last two weeks.')}<div class="card m0">${table(['Who', 'Device', 'Where', 'Last Seen', ''], SESS.map((s) => [esc(s[0]), s[1], `<span class="mono">${esc(s[2])}</span>`, `<span class="hint">${s[3]}</span>`, s[4] ? '<span class="hint">This Session</span>' : `<button class="pill sm" data-act="kill" data-id="${s[5]}">Sign Out</button>`]), { empty: 'Nobody signed in.' })}</div>`; }
  function vSecEv() { return `${ph('Security Events', 'Staff sign-ins and changes to access.')}<div class="card m0">${table(['When', 'Who', 'What', 'Detail'], SEC.map((x) => [`<span class="hint nw">${x[0]}</span>`, esc(x[1]), b(x[2], x[4]), `<span class="hint">${esc(x[3])}</span>`]), { empty: 'Nothing yet.' })}</div>`; }
  function vAudit() { const L = AUD.filter((x) => S.aub === 'all' || x[2] === S.aub);
    return `${ph('Audit Log', 'Every action in every board, in one place. Entries cannot be changed or deleted.', '<button class="pill" data-act="audExp">Export</button>')}
      <div class="card m0"><div class="ch lgf">${seg('aub', [['all', 'All'], ...['Finance', 'Risk', 'Users', 'Team', 'Content', 'Settings'].map((x) => [x, x])])}</div>${table(['When', 'Who', 'Board', 'What', 'Detail'], L.map((x) => [`<span class="hint nw">${x[0]}</span>`, esc(x[1]), XL(AL[x[2]].split('#')[0], AL[x[2]].split('#')[1], x[2], 'b plain'), `<b>${esc(x[3])}</b>`, `<span class="hint">${esc(x[4])}</span>`]), { empty: 'Nothing yet.' })}</div>`; }
  const reload = (ok) => () => { toast(ok); setTimeout(() => location.reload(), 700); };
  const APP = { title: 'Team and Approvals', stats: () => [['Waiting for You', mine().length, mine().length ? 'warnt' : ''], ['Staff', MEM.length], ['Signed In Now', new Set(SESSR.filter((s) => F.within(s.seen_at, 1 / 24)).map((s) => s.user_id)).size], ['Two-Factor', S.set.twofa ? 'Required' : 'Off', S.set.twofa ? '' : 'warnt']],
    areas: [{ h: 'Approvals' }, { id: 'ap', n: 'Approvals', b: () => mine().length || null, bad: true, tabs: [['mine', 'Waiting for You', () => mine().length || null, 1], ['all', 'All Approvals'], ['aprules', 'Approval Rules']] }, { h: 'People' }, { id: 'team', n: 'Team', tabs: [['members', 'Members'], ['invites', 'Invitations', () => INV.length || null]] }, { id: 'roles', n: 'Roles', tabs: [['roles', 'Roles and Permissions']] }, { id: 'sec', n: 'Security', tabs: [['signin', 'Sign-In'], ['sessions', 'Active Sessions'], ['secev', 'Security Events']] }, { id: 'aud', n: 'Audit Log', tabs: [['audit', 'Audit Log']] }],
    views: { mine: vMine, all: vAll, aprules: vApRules, members: vMembers, invites: vInvites, roles: vRoles, signin: vSignin, sessions: vSessions, secev: vSecEv, audit: vAudit },
    click: (a, el, id, k) => { switch (a) {
      case 'apprOk': if (!confirm('Approve this? It happens right away.')) return 0; F.api('/approvals/' + encodeURIComponent(id) + '/approve', {}).then(reload('Approved')).catch((e) => toast(e.message)); return 0;
      case 'apprNo': F.api('/approvals/' + encodeURIComponent(id) + '/reject', {}).then(reload('Declined')).catch((e) => toast(e.message)); return 0;
      case 'approve': if (!confirm('Approve and send this batch now?')) return 0; F.api('/batches/' + id + '/approve', {}).then(reload('Approved. The batch is sent.')).catch((e) => toast(e.message)); return 0;
      case 'ruleT': { const v = Object.assign({}, RON); v[k] = RON[k] === false; Object.assign(RON, v); F.put('team.rules', v).catch((e) => toast(e.message)); return 1; }
      case 'invite': S.drawer = { k: 'invite' }; return 1;
      case 'doInvite': { const e = ((root.querySelector('#ie') || {}).value || '').trim().toLowerCase(); if (!e.includes('@')) { toast('Enter an email address'); return 0; } const role = root.querySelector('#ir').value; const ex = BO.users.find((u) => u.email.toLowerCase() === e);
        if (ex) { F.api('/staff/invite', { email: e, role }).then(reload(`${F.full(ex)} now has ${RN[role]} access`)).catch((er) => toast(er.message)); return 0; }
        F.put('team.invites', INVS.concat([{ email: e, role, by: BO.me.id, byName: F.me(), at: new Date().toISOString() }])).then(() => { S.drawer = null; location.hash = 'invites'; reload('Invitation saved. Ask them to sign up with this email.')(); }).catch((er) => toast(er.message)); return 0; }
      case 'revoke': F.put('team.invites', INVS.filter((x, i) => i !== +k)).then(reload('Invitation cancelled')).catch((e) => toast(e.message)); return 0;
      case 'remove': if (!confirm('Remove back office access? They become a regular trader and are signed out.')) return 0; F.api('/staff/' + id + '/role', { role: 'trader' }).then(reload('Access removed')).catch((e) => toast(e.message)); return 0;
      case 'mfaReset': if (!confirm('Reset two-step login for this person? They are signed out and set it up again with their phone the next time they sign in.')) return 0; F.api('/staff/' + id + '/mfa-reset', {}).then(reload('Two-step login reset. They set it up again at their next sign-in.')).catch((e) => toast(e.message)); return 0;
      case 'kill': F.api('/users/' + id + '/signout', {}).then(reload('Signed out')).catch((e) => toast(e.message)); return 0;
      case 'netAdd': { const v = ((root.querySelector('#netin') || {}).value || '').trim(); if (!v) return 0; F.put('team.networks', NETS.concat([v])).then(reload('Network added')).catch((e) => toast(e.message)); return 0; }
      case 'netDel': F.put('team.networks', NETS.filter((x, i) => i !== +k)).then(reload('Removed')).catch((e) => toast(e.message)); return 0;
      case 'audExp': { const rows = [['When', 'Who', 'Board', 'What', 'Detail']].concat((BO.audit || []).map((x) => [x.at, x.by, BOARDOF(x.action), x.action, x.target || ''])); window.FSG.csvDl('audit-log.csv', rows); return 0; }
      default: return 0; } },
    change: (el) => { if (el.dataset.team) { if (!confirm('Change this person\'s role to ' + RN[el.value] + '?')) return 1; F.api('/staff/' + el.dataset.team + '/role', { role: el.value }).then(reload('Role changed')).catch((e) => toast(e.message)); return 0; } return 0; },
    drawer: (d) => ({ title: 'Invite Staff', body: `${fld('ie', 'Email', '', 'placeholder="name@company.com"')}<div class="fl"><label for="ir">Role</label><select id="ir">${Object.entries(RN).map(([k2, r]) => `<option value="${k2}">${r}</option>`).join('')}</select></div><p class="hint" style="margin:0">If they already have an account they get access now. If not, they get it as soon as they sign up with this email.</p>`, foot: '<button class="pill" data-act="closeDrw">Cancel</button><button class="pill pri" data-act="doInvite">Send Invitation</button>' }) };
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
