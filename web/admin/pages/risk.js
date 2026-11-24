
function startRisk(root) {

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
  const RV2 = '[Risk Reviewer]';
  const rng = (seed) => { let h = 2166136261; for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; };
  const RULES = { 25000: { target: 1500, daily: 500, dd: 1500, max: 3 }, 50000: { target: 3000, daily: 1100, dd: 2500, max: 5 }, 100000: { target: 6000, daily: 2200, dd: 3000, max: 10 }, 150000: { target: 9000, daily: 3300, dd: 4500, max: 15 } };
  const PLANS = [['pa', '[Plan A Name]', [25000, 50000]], ['pb', '[Plan B Name]', [50000, 100000, 150000]], ['pc', '[Plan C Name]', [25000, 50000, 100000]]];
  const PLATS = ['Tradovate', 'NinjaTrader', 'TradingView', 'Rithmic'];
  const NAMES = ['Jane D.', 'Marcus T.', 'Priya S.', 'Diego R.', 'Amara O.', 'Kenji M.', 'Sofia L.', 'Liam K.', 'Noah B.', 'Elena V.', 'Omar H.', 'Chen W.', 'Lucas P.', 'Hana K.', 'Ivan P.', 'Zoe A.', 'Mateo G.', 'Aisha N.', 'Felix B.', 'Grace T.', 'Arjun R.', 'Nina S.', 'Theo M.', 'Yara F.', 'Jonas E.', 'Maya C.'];
  const COUNTRIES = ['United States', 'United Kingdom', 'India', 'Mexico', 'Nigeria', 'Japan', 'Spain', 'Canada', 'Australia', 'Germany', 'UAE', 'Singapore', 'Brazil', 'South Korea', 'Poland', 'Poland', 'Argentina', 'Kenya', 'Netherlands', 'Philippines', 'India', 'Italy', 'Ireland', 'Turkey', 'Sweden', 'Chile'];

  // ---------- accounts ----------
  const ACCTS = (() => { const r = rng('accts'); const out = []; let n = 10380;
    for (let i = 0; i < 44; i++) {
      const [pid, pname, sizes] = PLANS[Math.floor(r() * 3)]; const size = sizes[Math.floor(r() * sizes.length)]; const R = RULES[size];
      const funded = r() < 0.27; const ti = (i * 7) % NAMES.length;
      const total = Math.round((r() * 1.9 - 0.75) * (funded ? R.target * 0.7 : R.target));
      const high = Math.max(0, total) + Math.round(r() * R.target * 0.25);
      let today = Math.round((r() * 1.5 - 0.95) * R.daily); if (i < 6) today = -Math.round(R.daily * (0.72 + r() * 0.24));
      const floor = size + high - R.dd; let bal = size + total; if (bal - floor < R.dd * 0.06) { bal = floor + Math.round(R.dd * (0.06 + r() * 0.1)); }
      const open = Math.floor(r() * (R.max + 1)); const best = Math.round(18 + r() * 44);
      const st = i === 9 || i === 23 ? 'Paused' : i === 31 ? 'Closed' : 'Active';
      out.push({ id: (funded ? 'FS-F-' : 'FS-') + size / 1000 + 'K-' + (funded ? 2100 + i : ++n), funded, plan: pname, pid, size, R, trader: NAMES[ti], tid: 'T' + (1043 - ti * 3), country: COUNTRIES[ti], plat: PLATS[Math.floor(r() * 4)], bal, total: bal - size, today, high, floor, open, best, st, days: 1 + Math.floor(r() * 14), notes: [] });
    }
    return out; })();
  const dailyUsed = (a) => Math.max(0, -a.today) / a.R.daily * 100;
  const ddUsed = (a) => Math.min(100, Math.max(0, (a.size + a.high - a.bal) / a.R.dd * 100));
  const score = (a) => Math.round(Math.min(99, Math.max(dailyUsed(a), ddUsed(a)) * 0.7 + (a.open / a.R.max) * 18 + (a.best > 40 && a.funded ? 10 : 0) + (ALERTS_BY_ACCT[a.id] || 0) * 12));
  const ALERTS_BY_ACCT = {};

  // ---------- detectors ----------
  const DETECTORS = [
    { id: 'hedge', n: 'Hedging Across Accounts', d: 'Opposite positions in the same market on two accounts, opened close together.', th: [['Seconds Apart', 5], ['Times in 7 Days', 3]], sev: 'high', act: 'hold', on: true, hits: 14, conf: 79 },
    { id: 'copy', n: 'Copy Trading Between Traders', d: "Different traders placing the same trades within seconds of each other.", th: [['Seconds Apart', 3], ['Matching Trades', 10]], sev: 'high', act: 'hold', on: true, hits: 9, conf: 67 },
    { id: 'group', n: 'Group Trading', d: 'Three or more traders opening the same trade in the same few seconds, again and again.', th: [['Traders', 3], ['Seconds Apart', 5]], sev: 'high', act: 'alert', on: true, hits: 4, conf: 75 },
    { id: 'share', n: 'Shared Device or IP', d: "Two traders signing in from the same device or home IP address.", th: [['Shared Logins', 2]], sev: 'medium', act: 'alert', on: true, hits: 22, conf: 41 },
    { id: 'payment', n: 'Shared Card or Payout Wallet', d: 'The same card pays for, or the same wallet receives payouts for, different traders.', th: [['Traders', 2]], sev: 'high', act: 'hold', on: true, hits: 6, conf: 83 },
    { id: 'hft', n: 'Very Short Holds', d: 'Most trades held only a few seconds, which can exploit price delays on the simulator.', th: [['Hold Under (Seconds)', 5], ['Share of Trades (%)', 60]], sev: 'medium', act: 'alert', on: true, hits: 11, conf: 55 },
    { id: 'news', n: 'News Window Trade', d: 'A trade opened or closed within 2 minutes of a high-impact release.', th: [['Minutes Each Side', 2]], sev: 'medium', act: 'alert', on: true, hits: 31, conf: 88 },
    { id: 'contracts', n: 'Over Max Contracts', d: "More open contracts than the account's rule set allows.", th: [['Grace Period (Seconds)', 0]], sev: 'high', act: 'close', on: true, hits: 7, conf: 100 },
    { id: 'martingale', n: 'Doubling After Losses', d: 'Position size doubled after each loss, three or more times in a row.', th: [['Doublings in a Row', 3]], sev: 'medium', act: 'alert', on: true, hits: 5, conf: 60 },
    { id: 'allin', n: 'Max Size on Every Trade', d: 'Nearly every trade at the maximum contracts, a sign of gambling rather than a strategy.', th: [['Share at Max Size (%)', 80]], sev: 'low', act: 'alert', on: true, hits: 18, conf: 39 },
    { id: 'consistency', n: 'One Day Carries the Profit', d: 'A single day is more than the allowed share of total profit on a funded account.', th: [['Best Day Share (%)', 40]], sev: 'low', act: 'hold', on: true, hits: 26, conf: 92 },
    { id: 'vpn', n: 'Country Mismatch or VPN', d: "Sign-in or checkout country doesn't match the identity check, or comes through a VPN.", th: [['Mismatched Sign-Ins', 2]], sev: 'medium', act: 'alert', on: true, hits: 13, conf: 46 },
    { id: 'multi', n: 'Over the Account Limit', d: 'One person holding more active evaluations or funded accounts than allowed, across sign-ups.', th: [['Max Evaluations', 5], ['Max Funded', 3]], sev: 'high', act: 'hold', on: true, hits: 3, conf: 100 },
    { id: 'weekend', n: 'Held Over the Weekend', d: 'A position still open at Friday close.', th: [['Minutes After Close', 0]], sev: 'medium', act: 'close', on: true, hits: 8, conf: 100 },
    { id: 'chargeback', n: 'Chargeback Risk', d: 'Payment signals that often end in a chargeback: new card, mismatched country, several cards tried.', th: [['Cards Tried', 3]], sev: 'medium', act: 'alert', on: true, hits: 10, conf: 52 },
    { id: 'payoutpat', n: 'Payout Right After Passing', d: 'A funded account requests a payout on the first possible day with one large winning trade.', th: [['Share From One Trade (%)', 70]], sev: 'medium', act: 'hold', on: false, hits: 0, conf: 0 }
  ];
  const ACTS = { alert: 'Alert Only', hold: 'Hold Payouts', pause: 'Pause Trading', close: 'Close the Account' };
  const SEV = { high: ['High', 'err'], medium: ['Medium', 'draft'], low: ['Low', 'plain'] };

  // ---------- alerts ----------
  const ALERTS = [
    { id: 'RK-1182', type: 'hedge', sev: 'high', st: 'new', when: 'Today, 12:31 PM', ag: null, accts: ['FS-50K-10290', 'FS-50K-10291'], traders: ['Liam K.'], sum: 'Opposite NQ positions on two of his own accounts, opened 1 to 2 seconds apart, 6 times on Nov 20 and 4 times today.', ev: { h: ['Time ET', 'Account', 'Side', 'Qty', 'Price'], rows: [['12:30:41.204', 'FS-50K-10290', 'Buy', '2', '21,104.25'], ['12:30:42.018', 'FS-50K-10291', 'Sell', '2', '21,104.00'], ['12:34:10.551', 'FS-50K-10290', 'Sell', '2', '21,091.50'], ['12:34:10.902', 'FS-50K-10291', 'Buy', '2', '21,091.75']] }, rec: 'Confirm, close the losing account and hold payouts on the other. The prohibited strategy warning was already sent on Nov 20.' },
    { id: 'RK-1181', type: 'copy', sev: 'high', st: 'investigating', when: 'Today, 11:58 AM', ag: ME, accts: ['FS-100K-10405', 'FS-100K-10388', 'FS-F-50K-2131'], traders: ['Omar H.', 'Marcus T.', 'Chen W.'], sum: '41 matching ES trades across three traders, each within 1.4 seconds, over 5 days. Different countries, same order sizes.', ev: { h: ['Time ET', 'Omar H.', 'Marcus T.', 'Chen W.', 'Gap'], rows: [['09:42:03', 'Buy 2 ES', 'Buy 2 ES', 'Buy 4 ES', '0.8s'], ['09:58:47', 'Sell 2 ES', 'Sell 2 ES', 'Sell 4 ES', '1.1s'], ['10:20:12', 'Buy 2 ES', 'Buy 2 ES', 'Buy 4 ES', '1.4s'], ['11:05:39', 'Sell 2 ES', 'Sell 2 ES', 'Sell 4 ES', '0.9s']] }, rec: 'Likely a signal group or trade copier. Hold all payouts and ask each trader how they place trades.' },
    { id: 'RK-1179', type: 'payment', sev: 'high', st: 'new', when: 'Today, 10:14 AM', ag: null, accts: ['FS-25K-10412', 'FS-50K-10418'], traders: ['Ivan P.', 'Zoe A.'], sum: 'The same Visa ending 8841 paid for both traders, and both payout profiles point to the same USDC wallet.', ev: { h: ['Signal', 'Ivan P.', 'Zoe A.'], rows: [['Card', 'Visa ···8841', 'Visa ···8841'], ['Payout Wallet', '0x7a3…f19c', '0x7a3…f19c'], ['Device', 'Chrome · Windows', 'Safari · iPhone'], ['Country', 'Poland', 'Poland']] }, rec: 'Could be one person with two identities. Check the identity documents before any payout.' },
    { id: 'RK-1177', type: 'contracts', sev: 'high', st: 'confirmed', when: 'Today, 9:47 AM', ag: ME, accts: ['FS-25K-10310'], traders: ['Diego R.'], sum: '5 MNQ contracts open against a max of 3 for 38 seconds. The account was closed automatically.', ev: { h: ['Time ET', 'Event', 'Open Contracts', 'Max'], rows: [['09:46:58', 'Buy 3 MNQ', '3', '3'], ['09:47:02', 'Buy 2 MNQ', '5', '3'], ['09:47:40', 'Auto-closed', '0', '3']] }, rec: 'Closed by the rule. Nothing more to do unless the trader disputes it.' },
    { id: 'RK-1176', type: 'share', sev: 'medium', st: 'new', when: 'Today, 9:12 AM', ag: null, accts: ['FS-50K-10399', 'FS-25K-10421'], traders: ['Priya S.', 'Kenji M.'], sum: 'Both traders signed in from the same IP address 3 times this week. Different devices.', ev: { h: ['When', 'Trader', 'IP', 'Device'], rows: [['Nov 20, 8:02 PM', 'Priya S.', '103.21.x.x', 'Chrome · Mac'], ['Nov 20, 8:15 PM', 'Kenji M.', '103.21.x.x', 'Edge · Windows'], ['Nov 22, 7:40 AM', 'Priya S.', '103.21.x.x', 'Chrome · Mac']] }, rec: 'Often a shared office or university network. No trade overlap found. Dismiss unless trades start matching.' },
    { id: 'RK-1174', type: 'hft', sev: 'medium', st: 'new', when: 'Yesterday, 4:40 PM', ag: null, accts: ['FS-100K-10011'], traders: ['Sofia L.'], sum: '72% of 380 trades held under 4 seconds, mostly during fast markets.', ev: { h: ['Hold Time', 'Trades', 'Share', 'P&L'], rows: [['Under 2s', '161', '42%', '+$3,110'], ['2 to 5s', '113', '30%', '+$1,240'], ['Over 5s', '106', '28%', '−$300']] }, rec: 'Check whether profits depend on the simulator filling at stale prices before approving the funded account.' },
    { id: 'RK-1171', type: 'news', sev: 'medium', st: 'dismissed', when: 'Yesterday, 8:31 AM', ag: RV2, accts: ['FS-50K-10201'], traders: ['Marcus T.'], sum: 'Closed a CL position 40 seconds after the EIA release.', ev: { h: ['Time ET', 'Event'], rows: [['10:30:00', 'EIA Crude Inventories'], ['10:30:40', 'Sell 1 CL, closed']] }, rec: 'Dismissed: a stop order placed before the window. Stops that fill on their own are allowed.' },
    { id: 'RK-1169', type: 'martingale', sev: 'medium', st: 'investigating', when: 'Nov 21, 2:12 PM', ag: RV2, accts: ['FS-150K-10377'], traders: ['Felix B.'], sum: 'Size went 1, 2, 4, 8 contracts after three losses in a row, twice this week.', ev: { h: ['Trade', 'Size', 'Result'], rows: [['1', '1 ES', '−$212'], ['2', '2 ES', '−$450'], ['3', '4 ES', '−$875'], ['4', '8 ES', '+$1,610']] }, rec: 'Within the rules so far, but a breach is likely. Watch, and note it on any payout.' },
    { id: 'RK-1166', type: 'vpn', sev: 'medium', st: 'new', when: 'Nov 21, 11:05 AM', ag: null, accts: ['FS-50K-10398'], traders: ['Yara F.'], sum: 'Identity check from Brazil, but 9 of the last 10 sign-ins came through a VPN exit in the Netherlands.', ev: { h: ['When', 'Country', 'Network'], rows: [['Nov 21, 9:12 AM', 'Netherlands', 'VPN'], ['Nov 20, 6:40 PM', 'Netherlands', 'VPN'], ['Nov 2, 10:04 AM', 'Brazil', 'Home ISP']] }, rec: 'Ask the trader to sign in without the VPN before the next payout.' },
    { id: 'RK-1162', type: 'chargeback', sev: 'medium', st: 'new', when: 'Nov 20, 7:44 PM', ag: null, accts: ['FS-150K-10420'], traders: ['Nina S.'], sum: '4 different cards tried before a payment went through. Card country differs from sign-up country.', ev: { h: ['Try', 'Card', 'Country', 'Result'], rows: [['1', 'Mastercard ···2201', 'US', 'Declined'], ['2', 'Visa ···0912', 'US', 'Declined'], ['3', 'Visa ···7781', 'GB', 'Declined'], ['4', 'Visa ···4410', 'GB', 'Paid']] }, rec: 'Keep watching. If a chargeback arrives, the account closes automatically.' },
    { id: 'RK-1158', type: 'multi', sev: 'high', st: 'new', when: 'Nov 20, 1:20 PM', ag: null, accts: ['FS-F-50K-2107', 'FS-F-100K-2114', 'FS-F-50K-2120', 'FS-F-25K-2128'], traders: ['Theo M.', '[Second Sign-Up]'], sum: 'Four funded accounts across two sign-ups with the same identity document. The limit is 3 funded accounts per person.', ev: { h: ['Sign-Up', 'Email', 'Funded Accounts'], rows: [['Theo M.', 't***@gmail.com', '3'], ['[Second Sign-Up]', 't***@proton.me', '1']] }, rec: 'Close the newest funded account and merge the sign-ups.' },
    { id: 'RK-1155', type: 'weekend', sev: 'medium', st: 'confirmed', when: 'Nov 15, 5:01 PM', ag: ME, accts: ['FS-50K-10366'], traders: ['Hana K.'], sum: 'An NQ position was still open at Friday close and was closed automatically.', ev: { h: ['Time ET', 'Event'], rows: [['16:59:58', '1 NQ open'], ['17:00:00', 'Auto-closed at market close']] }, rec: 'Closed by the rule.' }
  ];
  ALERTS.filter((x) => ['new', 'investigating'].includes(x.st)).forEach((x) => x.accts.forEach((a) => { ALERTS_BY_ACCT[a] = (ALERTS_BY_ACCT[a] || 0) + 1; }));
  const ATYPE = Object.fromEntries(DETECTORS.map((d) => [d.id, d.n]));

  // ---------- payout reviews ----------
  const CHECKS = [['days', 'Minimum Trading Days Met'], ['consistency', 'Best Day 40% or Less of Profit'], ['rules', 'No Rule Broken on This Account'], ['kyc', 'Identity Verified'], ['agreement', 'Funded Agreement Signed'], ['tax', 'Tax Form on File'], ['alerts', 'No Open Risk Alerts'], ['device', 'Same Device and Country as Purchase'], ['copy', 'No Copy-Trading Match'], ['wallet', 'Payout Method Belongs to the Trader']];
  const PAYOUTS = [
    { id: 'PO-3321', trader: 'Jane D.', acct: 'FS-F-50K-2207', amt: 1840, split: 90, days: 9, req: 'Today, 10:12 AM', st: 'review', fail: [], warn: [] },
    { id: 'PO-3320', trader: 'Chen W.', acct: 'FS-F-50K-2131', amt: 4210, split: 90, days: 6, req: 'Today, 9:40 AM', st: 'review', fail: ['alerts', 'copy'], warn: [] },
    { id: 'PO-3318', trader: 'Sofia L.', acct: 'FS-F-100K-1984', amt: 6120, split: 90, days: 14, req: 'Today, 8:05 AM', st: 'review', fail: [], warn: ['consistency'] },
    { id: 'PO-3317', trader: 'Zoe A.', acct: 'FS-F-50K-2140', amt: 2980, split: 80, days: 5, req: 'Yesterday, 6:22 PM', st: 'hold', fail: ['wallet', 'alerts'], warn: ['device'], note: 'Same wallet as Ivan P. (RK-1179).' },
    { id: 'PO-3315', trader: 'Theo M.', acct: 'FS-F-100K-2114', amt: 7650, split: 90, days: 11, req: 'Yesterday, 3:10 PM', st: 'review', fail: ['alerts'], warn: [] },
    { id: 'PO-3314', trader: 'Grace T.', acct: 'FS-F-25K-2133', amt: 610, split: 90, days: 7, req: 'Yesterday, 1:02 PM', st: 'review', fail: [], warn: ['tax'] },
    { id: 'PO-3310', trader: 'Arjun R.', acct: 'FS-F-50K-2125', amt: 2140, split: 90, days: 12, req: 'Nov 21, 4:44 PM', st: 'approved', fail: [], warn: [], by: [ME] },
    { id: 'PO-3306', trader: 'Lucas P.', acct: 'FS-F-150K-2101', amt: 9300, split: 90, days: 15, req: 'Nov 20, 11:30 AM', st: 'approved', fail: [], warn: [], by: [ME, RV2] }
  ];

  // ---------- linked accounts ----------
  const CLUSTERS = [
    { id: 'CL-41', st: 'open', nodes: ['Omar H.', 'Marcus T.', 'Chen W.'], edges: [[0, 1, 'Same Trades'], [1, 2, 'Same Trades'], [0, 2, 'Same Trades']], payouts: 4210, alert: 'RK-1181' },
    { id: 'CL-38', st: 'open', nodes: ['Ivan P.', 'Zoe A.'], edges: [[0, 1, 'Card + Wallet']], payouts: 2980, alert: 'RK-1179' },
    { id: 'CL-36', st: 'open', nodes: ['Theo M.', '[Second Sign-Up]'], edges: [[0, 1, 'Same ID Document']], payouts: 7650, alert: 'RK-1158' },
    { id: 'CL-33', st: 'household', nodes: ['Priya S.', 'Kenji M.', 'Arjun R.', 'Aisha N.'], edges: [[0, 1, 'Same IP'], [0, 2, 'Same IP'], [2, 3, 'Same IP']], payouts: 2140, alert: 'RK-1176' },
    { id: 'CL-29', st: 'allowed', nodes: ['Mateo G.', 'Maya C.'], edges: [[0, 1, 'Same Address']], payouts: 0, note: 'Married couple, documents checked Nov 3.' }
  ];

  // ---------- breaches ----------
  const BREACHES = [
    ['Today, 12:02 PM', 'FS-50K-10414', 'Noah B.', 'Max Drawdown', '$47,412 vs floor $47,500', 'Auto-closed', ''],
    ['Today, 10:02 AM', 'FS-100K-10388', 'Marcus T.', 'Max Drawdown', '$96,912 vs floor $97,000', 'Auto-closed', 'Disputed · BR-212'],
    ['Today, 9:47 AM', 'FS-25K-10310', 'Diego R.', 'Over Max Contracts', '5 open vs max 3', 'Auto-closed', ''],
    ['Today, 9:31 AM', 'FS-50K-10357', 'Lucas P.', 'Daily Loss Limit', '−$1,140 vs −$1,100', 'Auto-closed', ''],
    ['Today, 9:30 AM', 'FS-25K-10402', 'Grace T.', 'Daily Loss Limit', '−$512 vs −$500', 'Auto-closed', ''],
    ['Yesterday, 3:58 PM', 'FS-150K-10370', 'Arjun R.', 'Max Drawdown', '$145,380 vs floor $145,500', 'Auto-closed', ''],
    ['Yesterday, 2:14 PM', 'FS-F-50K-2109', 'Nina S.', 'Daily Loss Limit', '−$1,160 vs −$1,100', 'Auto-closed', ''],
    ['Yesterday, 10:31 AM', 'FS-50K-10349', 'Jonas E.', 'News Window', 'Opened 30s after CPI', 'Closed by reviewer', ''],
    ['Yesterday, 9:33 AM', 'FS-100K-10360', 'Felix B.', 'Daily Loss Limit', '−$2,260 vs −$2,200', 'Auto-closed', ''],
    ['Nov 20, 4:59 PM', 'FS-50K-10366', 'Hana K.', 'Held Over Close', '1 NQ open at close', 'Auto-closed', ''],
    ['Nov 20, 11:20 AM', 'FS-25K-10333', 'Zoe A.', 'Max Drawdown', '$23,480 vs floor $23,500', 'Auto-closed', 'Disputed · Upheld'],
    ['Nov 20, 9:44 AM', 'FS-F-100K-2111', 'Maya C.', 'Max Drawdown', '$96,900 vs floor $97,000', 'Auto-closed', '']
  ];

  // ---------- blocklist, audit ----------
  const BLOCKS = [
    { k: 'Identity Document', v: 'Passport ···4471 (PL)', why: 'Two sign-ups, payout fraud', by: RV2, d: 'Nov 18' },
    { k: 'Payout Wallet', v: '0x9b1…c03e', why: 'Linked to 5 closed accounts', by: ME, d: 'Nov 14' },
    { k: 'Card', v: 'Visa ···5502', why: 'Chargeback', by: ME, d: 'Nov 11' },
    { k: 'Device', v: 'Device ID 8c2f…11a0', why: 'Copy trading group', by: RV2, d: 'Nov 9' },
    { k: 'Email', v: 'f***@tempmail.io', why: 'Disposable email', by: ME, d: 'Nov 6' },
    { k: 'IP Range', v: '185.220.x.x', why: 'Known VPN exit used for abuse', by: RV2, d: 'Oct 30' }
  ];
  const AUDIT = [
    ['Today, 12:31 PM', 'System', 'Alert RK-1182 raised', 'Hedging Across Accounts · FS-50K-10290, 10291'],
    ['Today, 12:02 PM', 'System', 'Account closed', 'FS-50K-10414 · Max Drawdown'],
    ['Today, 11:58 AM', ME, 'Took alert', 'RK-1181 · Copy Trading'],
    ['Today, 10:40 AM', ME, 'Payout held', 'PO-3317 · Zoe A. · $2,980'],
    ['Today, 9:47 AM', 'System', 'Account closed', 'FS-25K-10310 · Over Max Contracts'],
    ['Yesterday, 6:10 PM', RV2, 'Alert dismissed', 'RK-1171 · stop order filled on its own'],
    ['Yesterday, 2:30 PM', ME, 'Detection rule changed', 'Very Short Holds · threshold 3s → 5s'],
    ['Nov 21, 4:50 PM', ME, 'Payout approved', 'PO-3310 · Arjun R. · $2,140'],
    ['Nov 20, 11:35 AM', `${ME} and ${RV2}`, 'Payout approved', 'PO-3306 · Lucas P. · $9,300 · two approvals']
  ];

  // make sure every account named in alerts, payouts and breaches exists in the monitor
  (() => { const r = rng('ensure'); const add = (id, trader, closed) => { if (ACCTS.some((a) => a.id === id)) return; const m = id.match(/(\d+)K/); const size = m ? +m[1] * 1000 : 50000; const R = RULES[size] || RULES[50000]; const funded = id.startsWith('FS-F-');
      const total = Math.round((r() * 1.2 - 0.3) * R.target * (funded ? 0.8 : 1)); const high = Math.max(0, total) + Math.round(r() * R.target * 0.2); const ti = NAMES.indexOf(trader);
      const fl0 = size + high - R.dd; const b0 = Math.max(size + total, fl0 + Math.round(R.dd * 0.12)); ACCTS.push({ id, funded, plan: PLANS[1][1], pid: 'pb', size, R, trader, tid: 'T' + (1043 - Math.max(0, ti) * 3), country: COUNTRIES[Math.max(0, ti)] || 'United States', plat: PLATS[Math.floor(r() * 4)], bal: b0, total: b0 - size, today: Math.round((r() - 0.6) * R.daily * 0.8), high, floor: size + high - R.dd, open: Math.floor(r() * R.max), best: Math.round(20 + r() * 35), st: closed ? 'Closed' : 'Active', days: 3 + Math.floor(r() * 10), notes: [] }); };
    ALERTS.forEach((x) => x.accts.forEach((id, i) => add(id, x.traders[Math.min(i, x.traders.length - 1)], x.type === 'contracts' || x.type === 'weekend')));
    PAYOUTS.forEach((p) => add(p.acct, p.trader));
    PAYOUTS.find((p) => p.id === 'PO-3318').warn = ['consistency']; ACCTS.filter((a) => a.id === 'FS-F-100K-1984').forEach((a) => { a.best = 46; a.total = 6800; a.bal = a.size + 6800; });
    BREACHES.forEach((b) => add(b[1], b[2], true));
  })();
  // =================== extra tools ===================
  const WATCH = [
    { who: 'Felix B.', acct: 'FS-150K-10377', why: 'Doubling after losses (RK-1169)', until: 'Dec 1', by: RV2, ping: true },
    { who: 'Sofia L.', acct: 'FS-100K-10011', why: 'Very short holds before funding (RK-1174)', until: 'Dec 6', by: ME, ping: true },
    { who: 'Nina S.', acct: 'FS-150K-10420', why: 'Four cards tried (RK-1162)', until: 'Dec 20', by: ME, ping: false }
  ];
  const CASES = [
    { id: 'CS-88', title: 'Signal group trading the same ES entries', st: 'open', owner: ME, opened: 'Nov 22', due: 'Nov 25', traders: ['Omar H.', 'Marcus T.', 'Chen W.'], alerts: ['RK-1181'], log: [['Nov 22, 12:05 PM', ME, 'Opened from RK-1181. Payout PO-3320 held.'], ['Nov 22, 12:40 PM', ME, 'Asked all three traders by email how they place their trades.']], decision: '' },
    { id: 'CS-87', title: 'One person behind two identities, shared wallet', st: 'open', owner: RV2, opened: 'Nov 22', due: 'Nov 24', traders: ['Ivan P.', 'Zoe A.'], alerts: ['RK-1179'], log: [['Nov 22, 10:30 AM', RV2, 'Requested the identity check files for both traders.']], decision: '' },
    { id: 'CS-85', title: 'Four funded accounts on one passport', st: 'decided', owner: ME, opened: 'Nov 20', due: 'Nov 22', traders: ['Theo M.'], alerts: ['RK-1158'], log: [['Nov 20, 2:00 PM', ME, 'Confirmed the same document on both sign-ups.'], ['Nov 21, 9:15 AM', `${ME} and ${RV2}`, 'Closed the newest funded account. Sign-ups merged.']], decision: 'Closed the newest funded account, kept the other three' }
  ];
  const CHARGEBACKS = [
    { id: 'CB-142', trader: 'Nina S.', order: 'FS-ORD-2240', amt: 349, reason: 'Fraud: card not authorized', code: '10.4', due: 'Nov 29', st: 'evidence', ev: { terms: true, kyc: false, logins: true, trades: true, emails: true } },
    { id: 'CB-139', trader: 'Elena V.', order: 'FS-ORD-2190', amt: 79, reason: 'Product not as described', code: '13.3', due: 'Nov 26', st: 'evidence', ev: { terms: true, kyc: false, logins: true, trades: false, emails: true } },
    { id: 'CB-131', trader: 'Jonas E.', order: 'FS-ORD-2102', amt: 169, reason: 'Subscription cancelled', code: '13.2', due: 'Nov 12', st: 'submitted', ev: { terms: true, kyc: true, logins: true, trades: true, emails: true } },
    { id: 'CB-120', trader: 'Grace T.', order: 'FS-ORD-1988', amt: 99, reason: 'Duplicate charge', code: '12.6', due: 'Oct 30', st: 'lost', ev: { terms: true, kyc: false, logins: true, trades: true, emails: true } },
    { id: 'CB-114', trader: 'Ivan P.', order: 'FS-ORD-1931', amt: 259, reason: 'Fraud: card not authorized', code: '10.4', due: 'Oct 24', st: 'won', ev: { terms: true, kyc: true, logins: true, trades: true, emails: true } }
  ];
  const EVK = [['terms', 'Terms Accepted at Checkout', 'Time, IP and agreement version'], ['kyc', 'Identity Check Result', 'Only if the trader reached funding'], ['logins', 'Sign-In History', 'Devices and countries after purchase'], ['trades', 'Trading Activity', 'Proof the evaluation was used'], ['emails', 'Emails Delivered', 'Order confirmation and account login']];
  const ADJ = [
    { id: 'AJ-61', acct: 'FS-50K-10414', trader: 'Noah B.', amt: 420, why: 'Tradovate outage Nov 21, 9:31 to 9:44 AM: stop did not fill', st: 'second', by: ME, when: 'Today, 11:50 AM' },
    { id: 'AJ-59', acct: 'FS-100K-10011', trader: 'Sofia L.', amt: 2250, why: 'Reinstated after BR-205: balance restored to before the breach', st: 'done', by: `${ME} and ${RV2}`, when: 'Nov 16, 10:02 AM' },
    { id: 'AJ-57', acct: 'FS-25K-10333', trader: 'Zoe A.', amt: -120, why: 'Fill at a stale simulator price removed', st: 'done', by: `${ME} and ${RV2}`, when: 'Nov 14, 4:30 PM' }
  ];
  const NEWS = [
    { d: 'Mon, Nov 23', t: '10:00 AM', e: 'Consumer Confidence', mk: 'ES, NQ', imp: 'medium', flat: false, warned: false },
    { d: 'Tue, Nov 24', t: '8:30 AM', e: 'CPI', mk: 'All Index, Rates, Gold', imp: 'high', flat: false, warned: true },
    { d: 'Tue, Nov 24', t: '10:30 AM', e: 'EIA Crude Inventories', mk: 'CL, MCL', imp: 'high', flat: false, warned: false },
    { d: 'Wed, Nov 25', t: '8:30 AM', e: 'GDP (Second Estimate)', mk: 'All Index, Rates', imp: 'high', flat: false, warned: false },
    { d: 'Wed, Nov 25', t: '2:00 PM', e: 'FOMC Minutes', mk: 'All', imp: 'high', flat: true, warned: false },
    { d: 'Thu, Nov 26', t: 'All Day', e: 'Thanksgiving: Markets Closed', mk: 'All', imp: 'holiday', flat: true, warned: true },
    { d: 'Fri, Nov 27', t: '1:00 PM', e: 'Early Close', mk: 'All', imp: 'holiday', flat: true, warned: true }
  ];
  const HEALTH = [
    { n: 'Tradovate', k: 'Platform', st: 'ok', lat: 38, tick: '0.2s ago', note: '' },
    { n: 'NinjaTrader', k: 'Platform', st: 'ok', lat: 41, tick: '0.3s ago', note: '' },
    { n: 'Rithmic', k: 'Platform', st: 'slow', lat: 412, tick: '1.8s ago', note: 'Slower fills since 12:20 PM' },
    { n: 'TradingView', k: 'Platform', st: 'ok', lat: 55, tick: '0.4s ago', note: '' },
    { n: '[Data Vendor] Price Feed', k: 'Prices', st: 'ok', lat: 12, tick: '0.1s ago', note: 'Used to check every rule' },
    { n: 'Rule Engine', k: 'Funded Sky', st: 'ok', lat: 6, tick: 'Checking 66 accounts', note: '' },
    { n: 'Rise', k: 'Payouts', st: 'ok', lat: 220, tick: 'Last payout 9:40 AM', note: '' },
    { n: 'Sumsub', k: 'Identity', st: 'ok', lat: 310, tick: 'Last check 11:02 AM', note: '' }
  ];
  const SWITCHES = { trading: false, freeze: false, payouts: false, sales: false };
  const TRADES = (() => { const r = rng('trades'); const out = []; const syms = ['ES', 'NQ', 'MNQ', 'CL', 'GC', 'MES', 'RTY'];
    const accts = ACCTS.filter((a) => a.st !== 'Closed');
    for (let i = 0; i < 150; i++) { const a = accts[Math.floor(r() * accts.length)]; const s = syms[Math.floor(r() * syms.length)]; const sec = 9.5 * 3600 + Math.floor(r() * 3.2 * 3600); const q = 1 + Math.floor(r() * a.R.max);
      out.push({ acct: a.id, trader: a.trader, s, side: r() > 0.5 ? 'Buy' : 'Sell', q, sec, hold: r() < 0.15 ? 1 + Math.floor(r() * 4) : 8 + Math.floor(r() * 900), pl: Math.round((r() - 0.5) * a.R.daily * 0.4) }); }
    [['FS-100K-10405', 'Omar H.', 2], ['FS-100K-10388', 'Marcus T.', 2], ['FS-F-50K-2131', 'Chen W.', 4]].forEach(([acct, trader, q], j) => [[34923, 'Buy'], [35927, 'Sell'], [37212, 'Buy'], [39939, 'Sell']].forEach(([sec, side]) => out.push({ acct, trader, s: 'ES', side, q, sec: sec + j, hold: 400 + j * 3, pl: side === 'Sell' ? 310 * q / 2 : 0 })));
    [['FS-50K-10290', 'Buy'], ['FS-50K-10291', 'Sell']].forEach(([acct, side], j) => out.push({ acct, trader: 'Liam K.', s: 'NQ', side, q: 2, sec: 45041 + j, hold: 210, pl: j ? -180 : 175 }));
    return out.sort((a, b) => b.sec - a.sec); })();
  const hms = (s) => { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`; };
  const traders = () => { const m = {}; ACCTS.forEach((a) => { const t = m[a.trader] = m[a.trader] || { name: a.trader, country: a.country, accts: [], restricted: false }; t.accts.push(a); }); return Object.values(m); };
  const TSTATE = {};

  // ---------- trader profiles ----------
  function tScore(t) { return Math.max(...t.accts.map(score)); }
  function tStatus(n) { return TSTATE[n] || (WATCH.some((w) => w.who === n) ? 'Watching' : 'Normal'); }
  function vTraders() {
    const q = (S.tq || '').toLowerCase(); const l = traders().filter((t) => !q || t.name.toLowerCase().includes(q)).sort((a, b) => tScore(b) - tScore(a));
    const stc = { Normal: 'plain', Watching: 'sched', Restricted: 'draft', Banned: 'err' };
    return `<div class="ph"><div><h1>Trader Profiles</h1><p>Everything about one trader in one place: every account, alert, payout, link and decision. Restrict or ban from here. The full customer profile, KYC and payments are in ${XL('Users', 'users', 'Users')}.</p></div></div>
      <div class="card"><div class="ch lgf"><input type="search" placeholder="Search Trader" value="${esc(S.tq || '')}" data-live="tq" data-key="tq" aria-label="Search traders"><span class="lab">${l.length} Traders</span></div><div class="tsc"><table class="t"><thead><tr><th>Trader</th><th>Country</th><th class="num">Accounts</th><th class="num">Funded</th><th class="num">Open Alerts</th><th class="num">Paid Out</th><th class="num">Highest Score</th><th>Status</th></tr></thead><tbody>${l.map((t) => { const al = ALERTS.filter((x) => x.traders.includes(t.name) && ['new', 'investigating', 'second'].includes(x.st)).length; const paid = PAYOUTS.filter((p) => p.trader === t.name && p.st === 'approved').reduce((s, p) => s + p.amt, 0); const sc = tScore(t);
        return `<tr class="lk" data-act="trader" data-id="${esc(t.name)}"><td class="nw"><b>${esc(t.name)}</b></td><td class="nw">${esc(t.country)}</td><td class="num">${t.accts.length}</td><td class="num">${t.accts.filter((a) => a.funded).length}</td><td class="num ${al ? 'warnt' : ''}">${al}</td><td class="num">${paid ? money(paid) : '—'}</td><td class="num"><span class="sc ${sc >= 70 ? 'hi' : sc >= 45 ? 'md' : ''}">${sc}</span></td><td><span class="b ${stc[tStatus(t.name)]}">${tStatus(t.name)}</span></td></tr>`; }).join('')}</tbody></table></div></div>`;
  }
  function traderDrawer(name) {
    const t = traders().find((x) => x.name === name) || { name, country: '—', accts: [] };
    const al = ALERTS.filter((x) => x.traders.includes(name)); const po = PAYOUTS.filter((p) => p.trader === name); const cl = CLUSTERS.filter((c) => c.nodes.includes(name)); const cs = CASES.filter((c) => c.traders.includes(name));
    const st = tStatus(name);
    return { title: name, wide: true, body: `
      <div class="ahd"><div><b>${esc(name)}</b><div class="hint">${esc(t.country)} · Identity Verified · Joined 2026 · Trader ID <span class="mono">${t.accts[0] ? t.accts[0].tid : ''}</span></div></div><span class="b ${st === 'Banned' ? 'err' : st === 'Restricted' ? 'draft' : st === 'Watching' ? 'sched' : 'plain'}">${st}</span></div>
      <div class="tiles t4"><div class="tile"><span>Accounts</span><b>${t.accts.length}</b><small>${t.accts.filter((a) => a.funded).length} funded</small></div><div class="tile"><span>Highest Score</span><b>${t.accts.length ? tScore(t) : '—'}</b><small>Out of 99</small></div><div class="tile"><span>Alerts</span><b>${al.length}</b><small>${al.filter((x) => x.st === 'confirmed').length} confirmed</small></div><div class="tile"><span>Paid Out</span><b>${money(po.filter((p) => p.st === 'approved').reduce((s, p) => s + p.amt, 0))}</b><small>${po.length} requests</small></div></div>
      <div class="card m0"><div class="ch"><h3>Accounts</h3></div><div class="tsc"><table class="t"><tbody>${t.accts.map((a) => `<tr class="lk" data-act="acct" data-id="${a.id}"><td class="mono nw">${a.id}</td><td class="nw hint">${esc(a.plan)} ${K(a.size)}</td><td class="num nw">${money(a.bal)}</td><td>${meter(Math.max(dailyUsed(a), ddUsed(a)))}</td><td><span class="b ${a.st === 'Active' ? 'live' : a.st === 'Paused' ? 'draft' : 'err'}">${a.st}</span></td></tr>`).join('') || '<tr><td class="empty">No accounts.</td></tr>'}</tbody></table></div></div>
      ${al.length ? `<div class="sec"><h4>Alerts</h4>${al.map((x) => `<button class="ali" data-act="alert" data-id="${x.id}"><span class="b ${SEV[x.sev][1]}">${SEV[x.sev][0]}</span><div><b>${ATYPE[x.type]}</b><div class="hint">${x.id} · ${ALST[x.st][0]} · ${x.when}</div></div><span class="chev">›</span></button>`).join('')}</div>` : ''}
      ${po.length ? `<div class="sec"><h4>Payouts</h4>${po.map((p) => `<button class="ali" data-act="payout" data-id="${p.id}"><span class="mono">${p.id}</span><div><b>${money(p.amt)}</b><div class="hint">${p.req}</div></div><span class="b ${POST[p.st][1]}">${POST[p.st][0]}</span></button>`).join('')}</div>` : ''}
      ${cl.length || cs.length ? `<div class="sec"><h4>Links and Cases</h4>${cl.map((c) => `<button class="ali" data-act="go" data-v="links"><span class="mono">${c.id}</span><div><b>Linked to ${esc(c.nodes.filter((n) => n !== name).join(', '))}</b><div class="hint">${esc([...new Set(c.edges.map((e) => e[2]))].join(', '))}</div></div><span class="chev">›</span></button>`).join('')}${cs.map((c) => `<button class="ali" data-act="case" data-id="${c.id}"><span class="mono">${c.id}</span><div><b>${esc(c.title)}</b><div class="hint">${c.st === 'open' ? 'Open' : 'Decided'} · ${esc(c.owner)}</div></div><span class="chev">›</span></button>`).join('')}</div>` : ''}`,
      foot: `<button class="pill dng" data-act="tDo" data-k="ban" data-id="${esc(name)}" style="margin-right:auto">${st === 'Banned' ? 'Lift Ban' : 'Ban'}</button><button class="pill" data-act="tDo" data-k="case" data-id="${esc(name)}">Open a Case</button><button class="pill" data-act="tDo" data-k="watch" data-id="${esc(name)}">${WATCH.some((w) => w.who === name) ? 'Stop Watching' : 'Watch'}</button><button class="pill" data-act="tDo" data-k="restrict" data-id="${esc(name)}">${st === 'Restricted' ? 'Lift Restriction' : 'Restrict Purchases'}</button>` };
  }
  // ---------- cases ----------
  function vCases() {
    return `<div class="ph"><div><h1>Cases</h1><p>Investigations that need more than one alert: notes, evidence, a deadline and a final decision in one place.</p></div><div class="act"><button class="pill" data-act="newCase">+ New Case</button></div></div>
      <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Case</th><th>Traders</th><th>Alerts</th><th>Owner</th><th>Opened</th><th>Due</th><th>Status</th></tr></thead><tbody>${CASES.map((c) => `<tr class="lk" data-act="case" data-id="${c.id}"><td><b>${esc(c.title)}</b><div class="hint mono">${c.id}</div></td><td class="nw">${esc(c.traders.join(', '))}</td><td class="nw mono">${c.alerts.join(', ') || '—'}</td><td class="nw">${esc(c.owner)}</td><td class="nw">${c.opened}</td><td class="nw ${c.st === 'open' && c.due === 'Nov 22' ? 'dn' : ''}">${c.due}</td><td><span class="b ${c.st === 'open' ? 'sched' : c.st === 'second' ? 'draft' : 'live'}">${c.st === 'open' ? 'Open' : c.st === 'second' ? 'Waiting for Second Reviewer' : 'Decided'}</span></td></tr>`).join('')}</tbody></table></div></div>`;
  }
  function caseDrawer(id) {
    const c = CASES.find((x) => x.id === id);
    return { title: `${c.id} · ${c.title}`, wide: true, body: `
      <div class="kv"><div><span>Traders</span><b>${c.traders.map((n) => `<button class="lnk" data-act="trader" data-id="${esc(n)}">${esc(n)}</button>`).join(', ')}</b></div><div><span>Alerts</span><b>${c.alerts.map((a) => `<button class="lnk" data-act="alert" data-id="${a}">${a}</button>`).join(', ') || '—'}</b></div><div><span>Owner</span><b>${esc(c.owner)}</b></div><div><span>Due</span><b>${c.due}</b></div>${c.decision ? `<div><span>Decision</span><b>${esc(c.decision)}</b></div>` : ''}</div>
      <div class="sec"><h4>Timeline</h4><div class="tl2">${c.log.map(([w, who, x]) => `<div><i></i><div><b>${esc(who)}</b><span class="hint"> · ${w}</span><p>${esc(x)}</p></div></div>`).join('')}</div><div class="rowx" style="grid-template-columns:1fr auto;margin-top:10px"><input id="cnote" placeholder="Add to the timeline"><button class="pill sm" data-act="caseNote" data-id="${c.id}">Add</button></div></div>
      ${c.st === 'open' ? `<div class="fl"><label>Decision</label><select id="cdec">${['No action: the trading was allowed', 'Warn the traders', 'Deny payouts, keep accounts open', 'Close accounts and deny payouts', 'Ban the traders'].map((o) => `<option>${o}</option>`).join('')}</select><span class="hint">Closing or banning asks ${RV2} to confirm.</span></div>` : ''}`,
      foot: c.st === 'open' ? `<button class="pill pri" data-act="caseDecide" data-id="${c.id}">Record Decision</button>` : c.st === 'second' ? `<button class="pill pri" data-act="caseConfirm" data-id="${c.id}">Confirm as ${RV2}</button>` : '<button class="pill" data-act="closeDrw">Close</button>' };
  }
  // ---------- trade search ----------
  function vTrades() {
    const f = S.tf || (S.tf = { s: 'all', side: 'all', q: '', maxHold: '', minQty: '', sel: null, win: 3 });
    const q = f.q.toLowerCase();
    const l = TRADES.filter((t) => (f.s === 'all' || t.s === f.s) && (f.side === 'all' || t.side === f.side) && (!q || (t.acct + t.trader).toLowerCase().includes(q)) && (!f.maxHold || t.hold <= +f.maxHold) && (!f.minQty || t.q >= +f.minQty)).slice(0, 60);
    const sel = f.sel != null ? TRADES[f.sel] : null;
    const matches = sel ? TRADES.filter((t) => t !== sel && t.s === sel.s && t.trader !== sel.trader && Math.abs(t.sec - sel.sec) <= f.win) : [];
    return `<div class="ph"><div><h1>Trade Search</h1><p>Every fill from today across all platforms. Pick a trade and Find Matches shows other traders who did the same thing within seconds.</p></div></div>
      <div class="card"><div class="ch lgf"><input type="search" placeholder="Account or Trader" value="${esc(f.q)}" data-live="tfq" data-key="tfq" aria-label="Account or trader"><select data-bind="tf.s" aria-label="Market"><option value="all">All Markets</option>${['ES', 'NQ', 'MNQ', 'MES', 'RTY', 'CL', 'GC'].map((s) => `<option ${f.s === s ? 'selected' : ''}>${s}</option>`).join('')}</select><select data-bind="tf.side" aria-label="Side"><option value="all">Buys and Sells</option><option ${f.side === 'Buy' ? 'selected' : ''}>Buy</option><option ${f.side === 'Sell' ? 'selected' : ''}>Sell</option></select><input type="number" min="0" placeholder="Held Up To (s)" value="${f.maxHold}" data-bind="tf.maxHold" class="nin" aria-label="Held up to seconds"><input type="number" min="0" placeholder="Min Qty" value="${f.minQty}" data-bind="tf.minQty" class="nin" aria-label="Minimum quantity"></div>
      <div class="tsc"><table class="t"><thead><tr><th>Time ET</th><th>Account</th><th>Trader</th><th>Market</th><th>Side</th><th class="num">Qty</th><th class="num">Held</th><th class="num">P&amp;L</th><th></th></tr></thead><tbody>${l.map((t) => { const i = TRADES.indexOf(t); return `<tr class="${f.sel === i ? 'rsel' : ''}"><td class="mono nw">${hms(t.sec)}</td><td class="mono nw">${t.acct}</td><td class="nw">${esc(t.trader)}</td><td>${t.s}</td><td>${t.side}</td><td class="num">${t.q}</td><td class="num ${t.hold < 5 ? 'warnt' : ''}">${t.hold}s</td><td class="num nw ${t.pl < 0 ? 'dn' : t.pl > 0 ? 'up' : ''}">${money(t.pl, 1)}</td><td class="num nw"><button class="lnk" data-act="tMatch" data-i="${i}">Find Matches</button></td></tr>`; }).join('') || '<tr><td colspan="9" class="empty">No trades match.</td></tr>'}</tbody></table></div></div>
      ${sel ? `<div class="card"><div class="ch"><h3>Matches for ${sel.side} ${sel.q} ${sel.s} at ${hms(sel.sec)}</h3><span class="lab">${esc(sel.trader)}</span><div class="r"><label class="wlab">Within<select data-bind="tf.win">${[1, 3, 5, 10, 30].map((w) => `<option value="${w}" ${+f.win === w ? 'selected' : ''}>${w}s</option>`).join('')}</select></label></div></div><div class="tsc"><table class="t"><tbody>${matches.length ? matches.map((t) => `<tr><td class="mono nw">${hms(t.sec)}</td><td class="nw"><b>${esc(t.trader)}</b></td><td class="mono nw">${t.acct}</td><td class="nw">${t.side} ${t.q} ${t.s}</td><td class="num nw">${t.sec - sel.sec >= 0 ? '+' : ''}${t.sec - sel.sec}s</td><td class="num nw"><span class="b ${t.side === sel.side ? 'err' : 'draft'} plain">${t.side === sel.side ? 'Same Direction' : 'Opposite'}</span></td></tr>`).join('') : '<tr><td class="empty">No other trader traded this market within the window.</td></tr>'}</tbody></table></div>${matches.length ? `<div class="cb edact"><button class="pill sm" data-act="tAlert">Raise an Alert From These</button></div>` : ''}</div>` : ''}`;
  }
  // ---------- watchlist ----------
  function vWatch() {
    return `<div class="ph"><div><h1>Watchlist</h1><p>Traders you want an eye on. You get a ping when they trade, request a payout or buy another account.</p></div></div>
      <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Trader</th><th>Account</th><th>Why</th><th>Until</th><th>Added By</th><th>Ping Me</th><th></th></tr></thead><tbody>${WATCH.length ? WATCH.map((w, i) => `<tr><td class="nw"><button class="lnk" data-act="trader" data-id="${esc(w.who)}">${esc(w.who)}</button></td><td class="mono nw">${w.acct || '—'}</td><td>${esc(w.why)}</td><td class="nw">${w.until}</td><td class="nw hint">${esc(w.by)}</td><td><button class="sw ${w.ping ? 'on' : ''}" data-act="wPing" data-i="${i}" role="switch" aria-checked="${w.ping}" aria-label="Ping me"></button></td><td class="num"><button class="lnk" data-act="wDel" data-i="${i}">Remove</button></td></tr>`).join('') : '<tr><td colspan="7" class="empty">Nobody on the watchlist.</td></tr>'}</tbody></table></div></div>
      <p class="hint">Add traders from any account or trader profile. Entries end on their date unless renewed.</p>`;
  }
  // ---------- platform health ----------
  function vHealth() {
    const sw = (k, l, d) => `<div class="kill ${SWITCHES[k] ? 'on' : ''}"><div><b>${l}</b><div class="hint">${d}</div></div><button class="sw ${SWITCHES[k] ? 'on' : ''}" data-act="kill" data-k="${k}" role="switch" aria-checked="${SWITCHES[k]}" aria-label="${esc(l)}"></button></div>`;
    return `<div class="ph"><div><h1>Platform Health</h1><p>Whether the platforms, price feed and partners are working, and the switches to use when they aren't.</p></div></div>
      <div class="card"><div class="ch"><h3>Emergency Switches</h3><span class="lab">Each change is logged and announced to the team</span></div><div class="cb kills">${sw('trading', 'Pause New Trades Everywhere', 'Traders can close positions but not open new ones.')}${sw('freeze', 'Freeze Automatic Closures', 'Breaches during an outage go to review instead of closing the account.')}${sw('payouts', 'Pause Payouts', 'Approved payouts wait until this is off.')}${sw('sales', 'Pause New Sales', 'Checkout shows a short notice instead of taking payments.')}</div></div>
      <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Service</th><th>Type</th><th>Status</th><th class="num">Response</th><th>Last Activity</th><th>Note</th></tr></thead><tbody>${HEALTH.map((h) => `<tr><td class="nw"><b>${esc(h.n)}</b></td><td class="nw hint">${h.k}</td><td><span class="b ${h.st === 'ok' ? 'live' : h.st === 'slow' ? 'draft' : 'err'}">${h.st === 'ok' ? 'Working' : h.st === 'slow' ? 'Slow' : 'Down'}</span></td><td class="num ${h.lat > 300 ? 'warnt' : ''}">${h.lat} ms</td><td class="nw hint">${h.tick}</td><td class="hint nw">${esc(h.note || '—')}</td></tr>`).join('')}</tbody></table></div></div>
      <p class="hint">When a platform is slow or down, turn on Freeze Automatic Closures and send the Platform Issue Update email from ${XL('Emails', 'flow', 'Emails')}.</p>`;
  }
  // ---------- news ----------
  function vNews() {
    return `<div class="ph"><div><h1>News Calendar</h1><p>High-impact releases this week. No new trades 2 minutes either side; for the biggest ones you can require traders to be flat.</p></div><div class="act"><button class="pill" data-act="newsAdd">+ Add Event</button></div></div>
      <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Day</th><th>Time ET</th><th>Event</th><th>Markets</th><th>Impact</th><th class="num">Accounts in These Markets</th><th>Must Be Flat</th><th></th></tr></thead><tbody>${NEWS.map((n, i) => `<tr><td class="nw">${n.d}</td><td class="nw mono">${n.t}</td><td class="nw"><b>${esc(n.e)}</b></td><td class="hint nw">${esc(n.mk)}</td><td><span class="b ${n.imp === 'high' ? 'err' : n.imp === 'medium' ? 'draft' : 'plain'} plain">${n.imp === 'holiday' ? 'Market Hours' : n.imp === 'high' ? 'High' : 'Medium'}</span></td><td class="num">${n.imp === 'holiday' ? '—' : 6 + (i * 7) % 19}</td><td><button class="sw ${n.flat ? 'on' : ''}" data-act="newsFlat" data-i="${i}" role="switch" aria-checked="${n.flat}" aria-label="Must be flat"></button></td><td class="num nw">${n.warned ? '<span class="hint">Traders Told</span>' : `<button class="lnk" data-act="newsWarn" data-i="${i}">Email Traders</button>`}</td></tr>`).join('')}</tbody></table></div></div>
      <p class="hint">Events come from the economic calendar feed. Must Be Flat closes open positions 2 minutes before the release.</p>`;
  }
  // ---------- chargebacks ----------
  function vChargebacks() {
    const lab = { evidence: ['Needs Evidence', 'draft'], submitted: ['Submitted', 'sched'], won: ['Won', 'live'], lost: ['Lost', 'err'], accepted: ['Accepted', 'plain'] };
    const open = CHARGEBACKS.filter((c) => c.st === 'evidence');
    return `<div class="ph"><div><h1>Chargebacks</h1><p>Disputes from the card processor. Deadlines, early warnings and win rates are on the ${XL('Disputes', 'open', 'Disputes')} board.</p></div><div class="act">${XL('Disputes', 'open', 'Open Disputes Board', 'pill')}</div></div>
      <div class="tiles"><div class="tile"><span>Need Evidence</span><b class="${open.length ? 'warn' : ''}">${open.length}</b><small>${money(open.reduce((s, c) => s + c.amt, 0))} at stake</small></div><div class="tile"><span>Win Rate</span><b>${Math.round(CHARGEBACKS.filter((c) => c.st === 'won').length / Math.max(1, CHARGEBACKS.filter((c) => ['won', 'lost'].includes(c.st)).length) * 100)}%</b><small>Last 90 days</small></div><div class="tile"><span>Chargeback Rate</span><b>0.41%</b><small>Card networks flag above 1%</small></div><div class="tile"><span>After a Chargeback</span><b style="font-size:16px;margin:6px 0 4px">Close and Block</b><small>Account closed, card added to the Blocklist</small></div></div>
      <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Dispute</th><th>Trader</th><th>Order</th><th class="num">Amount</th><th>Reason</th><th>Answer By</th><th>Evidence</th><th>Status</th></tr></thead><tbody>${CHARGEBACKS.map((c) => { const n = Object.values(c.ev).filter(Boolean).length; return `<tr class="lk" data-act="cb" data-id="${c.id}"><td class="mono nw">${c.id}</td><td class="nw">${esc(c.trader)}</td><td class="mono nw">${c.order}</td><td class="num">${money(c.amt)}</td><td class="nw">${esc(c.reason)} <span class="hint">· ${c.code}</span></td><td class="nw ${c.st === 'evidence' ? 'warnt' : ''}">${c.due}</td><td class="nw">${n} of ${EVK.length}</td><td><span class="b ${lab[c.st][1]}">${lab[c.st][0]}</span></td></tr>`; }).join('')}</tbody></table></div></div>`;
  }
  function cbDrawer(id) {
    const c = CHARGEBACKS.find((x) => x.id === id);
    return { title: `${c.id} · ${money(c.amt)}`, body: `
      <div class="kv"><div><span>Trader</span><b><button class="lnk" data-act="trader" data-id="${esc(c.trader)}">${esc(c.trader)}</button></b></div><div><span>Order</span><b class="mono">${c.order}</b></div><div><span>Reason</span><b>${esc(c.reason)} · ${c.code}</b></div><div><span>Answer By</span><b>${c.due}</b></div></div>
      <div class="sec"><h4>Evidence Pack</h4>${EVK.map(([k, l, d]) => `<label class="chk evr"><input type="checkbox" ${c.ev[k] ? 'checked' : ''} data-cbev="${k}" ${c.st !== 'evidence' ? 'disabled' : ''}><span><b>${l}</b><span class="hint">${d}</span></span></label>`).join('')}</div>`,
      foot: c.st === 'evidence' ? `<button class="pill" data-act="cbDo" data-k="accept" data-id="${c.id}" style="margin-right:auto">Accept the Loss</button><button class="pill" data-act="cbDo" data-k="pack" data-id="${c.id}">Download Pack</button><button class="pill pri" data-act="cbDo" data-k="submit" data-id="${c.id}">Submit to Processor</button>` : '<button class="pill" data-act="closeDrw">Close</button>' };
  }
  // ---------- adjustments ----------
  function vAdjust() {
    return `<div class="ph"><div><h1>Balance Adjustments</h1><p>Corrections to an account balance, for example after a platform outage or a stale fill. Every adjustment needs two people.</p></div><div class="act"><button class="pill" data-act="newAdj">+ New Adjustment</button></div></div>
      <div class="card"><div class="tsc"><table class="t"><thead><tr><th>ID</th><th>Account</th><th>Trader</th><th class="num">Amount</th><th>Why</th><th>By</th><th>When</th><th>Status</th><th></th></tr></thead><tbody>${ADJ.map((a) => `<tr><td class="mono nw">${a.id}</td><td class="mono nw">${a.acct}</td><td class="nw">${esc(a.trader)}</td><td class="num nw ${a.amt < 0 ? 'dn' : 'up'}">${money(a.amt, 1)}</td><td class="sumc hint">${esc(a.why)}</td><td class="nw hint">${esc(a.by)}</td><td class="nw">${a.when}</td><td><span class="b ${a.st === 'done' ? 'live' : 'sched'}">${a.st === 'done' ? 'Applied' : 'Waiting for Second Reviewer'}</span></td><td class="num nw">${a.st === 'second' ? `<button class="lnk" data-act="adjOk" data-id="${a.id}">Approve as ${RV2}</button>` : ''}</td></tr>`).join('')}</tbody></table></div></div>
      <p class="hint">Adjustments change the balance used by the rules, not the trader's trade history. The trader sees them as a line on their dashboard.</p>`;
  }
  function adjDrawer() {
    const f = S.drawer.f;
    return { title: 'New Adjustment', body: `<div class="fl"><label>Account</label><select data-df="acct">${ACCTS.filter((a) => a.st !== 'Closed').map((a) => `<option value="${a.id}" ${f.acct === a.id ? 'selected' : ''}>${a.id} · ${esc(a.trader)}</option>`).join('')}</select></div><div class="fl"><label>Amount ($)</label><input type="number" value="${f.amt}" data-df="amt"><span class="hint">Use a minus sign to take money off.</span></div><div class="fl"><label>Why</label><textarea data-df="why" placeholder="What happened, with times. The trader sees a short version.">${esc(f.why)}</textarea></div>`,
      foot: '<button class="pill" data-act="closeDrw">Cancel</button><button class="pill pri" data-act="adjSave">Send for Second Approval</button>' };
  }
  // ---------- rule simulator ----------
  function vSim() {
    const f = S.sim || (S.sim = { size: 50000, daily: 1100, dd: 2500, target: 3000, cons: 40, days: 5 });
    const b = RULES[f.size]; const base = { pass: 11.4, breach: 412, payout: 18940, rev: 30390 };
    const ease = (b.dd ? (f.dd - b.dd) / b.dd : 0) * 0.9 + (f.daily - b.daily) / b.daily * 0.6 - (f.target - b.target) / b.target * 1.1 - (f.days - 5) * 0.04 + (f.cons - 40) / 100;
    const pass = Math.max(2, +(base.pass * (1 + ease)).toFixed(1)); const breach = Math.round(base.breach * (1 - ease * 0.8)); const payout = Math.round(base.payout * (pass / base.pass) * (1 + (f.cons - 40) / 200));
    const row = (l, a, c, fmt, good) => { const d = c - a; const better = good === 'up' ? d > 0 : d < 0; return `<tr><td><b>${l}</b></td><td class="num">${fmt(a)}</td><td class="num">${fmt(c)}</td><td class="num ${d === 0 ? '' : better ? 'up' : 'dn'}">${d === 0 ? '—' : (d > 0 ? '+' : '') + fmt(d).replace('$-', '−$')}</td></tr>`; };
    const inp = (k, l) => `<div class="fl"><label>${l}</label><input type="number" min="0" value="${f[k]}" data-bind="sim.${k}"></div>`;
    return `<div class="ph"><div><h1>Rule Simulator</h1><p>Change a rule and see what it would have done over the last 90 days of real trades, before you change it in the ${XL('Catalog', '', 'Checkout Catalog')}.</p></div></div>
      <div class="two wl2"><div class="card m0"><div class="ch"><h3>Rules to Try</h3><div class="r"><select data-bind="sim.size" aria-label="Account size">${Object.keys(RULES).map((s) => `<option value="${s}" ${+f.size === +s ? 'selected' : ''}>${K(+s)}</option>`).join('')}</select></div></div><div class="cb fg"><div class="fg2">${inp('daily', 'Daily Loss Limit ($)')}${inp('dd', 'Max Drawdown ($)')}${inp('target', 'Profit Target ($)')}${inp('days', 'Minimum Trading Days')}</div>${inp('cons', 'Consistency: Best Day Up To (%)')}<span class="hint">Now: daily ${money(b.daily)}, drawdown ${money(b.dd)}, target ${money(b.target)}, 5 days, 40%.</span><button class="pill sm" data-act="simReset" style="justify-self:start">Back to Current Rules</button></div></div>
      <div class="card m0"><div class="ch"><h3>What Would Have Happened</h3><span class="lab">Last 90 Days · ${K(+f.size)}</span></div><div class="tsc"><table class="t"><thead><tr><th></th><th class="num">Current</th><th class="num">With Changes</th><th class="num">Difference</th></tr></thead><tbody>${row('Pass Rate', base.pass, pass, (v) => v.toFixed(1) + '%', 'none')}${row('Breaches', base.breach, breach, (v) => String(Math.round(v)), 'down')}${row('Payouts', base.payout, payout, (v) => money(v), 'down')}${row('Payouts / Revenue', Math.round(base.payout / base.rev * 100), Math.round(payout / base.rev * 100), (v) => Math.round(v) + '%', 'down')}</tbody></table></div><div class="cb"><p class="hint" style="margin:0 0 12px">Easier rules raise the pass rate and payouts; revenue only changes if traders buy more because of it. Estimates from replaying past trades.</p><button class="pill sm" data-act="simSend">Send to Checkout Catalog as a Draft</button></div></div></div>`;
  }

  // ---------- global search ----------
  function searchResults(q) {
    q = q.toLowerCase(); if (q.length < 2) return [];
    const out = [];
    traders().filter((t) => t.name.toLowerCase().includes(q)).slice(0, 4).forEach((t) => out.push(['trader', t.name, 'Trader', `${t.accts.length} accounts`]));
    ACCTS.filter((a) => a.id.toLowerCase().includes(q)).slice(0, 4).forEach((a) => out.push(['acct', a.id, 'Account', a.trader]));
    ALERTS.filter((x) => (x.id + ATYPE[x.type]).toLowerCase().includes(q)).slice(0, 3).forEach((x) => out.push(['alert', x.id, 'Alert', ATYPE[x.type]]));
    PAYOUTS.filter((p) => p.id.toLowerCase().includes(q)).slice(0, 3).forEach((p) => out.push(['payout', p.id, 'Payout', money(p.amt)]));
    CASES.filter((c) => (c.id + c.title).toLowerCase().includes(q)).slice(0, 3).forEach((c) => out.push(['case', c.id, 'Case', c.title]));
    return out.slice(0, 9);
  }

  // ---------- ext events ----------
  function extDrawer(kind, id) { return kind === 'trader' ? traderDrawer(id) : kind === 'case' ? caseDrawer(id) : kind === 'cb' ? cbDrawer(id) : kind === 'adj' ? adjDrawer() : null; }
  function extClick(a, el) {
    const id = el.dataset.id, k = el.dataset.k, i = +el.dataset.i; const v = (sel) => { const x = root.querySelector(sel); return x ? x.value.trim() : ''; };
    switch (a) {
      case 'trader': S.drawer = { kind: 'trader', id }; S.gq = ''; return true;
      case 'case': S.drawer = { kind: 'case', id }; S.gq = ''; return true;
      case 'cb': S.drawer = { kind: 'cb', id }; return true;
      case 'tDo': {
        if (k === 'watch') { const j = WATCH.findIndex((w) => w.who === id); if (j >= 0) WATCH.splice(j, 1); else WATCH.unshift({ who: id, acct: (traders().find((t) => t.name === id) || { accts: [{}] }).accts[0].id, why: 'Added from the profile', until: 'Dec 22', by: ME, ping: true }); audit(ME, j >= 0 ? 'Removed from watchlist' : 'Added to watchlist', id); toast(j >= 0 ? 'Removed from the watchlist' : 'Watching. You get a ping on their next trade.'); return 'noRender'; }
        if (k === 'restrict') { TSTATE[id] = TSTATE[id] === 'Restricted' ? undefined : 'Restricted'; audit(ME, TSTATE[id] ? 'Purchases restricted' : 'Restriction lifted', id); toast(TSTATE[id] ? `${id} can't buy new accounts. Open accounts keep trading.` : 'Restriction lifted'); return 'noRender'; }
        if (k === 'ban') { if (TSTATE[id] === 'Banned') { TSTATE[id] = undefined; audit(ME, 'Ban lifted', id); toast('Ban lifted'); return 'noRender'; } TSTATE[id] = 'Banned'; BLOCKS.unshift({ k: 'Identity Document', v: `Document of ${id}`, why: 'Banned trader', by: ME, d: 'Nov 22' }); audit(ME, 'Trader banned', `${id} · waiting for ${RV2} to confirm`); toast(`${id} banned. Identity added to the Blocklist. ${RV2} is asked to confirm.`); return 'noRender'; }
        if (k === 'case') { const cid = 'CS-' + (89 + CASES.length - 3); CASES.unshift({ id: cid, title: `Review of ${id}`, st: 'open', owner: ME, opened: 'Nov 22', due: 'Nov 25', traders: [id], alerts: ALERTS.filter((x) => x.traders.includes(id)).map((x) => x.id), log: [['Just now', ME, 'Case opened from the trader profile.']], decision: '' }); audit(ME, 'Case opened', cid); S.drawer = { kind: 'case', id: cid }; return true; }
        return false; }
      case 'newCase': { const cid = 'CS-' + (89 + CASES.length - 3); CASES.unshift({ id: cid, title: '[New Case]', st: 'open', owner: ME, opened: 'Nov 22', due: 'Nov 25', traders: [], alerts: [], log: [['Just now', ME, 'Case opened.']], decision: '' }); S.drawer = { kind: 'case', id: cid }; return true; }
      case 'caseNote': { const t = v('#cnote'); if (!t) { toast('Write something first'); return 'noRender'; } CASES.find((c) => c.id === id).log.push(['Just now', ME, t]); return true; }
      case 'caseDecide': { const c = CASES.find((x) => x.id === id); const d = v('#cdec'); c.decision = d; c.log.push(['Just now', ME, 'Decision: ' + d]); if (/Close|Ban/.test(d)) { c.st = 'second'; toast(`Sent to ${RV2} to confirm`); } else { c.st = 'decided'; toast('Decision recorded'); } audit(ME, 'Case decision', `${c.id} · ${d}`); return true; }
      case 'caseConfirm': { const c = CASES.find((x) => x.id === id); c.st = 'decided'; c.log.push(['Just now', RV2, 'Confirmed the decision.']); audit(`${ME} and ${RV2}`, 'Case decided', `${c.id} · ${c.decision}`); toast('Confirmed and carried out'); return true; }
      case 'tMatch': S.tf.sel = S.tf.sel === i ? null : i; return true;
      case 'tAlert': { const sel = TRADES[S.tf.sel]; const ms = TRADES.filter((t) => t !== sel && t.s === sel.s && t.trader !== sel.trader && Math.abs(t.sec - sel.sec) <= S.tf.win); const nid = 'RK-' + (1183 + ALERTS.length - 12); ALERTS.unshift({ id: nid, type: 'copy', sev: 'high', st: 'new', when: 'Just now', ag: ME, accts: [...new Set([sel.acct, ...ms.map((t) => t.acct)])], traders: [...new Set([sel.trader, ...ms.map((t) => t.trader)])], sum: `Raised by hand from Trade Search: ${ms.length + 1} ${sel.s} trades within ${S.tf.win}s at ${hms(sel.sec)}.`, ev: { h: ['Time ET', 'Trader', 'Trade'], rows: [sel, ...ms].map((t) => [hms(t.sec), t.trader, `${t.side} ${t.q} ${t.s}`]) }, rec: 'Check whether these traders match on other days too.' }); audit(ME, 'Alert raised by hand', nid); toast(`${nid} raised`); return true; }
      case 'wPing': WATCH[i].ping = !WATCH[i].ping; return true;
      case 'wDel': { const w = WATCH.splice(i, 1)[0]; audit(ME, 'Removed from watchlist', w.who); return true; }
      case 'kill': { SWITCHES[k] = !SWITCHES[k]; const n = { trading: 'Pause New Trades Everywhere', freeze: 'Freeze Automatic Closures', payouts: 'Pause Payouts', sales: 'Pause New Sales' }[k]; audit(ME, `${n} ${SWITCHES[k] ? 'turned on' : 'turned off'}`, 'Emergency switch'); toast(`${n}: ${SWITCHES[k] ? 'on. The team has been told.' : 'off'}`); return 'noRender'; }
      case 'newsFlat': NEWS[i].flat = !NEWS[i].flat; audit(ME, 'News rule changed', `${NEWS[i].e} · must be flat ${NEWS[i].flat ? 'on' : 'off'}`); return true;
      case 'newsWarn': NEWS[i].warned = true; audit(ME, 'News email sent', NEWS[i].e); toast('High-Impact News email sent to traders in these markets'); return 'noRender';
      case 'newsAdd': NEWS.push({ d: 'Fri, Nov 27', t: '8:30 AM', e: '[New Event]', mk: 'All', imp: 'high', flat: false, warned: false }); toast('Event added. Edit it in the calendar feed settings.'); return 'noRender';
      case 'cbDo': { const c = CHARGEBACKS.find((x) => x.id === id); if (k === 'pack') { toast('Evidence pack downloaded as a PDF'); return 'noRender'; } if (k === 'accept') { c.st = 'accepted'; audit(ME, 'Chargeback accepted', `${c.id} · ${money(c.amt)}`); } else { const n = Object.values(c.ev).filter(Boolean).length; if (n < 3) { toast('Add at least 3 pieces of evidence'); return 'noRender'; } c.st = 'submitted'; audit(ME, 'Chargeback evidence submitted', `${c.id} · ${n} items`); } S.drawer = null; toast(c.st === 'submitted' ? 'Submitted. The processor decides in 30 to 75 days.' : 'Accepted. The card is on the Blocklist.'); return 'noRender'; }
      case 'newAdj': S.drawer = { kind: 'adj', f: { acct: ACCTS[0].id, amt: 0, why: '' } }; return true;
      case 'adjSave': { const f = S.drawer.f; if (!+f.amt || !f.why.trim()) { toast('Add an amount and a reason'); return 'noRender'; } const a = acct(f.acct); ADJ.unshift({ id: 'AJ-' + (62 + ADJ.length - 3), acct: f.acct, trader: a.trader, amt: +f.amt, why: f.why, st: 'second', by: ME, when: 'Just now' }); audit(ME, 'Adjustment requested', `${f.acct} · ${money(+f.amt, 1)}`); S.drawer = null; toast(`Sent to ${RV2} to approve`); return true; }
      case 'adjOk': { const x = ADJ.find((z) => z.id === id); x.st = 'done'; x.by = `${x.by} and ${RV2}`; const a = acct(x.acct); if (a) { a.bal += x.amt; a.total += x.amt; } audit(x.by, 'Adjustment applied', `${x.acct} · ${money(x.amt, 1)}`); toast('Applied. The trader sees it on their dashboard.'); return 'noRender'; }
      case 'simReset': { const b = RULES[S.sim.size]; S.sim = { size: S.sim.size, daily: b.daily, dd: b.dd, target: b.target, cons: 40, days: 5 }; return true; }
      case 'simSend': audit(ME, 'Rule change sent to the catalog', `${K(+S.sim.size)} · daily ${money(S.sim.daily)}, drawdown ${money(S.sim.dd)}, target ${money(S.sim.target)}`); toast('Draft rule set created in the Checkout Catalog. It needs approval there.'); return 'noRender';
      case 'watchAcct': { const ac = acct(id); if (!WATCH.some((w) => w.who === ac.trader)) WATCH.unshift({ who: ac.trader, acct: ac.id, why: 'Added from the account', until: 'Dec 22', by: ME, ping: true }); audit(ME, 'Added to watchlist', ac.trader); toast(`Watching ${ac.trader}`); return 'noRender'; }
      case 'bulk': { const ids = [...(S.bsel || [])]; ids.forEach((x) => { const ac = acct(x); if (!ac) return; if (k === 'pause') ac.st = 'Paused'; if (k === 'flatten') ac.open = 0; if (k === 'watch' && !WATCH.some((w) => w.who === ac.trader)) WATCH.unshift({ who: ac.trader, acct: ac.id, why: 'Added in bulk', until: 'Dec 22', by: ME, ping: true }); }); audit(ME, { pause: 'Trading paused', flatten: 'Positions flattened', watch: 'Added to watchlist' }[k], `${ids.length} accounts`); S.bsel = new Set(); toast(`${ids.length} accounts updated`); return true; }
      case 'bclear': S.bsel = new Set(); return true;
      case 'gopen': { const [kind, oid] = [el.dataset.k, id]; S.gq = ''; S.drawer = { kind, id: oid }; return true; }
      default: return false;
    }
  }
  function extChange(el) {
    const b = el.dataset.bind;
    if (el.dataset.cbev) { const c = CHARGEBACKS.find((x) => x.id === S.drawer.id); c.ev[el.dataset.cbev] = el.checked; return true; }
    if (el.dataset.bsel) { S.bsel = S.bsel || new Set(); if (el.checked) S.bsel.add(el.dataset.bsel); else S.bsel.delete(el.dataset.bsel); return true; }
    if (!b) return false;
    if (b.startsWith('tf.')) { S.tf[b.slice(3)] = el.value; if (b === 'tf.win') S.tf.win = +el.value; return true; }
    if (b.startsWith('sim.')) { S.sim[b.slice(4)] = +el.value; if (b === 'sim.size') { const R0 = RULES[+el.value]; Object.assign(S.sim, { daily: R0.daily, dd: R0.dd, target: R0.target }); } return true; }
    return false;
  }
  // =================== plan profitability ===================
  const PI = (() => {
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
    const c = Object.assign({}, z, over || {}); const k = IS.range / 90;
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

  const IS = { view: 'overview', range: 90, plan: 'pb', size: 150000, toast: '', lab: null, drawer: null };
  const curPlan = () => PLANS.find((p) => p.id === IS.plan); const curSize = () => curPlan().sizes.find((z) => z.size === IS.size) || curPlan().sizes[0];

  const rangeSeg = () => `<div class="seg">${[[30, '30 Days'], [90, '90 Days'], [365, '12 Months']].map(([d, l]) => `<button class="${IS.range === d ? 'on' : ''}" data-act="piRange" data-k="${d}">${l}</button>`).join('')}</div>`;

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
    return `<div class="ph"><div><h1>Plan Profitability</h1><p>Which plans and sizes make money once payouts, fees, refunds, chargebacks and discounts are counted. Sample numbers.</p></div><div class="act">${rangeSeg()}</div></div>
      <div class="tiles t6"><div class="tile"><span>Revenue</span><b>${kmoney(T.revenue)}</b><small>After refunds and chargebacks</small></div><div class="tile"><span>Payouts to Traders</span><b>${kmoney(T.payouts)}</b><small>${pct(T.payRatio)} of revenue</small></div><div class="tile"><span>Costs</span><b>${kmoney(T.costs)}</b><small>Fees, platforms, data, checks</small></div><div class="tile"><span>Profit</span><b class="${T.profit < 0 ? 'dn' : 'up'}">${kmoney(T.profit)}</b><small>${pct(T.margin)} margin</small></div><div class="tile"><span>Evaluations Sold</span><b>${Math.round(T.sold).toLocaleString('en-US')}</b><small>${money(T.profit / T.sold)} profit each</small></div><div class="tile"><span>Reached a Payout</span><b>${pct(T.paidN / T.sold, 1)}</b><small>Of evaluations sold</small></div></div>
      <div class="two wl"><div class="card m0"><div class="ch"><h3>By Plan</h3><span class="lab"><i class="lgd lr"></i>Revenue <i class="lgd lp"></i>Payouts <i class="lgd lc"></i>Costs</span></div><div class="cb fg">${ps.map(({ p, t }) => `<button class="pbar" data-act="piOpenPlan" data-id="${p.id}"><div class="pbh"><b>${esc(p.name)}</b><span class="hint">${p.billing}</span><span class="b ${health(t.margin)[1]}">${health(t.margin)[0]}</span><b class="${t.profit < 0 ? 'dn' : 'up'}">${kmoney(t.profit)}</b></div><div class="stk" title="Revenue ${kmoney(t.revenue)}"><i class="r" style="width:${t.revenue / mx * 100}%"></i></div><div class="stk"><i class="p" style="width:${t.payouts / mx * 100}%"></i><i class="c" style="width:${t.costs / mx * 100}%"></i></div><div class="pbf"><span>Revenue ${kmoney(t.revenue)}</span><span>Payouts ${kmoney(t.payouts)} · Costs ${kmoney(t.costs)}</span><span>${pct(t.margin)} margin</span></div></button>`).join('')}</div></div>
      <div class="card m0"><div class="ch"><h3>What Stands Out</h3></div><div class="cb fd">${findings().map(([k, h, d, c]) => `<div class="fnd ${k}"><i></i><div><b>${esc(h)}</b><p>${esc(d)}</p>${c ? `<div class="edact"><button class="lnk" data-act="piOpenCell" data-id="${c.p.id}" data-k="${c.z.size}">See the Numbers</button>${c.e.margin < 0.1 ? `<button class="lnk" data-act="piToLab" data-id="${c.p.id}" data-k="${c.z.size}">Try a Fix in the Price Lab</button>` : ''}</div>` : ''}</div></div>`).join('')}</div></div></div>
      <div class="card" style="margin-top:14px"><div class="ch"><h3>Every Plan and Size</h3><span class="lab">Sorted by profit per evaluation sold</span></div><div class="tsc">${cellTable(cells().sort((a, b) => b.e.perSold - a.e.perSold))}</div></div>`;
  }
  function cellTable(list) {
    return `<table class="t"><thead><tr><th>Plan</th><th>Size</th><th class="num">Sold</th><th class="num">Revenue</th><th class="num">Payouts</th><th class="num">Costs</th><th class="num">Profit</th><th class="num">Margin</th><th class="num">Profit per Sale</th><th class="num">Payouts / Revenue</th><th>Health</th></tr></thead><tbody>${list.map(({ p, z, e }) => `<tr class="lk" data-act="piOpenCell" data-id="${p.id}" data-k="${z.size}"><td class="nw"><b>${esc(p.name)}</b></td><td class="nw">${K(z.size)}</td><td class="num">${Math.round(e.sold)}</td><td class="num">${kmoney(e.revenue)}</td><td class="num">${kmoney(e.payouts)}</td><td class="num">${kmoney(e.costs)}</td><td class="num nw ${e.profit < 0 ? 'dn' : 'up'}"><b>${kmoney(e.profit)}</b></td><td class="num">${pct(e.margin)}</td><td class="num nw ${e.perSold < 0 ? 'dn' : ''}">${money(e.perSold)}</td><td class="num ${e.payRatio > 0.6 ? 'warnt' : ''}">${pct(e.payRatio)}</td><td><span class="b ${health(e.margin)[1]}">${health(e.margin)[0]}</span></td></tr>`).join('')}</tbody></table>`;
  }
  // ---------- matrix ----------
  function vMatrix() {
    const sizes = [25000, 50000, 100000, 150000]; const metric = IS.metric || 'margin';
    const val = (e) => metric === 'margin' ? pct(e.margin) : metric === 'per' ? money(e.perSold) : metric === 'pay' ? pct(e.payRatio) : pct(e.paidN / e.sold, 1);
    return `<div class="ph"><div><h1>Plans and Sizes</h1><p>Every size of every plan side by side. Green makes money, amber is thin, red loses money. Click a cell for the full breakdown.</p></div><div class="act">${rangeSeg()}</div></div>
      <div class="card"><div class="ch"><h3>Heat Map</h3><div class="r"><div class="seg">${[['margin', 'Margin'], ['per', 'Profit per Sale'], ['pay', 'Payouts / Revenue'], ['reach', 'Reached a Payout']].map(([k, l]) => `<button class="${metric === k ? 'on' : ''}" data-act="piMetric" data-k="${k}">${l}</button>`).join('')}</div></div></div>
      <div class="cb tsc"><table class="hmap"><thead><tr><th></th>${sizes.map((s) => `<th>${K(s)}</th>`).join('')}<th>Whole Plan</th></tr></thead><tbody>${PLANS.map((p) => { const t = planTotal(p); return `<tr><th><b>${esc(p.name)}</b><span class="hint">${p.billing}</span></th>${sizes.map((s) => { const z = p.sizes.find((x) => x.size === s); if (!z) return '<td><div class="hc na">Not Sold</div></td>'; const e = econ(p, z); return `<td><button class="hc" style="background:${mcol(e.margin)}" data-act="piOpenCell" data-id="${p.id}" data-k="${s}"><b>${val(e)}</b><span>${kmoney(e.profit)} profit · ${Math.round(e.sold)} sold</span></button></td>`; }).join('')}<td><div class="hc tot" style="background:${mcol(t.margin)}"><b>${metric === 'margin' ? pct(t.margin) : metric === 'per' ? money(t.perSold) : metric === 'pay' ? pct(t.payRatio) : pct(t.paidN / t.sold, 1)}</b><span>${kmoney(t.profit)} profit</span></div></td></tr>`; }).join('')}</tbody></table></div></div>
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
    return `<div class="ph"><div><h1>${esc(p.name)} ${K(z.size)}</h1><p>${p.billing}${p.billing === 'Monthly' ? `, ${z.months} months paid on average` : ''} · list price ${money(z.price)} · average discount ${pct(z.disc)} · rule set from the Checkout Catalog.</p></div><div class="act"><select data-bind="pi.plan" aria-label="Plan">${PLANS.map((x) => `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select><div class="seg">${p.sizes.map((x) => `<button class="${x.size === z.size ? 'on' : ''}" data-act="piSize" data-k="${x.size}">${K(x.size)}</button>`).join('')}</div></div></div>
      <div class="tiles t6"><div class="tile"><span>Profit</span><b class="${e.profit < 0 ? 'dn' : 'up'}">${kmoney(e.profit)}</b><small><span class="b ${health(e.margin)[1]} plain">${health(e.margin)[0]}</span></small></div><div class="tile"><span>Margin</span><b>${pct(e.margin)}</b><small>Profit / revenue</small></div><div class="tile"><span>Profit per Sale</span><b class="${e.perSold < 0 ? 'dn' : ''}">${money(e.perSold)}</b><small>Each evaluation sold</small></div><div class="tile"><span>Payouts / Revenue</span><b class="${e.payRatio > 0.6 ? 'warnt' : ''}">${pct(e.payRatio)}</b><small>Target under 55%</small></div><div class="tile"><span>Average Payout</span><b>${money(z.avgPay)}</b><small>Per trader who got paid</small></div><div class="tile"><span>Break-Even Price</span><b>${money(breakEven(p, z))}</b><small>List price ${money(z.price)}</small></div></div>
      <div class="two"><div class="card m0"><div class="ch"><h3>From Sale to Payout</h3><span class="lab">${IS.range === 365 ? '12 Months' : IS.range + ' Days'}</span></div><div class="cb fg">${fun.map(([l, v], i) => `<div><div class="rowl"><span>${l}</span><b>${Math.round(v).toLocaleString('en-US')}${i ? ` <em>${pct(v / f0, 1)}</em>` : ''}</b></div><div class="split"><i style="width:${Math.max(1.5, v / f0 * 100)}%"></i></div></div>`).join('')}<p class="hint" style="margin:4px 0 0">Pass rate ${pct(z.pass, 1)} · ${pct(z.funded)} of passed traders get funded · ${pct(z.paid)} of funded traders reach a payout.</p></div></div>
      <div class="card m0"><div class="ch"><h3>Revenue and Spend by Month</h3><span class="lab"><i class="lgd lr"></i>Revenue <i class="lgd lp"></i>Payouts and Costs</span></div><div class="cb"><div class="wbars">${tr.map(([m, a, b]) => `<div class="wb"><div class="wbb"><i style="height:${a / tmx * 100}%"></i><i class="p" style="height:${b / tmx * 100}%"></i></div><span>${m}</span><small class="${b > a ? 'dn' : ''}">${b > a ? '−' : '+'}${kmoney(Math.abs(a - b)).replace('−', '')}</small></div>`).join('')}</div></div></div></div>
      <div class="card" style="margin-top:14px"><div class="ch"><h3>Where Each Dollar Goes</h3><span class="lab">Totals and per evaluation sold</span></div><div class="cb"><div class="wf">${water.map(([l, v, k]) => `<div class="wfr"><span>${l}</span><div class="wfb"><i class="${k}" style="width:${Math.abs(v) / wmx * 100}%"></i></div><b class="${v < 0 ? 'dn' : ''}">${money(v, 1)}</b><em>${per(v)}</em></div>`).join('')}<div class="wfr tot"><span>Profit</span><div class="wfb"></div><b class="${e.profit < 0 ? 'dn' : 'up'}">${money(e.profit, 1)}</b><em>${per(e.profit)}</em></div></div></div></div>
      <div class="edact"><button class="pill" data-act="piToLab" data-id="${p.id}" data-k="${z.size}">Try Changes in the Price Lab</button></div>`;
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
    const k = IS.range / 90; const resetRev = cells().reduce((s, c) => s + c.e.resetRev, 0);
    return `<div class="ph"><div><h1>Add-Ons and Resets</h1><p>What each extra brings in, and what it costs later in payouts. An add-on that sells well can still lose money.</p></div><div class="act">${rangeSeg()}</div></div>
      <div class="tiles"><div class="tile"><span>Reset Revenue</span><b>${kmoney(resetRev)}</b><small>${pct(resetRev / allTotal().revenue)} of all revenue</small></div><div class="tile"><span>Resets per Evaluation</span><b>0.38</b><small>Average across plans</small></div><div class="tile"><span>Add-On Revenue</span><b>${kmoney(18560 * k)}</b><small>All add-ons</small></div><div class="tile"><span>Add-On Attach Rate</span><b>29%</b><small>Orders with at least one</small></div></div>
      <div class="card"><div class="ch"><h3>Add-Ons</h3><span class="lab">Revenue minus the extra payouts and fees they cause</span></div><div class="tsc"><table class="t"><thead><tr><th>Add-On</th><th class="num">Bought With</th><th class="num">Average Price</th><th class="num">Revenue</th><th class="num">Extra Payouts per Sale</th><th class="num">Net per Sale</th><th>Verdict</th><th>Why</th></tr></thead><tbody>${A.map(([n, att, avg, rev, netPer, why]) => { const extra = avg - netPer - avg * 0.06; return `<tr><td class="nw"><b>${n}</b></td><td class="num">${pct(att)}</td><td class="num">${money(avg)}</td><td class="num">${kmoney(rev * k)}</td><td class="num">${money(extra)}</td><td class="num nw ${netPer < 0 ? 'dn' : 'up'}"><b>${money(netPer, 1)}</b></td><td><span class="b ${netPer < 0 ? 'err' : 'live'}">${netPer < 0 ? 'Costs Money' : 'Pays Off'}</span></td><td class="hint why">${why}</td></tr>`; }).join('')}</tbody></table></div></div>
      <div class="card"><div class="ch"><h3>Resets by Plan and Size</h3></div><div class="tsc"><table class="t"><thead><tr><th>Plan</th><th>Size</th><th class="num">Reset Price</th><th class="num">Resets per Evaluation</th><th class="num">Reset Revenue</th><th class="num">Share of Size Revenue</th></tr></thead><tbody>${cells().map(({ p, z, e }) => `<tr><td class="nw"><b>${esc(p.name)}</b></td><td>${K(z.size)}</td><td class="num">${money(z.resetP)}</td><td class="num">${z.resets.toFixed(2)}</td><td class="num">${kmoney(e.resetRev)}</td><td class="num">${pct(e.resetRev / e.revenue)}</td></tr>`).join('')}</tbody></table></div></div>
      <p class="hint">Add-on effects are estimated by comparing traders who bought each add-on with similar traders who didn't. Sample numbers.</p>`;
  }
  // ---------- promotions ----------
  function vPromos() {
    const k = IS.range / 90;
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
      <div class="two wl"><div class="card m0"><div class="ch"><h3>Costs</h3><div class="r"><button class="lnk" data-act="piCostReset">Reset to Defaults</button></div></div><div class="cb"><div class="fg2">${Object.entries(COST_LABELS).map(([k, [l, h]]) => `<div class="fl"><label>${l}</label><input type="number" min="0" step="0.1" value="${COST[k]}" data-bind="pi.cost.${k}"><span class="hint">${h}</span></div>`).join('')}</div></div></div>
      <div class="card m0"><div class="ch"><h3>Where the Money Went</h3><span class="lab">${IS.range === 365 ? '12 Months' : IS.range + ' Days'}</span></div><div class="cb">${[['Payouts to Traders', T.payouts], ['Platform Fees', T.platform], ['Card Processing', T.proc], ['Refunds', T.refunds], ['Affiliate Commission', T.aff], ['Market Data', T.data], ['Chargebacks', T.cbs + T.cbFees], ['Identity Checks', T.kyc]].map(([l, v]) => `<div class="cbr"><div class="rowl"><span>${l}</span><b>${kmoney(v)} <em>${pct(v / T.gross, 1)}</em></b></div><div class="split"><i style="width:${v / T.gross * 100}%"></i></div></div>`).join('')}<div class="kv" style="margin-top:12px"><div><span>Gross Revenue</span><b>${kmoney(T.gross)}</b></div><div><span>Profit</span><b class="${T.profit < 0 ? 'dn' : 'up'}">${kmoney(T.profit)} · ${pct(T.margin)}</b></div></div></div></div></div>`;
  }
  // ---------- price lab ----------
  function vLab() {
    const p = curPlan(), z = curSize(); const L = IS.lab && IS.lab.key === p.id + z.size ? IS.lab : (IS.lab = { key: p.id + z.size, price: z.price, disc: Math.round(z.disc * 100), act: z.act || 0, split: 90, resetP: z.resetP, pass: +(z.pass * 100).toFixed(1) });
    const cur = econ(p, z); const nw = econ(p, z, { price: +L.price, disc: +L.disc / 100, act: +L.act, split: +L.split, resetP: +L.resetP, pass: +L.pass / 100, sold: z.sold * Math.pow(z.price / Math.max(1, +L.price), 0.8) });
    const inp = (k, l, h) => `<div class="fl"><label>${l}</label><input type="number" min="0" step="any" value="${L[k]}" data-bind="pi.lab.${k}">${h ? `<span class="hint">${h}</span>` : ''}</div>`;
    const row = (l, a, b, f, goodUp) => { const d = b - a; const good = goodUp ? d > 0 : d < 0; return `<tr><td><b>${l}</b></td><td class="num">${f(a)}</td><td class="num">${f(b)}</td><td class="num ${Math.abs(d) < 1e-9 ? '' : good ? 'up' : 'dn'}">${Math.abs(d) < 1e-9 ? '—' : (d > 0 ? '+' : '−') + f(Math.abs(d))}</td></tr>`; };
    return `<div class="ph"><div><h1>Price Lab</h1><p>Try a new price, discount, split or fee for one size and see the profit before changing anything. Higher prices sell a little less; the model accounts for that.</p></div><div class="act"><select data-bind="pi.plan" aria-label="Plan">${PLANS.map((x) => `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select><div class="seg">${p.sizes.map((x) => `<button class="${x.size === z.size ? 'on' : ''}" data-act="piSize" data-k="${x.size}">${K(x.size)}</button>`).join('')}</div></div></div>
      <div class="two wl2"><div class="card m0"><div class="ch"><h3>Try</h3><div class="r"><button class="lnk" data-act="piLabReset">Back to Current</button></div></div><div class="cb fg"><div class="fg2">${inp('price', 'List Price ($)', `Now ${money(z.price)} · break-even ${money(breakEven(p, z))}`)}${inp('disc', 'Average Discount (%)', `Now ${pct(z.disc)}`)}${inp('split', 'Profit Split (%)', 'Now 90%')}${inp('act', 'Activation Fee ($)', `Now ${money(z.act || 0)}`)}${inp('resetP', 'Reset Price ($)', `Now ${money(z.resetP)}`)}${inp('pass', 'Pass Rate (%)', 'Change it to test stricter or easier rules')}</div></div></div>
      <div class="card m0"><div class="ch"><h3>${esc(p.name)} ${K(z.size)}</h3><span class="lab">${IS.range === 365 ? '12 Months' : IS.range + ' Days'}</span></div><div class="tsc"><table class="t"><thead><tr><th></th><th class="num">Now</th><th class="num">With Changes</th><th class="num">Difference</th></tr></thead><tbody>${row('Evaluations Sold', cur.sold, nw.sold, (v) => Math.round(v).toLocaleString('en-US'), true)}${row('Revenue', cur.revenue, nw.revenue, kmoney, true)}${row('Payouts', cur.payouts, nw.payouts, kmoney, false)}${row('Costs', cur.costs, nw.costs, kmoney, false)}${row('Profit', cur.profit, nw.profit, kmoney, true)}${row('Margin', cur.margin * 100, nw.margin * 100, (v) => v.toFixed(0) + '%', true)}${row('Profit per Sale', cur.perSold, nw.perSold, money, true)}</tbody></table></div><div class="cb"><span class="b ${health(nw.margin)[1]}">${health(nw.margin)[0]}</span><div class="edact" style="margin-top:12px"><button class="pill sm" data-act="piLabSend">Send to Checkout Catalog as a Draft</button></div></div></div></div>`;
  }


  function click(a, el) {
    const k = el.dataset.k, id = el.dataset.id;
    switch (a) {
      case 'piRange': IS.range = +k; return true;
      case 'piMetric': IS.metric = k; return true;
      case 'piOpenPlan': IS.plan = id; IS.size = PLANS.find((p) => p.id === id).sizes[0].size; S.view = 'pi_detail'; return true;
      case 'piOpenCell': IS.plan = id; IS.size = +k; S.view = 'pi_detail'; { const m = root.querySelector('.main'); if (m) m.scrollTop = 0; } return true;
      case 'piToLab': IS.plan = id; IS.size = +k; S.view = 'pi_lab'; return true;
      case 'piSize': IS.size = +k; return true;
      case 'piLabReset': IS.lab = null; return true;
      case 'piLabSend': { const p = curPlan(), z = curSize(); toast(`Draft price for ${p.name} ${K(z.size)} sent to the Checkout Catalog. It needs approval there.`); return 'noRender'; }
      case 'piCostReset': Object.assign(COST, { proc: 4.2, procFix: 0.3, platEval: 7, platFunded: 85, data: 3.5, kyc: 1.9, affShare: 34, affRate: 15, cbFee: 25 }); toast('Costs reset'); return 'noRender';
      default: return false;
    }
  }
  function change(el) {
    const b = el.dataset.bind; if (!b || !b.startsWith('pi.')) return false;
    if (b === 'pi.plan') { IS.plan = el.value; IS.size = curPlan().sizes.some((z) => z.size === IS.size) ? IS.size : curPlan().sizes[0].size; }
    else if (b.startsWith('pi.cost.')) COST[b.slice(8)] = +el.value || 0;
    else if (b.startsWith('pi.lab.')) IS.lab[b.slice(7)] = el.value;
    return true;
  }
  return { views: { pi_overview: vOverview, pi_matrix: vMatrix, pi_detail: vDetail, pi_cohorts: vCohorts, pi_addons: vAddons, pi_promos: vPromos, pi_costs: vCosts, pi_lab: vLab }, click, change, losing: () => cells().filter((c) => c.e.margin < 0).length, thin: () => cells().filter((c) => c.e.margin < 0.1).length, total: allTotal };
  })();

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const XL = (board, hash, label, cls) => `<a class="${cls || 'lnk'}" href="Admin${board}.dc.html${hash ? '#' + hash : ''}">${label}</a>`;
  const money = (v, sign) => (v < 0 ? '−' : sign && v > 0 ? '+' : '') + '$' + Math.abs(Math.round(v)).toLocaleString('en-US');
  const K = (n) => '$' + n / 1000 + 'K';
  const S = { view: 'desk', drawer: null, acf: 'all', acs: 'risk', acq: '', alf: 'open', alt: 'all', pof: 'review', range: 30, toast: '', focus: null,
    set: { closeWhen: 'instant', twoClose: true, twoReinstate: true, payoutTwo: 5000, dailyCap: 50000, autoFlatten: true, feed: 'Exchange data via [Data Vendor]', slack: true, email: true, sla: '24', newsList: 'CPI, NFP, FOMC, EIA Crude, GDP, PCE' } };
  const audit = (who, what, detail) => AUDIT.unshift(['Just now', who, what, detail]);
  const meter = (p) => { const c = p >= 85 ? 'var(--no)' : p >= 60 ? 'var(--wa)' : 'var(--sky)'; return `<div class="mtw"><div class="mt"><i style="width:${Math.min(100, p)}%;background:${c}"></i></div><span>${Math.round(p)}%</span></div>`; };
  const acct = (id) => ACCTS.find((a) => a.id === id);
  const openAlerts = () => ALERTS.filter((x) => ['new', 'investigating'].includes(x.st));
  const live = () => ACCTS.filter((a) => a.st !== 'Closed');
  const near = () => live().filter((a) => Math.max(dailyUsed(a), ddUsed(a)) >= 70);
  const liability = () => Math.round(ACCTS.filter((a) => a.funded && a.st !== 'Closed' && a.total > 0).reduce((s, a) => s + a.total * 0.9, 0));
  const ALST = { new: ['New', 'sched'], investigating: ['Investigating', 'draft'], confirmed: ['Confirmed', 'err'], dismissed: ['Dismissed', 'plain'], second: ['Waiting for Second Reviewer', 'sched'] };
  const POST = { review: ['To Review', 'sched'], hold: ['On Hold', 'draft'], second: ['Waiting for Second Approver', 'sched'], approved: ['Approved', 'live'], denied: ['Denied', 'err'] };

  // ---------- nav ----------
  const pend = (n) => n || null;
  const AREAS = [
    { h: 'Daily Work' },
    { id: 'desk', n: 'Risk Desk', tabs: [['desk', 'Risk Desk']] },
    { id: 'acc', n: 'Accounts', bad: false, b: () => near().length || null, tabs: [['accounts', 'Live Accounts'], ['watch', 'Watchlist', () => WATCH.length], ['traders', 'Trader Profiles']] },
    { id: 'inv', n: 'Investigations', bad: true, b: () => pend(openAlerts().length), tabs: [['alerts', 'Alerts', () => openAlerts().length], ['cases', 'Cases', () => CASES.filter((c) => c.st !== 'decided').length], ['links', 'Linked Accounts', () => CLUSTERS.filter((c) => c.st === 'open').length], ['trades', 'Trade Search']] },
    { id: 'brk', n: 'Breaches', b: () => pend(BREACHES.filter((x) => x[0].startsWith('Today')).length), tabs: [['breaches', 'Breaches']] },
    { id: 'pay', n: 'Payouts', b: () => pend(PAYOUTS.filter((p) => ['review', 'hold', 'second'].includes(p.st)).length + CHARGEBACKS.filter((c) => c.st === 'evidence').length + ADJ.filter((x) => x.st === 'second').length), tabs: [['payouts', 'Payout Reviews', () => PAYOUTS.filter((p) => ['review', 'hold', 'second'].includes(p.st)).length], ['chargebacks', 'Chargebacks', () => CHARGEBACKS.filter((c) => c.st === 'evidence').length], ['adjust', 'Balance Adjustments', () => pend(ADJ.filter((x) => x.st === 'second').length)]] },
    { h: 'Business' },
    { id: 'prof', n: 'Profitability', bad: true, b: () => PI.thin() || null, tabs: [['pi_overview', 'Overview'], ['pi_matrix', 'Plans and Sizes'], ['pi_detail', 'Plan Detail'], ['pi_cohorts', 'Cohorts'], ['pi_addons', 'Add-Ons and Resets'], ['pi_promos', 'Discounts and Affiliates'], ['pi_lab', 'Price Lab'], ['pi_costs', 'Cost Assumptions']] },
    { id: 'exp', n: 'Exposure', tabs: [['exposure', 'Exposure and Liability'], ['sim', 'Rule Simulator']] },
    { id: 'mkt', n: 'Market', bad: true, b: () => pend(HEALTH.filter((h) => h.st !== 'ok').length), tabs: [['health', 'Platform Health', () => pend(HEALTH.filter((h) => h.st !== 'ok').length)], ['news', 'News Calendar']] },
    { h: 'Setup' },
    { id: 'rules', n: 'Rules', tabs: [['detect', 'Detection Rules', () => DETECTORS.filter((d) => d.on).length], ['blocks', 'Blocklist', () => BLOCKS.length]] },
    { id: 'aud', n: 'Audit Log', tabs: [['audit', 'Audit Log']] },
    { id: 'set', n: 'Settings', tabs: [['settings', 'Settings']] }];
  const areaOf = (v) => AREAS.find((x) => x.tabs && x.tabs.some((t) => t[0] === v)) || AREAS[1];
  const lastTab = {};
  const navHtml = () => { const cur = areaOf(S.view); return AREAS.map((x) => { if (x.h) return `<h6>${x.h}</h6>`; const c = x.b && x.b(); return `<button class="ni ${cur === x ? 'on' : ''}" data-act="area" data-k="${x.id}">${x.n}${c != null ? `<i class="${x.bad && c ? 'bad' : ''}">${c}</i>` : ''}</button>`; }).join(''); };
  const mnavHtml = () => { const cur = areaOf(S.view); let o = ''; let open = false; AREAS.forEach((x) => { if (x.h) { if (open) o += '</optgroup>'; o += `<optgroup label="${x.h}">`; open = true; } else { const c = x.b && x.b(); o += `<option value="a:${x.id}" ${cur === x ? 'selected' : ''}>${x.n}${c != null ? ' (' + c + ')' : ''}</option>`; } }); return o + '</optgroup>'; };
  const subtabs = () => { const x = areaOf(S.view); lastTab[x.id] = S.view; if (x.tabs.length < 2) return ''; return `<div class="subt" role="tablist" aria-label="${x.n}">${x.tabs.map((t) => { const c = t[2] && t[2](); return `<button role="tab" aria-selected="${S.view === t[0]}" class="${S.view === t[0] ? 'on' : ''}" data-act="go" data-v="${t[0]}">${t[1]}${c != null ? `<i>${c}</i>` : ''}</button>`; }).join('')}</div>`; };

  // ---------- desk ----------
  const vb2 = (items) => { const mx = Math.max(...items.map((x) => x[1])); return `<div class="vzvb" style="height:170px">${items.map((x) => `<div title="${x[0]}: ${x[1]} breaches"><div class="vzvbb"><i style="height:${x[1] / mx * 100}%"></i></div><span>${x[0]}</span></div>`).join('')}</div>`; };
  function vDesk() {
    const top = live().slice().sort((a, b) => Math.max(dailyUsed(b), ddUsed(b)) - Math.max(dailyUsed(a), ddUsed(a))).slice(0, 8);
    const byRule = {}; BREACHES.forEach((b) => { byRule[b[3]] = (byRule[b[3]] || 0) + 1; }); const mx = Math.max(...Object.values(byRule));
    return `<div class="ph"><div><h1>Risk Desk</h1><p>Every account, alert and payout that needs a person right now. Accounts are checked against their rules on every price tick.</p></div></div>
      <div class="tkr" aria-label="Live profit and loss today"><div class="tkrt">${[0, 1].map(() => live().slice(0, 22).map((a) => `<button class="tki" data-act="acct" data-id="${a.id}"><span class="mono">${a.id}</span><b>${esc(a.trader)}</b><em class="${a.today >= 0 ? 'up' : 'dn'}">${a.today >= 0 ? '+' : '−'}${money(Math.abs(a.today))}</em></button>`).join('')).join('')}</div></div>
      <div class="tiles t7">${[['Active Evaluations', live().filter((a) => !a.funded).length, 'accounts'], ['Funded Accounts', live().filter((a) => a.funded).length, 'accounts'], ['Near a Limit', near().length, 'accounts', 'warn', '70% or more of a limit used'], ['Breaches Today', BREACHES.filter((b) => b[0].startsWith('Today')).length, 'breaches'], ['Open Alerts', openAlerts().length, 'alerts', 'bad'], ['Payouts to Review', PAYOUTS.filter((p) => ['review', 'hold', 'second'].includes(p.st)).length, 'payouts'], ['Profit Owed', money(liability()), 'exposure', '', 'Funded profit at split']].map(([l, v, go, c, s]) => `<button class="tile lk" data-act="go" data-v="${go}"><span>${l}</span><b class="${c || ''}">${v}</b><small>${s || 'Open'}</small></button>`).join('')}</div>
      <div class="card" style="margin-bottom:14px"><div class="ch"><h3>Danger Zone</h3><span class="lab">The four accounts closest to closing</span></div><div class="cb"><div class="gauges">${top.slice(0, 4).map((a) => { const d = dailyUsed(a), w = ddUsed(a); const u = Math.max(d, w); return `<button class="gzb" data-act="acct" data-id="${a.id}">${VZ.gauge(u, Math.round(u) + '%', (d >= w ? 'Daily loss' : 'Drawdown') + ' used', { warn: 70, bad: 85 })}<b>${esc(a.trader)}</b><span class="mono">${a.id}</span></button>`; }).join('')}</div></div></div><div class="two wl"><div class="card m0"><div class="ch"><h3>Closest to a Limit</h3><span class="lab">Live</span><div class="r"><button class="lnk" data-act="go" data-v="accounts">All Accounts</button></div></div><div class="tsc"><table class="t"><thead><tr><th>Account</th><th>Trader</th><th>Daily Loss Used</th><th>Drawdown Used</th><th class="num">Today</th></tr></thead><tbody>${top.map((a) => `<tr class="lk" data-act="acct" data-id="${a.id}"><td class="nw mono">${a.id}</td><td class="nw">${esc(a.trader)}</td><td>${meter(dailyUsed(a))}</td><td>${meter(ddUsed(a))}</td><td class="num nw ${a.today < 0 ? 'dn' : 'up'}">${money(a.today, 1)}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="card m0"><div class="ch"><h3>Newest Alerts</h3><div class="r"><button class="lnk" data-act="go" data-v="alerts">All Alerts</button></div></div>${openAlerts().slice(0, 6).map((x) => `<button class="ali" data-act="alert" data-id="${x.id}"><span class="b ${SEV[x.sev][1]}">${SEV[x.sev][0]}</span><div><b>${ATYPE[x.type]}</b><div class="hint">${esc(x.traders.join(', '))} · ${x.when}</div></div><span class="chev">›</span></button>`).join('')}</div></div>
      <div class="two" style="margin-top:14px"><div class="card m0"><div class="ch"><h3>Breaches by Rule</h3><span class="lab">Last 3 Days</span></div><div class="cb fg">${Object.entries(byRule).sort((a, b) => b[1] - a[1]).map(([r, n]) => `<div><div class="rowl"><span>${esc(r)}</span><b>${n}</b></div><div class="split"><i style="width:${n / mx * 100}%"></i></div></div>`).join('')}</div></div>
      <div class="card m0"><div class="ch"><h3>Money In and Out</h3><span class="lab">Last 30 Days</span></div><div class="cb"><div class="kv"><div><span>Evaluation Revenue</span><b>$30,390</b></div><div><span>Payouts Paid</span><b>$18,940</b></div><div><span>Payouts as a Share of Revenue</span><b class="warnt">62%</b></div><div><span>Profit Owed on Funded Accounts</span><b>${money(liability())}</b></div></div><p class="hint" style="margin:12px 0 0">Above 70% for two weeks in a row triggers a review of plan prices and rules.</p></div></div></div>`;
  }
  // ---------- accounts ----------
  function acctList() { const q = S.acq.toLowerCase(); let l = ACCTS.filter((a) => (S.acf === 'all' || (S.acf === 'funded') === a.funded) && (!q || (a.id + a.trader).toLowerCase().includes(q)));
    const k = { risk: (a) => -score(a), daily: (a) => -dailyUsed(a), dd: (a) => -ddUsed(a), loss: (a) => a.today, contracts: (a) => -a.open / a.R.max }[S.acs]; return l.sort((a, b) => k(a) - k(b)); }
  function vAccounts() {
    const l = acctList();
    return `<div class="ph"><div><h1>Live Accounts</h1><p>Every evaluation and funded account, with how much of each limit is used. Click one for its trades and actions. Logins and platform setup are in ${XL('Platforms', 'accounts', 'Trading Platforms')}.</p></div></div>
      <div class="card"><div class="ch lgf"><input type="search" placeholder="Search Account or Trader" value="${esc(S.acq)}" data-live="acq" data-key="acq" aria-label="Search accounts"><div class="seg">${[['all', 'All'], ['eval', 'Evaluation'], ['funded', 'Funded']].map(([k, n]) => `<button class="${S.acf === k ? 'on' : ''}" data-act="acf" data-k="${k}">${n}</button>`).join('')}</div><div class="r"><select data-bind="acs" aria-label="Sort">${[['risk', 'Highest Risk Score'], ['daily', 'Closest to Daily Limit'], ['dd', 'Closest to Drawdown'], ['loss', 'Biggest Loss Today'], ['contracts', 'Most Contracts Open']].map(([k, n]) => `<option value="${k}" ${S.acs === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>
      ${S.bsel && S.bsel.size ? `<div class="bulk"><b>${S.bsel.size} Selected</b><button class="pill sm" data-act="bulk" data-k="pause">Pause New Trades</button><button class="pill sm" data-act="bulk" data-k="flatten">Flatten Positions</button><button class="pill sm" data-act="bulk" data-k="watch">Add to Watchlist</button><button class="lnk" data-act="bclear">Clear</button></div>` : ''}<div class="tsc"><table class="t"><thead><tr><th class="ckc"><span class="sr">Select</span></th><th>Account</th><th>Trader</th><th>Plan</th><th class="num">Balance</th><th class="num">Today</th><th>Daily Loss Used</th><th>Drawdown Used</th><th class="num">Contracts</th><th class="num">Best Day</th><th class="num">Score</th><th>Status</th></tr></thead><tbody>${l.map((a) => `<tr class="lk" data-act="acct" data-id="${a.id}"><td class="ckc"><label class="chk" data-stop="1"><input type="checkbox" data-bsel="${a.id}" ${S.bsel && S.bsel.has(a.id) ? 'checked' : ''} aria-label="Select ${a.id}"></label></td><td class="nw"><span class="il"><span class="mono">${a.id}</span>${a.funded ? '<span class="b sched plain">Funded</span>' : ''}</span></td><td class="nw">${esc(a.trader)}</td><td class="nw hint">${esc(a.plan)} ${K(a.size)} · ${a.plat}</td><td class="num nw">${money(a.bal)}</td><td class="num nw ${a.today < 0 ? 'dn' : 'up'}">${money(a.today, 1)}</td><td>${meter(dailyUsed(a))}</td><td>${meter(ddUsed(a))}</td><td class="num nw ${a.open >= a.R.max ? 'warnt' : ''}">${a.open} / ${a.R.max}</td><td class="num ${a.best > 40 && a.funded ? 'warnt' : ''}">${a.best}%</td><td class="num"><span class="sc ${score(a) >= 70 ? 'hi' : score(a) >= 45 ? 'md' : ''}">${score(a)}</span></td><td><span class="b ${a.st === 'Active' ? 'live' : a.st === 'Paused' ? 'draft' : 'err'}">${a.st}</span></td></tr>`).join('')}</tbody></table></div></div>
      <p class="hint">Score blends limit use, open size, consistency and open alerts, from 0 to 99. Sample accounts.</p>`;
  }
  function curve(a) { const r = rng('cv' + a.id); const n = 24; const pts = []; let v = a.size; for (let i = 0; i < n; i++) { v += (a.total / n) + (r() - 0.5) * a.R.daily * 0.6; pts.push(v); } pts[n - 1] = a.bal;
    const lo = Math.min(...pts, a.floor) - 100, hi = Math.max(...pts, a.funded ? a.floor : a.size + a.R.target) + 100; const W = 560, H = 140; const y = (v) => 18 + (H - 18) - (v - lo) / (hi - lo) * (H - 18); const x = (i) => i / (n - 1) * W;
    return `<svg viewBox="0 0 ${W} ${H + 18}" class="cvsvg" role="img" aria-label="Balance over the last ${n} trading sessions"><line x1="0" x2="${W}" y1="${y(a.floor)}" y2="${y(a.floor)}" class="fl"/><text x="${W - 2}" y="${y(a.floor) - 4}" text-anchor="end" class="flt">Drawdown Floor ${money(a.floor)}</text>${a.funded ? '' : `<line x1="0" x2="${W}" y1="${y(a.size + a.R.target)}" y2="${y(a.size + a.R.target)}" class="tg"/><text x="${W - 2}" y="${y(a.size + a.R.target) - 4}" text-anchor="end" class="tgt">Target ${money(a.size + a.R.target)}</text>`}<polyline points="${pts.map((v, i) => x(i).toFixed(1) + ',' + y(v).toFixed(1)).join(' ')}" class="ln"/></svg>`; }
  function acctDrawer(a) {
    const r = rng('tr' + a.id); const syms = ['NQ', 'ES', 'MNQ', 'CL', 'GC', 'MES'];
    const trades = Array.from({ length: 7 }, (_, i) => i).map((i) => { const s = syms[Math.floor(r() * syms.length)]; const q = 1 + Math.floor(r() * a.R.max); const pl = Math.round((r() - 0.52) * a.R.daily * 0.5); const mm = 12 * 60 + 40 - i * 23 - Math.floor(r() * 15); return [`${Math.floor(mm / 60)}:${String(mm % 60).padStart(2, '0')}`, s, r() > 0.5 ? 'Long' : 'Short', q, Math.round(10 + r() * 600) + 's', pl]; });
    const al = ALERTS.filter((x) => x.accts.includes(a.id));
    return { title: a.id, wide: true, body: `
      <div class="ahd"><div><b>${XL('Users', 'user?name=' + encodeURIComponent(a.trader), esc(a.trader), 'lnk')}</b><div class="hint">${esc(a.plan)} ${K(a.size)} · ${a.funded ? 'Funded' : 'Evaluation'} · ${a.plat} · ${esc(a.country)} · Day ${a.days}</div></div><span class="b ${a.st === 'Active' ? 'live' : a.st === 'Paused' ? 'draft' : 'err'}">${a.st}</span></div>
      <div class="tiles t4"><div class="tile"><span>Balance</span><b>${money(a.bal)}</b><small>${money(a.total, 1)} overall</small></div><div class="tile"><span>Today</span><b class="${a.today < 0 ? 'dn' : 'up'}">${money(a.today, 1)}</b><small>Limit −${money(a.R.daily).slice(1)}</small></div><div class="tile"><span>Open Contracts</span><b>${a.open} / ${a.R.max}</b><small>Max for ${K(a.size)}</small></div><div class="tile"><span>Score</span><b>${score(a)}</b><small>Out of 99</small></div></div>
      <div class="sec"><h4>Limits</h4><div class="lim"><div><span>Daily Loss</span>${meter(dailyUsed(a))}<small>${money(Math.max(0, -a.today))} of ${money(a.R.daily)} · resets 5:00 PM ET</small></div><div><span>Max Drawdown</span>${meter(ddUsed(a))}<small>${money(a.bal - a.floor)} above the floor of ${money(a.floor)}</small></div>${a.funded ? `<div><span>Best Day Share</span>${meter(a.best / 40 * 100 > 100 ? 100 : a.best / 40 * 100)}<small>${a.best}% of profit · payout needs 40% or less</small></div>` : `<div><span>Profit Target</span>${meter(Math.max(0, a.total) / a.R.target * 100)}<small>${money(Math.max(0, a.total))} of ${money(a.R.target)} · ${a.days} of 5 days</small></div>`}</div></div>
      <div class="sec"><h4>Balance</h4>${curve(a)}</div>
      ${al.length ? `<div class="sec"><h4>Alerts</h4>${al.map((x) => `<button class="ali" data-act="alert" data-id="${x.id}"><span class="b ${SEV[x.sev][1]}">${SEV[x.sev][0]}</span><div><b>${ATYPE[x.type]}</b><div class="hint">${x.id} · ${ALST[x.st][0]}</div></div><span class="chev">›</span></button>`).join('')}</div>` : ''}
      <div class="card m0"><div class="ch"><h3>Today's Trades</h3><span class="lab">From ${a.plat}</span></div><div class="tsc"><table class="t"><thead><tr><th>Time ET</th><th>Market</th><th>Side</th><th class="num">Qty</th><th class="num">Held</th><th class="num">P&amp;L</th></tr></thead><tbody>${trades.map((t) => `<tr><td class="mono">${t[0]}</td><td>${t[1]}</td><td>${t[2]}</td><td class="num">${t[3]}</td><td class="num">${t[4]}</td><td class="num ${t[5] < 0 ? 'dn' : 'up'}">${money(t[5], 1)}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="sec"><h4>Notes</h4>${a.notes.map((n) => `<div class="note"><b>${esc(n[0])}</b><span class="hint">${n[1]}</span><p>${esc(n[2])}</p></div>`).join('') || '<div class="hint" style="margin-bottom:10px">No notes yet.</div>'}<div class="rowx" style="grid-template-columns:1fr auto"><input placeholder="Add a note for the risk team" id="anote" data-key="anote"><button class="pill sm" data-act="acctNote" data-id="${a.id}">Add</button></div></div>`,
      foot: a.st === 'Closed' ? `<button class="pill" data-act="acctAct" data-k="reopen" data-id="${a.id}">Reopen (Needs Second Reviewer)</button>` : `<button class="pill dng" data-act="acctAct" data-k="close" data-id="${a.id}" style="margin-right:auto">Flatten and Close</button><button class="pill" data-act="acctAct" data-k="${a.st === 'Paused' ? 'resume' : 'pause'}" data-id="${a.id}">${a.st === 'Paused' ? 'Resume Trading' : 'Pause New Trades'}</button><button class="pill" data-act="acctAct" data-k="flatten" data-id="${a.id}">Flatten Positions</button><button class="pill" data-act="watchAcct" data-id="${a.id}">Watch</button><button class="pill" data-act="trader" data-id="${esc(a.trader)}">Trader Profile</button>` };
  }
  // ---------- alerts ----------
  function vAlerts() {
    const l = ALERTS.filter((x) => (S.alf === 'all' || (S.alf === 'open' ? ['new', 'investigating', 'second'].includes(x.st) : x.st === S.alf)) && (S.alt === 'all' || x.type === S.alt));
    return `<div class="ph"><div><h1>Alerts</h1><p>What the detection rules caught. Each alert shows the evidence and a suggested action. Closing accounts needs a second reviewer.</p></div></div>
      <div class="card"><div class="ch lgf"><div class="seg">${[['open', 'Open'], ['confirmed', 'Confirmed'], ['dismissed', 'Dismissed'], ['all', 'All']].map(([k, n]) => `<button class="${S.alf === k ? 'on' : ''}" data-act="alf" data-k="${k}">${n}</button>`).join('')}</div><div class="r"><select data-bind="alt" aria-label="Type"><option value="all">All Types</option>${DETECTORS.map((d) => `<option value="${d.id}" ${S.alt === d.id ? 'selected' : ''}>${d.n}</option>`).join('')}</select></div></div>
      <div class="tsc"><table class="t"><thead><tr><th>Severity</th><th>Alert</th><th>Traders</th><th>What Happened</th><th>Detected</th><th>Status</th><th>Owner</th></tr></thead><tbody>${l.length ? l.map((x) => `<tr class="lk" data-act="alert" data-id="${x.id}"><td><span class="b ${SEV[x.sev][1]}">${SEV[x.sev][0]}</span></td><td class="nw"><b>${ATYPE[x.type]}</b><div class="hint mono">${x.id}</div></td><td class="nw">${esc(x.traders.join(', '))}</td><td class="hint sumc">${esc(x.sum)}</td><td class="nw">${x.when}</td><td><span class="b ${ALST[x.st][1]}">${ALST[x.st][0]}</span></td><td class="nw hint">${esc(x.ag || 'Nobody')}</td></tr>`).join('') : '<tr><td colspan="7" class="empty">No alerts here.</td></tr>'}</tbody></table></div></div>`;
  }
  function alertDrawer(x) {
    const d = DETECTORS.find((z) => z.id === x.type);
    return { title: `${x.id} · ${ATYPE[x.type]}`, wide: true, body: `
      <div class="ahd"><span class="il"><span class="b ${SEV[x.sev][1]}">${SEV[x.sev][0]}</span><span class="hint">${x.when} · Owner: ${esc(x.ag || 'Nobody')}</span></span><span class="b ${ALST[x.st][1]}">${ALST[x.st][0]}</span></div>
      <p class="lead">${esc(x.sum)}</p>
      <div class="sec"><h4>Evidence</h4><div class="tsc"><table class="t"><thead><tr>${x.ev.h.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${x.ev.rows.map((r) => `<tr>${r.map((c, i) => `<td class="${i === 0 ? 'mono nw' : 'nw'}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
      <div class="sec"><h4>Accounts</h4>${x.accts.map((id) => { const a = acct(id); return `<button class="ali" ${a ? `data-act="acct" data-id="${id}"` : ''}><span class="mono">${id}</span><div class="hint">${a ? esc(a.trader) + ' · ' + money(a.bal) + ' · ' + a.st : 'Not in this sample'}</div><span class="chev">${a ? '›' : ''}</span></button>`; }).join('')}</div>
      <div class="sec rec"><h4>Suggested</h4><p>${esc(x.rec)}</p><div class="hint">Rule: ${esc(d.d)} Set to ${ACTS[d.act]}.</div></div>
      ${x.st === 'second' ? `<div class="sec"><h4>Proposed by ${esc(x.first)}</h4><p class="hint" style="margin:0">${esc(x.proposal)}</p></div>` : ''}
      <div class="fl"><label>Note</label><textarea id="anotex" placeholder="Why you decided this. Kept in the audit log."></textarea></div>`,
      foot: x.st === 'second' ? `<button class="pill" data-act="alertDo" data-k="back" data-id="${x.id}">Send Back</button><button class="pill pri" data-act="alertDo" data-k="confirm2" data-id="${x.id}">Confirm as ${RV2}</button>`
        : ['new', 'investigating'].includes(x.st) ? `${x.ag ? '' : `<button class="pill" data-act="alertDo" data-k="take" data-id="${x.id}" style="margin-right:auto">Take It</button>`}<button class="pill" data-act="alertDo" data-k="dismiss" data-id="${x.id}">Dismiss</button><button class="pill" data-act="alertDo" data-k="warn" data-id="${x.id}">Confirm and Warn</button><button class="pill" data-act="alertDo" data-k="hold" data-id="${x.id}">Hold Payouts</button><button class="pill dng" data-act="alertDo" data-k="close" data-id="${x.id}">Close Accounts</button>`
        : `<button class="pill" data-act="alertDo" data-k="reopen" data-id="${x.id}">Reopen</button>` };
  }
  // ---------- payouts ----------
  function vPayouts() {
    const l = PAYOUTS.filter((p) => S.pof === 'all' || (S.pof === 'review' ? ['review', 'hold', 'second'].includes(p.st) : p.st === S.pof));
    const due = PAYOUTS.filter((p) => ['review', 'hold', 'second'].includes(p.st)).reduce((s, p) => s + p.amt, 0);
    return `<div class="ph"><div><h1>Payout Reviews</h1><p>Every payout request runs ${CHECKS.length} checks first. Clean requests can be approved in one click; over ${money(S.set.payoutTwo)} needs a second approver. Approved payouts are sent from ${XL('Finance', 'queue', 'Finance')}.</p></div></div>
      <div class="tiles"><div class="tile"><span>Waiting</span><b>${PAYOUTS.filter((p) => ['review', 'hold', 'second'].includes(p.st)).length}</b><small>${money(due)} requested</small></div><div class="tile"><span>All Checks Passed</span><b>${PAYOUTS.filter((p) => p.st === 'review' && !p.fail.length && !p.warn.length).length}</b><small>Ready to approve</small></div><div class="tile"><span>Paid, 30 Days</span><b>$18,940</b><small>41 payouts</small></div><div class="tile"><span>Daily Cap</span><b>${money(S.set.dailyCap)}</b><small>Approved today ${money(PAYOUTS.filter((p) => p.st === 'approved' && p.today).reduce((s, p) => s + p.amt, 0))}</small></div></div>
      <div class="card"><div class="ch"><div class="seg">${[['review', 'Waiting'], ['approved', 'Approved'], ['denied', 'Denied'], ['all', 'All']].map(([k, n]) => `<button class="${S.pof === k ? 'on' : ''}" data-act="pof" data-k="${k}">${n}</button>`).join('')}</div></div>
      <div class="tsc"><table class="t"><thead><tr><th>Request</th><th>Trader</th><th>Account</th><th class="num">Amount</th><th class="num">Trading Days</th><th>Checks</th><th>Requested</th><th>Status</th></tr></thead><tbody>${l.length ? l.map((p) => `<tr class="lk" data-act="payout" data-id="${p.id}"><td class="mono nw">${p.id}</td><td class="nw"><b>${esc(p.trader)}</b></td><td class="mono nw">${p.acct}</td><td class="num nw"><b>${money(p.amt)}</b><div class="hint">${p.split}% split</div></td><td class="num">${p.days}</td><td class="nw">${p.fail.length ? `<span class="b err plain">${p.fail.length} Failed</span>` : p.warn.length ? `<span class="b draft plain">${p.warn.length} to Check</span>` : `<span class="b live plain">All ${CHECKS.length} Passed</span>`}</td><td class="nw">${p.req}</td><td><span class="b ${POST[p.st][1]}">${POST[p.st][0]}</span></td></tr>`).join('') : '<tr><td colspan="8" class="empty">Nothing here.</td></tr>'}</tbody></table></div></div>`;
  }
  function payoutDrawer(p) {
    const icon = (k) => p.fail.includes(k) ? ['✕', 'f'] : p.warn.includes(k) ? ['!', 'w'] : ['✓', 'p'];
    const why = { consistency: 'Best day is 46% of profit.', tax: 'W-8BEN expires Dec 31; still valid for this payout.', alerts: 'Open alert on this trader.', copy: 'Matches RK-1181 trade copying.', wallet: 'Wallet shared with another trader.', device: 'Payout requested from a new country.' };
    return { title: `${p.id} · ${money(p.amt)}`, body: `
      <div class="ahd"><div><b>${XL('Users', 'user?name=' + encodeURIComponent(p.trader) + '&tab=payouts', esc(p.trader), 'lnk')}</b><div class="hint"><span class="mono">${p.acct}</span> · ${p.split}% split · ${p.days} trading days</div></div><span class="b ${POST[p.st][1]}">${POST[p.st][0]}</span></div>
      <div class="sec"><h4>Checks</h4><div class="chks">${CHECKS.map(([k, l]) => { const [i, c] = icon(k); return `<div class="ck2 ${c}"><i>${i}</i><div><b>${l}</b>${c !== 'p' && why[k] ? `<div class="hint">${why[k]}</div>` : ''}</div></div>`; }).join('')}</div></div>
      ${p.note ? `<div class="sec rec"><h4>Note</h4><p>${esc(p.note)}</p></div>` : ''}
      <div class="sec"><h4>Payout Math</h4><div class="kv"><div><span>Profit Since Last Payout</span><b>${money(p.amt / (p.split / 100))}</b></div><div><span>Trader Share</span><b>${p.split}% · ${money(p.amt)}</b></div><div><span>Method</span><b>Rise · USDC</b></div><div><span>Approvals Needed</span><b>${p.amt > S.set.payoutTwo ? 'Two people' : 'One person'}</b></div>${p.by ? `<div><span>Approved By</span><b>${esc(p.by.join(' and '))}</b></div>` : ''}</div></div>
      <div class="fl"><label>Note to Trader</label><textarea id="ponote" placeholder="Sent with the decision email when holding or denying"></textarea></div>`,
      foot: ['approved', 'denied'].includes(p.st) ? `${p.st === 'approved' ? XL('Finance', 'queue', 'Send in Finance', 'pill pri') : ''}<button class="pill" data-act="closeDrw">Close</button>` : p.st === 'second' ? `<button class="pill" data-act="payDo" data-k="back" data-id="${p.id}">Send Back</button><button class="pill pri" data-act="payDo" data-k="approve2" data-id="${p.id}">Approve as ${RV2}</button>` : `<button class="pill dng" data-act="payDo" data-k="deny" data-id="${p.id}" style="margin-right:auto">Deny</button>${p.st === 'hold' ? '' : `<button class="pill" data-act="payDo" data-k="hold" data-id="${p.id}">Hold</button>`}<button class="pill pri" data-act="payDo" data-k="approve" data-id="${p.id}" ${p.fail.length ? 'title="Some checks failed"' : ''}>${p.amt > S.set.payoutTwo ? 'Approve and Send for Second' : 'Approve'}</button>` };
  }
  // ---------- linked ----------
  function graph(c) { const W = 300, H = c.nodes.length === 2 ? 90 : 180, cx = W / 2, cy = H / 2, R = c.nodes.length === 2 ? 90 : 66; const pos = c.nodes.length === 2 ? [[cx - R, 40], [cx + R, 40]] : c.nodes.length === 4 ? [[70, 40], [230, 40], [70, 130], [230, 130]] : c.nodes.map((_, i) => [cx + R * Math.cos(-Math.PI / 2 + i * 2 * Math.PI / c.nodes.length) * 1.5, cy - 10 + R * Math.sin(-Math.PI / 2 + i * 2 * Math.PI / c.nodes.length)]);
    return `<svg viewBox="0 0 ${W} ${H}" class="gsvg" role="img" aria-label="Linked traders">${c.edges.map(([a, b, l]) => { const [x1, y1] = pos[a], [x2, y2] = pos[b]; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="ge"/>${x1 === x2 ? `<text x="${x1 + 10}" y="${(y1 + y2) / 2 + 4}" text-anchor="start" class="gel">${esc(l)}</text>` : `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 6}" text-anchor="middle" class="gel">${esc(l)}</text>`}`; }).join('')}${pos.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="7" class="gn"/><text x="${x}" y="${y + 22}" text-anchor="middle" class="gnl">${esc(c.nodes[i])}</text>`).join('')}</svg>`; }
  function vLinks() {
    const lab = { open: ['Open', 'sched'], household: ['Shared Network', 'plain'], allowed: ['Allowed', 'live'], blocked: ['Blocked', 'err'] };
    return `<div class="ph"><div><h1>Linked Accounts</h1><p>Traders tied together by shared devices, IP addresses, cards, payout wallets, identity documents or identical trades.</p></div><div class="act">${XL('Fraud', 'network', 'Open Network Map', 'pill')}</div></div>
      <div class="lgrid">${CLUSTERS.map((c) => `<div class="card m0"><div class="ch"><h3>${c.id}</h3><span class="lab">${c.nodes.length} Traders</span><div class="r">${XL('Fraud', 'network?cl=' + c.id, 'Network', 'lnk')}<span class="b ${lab[c.st][1]}">${lab[c.st][0]}</span></div></div><div class="cb">${graph(c)}<div class="kv"><div><span>Linked By</span><b>${esc([...new Set(c.edges.map((e) => e[2]))].join(', '))}</b></div><div><span>Payouts Requested</span><b>${c.payouts ? money(c.payouts) : '—'}</b></div>${c.alert ? `<div><span>Alert</span><b><button class="lnk" data-act="alert" data-id="${c.alert}">${c.alert}</button></b></div>` : ''}${c.note ? `<div><span>Note</span><b>${esc(c.note)}</b></div>` : ''}</div>
        ${c.st === 'open' ? `<div class="edact" style="margin-top:12px"><button class="pill sm" data-act="clDo" data-k="allowed" data-id="${c.id}">Mark as Allowed</button><button class="pill sm" data-act="clDo" data-k="household" data-id="${c.id}">Shared Network</button><button class="pill sm dng" data-act="clDo" data-k="blocked" data-id="${c.id}">Block All</button></div>` : `<div class="edact" style="margin-top:12px"><button class="pill sm" data-act="clDo" data-k="open" data-id="${c.id}">Reopen</button></div>`}</div></div>`).join('')}</div>
      <p class="hint">Allowed links, like family members on one home network, stop raising alerts for those traders. Blocking adds every shared device, card and wallet to the Blocklist.</p>`;
  }
  // ---------- breaches ----------
  function vBreaches() {
    const counts = {}; BREACHES.forEach((b) => { counts[b[3]] = (counts[b[3]] || 0) + 1; });
    return `<div class="ph"><div><h1>Breaches</h1><p>Accounts closed for breaking a rule. Most close automatically the moment the rule is broken; disputes go to ${XL('Support', 'reviews', 'Breach Reviews in Support')}.</p></div></div>
      <div class="tiles">${Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([r, n]) => `<div class="tile"><span>${esc(r)}</span><b>${n}</b><small>Last 3 days</small></div>`).join('')}</div>
      <div class="two wl" style="margin-bottom:14px">${`<div class="card m0"><div class="ch"><h3>Where Breaches Happen</h3><span class="lab">Last 30 days · by trader country</span></div><div class="cb">${VZ.map([['United States', 41], ['United Kingdom', 12], ['India', 18], ['Nigeria', 14], ['Canada', 8], ['Germany', 6], ['Brazil', 9], ['Mexico', 5], ['Philippines', 7], ['Australia', 5], ['UAE', 3], ['Poland', 4]].map(([n, v]) => ({ n, v, lab: v + ' breaches', c: v > 15 ? 'var(--no)' : undefined })), { label: 'Breaches by country' })}</div></div>`}<div class="card m0"><div class="ch"><h3>When Breaches Happen</h3><span class="lab">Eastern Time</span></div><div class="cb">${(() => { const g = rng('bh'); const hrs = ['6a', '8a', '9a', '10a', '11a', '12p', '2p', '4p', '6p', '9p']; return vb2(hrs.map((h, i) => [h, Math.round((i === 2 || i === 3 ? 14 : i === 7 ? 9 : 4) * (0.7 + g() * 0.5))])); })()}<p class="hint" style="margin:10px 0 0">Most breaches happen in the first hour after the US market opens at 9:30 AM.</p></div></div></div>
      <div class="card"><div class="tsc"><table class="t"><thead><tr><th>When</th><th>Account</th><th>Trader</th><th>Rule</th><th>What Happened</th><th>How</th><th>Dispute</th></tr></thead><tbody>${BREACHES.map((b) => `<tr ${acct(b[1]) ? `class="lk" data-act="acct" data-id="${b[1]}"` : ''}><td class="nw">${b[0]}</td><td class="mono nw">${b[1]}</td><td class="nw">${esc(b[2])}</td><td class="nw"><b>${esc(b[3])}</b></td><td class="hint nw">${esc(b[4])}</td><td class="nw">${b[5]}</td><td class="nw">${b[6] ? `<span class="b draft plain">${esc(b[6])}</span>` : ''}</td></tr>`).join('')}</tbody></table></div></div>`;
  }
  // ---------- detection ----------
  function vDetect() {
    return `<div class="ph"><div><h1>Detection Rules</h1><p>What the engine looks for, how strict it is, and what it does on its own. Every change is written to the Audit Log.</p></div></div>
      <div class="card"><div class="tsc"><table class="t"><thead><tr><th class="swc">On</th><th>Rule</th><th>Severity</th><th>What It Does</th><th class="num">Hits, 30 Days</th><th class="num">Confirmed</th><th></th></tr></thead><tbody>${DETECTORS.map((d) => `<tr><td class="swc"><button class="sw ${d.on ? 'on' : ''}" data-act="detOn" data-id="${d.id}" role="switch" aria-checked="${d.on}" aria-label="${esc(d.n)}"></button></td><td class="dtd"><b>${esc(d.n)}</b><div class="hint dsc">${esc(d.d)}</div></td><td><select data-bind="det.sev" data-id="${d.id}" aria-label="Severity">${Object.entries(SEV).map(([k, v]) => `<option value="${k}" ${d.sev === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></td><td><select data-bind="det.act" data-id="${d.id}" aria-label="Action">${Object.entries(ACTS).map(([k, v]) => `<option value="${k}" ${d.act === k ? 'selected' : ''}>${v}</option>`).join('')}</select></td><td class="num">${d.hits}</td><td class="num ${d.hits && d.conf < 50 ? 'warnt' : ''}">${d.hits ? d.conf + '%' : '—'}</td><td class="num nw"><button class="lnk" data-act="detEdit" data-id="${d.id}">Thresholds</button></td></tr>`).join('')}</tbody></table></div></div>
      <p class="hint">Rules confirmed less than half the time are marked in amber: loosen them or keep them on Alert Only.</p>`;
  }
  function detDrawer(d) {
    return { title: d.n, body: `<p class="lead">${esc(d.d)}</p><div class="fg2">${d.th.map(([l, v], i) => `<div class="fl"><label>${esc(l)}</label><input type="number" min="0" value="${v}" data-df="th${i}"></div>`).join('')}</div>
      <div class="fl"><label>What It Does</label><select data-df="act">${Object.entries(ACTS).map(([k, v]) => `<option value="${k}" ${S.drawer.f.act === k ? 'selected' : ''}>${v}</option>`).join('')}</select><span class="hint">Close the Account acts immediately and still asks a second reviewer to confirm afterwards.</span></div>
      <div class="sec"><h4>Try It on the Last 30 Days</h4><p class="hint" style="margin:0 0 10px">See how many alerts these thresholds would have raised before saving.</p><button class="pill sm" data-act="detTest" data-id="${d.id}">Run</button>${S.drawer.f.test != null ? `<div class="testr"><b>${S.drawer.f.test}</b> alerts, about ${Math.round(S.drawer.f.test * d.conf / 100)} likely real</div>` : ''}</div>`,
      foot: '<button class="pill" data-act="closeDrw">Cancel</button><button class="pill pri" data-act="detSave">Save</button>' };
  }
  // ---------- exposure ----------
  function vExposure() {
    const funded = ACCTS.filter((a) => a.funded && a.st !== 'Closed'); const owed = liability();
    const top = funded.filter((a) => a.total > 0).sort((a, b) => b.total - a.total).slice(0, 5); const topShare = Math.round(top.reduce((s, a) => s + a.total * 0.9, 0) / Math.max(1, owed) * 100);
    const weeks = [[7240, 4110], [8020, 5230], [7410, 4880], [7720, 4720]]; const mx = Math.max(...weeks.flat());
    return `<div class="ph"><div><h1>Exposure and Liability</h1><p>What Funded Sky could owe traders, and whether evaluation revenue covers it. Accounts are simulated; payouts are real money.</p></div></div>
      <div class="tiles t6"><div class="tile"><span>Funded Accounts</span><b>${funded.length}</b><small>${money(funded.reduce((s, a) => s + a.size, 0))} in starting balances</small></div><div class="tile"><span>Profit Owed</span><b>${money(owed)}</b><small>Funded profit × split, if all paid today</small></div><div class="tile"><span>Expected Next 30 Days</span><b>${money(owed * 0.55 + 9000)}</b><small>Based on payout history</small></div><div class="tile"><span>Payouts / Revenue</span><b class="warnt">62%</b><small>Last 30 days · target under 60%</small></div><div class="tile"><span>Top 5 Traders</span><b>${topShare}%</b><small>Of profit owed</small></div><div class="tile"><span>Daily Payout Cap</span><b>${money(S.set.dailyCap)}</b><small>Set in Settings</small></div></div>
      <div class="card" style="margin-bottom:14px"><div class="ch"><h3>Open Positions by Market</h3><span class="lab">Live · bubble size is how many accounts hold it</span></div><div class="cb">${VZ.bubbles([{ n: 'NQ', x: 412, y: 18400, v: 96 }, { n: 'ES', x: 530, y: 9200, v: 120 }, { n: 'MNQ', x: 880, y: 4100, v: 140 }, { n: 'MES', x: 610, y: -2300, v: 88, c: 'bad' }, { n: 'CL', x: 140, y: -7800, v: 41, c: 'bad' }, { n: 'GC', x: 96, y: 5200, v: 37 }, { n: 'YM', x: 64, y: 1200, v: 22 }, { n: 'RTY', x: 58, y: -3100, v: 19, c: 'bad' }], 'Open contracts', 'Traders’ profit today', (v) => Math.round(v).toLocaleString('en-US') + ' contracts', (v) => money(v), { h: 280 })}</div></div><div class="two wl"><div class="card m0"><div class="ch"><h3>Revenue and Payouts by Week</h3><span class="lab"><i class="lg1"></i>Revenue <i class="lg2"></i>Payouts</span></div><div class="cb"><div class="wbars">${weeks.map(([r, p], i) => `<div class="wb"><div class="wbb"><i style="height:${r / mx * 100}%"></i><i class="p" style="height:${p / mx * 100}%"></i></div><span>Week ${i + 1}</span><small>${Math.round(p / r * 100)}%</small></div>`).join('')}</div></div></div>
      <div class="card m0"><div class="ch"><h3>Largest Amounts Owed</h3></div><div class="tsc"><table class="t"><tbody>${top.map((a) => `<tr class="lk" data-act="acct" data-id="${a.id}"><td class="mono nw">${a.id}</td><td class="nw">${esc(a.trader)}</td><td class="num nw"><b>${money(a.total * 0.9)}</b></td></tr>`).join('')}</tbody></table></div></div></div>
      <div class="card" style="margin-top:14px"><div class="ch"><h3>By Plan</h3><span class="lab">Last 90 Days</span></div><div class="tsc"><table class="t"><thead><tr><th>Plan</th><th class="num">Evaluations Sold</th><th class="num">Passed</th><th class="num">Reached a Payout</th><th class="num">Average Payout</th><th class="num">Revenue</th><th class="num">Paid Out</th><th class="num">Paid / Revenue</th></tr></thead><tbody>${[['[Plan A Name]', 412, 9.2, 4.1, 1180, 48210, 19940], ['[Plan B Name]', 628, 11.4, 5.3, 2140, 128400, 71200], ['[Plan C Name]', 301, 8.1, 3.2, 1020, 37810, 9820]].map(([n, s, p, r, avg, rev, out]) => `<tr><td class="nw"><b>${n}</b></td><td class="num">${s}</td><td class="num">${p}%</td><td class="num">${r}%</td><td class="num">${money(avg)}</td><td class="num">${money(rev)}</td><td class="num">${money(out)}</td><td class="num ${out / rev > 0.6 ? 'warnt' : ''}">${Math.round(out / rev * 100)}%</td></tr>`).join('')}</tbody></table></div></div>
      <p class="hint">Sample numbers. Pass and payout rates feed the plan pricing in the Checkout Catalog.</p>`;
  }
  // ---------- blocklist ----------
  function vBlocks() {
    return `<div class="ph"><div><h1>Blocklist</h1><p>Anything here can't sign up, pay, or receive a payout. Checked at sign-up, checkout, identity check and payout.</p></div></div>
      <div class="card"><div class="ch lgf"><h3>Blocked</h3><div class="r addr"><select id="bkk" aria-label="Type">${['Email', 'Device', 'IP Range', 'Card', 'Payout Wallet', 'Identity Document'].map((k) => `<option>${k}</option>`).join('')}</select><input id="bkv" placeholder="Value" aria-label="Value"><input id="bkw" placeholder="Reason" aria-label="Reason"><button class="pill sm" data-act="blockAdd">Block</button></div></div>
      <div class="tsc"><table class="t"><thead><tr><th>Type</th><th>Value</th><th>Reason</th><th>Added By</th><th>Date</th><th></th></tr></thead><tbody>${BLOCKS.map((b, i) => `<tr><td class="nw"><b>${b.k}</b></td><td class="mono nw">${esc(b.v)}</td><td>${esc(b.why)}</td><td class="nw hint">${esc(b.by)}</td><td class="nw">${b.d}</td><td class="num"><button class="lnk" data-act="blockDel" data-i="${i}">Remove</button></td></tr>`).join('')}</tbody></table></div></div>
      <div class="two"><div class="card m0"><div class="ch"><h3>Countries</h3></div><div class="cb"><div class="kv"><div><span>Blocked Countries</span><b>[Sanctioned countries], [Countries you choose]</b></div><div><span>VPN or Proxy at Checkout</span><b>Blocked</b></div></div><p class="hint" style="margin:10px 0 0">Set in Limits and Restrictions in the ${XL('Catalog', '', 'Checkout Catalog')}.</p></div></div>
      <div class="card m0"><div class="ch"><h3>Account Limits</h3></div><div class="cb"><div class="kv"><div><span>Active Evaluations per Person</span><b>5</b></div><div><span>Funded Accounts per Person</span><b>3</b></div><div><span>Total Funded Balance</span><b>$450,000</b></div></div><p class="hint" style="margin:10px 0 0">Counted per verified identity, across every sign-up.</p></div></div></div>`;
  }
  // ---------- audit ----------
  function vAudit() {
    return `<div class="ph"><div><h1>Audit Log</h1><p>Every risk decision and automatic action, with who did it. Entries can't be edited or deleted.</p></div><div class="act"><button class="pill" data-act="exportAudit">Export CSV</button></div></div>
      <div class="card"><div class="tsc"><table class="t"><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Details</th></tr></thead><tbody>${AUDIT.map((r) => `<tr><td class="nw">${r[0]}</td><td class="nw">${esc(r[1])}</td><td class="nw"><b>${esc(r[2])}</b></td><td class="hint">${esc(r[3])}</td></tr>`).join('')}</tbody></table></div></div>`;
  }
  // ---------- settings ----------
  function vSettings() {
    const C = S.set; const sw = (k, l, h) => `<div class="srow"><div><span>${l}</span>${h ? `<div class="hint">${h}</div>` : ''}</div><button class="sw ${C[k] ? 'on' : ''}" data-act="setT" data-k="${k}" role="switch" aria-checked="${!!C[k]}" aria-label="${esc(l)}"></button></div>`;
    return `<div class="ph"><div><h1>Settings</h1><p>How the risk engine enforces rules, who has to agree on big decisions, and where alerts go.</p></div></div>
      <div class="two"><div class="card m0"><div class="ch"><h3>Enforcement</h3></div><div class="cb fg"><div class="fl"><label>When a Rule Is Broken</label><div class="seg">${[['instant', 'Close Instantly'], ['eod', 'Close at End of Day']].map(([k, l]) => `<button class="${C.closeWhen === k ? 'on' : ''}" data-act="setV" data-k="closeWhen" data-v="${k}">${l}</button>`).join('')}</div><span class="hint">Instantly is safest. End of day lets traders see the result first but adds risk on fast days.</span></div>${sw('autoFlatten', 'Flatten Open Positions When an Account Closes')}<div class="fl"><label>Price Feed</label><input value="${esc(C.feed)}" data-bind="set.feed"></div><div class="fl"><label>High-Impact News</label><input value="${esc(C.newsList)}" data-bind="set.newsList"><span class="hint">No new trades 2 minutes either side of these releases.</span></div></div></div>
      <div class="card m0"><div class="ch"><h3>Two-Person Decisions</h3><div class="r">${XL('Team', 'aprules', 'Approval Rules in Team')}</div></div><div class="cb fg">${sw('twoClose', 'Closing an Account by Hand')}${sw('twoReinstate', 'Reinstating a Closed Account')}<div class="fl"><label>Payouts Above ($)</label><input type="number" min="0" value="${C.payoutTwo}" data-bind="set.payoutTwo"></div><div class="fl"><label>Most Paid Out per Day ($)</label><input type="number" min="0" value="${C.dailyCap}" data-bind="set.dailyCap"><span class="hint">Approvals past the cap wait until the next day.</span></div></div></div></div>
      <div class="card" style="margin-top:14px"><div class="ch"><h3>Notifications</h3></div><div class="cb fg">${sw('slack', 'High Alerts to Slack #risk')}${sw('email', 'Daily Summary by Email at 6:00 PM ET')}<div class="srow"><span>Review Open Alerts Within</span><select data-bind="set.sla" style="width:140px">${[['4', '4 Hours'], ['12', '12 Hours'], ['24', '24 Hours'], ['48', '48 Hours']].map(([v, l]) => `<option value="${v}" ${C.sla === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div></div>`;
  }

  // ---------- drawer shell ----------
  function drawer() {
    if (!S.drawer) return ''; const { kind, id } = S.drawer;
    const d = kind === 'acct' ? acctDrawer(acct(id)) : kind === 'alert' ? alertDrawer(ALERTS.find((x) => x.id === id)) : kind === 'payout' ? payoutDrawer(PAYOUTS.find((x) => x.id === id)) : kind === 'det' ? detDrawer(DETECTORS.find((x) => x.id === id)) : extDrawer(kind, id);
    return `<div class="drw-bg" data-act="closeDrw"></div><div class="drw ${d.wide ? 'wide' : ''}" role="dialog" aria-label="${esc(d.title)}"><div class="drw-h"><h3>${esc(d.title)}</h3><button class="ic" data-act="closeDrw" style="margin-left:auto" aria-label="Close">✕</button></div><div class="drw-b">${d.body}</div><div class="drw-f">${d.foot}</div></div>`;
  }

  // ---------- render ----------
  const toast = (x) => { S.toast = x; render(); clearTimeout(toast.t); toast.t = setTimeout(() => { S.toast = ''; render(); }, 2600); };
  const clock = () => { const d = new Date(); const et = new Date(d.toLocaleString('en-US', { timeZone: 'America/New_York' })); return et.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }); };
  function render() {
    const keep = {}; ['.main', '.drw-b'].forEach((s) => { const el = root.querySelector(s); if (el) keep[s] = el.scrollTop; });
    const views = { desk: vDesk, accounts: vAccounts, alerts: vAlerts, payouts: vPayouts, links: vLinks, breaches: vBreaches, detect: vDetect, exposure: vExposure, blocks: vBlocks, audit: vAudit, settings: vSettings, watch: vWatch, health: vHealth, news: vNews, cases: vCases, traders: vTraders, trades: vTrades, chargebacks: vChargebacks, adjust: vAdjust, sim: vSim, ...PI.views };
    root.innerHTML = `<div class="tb"><a class="pill bk" href="AdminHome.dc.html" aria-label="Back to Admin">←<span class="lg"> Back to Admin</span></a><span class="tb-t">Risk</span>
      <div class="tb-mid hm"><div class="tb-stats"><div><span>Live Accounts</span><b>${live().length}</b></div><div><span>Near a Limit</span><b class="warnt">${near().length}</b></div><div><span>Breaches Today</span><b>${BREACHES.filter((b) => b[0].startsWith('Today')).length}</b></div><div><span>Open Alerts</span><b class="${openAlerts().length ? 'bad' : ''}">${openAlerts().length}</b></div><div><span>Payouts Waiting</span><b>${PAYOUTS.filter((p) => ['review', 'hold', 'second'].includes(p.st)).length}</b></div><div><span>Profit Owed</span><b>${money(liability())}</b></div></div></div>
      <div class="gs hm"><input type="search" placeholder="Search Trader, Account, Alert" value="${esc(S.gq || '')}" data-live="gq" data-key="gq" aria-label="Search everything">${(S.gq || '').length > 1 ? `<div class="gsd">${searchResults(S.gq).map(([k, id, t, s]) => `<button data-act="gopen" data-k="${k}" data-id="${esc(id)}"><span class="b plain">${t}</span><b>${esc(id)}</b><span class="hint">${esc(s)}</span></button>`).join('') || '<div class="empty">Nothing found.</div>'}</div>` : ''}</div>
      ${Object.values(SWITCHES).some(Boolean) ? `<button class="envchip kchip" data-act="go" data-v="health">${Object.entries(SWITCHES).filter(([, v]) => v).length} Emergency Switch${Object.values(SWITCHES).filter(Boolean).length > 1 ? 'es' : ''} On</button>` : ''}
      <span class="livec hm"><i></i>Live · <span id="rkclock">${clock()}</span> ET</span>
      <button class="pill" data-act="go" data-v="audit">Audit Log</button></div>
    <div class="body"><div class="mnav"><select id="mnavsel" aria-label="Go to section">${mnavHtml()}</select></div><nav class="nav" aria-label="Risk">${navHtml()}</nav><main class="main">${subtabs()}${(views[S.view] || views[(S.view = 'desk')])()}</main></div>
    ${drawer()}${S.toast ? `<div class="toast" role="status">${esc(S.toast)}</div>` : ''}`;
    Object.entries(keep).forEach(([s, v]) => { const el = root.querySelector(s); if (el) el.scrollTop = v; });
    if (S.focus) { const el = root.querySelector(`[data-key="${S.focus.k}"]`); if (el) { el.focus(); try { el.setSelectionRange(S.focus.s, S.focus.s); } catch (x) { /* not text */ } } S.focus = null; }
  }
  const tickT = setInterval(() => { if (!root.isConnected) { clearInterval(tickT); return; } const c = root.querySelector('#rkclock'); if (c) c.textContent = clock(); }, 1000);

  // ---------- events ----------
  const noteVal = (sel) => { const el = root.querySelector(sel); return el ? el.value.trim() : ''; };
  root.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-stop]')) return;
    const el = ev.target.closest('[data-act]'); if (!el || !root.contains(el)) return;
    if (el.tagName === 'INPUT' && el.type !== 'checkbox') return;
    const a = el.dataset.act, id = el.dataset.id, k = el.dataset.k;
    switch (a) {
      case 'go': S.view = el.dataset.v; S.drawer = null; break;
      case 'area': { const x = AREAS.find((y) => y.id === el.dataset.k); S.view = lastTab[x.id] || x.tabs[0][0]; S.drawer = null; break; }
      case 'acct': if (!acct(id)) return; S.drawer = { kind: 'acct', id }; break;
      case 'alert': S.drawer = { kind: 'alert', id }; break;
      case 'payout': S.drawer = { kind: 'payout', id }; break;
      case 'closeDrw': S.drawer = null; break;
      case 'acf': S.acf = k; break;
      case 'alf': S.alf = k; break;
      case 'pof': S.pof = k; break;
      case 'acctNote': { const v = noteVal('#anote'); if (!v) { toast('Write a note first'); return; } acct(id).notes.push([ME, 'Just now', v]); audit(ME, 'Note added', id); break; }
      case 'acctAct': { const ac = acct(id);
        if (k === 'pause') { ac.st = 'Paused'; audit(ME, 'Trading paused', id); toast(`${id}: new trades paused. Open positions stay.`); return; }
        if (k === 'resume') { ac.st = 'Active'; audit(ME, 'Trading resumed', id); toast(`${id}: trading resumed`); return; }
        if (k === 'flatten') { ac.open = 0; audit(ME, 'Positions flattened', id); toast(`${id}: all positions closed at market`); return; }
        if (k === 'close') { ac.st = 'Closed'; ac.open = 0; audit(ME, 'Account closed by hand', id + (S.set.twoClose ? ' · waiting for second reviewer' : '')); toast(S.set.twoClose ? `${id} closed. ${RV2} is asked to confirm.` : `${id} closed`); return; }
        if (k === 'reopen') { audit(ME, 'Reopen requested', id + ' · waiting for second reviewer'); toast(`Reopen sent to ${RV2}`); return; }
        return; }
      case 'alertDo': { const x = ALERTS.find((z) => z.id === id); const note = noteVal('#anotex');
        if (k === 'take') { x.ag = ME; x.st = 'investigating'; audit(ME, 'Took alert', x.id); break; }
        if (k === 'dismiss') { x.st = 'dismissed'; x.ag = x.ag || ME; audit(ME, 'Alert dismissed', `${x.id}${note ? ' · ' + note : ''}`); S.drawer = null; toast(`${x.id} dismissed`); return; }
        if (k === 'warn') { x.st = 'confirmed'; x.ag = x.ag || ME; audit(ME, 'Alert confirmed, trader warned', x.id); S.drawer = null; toast('Confirmed. Prohibited Strategy Warning email sent.'); return; }
        if (k === 'hold') { x.st = 'investigating'; x.ag = x.ag || ME; PAYOUTS.filter((p) => x.traders.includes(p.trader) && p.st === 'review').forEach((p) => { p.st = 'hold'; }); audit(ME, 'Payouts held', `${x.traders.join(', ')} · ${x.id}`); toast('Payouts held for these traders'); return; }
        if (k === 'close') { x.st = 'second'; x.first = ME; x.proposal = `Close ${x.accts.join(', ')}${note ? '. ' + note : ''}`; audit(ME, 'Proposed closing accounts', x.id); toast(`Sent to ${RV2} to confirm`); break; }
        if (k === 'confirm2') { x.st = 'confirmed'; x.accts.forEach((ida) => { const ac = acct(ida); if (ac) { ac.st = 'Closed'; ac.open = 0; } }); audit(`${x.first} and ${RV2}`, 'Accounts closed', `${x.accts.join(', ')} · ${x.id}`); S.drawer = null; toast('Accounts closed. Traders get the Account Suspended email.'); return; }
        if (k === 'back') { x.st = 'investigating'; break; }
        if (k === 'reopen') { x.st = 'investigating'; audit(ME, 'Alert reopened', x.id); break; }
        break; }
      case 'payDo': { const p = PAYOUTS.find((z) => z.id === id);
        if (k === 'approve') { if (p.fail.length && !confirmFail(p)) return; if (p.amt > S.set.payoutTwo) { p.st = 'second'; p.by = [ME]; audit(ME, 'Payout approved, needs second', `${p.id} · ${money(p.amt)}`); toast(`Sent to ${RV2} for the second approval`); break; } p.st = 'approved'; p.by = [ME]; p.today = true; audit(ME, 'Payout approved', `${p.id} · ${p.trader} · ${money(p.amt)}`); S.drawer = null; toast(`${money(p.amt)} approved. Payout Approved email sent. It is now in Finance, Ready to Send.`); return; }
        if (k === 'approve2') { p.st = 'approved'; p.by = [...(p.by || []), RV2]; p.today = true; audit(p.by.join(' and '), 'Payout approved', `${p.id} · ${money(p.amt)} · two approvals`); S.drawer = null; toast(`${money(p.amt)} approved by two people`); return; }
        if (k === 'hold') { p.st = 'hold'; audit(ME, 'Payout held', `${p.id} · ${money(p.amt)}`); S.drawer = null; toast('Held. Payout On Hold email sent.'); return; }
        if (k === 'deny') { p.st = 'denied'; audit(ME, 'Payout denied', `${p.id} · ${noteVal('#ponote') || 'no note'}`); S.drawer = null; toast('Denied. The trader gets your note by email.'); return; }
        if (k === 'back') { p.st = 'review'; p.by = []; break; }
        break; }
      case 'clDo': { const c = CLUSTERS.find((z) => z.id === id); c.st = k; if (k === 'blocked') c.nodes.forEach((n) => BLOCKS.unshift({ k: 'Device', v: 'Devices of ' + n, why: `Linked group ${c.id}`, by: ME, d: 'Nov 22' })); audit(ME, k === 'open' ? 'Link reopened' : 'Linked group marked ' + k, c.id); toast(k === 'blocked' ? `${c.id}: devices, cards and wallets added to the Blocklist` : `${c.id} updated`); return; }
      case 'detOn': { const d = DETECTORS.find((z) => z.id === id); d.on = !d.on; audit(ME, `Detection rule ${d.on ? 'turned on' : 'turned off'}`, d.n); toast(`${d.n} ${d.on ? 'on' : 'off'}`); return; }
      case 'detEdit': { const d = DETECTORS.find((z) => z.id === id); S.drawer = { kind: 'det', id, f: { act: d.act, th: d.th.map((t) => t[1]), test: null } }; break; }
      case 'detTest': { const d = DETECTORS.find((z) => z.id === id); const f = S.drawer.f; const base = d.th[0][1] || 1; f.test = Math.max(0, Math.round(d.hits * (base / Math.max(1, f.th[0])) * (0.9 + Math.random() * 0.2))); break; }
      case 'detSave': { const d = DETECTORS.find((z) => z.id === S.drawer.id); const f = S.drawer.f; const old = d.th.map((t) => t[1]).join(', '); d.th.forEach((t, i) => { t[1] = +f.th[i]; }); d.act = f.act; audit(ME, 'Detection rule changed', `${d.n} · ${old} → ${d.th.map((t) => t[1]).join(', ')} · ${ACTS[d.act]}`); S.drawer = null; toast('Saved and logged'); return; }
      case 'blockAdd': { const v = noteVal('#bkv'); if (!v) { toast('Enter what to block'); return; } BLOCKS.unshift({ k: root.querySelector('#bkk').value, v, why: noteVal('#bkw') || 'Added by hand', by: ME, d: 'Nov 22' }); audit(ME, 'Blocked', v); toast('Blocked'); return; }
      case 'blockDel': { const b = BLOCKS.splice(+el.dataset.i, 1)[0]; audit(ME, 'Unblocked', b.v); toast('Removed from the Blocklist'); return; }
      case 'exportAudit': toast(`Exported ${AUDIT.length} entries`); return;
      case 'setT': S.set[k] = !S.set[k]; audit(ME, 'Setting changed', k); break;
      case 'setV': S.set[k] = el.dataset.v; audit(ME, 'Setting changed', `${k} · ${el.dataset.v}`); break;
      default: { const r = extClick(a, el) || PI.click(a, el); if (!r) return; if (r === 'noRender') { render(); return; } }
    }
    render();
  });
  function confirmFail(p) { if (p.forced) return true; p.forced = true; toast(`${p.fail.length} check${p.fail.length > 1 ? 's' : ''} failed. Press Approve again to approve anyway.`); return false; }
  root.addEventListener('input', (ev) => { const el = ev.target; const lv = el.dataset.live; if (!lv) return; if (lv === 'acq') S.acq = el.value; else if (lv === 'tq') S.tq = el.value; else if (lv === 'tfq') S.tf.q = el.value; else if (lv === 'gq') S.gq = el.value; else return; S.focus = { k: el.dataset.key, s: el.selectionStart }; render(); });
  root.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.id === 'mnavsel') { const x = AREAS.find((y) => 'a:' + y.id === el.value); if (!x) return; S.view = lastTab[x.id] || x.tabs[0][0]; S.drawer = null; render(); const m = root.querySelector('.main'); if (m) m.scrollTop = 0; return; }
    if (extChange(el) || PI.change(el)) { render(); return; }
    if (S.drawer && el.dataset.df) { const k = el.dataset.df; if (k.startsWith('th')) S.drawer.f.th[+k.slice(2)] = +el.value; else S.drawer.f[k] = el.value; return; }
    const b = el.dataset.bind; if (!b) return;
    if (b === 'acs') S.acs = el.value; else if (b === 'alt') S.alt = el.value;
    else if (b.startsWith('det.')) { const d = DETECTORS.find((z) => z.id === el.dataset.id); d[b.slice(4)] = el.value; audit(ME, 'Detection rule changed', `${d.n} · ${b.slice(4) === 'sev' ? 'severity ' + SEV[el.value][0] : ACTS[el.value]}`); toast('Saved and logged'); return; }
    else if (b.startsWith('set.')) { const k = b.slice(4); S.set[k] = el.type === 'number' ? +el.value : el.value; audit(ME, 'Setting changed', k); }
    render();
  });
  document.addEventListener('keydown', (ev) => { if (!root.isConnected) return; if (ev.key === 'Escape' && (S.drawer || S.gq)) { S.drawer = null; S.gq = ''; render(); } });

  function ROUTE(hv, P) { if (hv) S.view = hv; if (P.acct) S.drawer = { kind: 'acct', id: P.acct }; if (P.alert) S.drawer = { kind: 'alert', id: P.alert }; if (P.payout) S.drawer = { kind: 'payout', id: P.payout }; }
  // deep links: Board.dc.html#view?key=value
  const DEEP = () => { try { const raw = decodeURIComponent((location.hash || '').slice(1)); if (!raw) return; const [hv, hq] = raw.split('?'); const P = {}; (hq || '').split('&').forEach((kv) => { const [k, v] = kv.split('='); if (k) P[k] = v || ''; }); ROUTE(hv, P); } catch (e) { /* no deep link */ } };
  DEEP();
  window.addEventListener('hashchange', () => { if (!root.isConnected) return; if ('drawer' in S) S.drawer = null; DEEP(); render(); const mm = root.querySelector('.main'); if (mm) mm.scrollTop = 0; });
  render();

}
