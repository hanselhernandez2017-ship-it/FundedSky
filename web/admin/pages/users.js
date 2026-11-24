
function startUsers(root) {

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
  const RV2 = '[Second Reviewer]';
  const PROV = 'Sumsub';
  const rng = (seed) => { let h = 2166136261; for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; };
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const FULL = ['Jane Dalton', 'Marcus Torres', 'Priya Shah', 'Diego Romero', 'Amara Okafor', 'Kenji Mori', 'Sofia Lopez', 'Liam Keller', 'Noah Brooks', 'Elena Volkova', 'Omar Haddad', 'Chen Wang', 'Lucas Pereira', 'Hana Kim', 'Ivan Petrov', 'Zoe Adler', 'Mateo Garcia', 'Aisha Nwosu', 'Felix Bauer', 'Grace Taylor', 'Arjun Rao', 'Nina Schulz', 'Theo Martin', 'Yara Farah', 'Jonas Eriksson', 'Maya Cruz',
    'Ethan Cole', 'Lina Haddou', 'Ravi Menon', 'Clara Novak', 'Tomas Silva', 'Mei Tanaka', 'Samuel Osei', 'Freya Lund', 'Pablo Ortiz', 'Ines Duarte', 'Kofi Mensah', 'Anya Ivanova'];
  const CTRY = ['United States', 'United Kingdom', 'India', 'Mexico', 'Nigeria', 'Japan', 'Spain', 'Canada', 'Australia', 'Germany', 'UAE', 'Singapore', 'Brazil', 'South Korea', 'Poland', 'Poland', 'Argentina', 'Kenya', 'Netherlands', 'Philippines', 'India', 'Italy', 'Ireland', 'Turkey', 'Sweden', 'Chile',
    'United States', 'France', 'India', 'Czechia', 'Portugal', 'Japan', 'Ghana', 'Norway', 'Colombia', 'Portugal', 'Ghana', 'Cyprus'];
  const CITY = { 'United States': 'Austin', 'United Kingdom': 'Manchester', India: 'Pune', Mexico: 'Guadalajara', Nigeria: 'Lagos', Japan: 'Osaka', Spain: 'Valencia', Canada: 'Toronto', Australia: 'Brisbane', Germany: 'Hamburg', UAE: 'Dubai', Singapore: 'Singapore', Brazil: 'São Paulo', 'South Korea': 'Busan', Poland: 'Kraków', Argentina: 'Córdoba', Kenya: 'Nairobi', Netherlands: 'Utrecht', Philippines: 'Cebu', Italy: 'Turin', Ireland: 'Cork', Turkey: 'Izmir', Sweden: 'Gothenburg', Chile: 'Santiago', France: 'Lyon', Czechia: 'Brno', Portugal: 'Porto', Ghana: 'Accra', Norway: 'Bergen', Colombia: 'Medellín', Cyprus: 'Limassol' };
  const TZ = { 'United States': 'Central Time', 'United Kingdom': 'London', India: 'India Time', Mexico: 'Central Time', Japan: 'Tokyo', Australia: 'Brisbane', Canada: 'Eastern Time', UAE: 'Dubai', Singapore: 'Singapore', Brazil: 'São Paulo', 'South Korea': 'Seoul', Argentina: 'Buenos Aires', Philippines: 'Manila', Chile: 'Santiago', Colombia: 'Bogotá' };
  const PLANS = [['[Plan A Name]', [25000, 50000]], ['[Plan B Name]', [50000, 100000, 150000]], ['[Plan C Name]', [25000, 50000, 100000]]];
  const PRICE = { 25000: 99, 50000: 149, 100000: 249, 150000: 349 };
  const PLATS = ['Tradovate', 'NinjaTrader', 'TradingView', 'Rithmic'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dnum = (w) => { if (!w || /Today|Just now/.test(w)) return 9e12; const p = w.replace(',', '').split(' '); return new Date(/\d{4}$/.test(w) ? +w.slice(-4) : 2026, MON.indexOf(p[0]), +p[1]).getTime(); };
  const day = (ago) => { const d = new Date(2026, 10, 22 - ago); return `${MON[d.getMonth()]} ${d.getDate()}${d.getFullYear() !== 2026 ? ', ' + d.getFullYear() : ''}`; };

  // KYC stories: uid index -> details
  const KYC_STORY = {
    14: { st: 'pending', why: 'Face Match Below Threshold', sev: 'md', wait: 3, fail: ['face'], face: 71 },
    15: { st: 'pending', why: 'Name on Document Differs', sev: 'md', wait: 5, warn: ['name'], docName: 'Zoë Adler-Brandt' },
    10: { st: 'pending', why: 'Possible Sanctions Match', sev: 'hi', wait: 1, fail: ['sanctions'] },
    16: { st: 'pending', why: 'Document Used on Another Account', sev: 'hi', wait: 2, fail: ['dup'], dupOf: 'U-10431' },
    12: { st: 'pending', why: 'Document Expires in 9 Days', sev: 'lo', wait: 7, warn: ['expiry'] },
    13: { st: 'pending', why: 'Review Asked For by Risk', sev: 'md', wait: 11, warn: ['manual'] },
    27: { st: 'pending', why: 'Address Could Not Be Matched', sev: 'lo', wait: 14, warn: ['address'] },
    19: { st: 'resubmit', why: 'Proof of Address Older Than 90 Days', sev: 'lo', wait: 26, fail: ['address'] },
    31: { st: 'resubmit', why: 'Photo of ID Too Blurry', sev: 'lo', wait: 30, fail: ['doc'] },
    37: { st: 'rejected', why: 'Document Looks Edited', sev: 'hi', wait: 0, fail: ['doc', 'face'] },
    33: { st: 'none' }, 34: { st: 'none' }, 35: { st: 'started' }, 30: { st: 'none' }
  };

  const USERS = FULL.map((name, i) => {
    const r = rng('u' + i); const ctry = CTRY[i]; const [f, l] = name.split(' ');
    const ks = KYC_STORY[i] || { st: 'verified' };
    const joined = Math.floor(20 + r() * 380); const nAcc = ks.st === 'none' ? (r() < 0.5 ? 0 : 1) : 1 + Math.floor(r() * 4);
    const funded = ks.st === 'verified' ? Math.min(nAcc, Math.floor(r() * 3)) : 0;
    const spent = nAcc * 149 + Math.floor(r() * 6) * 79; const paid = funded ? Math.round((800 + r() * 9000) / 10) * 10 : 0;
    return {
      id: 'U-' + (10400 + i * 3 + (i > 9 ? 1 : 0)), i, name, short: `${f} ${l[0]}.`, email: `${f.toLowerCase()}.${l.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
      phone: '+' + ({ 'United States': 1, Canada: 1, 'United Kingdom': 44, India: 91, Mexico: 52, Nigeria: 234, Japan: 81, Spain: 34, Australia: 61, Germany: 49, UAE: 971, Singapore: 65, Brazil: 55, 'South Korea': 82, Poland: 48, Argentina: 54, Kenya: 254, Netherlands: 31, Philippines: 63, Italy: 39, Ireland: 353, Turkey: 90, Sweden: 46, Chile: 56, France: 33, Czechia: 420, Portugal: 351, Ghana: 233, Norway: 47, Colombia: 57, Cyprus: 357 }[ctry] || 1) + ' ••• ••• ' + String(1000 + Math.floor(r() * 8999)),
      dob: `${MON[Math.floor(r() * 12)]} ${1 + Math.floor(r() * 27)}, ${1972 + Math.floor(r() * 30)}`,
      ctry, city: CITY[ctry] || '—', tz: TZ[ctry] || ctry, joinedAgo: joined, joined: day(joined), lastAgo: i === 37 ? 34 : Math.floor(r() * (i % 5 === 0 ? 20 : 3)),
      st: i === 37 ? 'Banned' : i === 22 ? 'Locked' : i === 29 ? 'Closed' : 'Active',
      kyc: ks.st, ks, spent, paid, nAcc, funded, risk: Math.round(8 + r() * 50 + (ks.sev === 'hi' ? 35 : 0)),
      via: pick(r, ['Email', 'Email', 'Google', 'Apple']), aff: r() < 0.35 ? pick(r, ['TRADEWITHSAM', 'FUTURESDAILY', 'NQKING', 'SKYHIGH']) : '', twofa: r() < 0.62, mkt: r() < 0.55,
      lang: pick(r, ['English', 'English', 'English', 'Spanish', 'Portuguese']),
      tags: i === 0 ? ['VIP'] : i === 7 ? ['Watchlist'] : i === 37 ? ['Fraud'] : i === 11 ? ['Copy Trading Alert'] : i === 4 ? ['Affiliate'] : [],
      notes: i === 7 ? [['[Risk Reviewer]', 'Nov 20', 'Hedging alert RK-1182 open. Hold payouts until it is closed.']] : i === 0 ? [['[Support Agent]', 'Nov 3', 'Long-time customer. Has bought 9 evaluations. Be generous with resets.']] : [],
      locked: i === 22 ? { why: 'Too many failed sign-ins', when: 'Nov 22, 9:14 AM' } : null
    };
  });
  // linked dup account
  const DUPID = 'U-10431';

  const uById = (id) => USERS.find((u) => u.id === id);

  // lazily built detail
  function detail(u) {
    if (u.d) return u.d; const r = rng('d' + u.id); const d = {};
    const j = u.joinedAgo; const T = { fe: Math.max(0, j - 3) }; T.pass = Math.round(T.fe * 0.55); T.kyc = Math.max(0, T.pass - 2); T.fund = Math.max(0, T.kyc - 1); T.pay = Math.max(0, T.fund - 9); d.T = T;
    d.accts = Array.from({ length: u.nAcc }, (_, k) => { const [pn, sz] = pick(r, PLANS); const size = pick(r, sz); const isF = k < u.funded; const st = isF ? 'Funded' : pick(r, ['Active', 'Active', 'Passed', 'Breached', 'Expired']);
      return { id: `FS-${isF ? 'F-' : ''}${size / 1000}K-${10300 + Math.floor(r() * 140)}`, plan: pn, size, plat: pick(r, PLATS), st, bal: size + Math.round((r() - 0.4) * size * 0.05), started: day(isF ? T.fund : Math.round(T.fe * (1 - k / Math.max(1, u.nAcc)))), bought: day(Math.round(T.fe * (1 - k / Math.max(1, u.nAcc)))) }; });
    let ago = u.joinedAgo;
    d.orders = d.accts.map((a, k) => ({ id: 'ORD-' + (58200 + Math.floor(r() * 900)), when: a.bought, item: `${a.plan} ${a.size / 1000}K Evaluation`, amt: PRICE[a.size], method: k % 3 === 2 ? 'PayPal' : `${pick(r, ['Visa', 'Mastercard', 'Amex'])} •• ${4000 + Math.floor(r() * 5999)}`, st: 'Paid' }));
    if (u.spent > d.orders.reduce((s, o) => s + o.amt, 0)) d.orders.push({ id: 'ORD-' + (58200 + Math.floor(r() * 900)), when: day(Math.round(T.fe * 0.4)), item: 'Reset After Breach', amt: 79, method: d.orders[0] ? d.orders[0].method : 'Visa •• 4242', st: 'Paid' });
    if (u.i === 11) d.orders.push({ id: 'ORD-58911', when: day(9), item: '[Plan B Name] 100K Evaluation', amt: 249, method: 'Visa •• 8841', st: 'Chargeback' });
    if (u.i === 3) { const o = d.orders[0]; if (o) o.st = 'Refunded'; }
    d.orders.sort((a, b) => dnum(b.when) - dnum(a.when));
    d.methods = [...new Set(d.orders.map((o) => o.method))];
    d.payouts = u.funded ? Array.from({ length: Math.max(1, Math.min(4, Math.floor(T.pay / 14) + 1)) }, (_, k) => ({ id: 'PO-' + (3200 + Math.floor(r() * 120)), when: day(Math.max(0, T.pay - (Math.max(1, Math.min(4, Math.floor(T.pay / 14) + 1)) - 1 - k) * 14)), amt: Math.round((300 + r() * 2600) / 10) * 10, st: k === 0 && u.i === 7 ? 'On Hold' : 'Paid', to: u.i % 2 ? 'USDC Wallet 0x7a…c41e' : 'Bank •• 6620' })) : [];
    d.payoutMethod = u.funded ? (u.i % 2 ? 'USDC Wallet 0x7a…c41e' : 'Bank •• 6620') : '';
    d.tax = u.funded ? (u.ctry === 'United States' ? 'W-9 on File' : 'W-8BEN on File') : 'Not Needed Yet';
    const cities = [u.city, u.city, u.city, u.i === 7 ? 'Amsterdam (VPN)' : u.city];
    d.sessions = Array.from({ length: 6 }, (_, k) => ({ when: k === 0 ? (u.lastAgo ? day(u.lastAgo) + ', 8:12 PM' : 'Today, ' + (9 + k) + ':' + String(10 + k * 7).padStart(2, '0') + ' AM') : day(u.lastAgo + k * 2) + ', ' + (1 + Math.floor(r() * 11)) + ':' + String(Math.floor(r() * 59)).padStart(2, '0') + ' PM',
      ip: `${Math.floor(20 + r() * 180)}.${Math.floor(r() * 255)}.${Math.floor(r() * 255)}.${Math.floor(r() * 255)}`, loc: `${cities[k % 4]}, ${u.ctry}`, dev: pick(r, ['Chrome on Windows', 'Safari on iPhone', 'Chrome on Mac', 'Edge on Windows', 'App on Android']), vpn: u.i === 7 && k % 4 === 3, ok: !(u.i === 22 && k < 3), live: k < (u.st === 'Active' ? 2 : 0) }));
    d.devices = [...new Set(d.sessions.map((s) => s.dev))].map((dv, k) => ({ dev: dv, fp: 'DV-' + (u.id.slice(2) * 7 + k).toString(16).toUpperCase(), first: day(u.joinedAgo - k * 9), shared: (u.i === 11 && k === 0) ? ['Omar Haddad', 'Marcus Torres'] : (u.i === 16 && k === 0) ? ['Unknown Account ' + DUPID] : [] }));
    d.agree = [['Terms of Service', 'Version 3.2', day(Math.min(u.joinedAgo, 40)), true], ['Privacy Policy', 'Version 2.4', day(Math.min(u.joinedAgo, 40)), true], ['Risk Disclosure', 'Version 1.6', day(u.joinedAgo), true], ['Refund Policy', 'Version 1.3', day(u.joinedAgo), true], ['Funded Trader Agreement', 'Version 2.1', u.funded ? day(T.fund) : '', !!u.funded], ['Marketing Emails', u.mkt ? 'Opted In' : 'Opted Out', day(u.joinedAgo), u.mkt]];
    d.tickets = Array.from({ length: Math.floor(r() * 4) }, (_, k) => ({ id: 'T-' + (4800 + Math.floor(r() * 400)), subj: pick(r, ['Where Is My Login for Tradovate', 'Reset After Breach Question', 'Payout Timing', 'Change My Email', 'Daily Loss Limit Question', 'Refund Request', 'KYC Document Rejected']), when: day(2 + k * 11), st: k === 0 && r() < 0.5 ? 'Open' : 'Solved' }));
    d.emails = [['Welcome to Funded Sky', day(u.joinedAgo), 'Opened'], ['Your Evaluation Is Ready', day(T.fe), 'Opened'], ...(u.funded ? [['You Passed', day(T.pass), 'Opened'], ['Payout Sent', day(3), 'Delivered']] : []), ...(u.kyc === 'resubmit' ? [['We Need New Documents', day(u.ks.wait), 'Opened']] : []), ['Weekly Recap', day(1), 'Delivered']];
    // activity
    const ev = [];
    ev.push(['acct', day(u.joinedAgo), `Signed up with ${u.via}`, u.aff ? `Affiliate code ${u.aff}` : 'No affiliate']);
    d.orders.forEach((o) => ev.push(['money', o.when, `${o.st === 'Paid' ? 'Bought' : o.st} ${o.item}`, `${'$' + o.amt} · ${o.method}`]));
    d.accts.forEach((a) => { ev.push(['trade', a.started, `Started ${a.id}`, `${a.plan} · ${a.plat}`]); if (a.st === 'Breached') ev.push(['trade', day(Math.max(0, Math.round(T.fe * 0.5))), `${a.id} Breached`, 'Daily loss limit']); if ((a.st === 'Passed' || a.st === 'Funded') && !ev.some((e) => / Passed$/.test(e[2]))) ev.push(['trade', day(T.pass), `Evaluation Passed`, 'Profit target reached in ' + (5 + Math.floor(r() * 12)) + ' days']); });
    d.payouts.forEach((p) => ev.push(['money', p.when, `Payout ${p.st === 'Paid' ? 'Paid' : p.st}`, `$${p.amt.toLocaleString('en-US')} to ${p.to}`]));
    if (u.kyc !== 'none') ev.push(['security', day(u.kyc === 'verified' ? T.kyc : Math.floor((u.ks.wait || 0) / 24)), 'Sent KYC Documents', `Passport and selfie through ${PROV}`]);
    if (u.kyc === 'verified') ev.push(['security', day(T.kyc), 'KYC Verified', 'All checks passed automatically']);
    if (u.twofa) ev.push(['security', day(Math.max(0, u.joinedAgo - 2)), 'Turned On Two-Factor Sign-In', 'Authenticator app']);
    d.tickets.forEach((t) => ev.push(['support', t.when, `Opened Ticket ${t.id}`, t.subj]));
    if (u.locked) ev.push(['security', 'Today', 'Account Locked', '5 failed sign-ins in 10 minutes']);
    u.notes.forEach((n) => ev.push(['staff', n[1], 'Note Added by ' + n[0], n[2]]));
    ev.push(['security', u.lastAgo ? day(u.lastAgo) : 'Today', 'Signed In', d.sessions[0].dev + ' · ' + d.sessions[0].loc]);
    const ord = (w) => (w === 'Today' ? -Date.UTC(2026, 10, 23) : (() => { const [m, dd] = w.replace(',', '').split(' '); const y = /\d{4}$/.test(w) ? +w.slice(-4) : 2026; return -(new Date(y, MON.indexOf(m), +dd).getTime()); })());
    d.act = ev.sort((a, b) => ord(a[1]) - ord(b[1]));
    d.staffLog = [[day(1), '[Support Agent]', 'Opened Profile', 'From ticket'], [day(u.lastAgo + 4), '[Risk Reviewer]', 'Opened Profile', 'From alert'], ...(u.kyc === 'verified' ? [[day(T.kyc), PROV, 'KYC Approved Automatically', 'All checks passed']] : [])];
    // KYC
    const ks = u.ks; const fl = (k) => (ks.fail || []).includes(k) ? 'f' : (ks.warn || []).includes(k) ? 'w' : '';
    d.kyc = u.kyc === 'none' ? null : {
      ref: 'KYC-' + (88000 + u.i * 37), level: u.funded || u.kyc !== 'verified' ? 'Full: ID, Selfie and Address' : 'Full: ID, Selfie and Address', when: day(ks.st === 'verified' ? T.kyc : Math.floor((ks.wait || 0) / 24)), docType: pick(r, ['Passport', 'Passport', 'Driver License', 'National ID']),
      docNo: '•••• ' + (1000 + Math.floor(r() * 8999)), expiry: u.i === 12 ? 'Dec 1, 2026' : `${MON[Math.floor(r() * 12)]} ${1 + Math.floor(r() * 27)}, ${2028 + Math.floor(r() * 6)}`, face: ks.face || 92 + Math.floor(r() * 7), docName: ks.docName || u.name,
      checks: [
        ['doc', 'Document Is Real', fl('doc') === 'f' ? (u.i === 37 ? 'Fonts and edges show signs of editing' : 'Too blurry to read the security features') : 'Security features found, no signs of editing'],
        ['expiry', 'Document Not Expired', fl('expiry') ? 'Expires Dec 1, 2026, in 9 days' : 'Valid for more than 6 months'],
        ['face', 'Face Matches Document', fl('face') ? `Match score ${ks.face || 58}%, needs 85%` : `Match score ${ks.face || 95}%`],
        ['live', 'Live Person', 'Head-turn check passed'],
        ['name', 'Name Matches Account', fl('name') ? `Document says ${ks.docName}` : 'Exact match'],
        ['age', 'Over 18', 'Born ' + u.dob],
        ['address', 'Address Verified', fl('address') === 'f' ? 'Bank statement dated 4 months ago' : fl('address') ? 'Utility bill name matches, street not found' : 'Bank statement from the last 90 days'],
        ['sanctions', 'Sanctions and Politically Exposed Lists', fl('sanctions') ? 'Name is 88% similar to one entry. Date of birth differs.' : 'No matches'],
        ['media', 'Negative News', 'Nothing found'],
        ['country', 'Country Allowed', u.ctry + ' is allowed'],
        ['dup', 'Same Identity on Another Account', fl('dup') ? `Passport number also used on ${ks.dupOf}` : 'No other account']
      ].map(([k, n, s]) => ({ k, n, s, r: fl(k) || (k === 'manual' ? 'w' : '') })),
      history: [[day(ks.st === 'verified' ? T.kyc : Math.floor((ks.wait || 0) / 24)), ks.st === 'verified' ? 'Approved Automatically' : ks.st === 'resubmit' ? 'New Documents Asked For' : ks.st === 'rejected' ? 'Rejected' : 'Sent to Manual Review', ks.why || 'All checks passed'], ...(u.i === 19 ? [[day(40), 'First Attempt', 'Approved ID, address failed']] : []), [day(ks.st === 'verified' ? T.kyc : Math.floor((ks.wait || 0) / 24)), 'Documents Sent', 'Through ' + PROV]]
    };
    u.d = d; return d;
  }

  const CHANGES = [
    { id: 'CR-301', uid: USERS[6].id, type: 'Email Change', from: 'sofia.lopez@example.com', to: 'sofia.l.trading@example.com', when: 'Today, 10:42 AM', needs: 'Confirmed on both addresses', st: 'open' },
    { id: 'CR-300', uid: USERS[15].id, type: 'Name Change', from: 'Zoe Adler', to: 'Zoë Adler-Brandt', when: 'Today, 9:05 AM', needs: 'Matches new KYC document', st: 'open' },
    { id: 'CR-299', uid: USERS[1].id, type: 'Payout Method Change', from: 'Bank •• 2210', to: 'USDC Wallet 0x19…ab03', when: 'Yesterday', needs: 'Second approver, 48-hour hold', st: 'open', two: true },
    { id: 'CR-298', uid: USERS[8].id, type: 'Two-Factor Reset', from: 'Authenticator app', to: 'None', when: 'Yesterday', needs: 'Selfie check passed', st: 'open' },
    { id: 'CR-297', uid: USERS[20].id, type: 'Country Change', from: 'India', to: 'United Arab Emirates', when: 'Nov 20', needs: 'New proof of address', st: 'open' },
    { id: 'CR-296', uid: USERS[24].id, type: 'Address Change', from: 'Gothenburg', to: 'Stockholm', when: 'Nov 19', needs: 'None', st: 'approved' },
    { id: 'CR-295', uid: USERS[2].id, type: 'Phone Change', from: '+91 ••• ••• 4410', to: '+91 ••• ••• 9032', when: 'Nov 18', needs: 'Text code confirmed', st: 'approved' },
    { id: 'CR-294', uid: USERS[17].id, type: 'Name Change', from: 'Aisha Nwosu', to: 'Aisha Bello', when: 'Nov 15', needs: 'Matches new KYC document', st: 'denied' }
  ];
  const DATAREQ = [
    { id: 'DR-41', uid: USERS[29].id, type: 'Delete My Account', when: 'Nov 12', due: 'Dec 12', st: 'open', note: 'Closed account. Trading and payment records are kept 5 years for anti-money-laundering law.' },
    { id: 'DR-40', uid: USERS[23].id, type: 'Copy of My Data', when: 'Nov 19', due: 'Dec 19', st: 'open', note: '' },
    { id: 'DR-39', uid: USERS[9].id, type: 'Copy of My Data', when: 'Nov 2', due: 'Dec 2', st: 'done', note: 'Sent as a download link, expires in 7 days.' },
    { id: 'DR-38', uid: USERS[26].id, type: 'Stop Marketing Emails', when: 'Oct 28', due: 'Nov 27', st: 'done', note: '' }
  ];
  const AUDIT = [
    ['Today, 11:02 AM', '[KYC Reviewer]', 'Viewed Documents', `${USERS[19].name} · reason: KYC review`],
    ['Today, 10:31 AM', '[Support Agent]', 'Reset Password Link Sent', USERS[5].name],
    ['Today, 9:14 AM', 'System', 'Account Locked', `${USERS[22].name} · 5 failed sign-ins`],
    ['Yesterday', '[Risk Reviewer]', 'Logged In As User', `${USERS[7].name} · view only · reason: hedging alert RK-1182`],
    ['Yesterday', '[KYC Reviewer] and ' + RV2, 'KYC Rejected', `${USERS[37].name} · document looks edited`],
    ['Nov 20', '[Admin]', 'User Banned', `${USERS[37].name} · two approvals`],
    ['Nov 20', '[Support Agent]', 'Email Changed', `${USERS[24].name}`],
    ['Nov 19', '[Admin]', 'Role Changed', '[Support Agent] can now see documents'],
    ['Nov 18', '[Finance]', 'Exported Users', '1,204 rows · reason: monthly report']
  ];
  const ROLES = [
    ['Owner', [1, 1, 1, 1, 1, 1, 1, 1]], ['Admin', [1, 1, 1, 1, 1, 1, 0, 1]], ['KYC Reviewer', [1, 0, 1, 1, 0, 0, 0, 0]],
    ['Risk', [1, 0, 1, 0, 1, 1, 0, 0]], ['Support', [1, 1, 0, 0, 1, 1, 0, 0]], ['Finance', [1, 0, 0, 0, 0, 0, 0, 1]]
  ];
  const PERMS = ['See Users', 'Edit Details', 'See Documents', 'Approve KYC', 'Log In As User', 'Lock Accounts', 'Ban Users', 'Export Data'];
  const TEAM = [['[Your Name]', 'Owner', true, 'Today'], ['[Admin]', 'Admin', true, 'Today'], ['[KYC Reviewer]', 'KYC Reviewer', true, 'Today'], ['[Risk Reviewer]', 'Risk', true, 'Yesterday'], ['[Support Agent]', 'Support', true, 'Today'], ['[Support Agent 2]', 'Support', false, 'Nov 18'], ['[Finance]', 'Finance', true, 'Nov 18']];
  const COUNTRIES_BLOCKED = ['Cuba', 'Iran', 'North Korea', 'Syria', 'Russia', 'Belarus', 'Crimea Region'];
  const DOCS = [['Passport', true, 'All countries'], ['Driver License', true, 'Most countries'], ['National ID Card', true, 'Most countries'], ['Residence Permit', true, 'With passport'], ['Bank Statement', true, 'Proof of address, last 90 days'], ['Utility Bill', true, 'Proof of address, last 90 days'], ['Tax Letter', false, 'Proof of address'], ['Phone Bill', false, 'Proof of address']];
  USERS.forEach((u) => { const d = detail(u); u.spent = d.orders.filter((o) => o.st === 'Paid').reduce((a, o) => a + o.amt, 0); u.paid = d.payouts.filter((p) => p.st === 'Paid').reduce((a, p) => a + p.amt, 0); });

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const XL = (board, hash, label, cls) => `<a class="${cls || 'lnk'}" href="Admin${board}.dc.html${hash ? '#' + hash : ''}">${label}</a>`;
  const money = (v) => (v < 0 ? '−' : '') + '$' + Math.abs(Math.round(v)).toLocaleString('en-US');
  const S = { view: 'overview', uid: null, ptab: 'overview', from: null, drawer: null, uq: '', uf: 'all', us: 'recent', kq: 'pending', af: 'all', reveal: {}, imp: null, menu: false, toast: '', focus: null, gq: '', auf: 'all',
    set: { when: 'payout', auto: true, faceMin: 85, poaDays: 90, ongoing: true, media: true, addr: true, retain: '5', timeout: '30', lockAfter: 5, staff2fa: true, mask: true, reason: true } };
  const KST = { verified: ['Verified', 'live'], pending: ['Waiting for Review', 'sched'], resubmit: ['New Documents Asked', 'draft'], rejected: ['Rejected', 'err'], none: ['Not Started', 'ended'], started: ['In Progress', 'plain'] };
  const UST = { Active: 'live', Locked: 'draft', Banned: 'err', Closed: 'ended' };
  const SEV = { hi: ['High', 'err'], md: ['Medium', 'draft'], lo: ['Low', 'plain'] };
  const audit = (who, what, det) => AUDIT.unshift(['Just now', who, what, det]);
  const u0 = () => uById(S.uid);
  const ini = (n) => n.split(' ').map((x) => x[0]).join('').slice(0, 2);
  const kycQ = () => USERS.filter((u) => u.kyc === 'pending').sort((a, b) => ({ hi: 0, md: 1, lo: 2 }[a.ks.sev] - { hi: 0, md: 1, lo: 2 }[b.ks.sev]) || b.ks.wait - a.ks.wait);
  const openCh = () => CHANGES.filter((c) => c.st === 'open');
  const openDr = () => DATAREQ.filter((c) => c.st === 'open');
  const ub = (u) => `<span class="b ${UST[u.st]}">${u.st}</span>`;
  const kb = (u) => `<span class="b ${KST[u.kyc][1]}">${KST[u.kyc][0]}</span>`;
  const ulink = (id) => { const u = uById(id); return u ? `<button class="lnk" data-act="user" data-id="${u.id}">${esc(u.name)}</button>` : `<span class="mono">${esc(id)}</span>`; };
  const sw = (k, l, sub) => `<div class="srow"><span>${l}${sub ? `<small class="hint" style="display:block;margin-top:2px">${sub}</small>` : ''}</span><button class="sw ${S.set[k] ? 'on' : ''}" role="switch" aria-checked="${!!S.set[k]}" aria-label="${l}" data-act="setT" data-k="${k}"><i></i></button></div>`;

  // ---------- nav ----------
  const pend = (n) => n || null;
  const AREAS = [
    { h: 'Daily Work' },
    { id: 'ov', n: 'Overview', tabs: [['overview', 'Overview']] },
    { id: 'usr', n: 'Users', b: () => USERS.length, tabs: [['users', 'All Users']] },
    { id: 'kyc', n: 'KYC Reviews', bad: true, b: () => pend(kycQ().length), tabs: [['kycq', 'Review Queue', () => kycQ().length], ['kycall', 'All Checks']] },
    { id: 'req', n: 'Requests', b: () => pend(openCh().length + openDr().length), tabs: [['changes', 'Account Changes', () => openCh().length], ['data', 'Privacy Requests', () => openDr().length]] },
    { h: 'Setup' },
    { id: 'kset', n: 'KYC Setup', tabs: [['kprov', 'Provider and Checks'], ['kctry', 'Countries'], ['kdocs', 'Accepted Documents']] },
    { id: 'staff', n: 'Staff Access', tabs: [['roles', 'Roles'], ['team', 'Team']] },
    { id: 'aud', n: 'Audit Log', tabs: [['audit', 'Audit Log']] },
    { id: 'set', n: 'Settings', tabs: [['settings', 'Settings']] }];
  const areaOf = (v) => (v === 'user' ? AREAS[2] : AREAS.find((x) => x.tabs && x.tabs.some((t) => t[0] === v)) || AREAS[1]);
  const lastTab = {};
  const navHtml = () => { const cur = areaOf(S.view); return AREAS.map((x) => { if (x.h) return `<h6>${x.h}</h6>`; const c = x.b && x.b(); return `<button class="ni ${cur === x ? 'on' : ''}" data-act="area" data-k="${x.id}">${x.n}${c != null ? `<i class="${x.bad && c ? 'bad' : ''}">${c}</i>` : ''}</button>`; }).join(''); };
  const mnavHtml = () => { const cur = areaOf(S.view); let o = ''; let open = false; AREAS.forEach((x) => { if (x.h) { if (open) o += '</optgroup>'; o += `<optgroup label="${x.h}">`; open = true; } else { const c = x.b && x.b(); o += `<option value="a:${x.id}" ${cur === x ? 'selected' : ''}>${x.n}${c != null ? ' (' + c + ')' : ''}</option>`; } }); return o + '</optgroup>'; };
  const subtabs = () => { if (S.view === 'user') return ''; const x = areaOf(S.view); lastTab[x.id] = S.view; if (x.tabs.length < 2) return ''; return `<div class="subt" role="tablist" aria-label="${x.n}">${x.tabs.map((t) => { const c = t[2] && t[2](); return `<button role="tab" aria-selected="${S.view === t[0]}" class="${S.view === t[0] ? 'on' : ''}" data-act="go" data-v="${t[0]}">${t[1]}${c != null ? `<i>${c}</i>` : ''}</button>`; }).join('')}</div>`; };

  // ---------- overview ----------
  function vOverview() {
    const n = USERS.length; const ver = USERS.filter((u) => u.kyc === 'verified').length;
    const funnel = [['Signed Up', 1204], ['Bought an Evaluation', 1012], ['Passed an Evaluation', 241], ['Started KYC', 228], ['Verified', 209], ['Got a First Payout', 162]];
    const sign = [38, 41, 29, 52, 47, 33, 30, 44, 58, 61, 49, 40, 36, 57]; const mx = Math.max(...sign);
    const byC = {}; USERS.forEach((u) => { byC[u.ctry] = (byC[u.ctry] || 0) + 1; }); const topC = Object.entries(byC).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return `<div class="ph"><div><h1>Overview</h1><p>Who your customers are, where they are in the journey, and what is waiting on your team.</p></div></div>
      <div class="tiles t6">${[['Total Users', '1,204', 'users', '', `${n} shown in this sample`], ['Signed Up Today', '57', 'users', '', '+18% on last week'], ['Verified', '209', 'kycall', '', `${Math.round(ver / n * 100)}% of the sample`], ['Waiting for KYC Review', kycQ().length, 'kycq', 'warn', 'Oldest ' + Math.max(...kycQ().map((u) => u.ks.wait)) + ' hours'], ['Open Requests', openCh().length + openDr().length, 'changes', '', 'Changes and privacy'], ['Locked or Banned', USERS.filter((u) => ['Locked', 'Banned'].includes(u.st)).length, 'users', '', 'Open the list']].map(([l, v, go, c, s]) => `<button class="tile lk" data-act="go" data-v="${go}"><span>${l}</span><b class="${c}">${v}</b><small>${s}</small></button>`).join('')}</div>
      <div class="two"><div class="card m0"><div class="ch"><h3>Customer Journey</h3><span class="lab">All Time</span></div><div class="cb fg">${funnel.map(([l, v], i) => `<div><div class="rowl"><span>${l}</span><b>${v.toLocaleString('en-US')}${i ? `<em class="hint"> · ${Math.round(v / funnel[i - 1][1] * 100)}% of the step before</em>` : ''}</b></div><div class="split"><i style="width:${v / funnel[0][1] * 100}%"></i></div></div>`).join('')}</div></div>
      <div class="card m0"><div class="ch"><h3>Sign-Ups</h3><span class="lab">Last 14 Days</span></div><div class="cb"><div class="ubars">${sign.map((v, i) => `<div><i style="height:${v / mx * 100}%" title="${v} sign-ups"></i><span>${i % 2 ? '' : day(13 - i).replace(/^\w+ /, '')}</span></div>`).join('')}</div></div></div></div>
      <div class="two" style="margin-top:14px"><div class="card m0"><div class="ch"><h3>Where Users Are</h3><span class="lab">Sample</span></div><div class="cb fg">${topC.map(([c, v]) => `<div><div class="rowl"><span>${c}</span><b>${v}</b></div><div class="split"><i style="width:${v / topC[0][1] * 100}%"></i></div></div>`).join('')}</div></div>
      <div class="card m0"><div class="ch"><h3>KYC Results</h3><span class="lab">Last 30 Days</span></div><div class="cb"><div class="kv"><div><span>Approved Automatically</span><b>81%</b></div><div><span>Sent to a Person</span><b>16%</b></div><div><span>Rejected</span><b>3%</b></div><div><span>Average Time to a Decision</span><b>4 Minutes Automatic · 6 Hours by Hand</b></div><div><span>Cost per Check</span><b>[Price per Check]</b></div></div></div></div></div>`;
  }

  // ---------- users ----------
  function userList() { const q = S.uq.toLowerCase();
    let l = USERS.filter((u) => (S.uf === 'all' || (S.uf === 'kyc' ? ['pending', 'resubmit', 'none', 'started'].includes(u.kyc) : S.uf === 'funded' ? u.funded > 0 : u.st === S.uf)) && (!q || (u.name + u.email + u.id + u.ctry + u.phone).toLowerCase().includes(q)));
    const k = { recent: (u) => u.lastAgo, joined: (u) => u.joinedAgo, spent: (u) => -u.spent, paid: (u) => -u.paid, risk: (u) => -u.risk }[S.us]; return l.sort((a, b) => k(a) - k(b)); }
  function vUsers() { const l = userList();
    return `<div class="ph"><div><h1>Users</h1><p>Everyone with a Funded Sky login. Search by name, email, user ID, country or the last 4 digits of a phone number.</p></div><div class="act"><button class="pill" data-act="export">Export</button></div></div>
      <div class="card"><div class="ch lgf"><input type="search" placeholder="Search Name, Email, ID or Phone" value="${esc(S.uq)}" data-live="uq" data-key="uq" aria-label="Search users"><div class="seg">${[['all', 'All'], ['Active', 'Active'], ['funded', 'Funded'], ['kyc', 'KYC Not Done'], ['Locked', 'Locked'], ['Banned', 'Banned']].map(([k, n]) => `<button class="${S.uf === k ? 'on' : ''}" data-act="uf" data-k="${k}">${n}</button>`).join('')}</div><div class="r"><select data-bind="us" aria-label="Sort">${[['recent', 'Last Seen'], ['joined', 'Newest'], ['spent', 'Spent Most'], ['paid', 'Paid Out Most'], ['risk', 'Highest Risk Score']].map(([k, n]) => `<option value="${k}" ${S.us === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>
      <div class="tsc"><table class="t"><thead><tr><th>User</th><th>Country</th><th>Status</th><th>KYC</th><th class="num">Accounts</th><th class="num">Spent</th><th class="num">Paid Out</th><th class="num">Risk</th><th>Joined</th><th>Last Seen</th></tr></thead><tbody>${l.map((u) => `<tr class="lk" data-act="user" data-id="${u.id}"><td class="nw"><span class="uc"><span class="uav">${ini(u.name)}</span><span><b>${esc(u.name)}</b><span class="hint">${esc(u.email)}</span></span></span></td><td class="nw">${esc(u.ctry)}</td><td>${ub(u)}</td><td>${kb(u)}</td><td class="num">${u.nAcc}${u.funded ? `<span class="hint"> · ${u.funded} Funded</span>` : ''}</td><td class="num nw">${money(u.spent)}</td><td class="num nw">${money(u.paid)}</td><td class="num"><span class="sc ${u.risk >= 70 ? 'hi' : u.risk >= 45 ? 'md' : ''}">${u.risk}</span></td><td class="nw hint">${u.joined}</td><td class="nw hint">${u.lastAgo ? day(u.lastAgo) : 'Today'}</td></tr>`).join('') || `<tr><td colspan="10"><div class="empty">No users match.</div></td></tr>`}</tbody></table></div></div>
      <p class="hint">${l.length} of ${USERS.length} sample users. Personal details are partly hidden until you open a profile.</p>`; }

  // ---------- profile ----------
  const PT = [['overview', 'Overview'], ['journey', 'Journey'], ['identity', 'Identity'], ['accounts', 'Trading Accounts'], ['trading', 'Trading'], ['links', 'Connections'], ['payments', 'Payments'], ['payouts', 'Payouts'], ['activity', 'Activity'], ['logins', 'Sign-Ins and Devices'], ['agree', 'Agreements'], ['support', 'Support and Emails'], ['notes', 'Notes'], ['staff', 'Staff Views']];
  function vUser() {
    const u = u0(); const d = detail(u); const back = S.from === 'kycq' ? ['kycq', 'Review Queue'] : S.from === 'changes' ? ['changes', 'Account Changes'] : ['users', 'All Users'];
    const cnt = { identity: u.kyc === 'pending' ? '!' : null, accounts: d.accts.length, payments: d.orders.length, payouts: d.payouts.length || null, support: d.tickets.filter((t) => t.st === 'Open').length || null, notes: u.notes.length || null, links: ext(u, d).links.filter((l) => l.lvl === 'hi').length ? '!' : (ext(u, d).links.length || null) };
    return `<button class="lnk bk2" data-act="go" data-v="${back[0]}">← ${back[1]}</button>
      <div class="card uhd"><div class="uhd1"><span class="uav lg">${ini(u.name)}</span><div class="uhdn"><div class="il"><h1>${esc(u.name)}</h1>${ub(u)}${kb(u)}<span class="b plain">${ext(u, d).seg}</span>${u.tags.map((t) => `<span class="b plain">${esc(t)}</span>`).join('')}</div>
        <div class="uhdm"><span class="mono">${u.id}</span><span>${esc(u.email)}</span><span>${esc(u.city)}, ${esc(u.ctry)}</span><span>Joined ${u.joined}</span><span>Last Seen ${u.lastAgo ? day(u.lastAgo) : 'Today'}</span></div></div>
        <div class="uhda"><button class="pill" data-act="imp">Log In As User</button><button class="pill" data-act="drw" data-k="email">Send Email</button><div class="mwrap"><button class="pill" data-act="menu" aria-expanded="${S.menu}">More Actions <span aria-hidden="true">▾</span></button>${S.menu ? `<div class="menu" role="menu">${[['edit', 'Edit Details'], ['pw', 'Send Password Reset'], ['2fa', 'Reset Two-Factor Sign-In'], ['out', 'Sign Out Everywhere'], u.st === 'Locked' ? ['unlock', 'Unlock Account'] : ['lock', 'Lock Account'], ['exportu', 'Download All Data'], u.st === 'Banned' ? ['unban', 'Lift Ban'] : ['ban', 'Ban User']].map(([k, l]) => `<button role="menuitem" class="${['ban', 'lock'].includes(k) ? 'dng' : ''}" data-act="uact" data-k="${k}">${l}</button>`).join('')}</div>` : ''}</div></div></div>
        ${u.locked ? `<div class="ubn warn">Locked ${u.locked.when}: ${esc(u.locked.why)}. The user cannot sign in until you unlock the account.<button class="pill sm" data-act="uact" data-k="unlock">Unlock</button></div>` : ''}${u.notes[0] && u.st !== 'Banned' ? `<div class="ubn pin"><b>Pinned Note</b><span>${esc(u.notes[0][2])}</span><span class="hint">${esc(u.notes[0][0])} · ${u.notes[0][1]}</span></div>` : ''}${u.st === 'Banned' ? `<div class="ubn bad">Banned Nov 20 by two people: document looks edited. Their devices, cards and wallets are on the Risk blocklist.</div>` : ''}
      </div>
      <div class="subt" role="tablist" aria-label="Profile">${PT.map(([k, l]) => `<button role="tab" aria-selected="${S.ptab === k}" class="${S.ptab === k ? 'on' : ''}" data-act="ptab" data-k="${k}">${l}${cnt[k] != null ? `<i class="${cnt[k] === '!' ? 'bad' : ''}">${cnt[k]}</i>` : ''}</button>`).join('')}</div>
      ${({ journey: pJourney, overview: pOverview, identity: pIdentity, trading: pTrading, links: pLinks, accounts: pAccounts, payments: pPayments, payouts: pPayouts, activity: pActivity, logins: pLogins, agree: pAgree, support: pSupport, notes: pNotes, staff: pStaff })[S.ptab](u, d)}`;
  }
  const docSvg = (kind, u) => { const face = kind !== 'poa'; const name = esc(u.name);
    if (kind === 'selfie') return `<svg viewBox="0 0 240 150" class="udsvg"><rect width="240" height="150" rx="8" fill="#1A1D22"/><circle cx="120" cy="62" r="26" fill="#3A4250"/><path d="M68 150c6-34 28-50 52-50s46 16 52 50z" fill="#3A4250"/><text x="12" y="20" class="udt">Live Selfie · Sample</text></svg>`;
    if (kind === 'poa') return `<svg viewBox="0 0 240 150" class="udsvg"><rect width="240" height="150" rx="8" fill="#E9E6E1"/><rect x="16" y="16" width="70" height="10" rx="2" fill="#B8B2AA"/><text x="16" y="44" class="udk">${name}</text><rect x="16" y="52" width="110" height="6" rx="2" fill="#CFC9C1"/><rect x="16" y="64" width="90" height="6" rx="2" fill="#CFC9C1"/>${[0, 1, 2, 3].map((k) => `<rect x="16" y="${86 + k * 14}" width="208" height="6" rx="2" fill="#DAD5CE"/>`).join('')}<text x="224" y="26" text-anchor="end" class="udk">Statement · Sample</text></svg>`;
    return `<svg viewBox="0 0 240 150" class="udsvg"><rect width="240" height="150" rx="10" fill="#26303B"/><rect x="0" y="0" width="240" height="26" rx="10" fill="#33414F"/><text x="12" y="17" class="udt">${kind === 'back' ? 'Back · Sample Document' : 'Identity Document · Sample'}</text>${kind === 'back' ? `${[0, 1, 2].map((k) => `<rect x="14" y="${96 + k * 14}" width="212" height="7" rx="2" fill="#4A5A6A"/>`).join('')}<rect x="14" y="40" width="80" height="40" rx="4" fill="#3E4C5B"/>` : `${face ? '<rect x="14" y="38" width="62" height="78" rx="4" fill="#3E4C5B"/><circle cx="45" cy="66" r="14" fill="#5B6B7C"/><path d="M24 116c3-16 11-24 21-24s18 8 21 24z" fill="#5B6B7C"/>' : ''}<text x="90" y="52" class="udk l">${name}</text>${[0, 1, 2, 3].map((k) => `<rect x="90" y="${62 + k * 13}" width="${120 - k * 18}" height="6" rx="2" fill="#4A5A6A"/>`).join('')}<rect x="14" y="126" width="212" height="8" rx="2" fill="#3E4C5B"/>`}</svg>`; };
  function pIdentity(u, d) {
    const k = d.kyc;
    if (!k) return `<div class="card"><div class="cb"><div class="empty emp2"><b>${u.kyc === 'started' ? 'KYC Started but Not Finished' : 'KYC Not Started'}</b><p class="hint">${u.kyc === 'started' ? 'They opened the check with ' + PROV + ' 2 days ago and stopped at the selfie step.' : `KYC is asked for ${S.set.when === 'payout' ? 'before the first payout' : S.set.when === 'funded' ? 'before a funded account' : 'before the first purchase'}. This user has not reached that point.`}</p><div class="edact" style="justify-content:center"><button class="pill" data-act="kyc" data-k="nudge">Send KYC Reminder</button></div></div></div></div>`;
    const revealed = !!S.reveal['doc' + u.id];
    const ord = { f: 0, w: 1, '': 2 }; const checks = k.checks.slice().sort((a, b) => ord[a.r] - ord[b.r]);
    const idx = kycQ().findIndex((x) => x.id === u.id); const nextU = idx >= 0 ? kycQ()[idx + 1] : S.from === 'kycq' ? kycQ()[0] : null;
    return `<div class="two wl"><div><div class="card m0"><div class="ch"><h3>Documents</h3><span class="lab">${k.docType} · ${PROV}</span><div class="r">${revealed ? `<button class="lnk" data-act="docs" data-k="hide">Hide</button><button class="lnk" data-act="docs" data-k="dl">Download</button>` : ''}</div></div>
        <div class="cb"><div class="udocs ${revealed ? '' : 'blur'}">${[['front', k.docType + ' Front'], ['back', k.docType + ' Back'], ['selfie', 'Selfie'], ['poa', 'Proof of Address']].map(([kk, l]) => `<figure>${docSvg(kk, u)}<figcaption>${l}</figcaption></figure>`).join('')}${revealed ? '' : `<div class="udcov"><b>Documents Are Hidden</b><p class="hint">Opening them asks for a reason and is written to the audit log.</p><button class="pill pri sm" data-act="drw" data-k="revealdoc">Show Documents</button></div>`}</div></div></div>
      <div class="card"><div class="ch"><h3>What the Document Says</h3><span class="lab">Read by ${PROV}</span></div><div class="tsc"><table class="t"><thead><tr><th>Field</th><th>On the Document</th><th>On the Account</th><th>Match</th></tr></thead><tbody>${[['Full Name', k.docName, u.name], ['Date of Birth', revealed ? u.dob : '•• ••, ' + u.dob.slice(-4), revealed ? u.dob : '•• ••, ' + u.dob.slice(-4)], ['Document Number', revealed ? k.docNo.replace('•••• ', 'P' + (u.i * 13 + 4100)) : k.docNo, '—'], ['Expires', k.expiry, '—'], ['Country', u.ctry, u.ctry], ['Address', u.i === 27 ? `12 Old Mill Road, ${u.city}` : `14 Harbor Street, ${u.city}`, `14 Harbor Street, ${u.city}`]].map(([f, a, b]) => { const m = b === '—' ? '' : a === b ? 'ok' : 'no'; return `<tr><td class="nw hint">${f}</td><td class="nw">${esc(a)}</td><td class="nw">${esc(b)}</td><td>${m === 'ok' ? '<span class="b live">Match</span>' : m === 'no' ? '<span class="b draft">Differs</span>' : '<span class="hint">—</span>'}</td></tr>`; }).join('')}</tbody></table></div></div></div>
      <div><div class="card m0"><div class="ch"><h3>Checks</h3>${kb(u)}<div class="r"><span class="hint mono">${k.ref}</span></div></div><div class="cb"><div class="chks">${checks.map((c) => `<div class="ck2 ${c.r}"><i>${c.r === 'f' ? '✕' : c.r === 'w' ? '!' : '✓'}</i><div><b>${c.n}</b><div class="hint">${esc(c.s)}</div></div></div>`).join('')}</div></div></div>
      <div class="card"><div class="ch"><h3>Decision</h3>${u.kyc === 'pending' ? `<span class="b ${SEV[u.ks.sev][1]}">${SEV[u.ks.sev][0]}</span>` : ''}</div><div class="cb fg">${u.kyc === 'pending' ? `<p class="lead">${esc(u.ks.why)}. Waiting ${u.ks.wait} hours.</p>` : `<p class="lead">${KST[u.kyc][0]} ${k.when}.${u.ks.why ? ' ' + esc(u.ks.why) + '.' : ''}</p>`}
        <div class="fl"><label for="kyn">Note for the Log</label><textarea id="kyn" rows="2" placeholder="Why you decided this"></textarea></div>
        <div class="edact"><button class="pill pri" data-act="kyc" data-k="approve" ${u.kyc === 'verified' ? 'disabled' : ''}>Approve</button><button class="pill" data-act="drw" data-k="resub">Ask for New Documents</button><button class="pill dng" data-act="kyc" data-k="reject" ${u.kyc === 'rejected' ? 'disabled' : ''}>Reject</button></div>
        <div class="edact"><button class="lnk" data-act="kyc" data-k="rerun">Run Checks Again</button><button class="lnk" data-act="kyc" data-k="prov">Open in ${PROV}</button>${nextU ? `<button class="lnk" data-act="kyc" data-k="next" data-id="${nextU.id}">Next in Queue: ${esc(nextU.name)} ›</button>` : ''}</div>
        <p class="hint" style="margin:0">Rejecting needs a second reviewer. The user gets the matching email: Identity Verified, New Documents Needed or Identity Not Verified.</p></div></div>
      <div class="card"><div class="ch"><h3>History</h3></div><div class="cb"><div class="tl2">${k.history.map((h) => `<div><i></i><div><b>${esc(h[1])}</b><p>${esc(h[2])} · ${h[0]}</p></div></div>`).join('')}</div></div></div></div></div>`;
  }
  function pAccounts(u, d) {
    return `<div class="card"><div class="ch"><h3>Trading Accounts</h3><span class="lab">${d.accts.length}</span><div class="r">${XL('Risk', 'accounts', 'Limits in Risk')}${XL('Platforms', 'accounts', 'Logins in Platforms')}</div></div>${d.accts.length ? `<div class="tsc"><table class="t"><thead><tr><th>Account</th><th>Plan</th><th>Platform</th><th class="num">Balance</th><th>Started</th><th>Status</th><th></th></tr></thead><tbody>${d.accts.map((a, i) => `<tr><td class="nw mono">${a.id}</td><td class="nw">${esc(a.plan)} ${a.size / 1000}K</td><td class="nw">${a.plat}</td><td class="num nw">${money(a.bal)}</td><td class="nw hint">${a.started}</td><td><span class="b ${a.st === 'Funded' ? 'sched' : a.st === 'Active' ? 'live' : a.st === 'Passed' ? 'live' : a.st === 'Breached' ? 'err' : 'ended'}">${a.st}</span></td><td class="num nw"><div class="il">${['Breached', 'Expired'].includes(a.st) ? `<button class="pill sm" data-act="acc" data-k="reset" data-i="${i}">Reset</button>` : ''}${a.st === 'Active' ? `<button class="pill sm" data-act="acc" data-k="extend" data-i="${i}">Add 14 Days</button>` : ''}<button class="pill sm" data-act="acc" data-k="creds" data-i="${i}">Resend Platform Login</button></div></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">No trading accounts yet.</div>'}</div>
      <p class="hint">Limits, trades and closing accounts are handled in the Risk board.</p>`;
  }
  function pPayments(u, d) {
    return `<div class="two wl"><div class="card m0"><div class="ch"><h3>Orders</h3><span class="lab">${money(u.spent)} Total</span><div class="r">${XL('Finance', 'ledger', 'Ledger in Finance')}</div></div><div class="tsc"><table class="t"><thead><tr><th>Order</th><th>Date</th><th>Item</th><th>Paid With</th><th class="num">Amount</th><th>Status</th><th></th></tr></thead><tbody>${d.orders.map((o, i) => `<tr><td class="nw mono">${o.id}</td><td class="nw hint">${o.when}</td><td class="nw">${esc(o.item)}</td><td class="nw">${esc(o.method)}</td><td class="num nw">${money(o.amt)}</td><td><span class="b ${o.st === 'Paid' ? 'live' : o.st === 'Refunded' ? 'ended' : 'err'}">${o.st}</span></td><td class="num">${o.st === 'Paid' ? `<button class="pill sm" data-act="refund" data-i="${i}">Refund</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="7"><div class="empty">No orders.</div></td></tr>'}</tbody></table></div></div>
      <div class="card m0"><div class="ch"><h3>Payment Methods</h3></div><div class="cb"><div class="kv">${d.methods.map((m) => `<div><span>${esc(m)}</span><b>${u.i === 11 && m.includes('8841') ? '<span class="b err">Shared With 2 Users</span>' : 'Saved by TailoredPay'}</b></div>`).join('') || '<div><span>None saved</span></div>'}</div><p class="hint" style="margin:12px 0 0">Full card numbers are never stored here. The payment processor keeps them.</p></div></div></div>`;
  }
  function pPayouts(u, d) {
    return `<div class="tiles t4"><div class="tile"><span>Paid Out</span><b>${money(u.paid)}</b><small>All time</small></div><div class="tile"><span>Payout Method</span><b class="sm">${esc(d.payoutMethod || 'None Yet')}</b><small>${d.payoutMethod ? 'Changes need a second approver' : 'Set after funding'}</small></div><div class="tile"><span>Tax Form</span><b class="sm">${d.tax}</b><small>${XL('Compliance', 'forms', u.funded ? 'Signed through [Tax Form Provider]' : 'Needed before the first payout')}</small></div><div class="tile"><span>Profit Split</span><b>${u.funded ? '90%' : '—'}</b><small>${u.funded ? 'Standard' : 'Not funded'}</small></div></div>
      <div class="card" style="margin-top:14px"><div class="ch"><h3>Payout History</h3><div class="r">${XL('Risk', 'payouts', 'Reviews in Risk')}${XL('Finance', 'batches', 'Sent in Finance')}</div></div>${d.payouts.length ? `<div class="tsc"><table class="t"><thead><tr><th>Payout</th><th>Date</th><th>Sent To</th><th class="num">Amount</th><th>Status</th></tr></thead><tbody>${d.payouts.map((p) => `<tr><td class="mono nw">${p.id}</td><td class="nw hint">${p.when}</td><td class="nw">${esc(p.to)}</td><td class="num nw">${money(p.amt)}</td><td><span class="b ${p.st === 'Paid' ? 'live' : 'draft'}">${p.st}</span></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">No payouts yet.</div>'}</div>`;
  }
  const ATY = { all: 'All', acct: 'Account', trade: 'Trading', money: 'Money', security: 'Security', support: 'Support', staff: 'Staff' };
  function pActivity(u, d) { const l = d.act.filter((e) => S.af === 'all' || e[0] === S.af);
    return `<div class="card"><div class="ch lgf"><h3>Everything This User Did</h3><div class="seg">${Object.entries(ATY).map(([k, n]) => `<button class="${S.af === k ? 'on' : ''}" data-act="af" data-k="${k}">${n}</button>`).join('')}</div></div><div class="cb"><div class="tl2 tlx">${l.map((e) => `<div><i class="${e[0]}"></i><div><div class="il"><b>${esc(e[2])}</b><span class="b plain">${ATY[e[0]]}</span></div><p>${esc(e[3])} · ${e[1]}</p></div></div>`).join('') || '<div class="empty">Nothing of this kind.</div>'}</div></div></div>`; }
  function pJourney(u, d) { const SRC = ['YouTube', 'Search, Unpaid', 'Affiliate · TradeWithMarc', 'Search Ads', 'Social Media', 'Direct']; const afc = d.act.map((e) => (String(e[3]).match(/Affiliate code (\w+)/) || [])[1]).find(Boolean); const src = afc ? 'Affiliate · ' + afc : SRC[u.i % SRC.length]; const firstBuy = d.act.slice().reverse().find((e) => e[0] === 'money');
    const ICON = { ad: 'Marketing', site: 'Website', acct: 'Account', money: 'Payment', trade: 'Trading', security: 'Security', support: 'Support', staff: 'Staff', email: 'Email' };
    const first = [['ad', day(u.joinedAgo + 3), 'First Visit', `Came from ${src}`, src.startsWith('Affiliate') ? XL('Affiliates', 'all', 'Affiliate', 'lnk') : XL('Analytics', 'channels', 'Traffic Sources', 'lnk')], ['site', day(u.joinedAgo + 1), 'Looked at Plans', 'Viewed the plans page 3 times, compared 50K and 100K', XL('Analytics', 'pages', 'Website Pages', 'lnk')], ['acct', day(u.joinedAgo), 'Signed Up', 'Email confirmed in 2 minutes', ''], ['email', day(u.joinedAgo), 'Welcome Email', 'Opened, clicked Open Dashboard', XL('Emails', 'logs', 'Email Log', 'lnk')]];
    const rest = d.act.slice().reverse().map((e) => [e[0], e[1], e[2], e[3], e[0] === 'money' ? XL('Finance', 'ledger', 'Ledger', 'lnk') : e[0] === 'trade' ? XL('Risk', 'accounts', 'Risk', 'lnk') : e[0] === 'support' ? XL('Support', 'inbox?q=open', 'Support', 'lnk') : '']);
    const all = first.concat(rest); const stages = [['First Visit', 1], ['Signed Up', 1], ['Bought', d.orders.length ? 1 : 0], ['Passed', u.funded ? 1 : 0], ['Funded', u.funded ? 1 : 0], ['Paid Out', d.payouts.length ? 1 : 0]];
    return `<div class="card m0" style="margin-bottom:14px"><div class="cb"><div class="jst">${stages.map(([l, ok], i) => `<div class="${ok ? 'ok' : ''}"><i>${ok ? '✓' : i + 1}</i><span>${l}</span></div>`).join('<em></em>')}</div></div></div>
      <div class="two wl"><div class="card m0"><div class="ch"><h3>Every Touchpoint</h3><span class="lab">${all.length} events, oldest first</span></div><div class="cb"><div class="jtl">${all.map((e) => `<div class="${e[0]}"><i></i><div><span class="jk">${ICON[e[0]] || 'Activity'} · ${e[1]}</span><b>${esc(e[2])}</b><p>${esc(e[3])}</p></div>${e[4] ? `<span class="jl">${e[4]}</span>` : ''}</div>`).join('')}</div></div></div>
      <div class="card m0"><div class="ch"><h3>Summary</h3></div><div class="cb"><div class="kv">${[['First Came From', src], ['First Purchase', firstBuy ? firstBuy[1] : 'Not yet'], ['Orders', d.orders.length], ['Support Tickets', d.tickets.length], ['Emails Opened', d.emails.filter((x) => x[2] === 'Opened').length + ' of ' + d.emails.length], ['Customer For', u.joinedAgo > 60 ? Math.round(u.joinedAgo / 30) + ' months' : u.joinedAgo + ' days']].map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join('')}</div><p class="hint" style="margin:14px 0 0">Everyone’s journey together is in ${XL('Analytics', 'funnel', 'Analytics')}.</p></div></div></div>`; }
  function pLogins(u, d) { const vp = d.sessions.filter((x) => x.vpn); const home = d.sessions.length - vp.length;
    const pts = [{ n: u.ctry, v: home, lab: home + ' sign-ins' }].concat(vp.length ? [{ n: 'Netherlands', v: vp.length, lab: vp.length + ' sign-ins through a VPN', c: 'var(--no)' }] : []);
    return `<div class="two wl" style="margin-bottom:14px"><div class="card m0"><div class="ch"><h3>Where They Sign In</h3><span class="lab">Last ${d.sessions.length} sign-ins</span></div><div class="cb">${VZ.map(pts, { arcs: vp.length ? [[u.ctry, 'Netherlands']] : [], label: 'Sign-in locations' })}</div></div>
      <div class="card m0"><div class="ch"><h3>Travel Check</h3></div><div class="cb">${vp.length ? `<div class="r" style="gap:10px;margin-bottom:10px"><span class="b err">Impossible Travel</span></div><p style="margin:0 0 8px">Signed in from ${esc(u.city)} and Amsterdam within 40 minutes.</p><p class="hint" style="margin:0 0 14px">Usually a VPN. It is also how account sharing looks. Compare with ${XL('Fraud', 'signals', 'shared signals in Fraud')}.</p>` : `<div class="r" style="gap:10px;margin-bottom:10px"><span class="b live">Normal</span></div><p class="hint" style="margin:0 0 14px">Every sign-in came from ${esc(u.city)}, ${esc(u.ctry)}. No VPN, no impossible travel.</p>`}${VZ.ring(vp.length ? 62 : 96, vp.length ? '62' : '96', 'Trust', { s: 104, c: vp.length ? 'var(--wa)' : 'var(--ok)' })}</div></div></div>
      <div class="card m0"><div class="ch"><h3>Sign-Ins</h3><div class="r"><button class="pill sm" data-act="uact" data-k="out">Sign Out Everywhere</button></div></div><div class="tsc"><table class="t"><thead><tr><th>When</th><th>Result</th><th>Device</th><th>Place</th><th>IP Address</th><th></th></tr></thead><tbody>${d.sessions.map((s, i) => `<tr><td class="nw">${s.when}</td><td>${s.ok ? '<span class="b live">Signed In</span>' : '<span class="b err">Wrong Password</span>'}</td><td class="nw">${s.dev}</td><td class="nw">${esc(s.loc)}${s.vpn ? ' <span class="b draft">VPN</span>' : ''}</td><td class="nw mono">${s.ip}</td><td class="num">${s.live ? `<button class="pill sm" data-act="sess" data-i="${i}">End Session</button>` : ''}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="card" style="margin-top:14px"><div class="ch"><h3>Devices</h3><span class="lab">${d.devices.length}</span></div><div class="cb"><div class="devg">${d.devices.map((x) => `<div class="devc ${x.shared.length ? 'bad' : ''}"><div class="devi">${/iPhone|Android/.test(x.dev) ? '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><rect x="6" y="2.5" width="8" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>' : '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><rect x="2.5" y="4" width="15" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M1.5 16.5h17" stroke="currentColor" stroke-width="1.5"/></svg>'}</div><b>${x.dev}</b><span class="mono">${x.fp}</span><span class="hint">First seen ${x.first}</span>${x.shared.length ? `<span class="b err" style="margin-top:8px">Also used by ${x.shared.length}</span><span class="hint">${esc(x.shared.join(', '))}</span>` : '<span class="b live" style="margin-top:8px">Only this trader</span>'}</div>`).join('')}</div></div></div>`;
  }
  function pAgree(u, d) {
    return `<div class="card"><div class="ch"><h3>Agreements and Consent</h3><div class="r">${XL('Compliance', 'docs', 'Versions in Compliance')}</div></div><div class="tsc"><table class="t"><thead><tr><th>Document</th><th>Version</th><th>Accepted</th><th>Status</th><th></th></tr></thead><tbody>${d.agree.map(([n, v, w, ok]) => `<tr><td class="nw"><b>${n}</b></td><td class="nw hint">${v}</td><td class="nw hint">${w ? w + ' · IP ' + d.sessions[d.sessions.length - 1].ip : '—'}</td><td>${n === 'Marketing Emails' ? `<span class="b ${ok ? 'live' : 'ended'}">${ok ? 'Opted In' : 'Opted Out'}</span>` : ok ? '<span class="b live">Signed</span>' : '<span class="b ended">Not Yet</span>'}</td><td class="num">${w && n !== 'Marketing Emails' ? `<button class="lnk" data-act="agreeDl" data-k="${esc(n)}">Download Signed Copy</button>` : ''}</td></tr>`).join('')}</tbody></table></div></div>`;
  }
  function pSupport(u, d) {
    return `<div class="two"><div class="card m0"><div class="ch"><h3>Tickets</h3><div class="r">${XL('Support', 'inbox?q=open', 'Open Support')}</div></div>${d.tickets.length ? d.tickets.map((t) => `<a class="ali" href="AdminSupport.dc.html#inbox?t=${t.id.slice(2)}"><span class="b ${t.st === 'Open' ? 'sched' : 'ended'}">${t.st}</span><div><b>${esc(t.subj)}</b><div class="hint">${t.id} · ${t.when}</div></div><span class="chev">›</span></a>`).join('') : '<div class="empty">No tickets.</div>'}</div>
      <div class="card m0"><div class="ch"><h3>Emails Sent</h3><div class="r">${XL('Emails', 'logs', 'Email Logs')}</div></div><div class="tsc"><table class="t"><tbody>${d.emails.map(([n, w, s]) => `<tr><td class="nw">${esc(n)}</td><td class="nw hint">${w}</td><td><span class="b ${s === 'Opened' ? 'live' : 'plain'}">${s}</span></td></tr>`).join('')}</tbody></table></div></div></div>`;
  }
  function pNotes(u) {
    return `<div class="two"><div class="card m0"><div class="ch"><h3>Notes</h3><span class="lab">Only staff see these</span></div><div class="cb">${u.notes.map((n) => `<div class="note"><b>${esc(n[0])}</b><span class="hint">${n[1]}</span><p>${esc(n[2])}</p></div>`).join('') || '<p class="hint" style="margin:0 0 12px">No notes yet.</p>'}<div class="fl"><label for="unote">Add a Note</label><textarea id="unote" rows="3" placeholder="What the next person should know"></textarea></div><button class="pill" data-act="note" style="margin-top:10px">Save Note</button></div></div>
      <div class="card m0"><div class="ch"><h3>Tags</h3></div><div class="cb"><div class="il" style="flex-wrap:wrap;white-space:normal">${u.tags.map((t, i) => `<span class="b plain">${esc(t)}<button class="x" data-act="untag" data-i="${i}" aria-label="Remove ${esc(t)}">✕</button></span>`).join('') || '<span class="hint">No tags</span>'}</div><div class="addr" style="margin-top:14px"><select id="tagsel" aria-label="Tag">${['VIP', 'Watchlist', 'Affiliate', 'Chargeback Risk', 'Do Not Refund', 'Press', 'Fraud'].filter((t) => !u.tags.includes(t)).map((t) => `<option>${t}</option>`).join('')}</select><button class="pill sm" data-act="tag">Add Tag</button></div></div></div></div>`;
  }
  function pStaff(u, d) {
    return `<div class="card"><div class="ch"><h3>Who on Staff Opened or Changed This User</h3></div><div class="tsc"><table class="t"><thead><tr><th>When</th><th>Who</th><th>What</th><th>Detail</th></tr></thead><tbody>${d.staffLog.map((x) => `<tr><td class="nw hint">${x[0]}</td><td class="nw">${esc(x[1])}</td><td class="nw"><b>${esc(x[2])}</b></td><td class="hint">${esc(x[3])}</td></tr>`).join('')}</tbody></table></div></div>`;
  }

  // ---------- KYC ----------
  function vKycQ() { const q = kycQ();
    return `<div class="ph"><div><h1>KYC Review Queue</h1><p>Checks ${PROV} could not decide alone. Highest risk first, then longest waiting. Approve within 24 hours.</p></div></div>
      <div class="tiles t4"><div class="tile"><span>Waiting</span><b>${q.length}</b><small>Oldest ${Math.max(0, ...q.map((u) => u.ks.wait))} hours</small></div><div class="tile"><span>High Risk</span><b class="${q.filter((u) => u.ks.sev === 'hi').length ? 'dn' : ''}">${q.filter((u) => u.ks.sev === 'hi').length}</b><small>Sanctions or duplicates</small></div><div class="tile"><span>New Documents Asked</span><b>${USERS.filter((u) => u.kyc === 'resubmit').length}</b><small>Waiting on the user</small></div><div class="tile"><span>Decided Today</span><b>${14 + USERS.filter((u) => u.kycToday).length}</b><small>By your team</small></div></div>
      <div class="card" style="margin-top:14px">${q.length ? `<div class="tsc"><table class="t"><thead><tr><th>Risk</th><th>User</th><th>Why It Needs a Person</th><th>Document</th><th>Country</th><th class="num">Waiting</th><th></th></tr></thead><tbody>${q.map((u) => `<tr class="lk" data-act="review" data-id="${u.id}"><td><span class="b ${SEV[u.ks.sev][1]}">${SEV[u.ks.sev][0]}</span></td><td class="nw"><span class="uc"><span class="uav">${ini(u.name)}</span><span><b>${esc(u.name)}</b><span class="hint">${u.id}</span></span></span></td><td class="nw">${esc(u.ks.why)}</td><td class="nw hint">${detail(u).kyc.docType}</td><td class="nw">${esc(u.ctry)}</td><td class="num nw ${u.ks.wait > 12 ? 'warnt' : ''}">${u.ks.wait} Hours</td><td class="num"><span class="chev">›</span></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty emp2"><b>Queue Is Empty</b><p class="hint">Every check has a decision.</p></div>'}</div>`; }
  function vKycAll() { const l = USERS.filter((u) => u.kyc !== 'none' && (S.kq === 'all' || u.kyc === S.kq));
    return `<div class="ph"><div><h1>All KYC Checks</h1><p>Every identity check sent to ${PROV}, with its result.</p></div></div>
      <div class="card"><div class="ch lgf"><div class="seg">${[['all', 'All'], ['verified', 'Verified'], ['pending', 'Waiting'], ['resubmit', 'New Documents Asked'], ['rejected', 'Rejected'], ['started', 'In Progress']].map(([k, n]) => `<button class="${S.kq === k ? 'on' : ''}" data-act="kq" data-k="${k}">${n}</button>`).join('')}</div></div>
      <div class="tsc"><table class="t"><thead><tr><th>Check</th><th>User</th><th>Document</th><th class="num">Face Match</th><th>Result</th><th>Date</th></tr></thead><tbody>${l.map((u) => { const k = detail(u).kyc; return `<tr class="lk" data-act="review" data-id="${u.id}"><td class="mono nw">${k ? k.ref : '—'}</td><td class="nw">${esc(u.name)}</td><td class="nw hint">${k ? k.docType : '—'}</td><td class="num nw">${k ? k.face + '%' : '—'}</td><td>${kb(u)}</td><td class="nw hint">${k ? k.when : '—'}</td></tr>`; }).join('')}</tbody></table></div></div>`; }

  // ---------- requests ----------
  function vChanges() {
    return `<div class="ph"><div><h1>Account Changes</h1><p>Changes users asked for that touch identity or money. Name and country changes need matching KYC documents. Second approvals wait in ${XL('Team', 'mine', 'Team')}.</p></div></div>
      <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Request</th><th>User</th><th>Change</th><th>From</th><th>To</th><th>Check</th><th>Asked</th><th>Status</th><th></th></tr></thead><tbody>${CHANGES.map((c) => `<tr><td class="mono nw">${c.id}</td><td class="nw">${ulink(c.uid)}</td><td class="nw"><b>${c.type}</b></td><td class="nw hint">${esc(c.from)}</td><td class="nw">${esc(c.to)}</td><td class="nw hint">${esc(c.needs)}</td><td class="nw hint">${c.when}</td><td><span class="b ${c.st === 'open' ? 'sched' : c.st === 'second' ? 'draft' : c.st === 'approved' ? 'live' : 'ended'}">${{ open: 'To Review', second: 'Waiting for Second Approver', approved: 'Approved', denied: 'Denied' }[c.st]}</span></td><td class="num nw">${c.st === 'open' ? `<div class="il"><button class="pill sm" data-act="chg" data-k="ok" data-id="${c.id}">Approve</button><button class="pill sm" data-act="chg" data-k="no" data-id="${c.id}">Deny</button></div>` : c.st === 'second' ? `<button class="pill sm" data-act="chg" data-k="ok2" data-id="${c.id}">Approve as ${RV2}</button>` : ''}</td></tr>`).join('')}</tbody></table></div></div>
      <p class="hint">Email changes are confirmed on both the old and new address. Payout method changes wait 48 hours before the first payout to the new method.</p>`;
  }
  function vData() {
    return `<div class="ph"><div><h1>Privacy Requests</h1><p>Users asking for a copy of their data, to delete their account, or to stop marketing. Answer within 30 days.</p></div></div>
      <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Request</th><th>User</th><th>Asked For</th><th>Asked</th><th>Due</th><th>Status</th><th>Note</th><th></th></tr></thead><tbody>${DATAREQ.map((r) => `<tr><td class="mono nw">${r.id}</td><td class="nw">${ulink(r.uid)}</td><td class="nw"><b>${r.type}</b></td><td class="nw hint">${r.when}</td><td class="nw ${r.st === 'open' ? 'warnt' : 'hint'}">${r.due}</td><td><span class="b ${r.st === 'open' ? 'sched' : r.st === 'second' ? 'draft' : 'live'}">${{ open: 'To Do', second: 'Waiting for Second Approver', done: 'Done' }[r.st]}</span></td><td class="hint dtd">${esc(r.note) || '—'}</td><td class="num nw">${r.st === 'open' ? `<button class="pill sm" data-act="dreq" data-id="${r.id}">${r.type === 'Delete My Account' ? 'Delete Personal Data' : r.type === 'Copy of My Data' ? 'Send Data Copy' : 'Mark Done'}</button>` : r.st === 'second' ? `<button class="pill sm" data-act="dreq2" data-id="${r.id}">Confirm as ${RV2}</button>` : ''}</td></tr>`).join('')}</tbody></table></div></div>
      <p class="hint">Deleting removes name, contact details and documents. Orders, trades, payouts and KYC results stay for 5 years where the law needs them. Have your lawyer confirm these periods.</p>`;
  }

  // ---------- setup ----------
  function vProv() { const C = S.set;
    return `<div class="ph"><div><h1>Provider and Checks</h1><p>How identity checks run with ${PROV}, when users are asked, and what passes automatically. The connection itself is in ${XL('Settings', 'int', 'Settings')}.</p></div></div>
      <div class="two"><div class="card m0"><div class="ch"><h3>${PROV}</h3><span class="b live">Connected</span></div><div class="cb"><div class="kv"><div><span>API Key</span><b class="mono">sk_live_••••••••3f9a</b></div><div><span>Webhook</span><b class="mono">/hooks/kyc</b></div><div><span>Last Event</span><b>2 minutes ago</b></div><div><span>Checks This Month</span><b>312</b></div></div><div class="edact" style="margin-top:12px"><button class="pill sm" data-act="ptest">Send Test Check</button><button class="pill sm" data-act="prot">Replace API Key</button></div></div></div>
      <div class="card m0"><div class="ch"><h3>When to Ask</h3></div><div class="cb fg"><div class="seg">${[['purchase', 'Before First Purchase'], ['funded', 'Before Funded Account'], ['payout', 'Before First Payout']].map(([k, l]) => `<button class="${C.when === k ? 'on' : ''}" data-act="setV" data-k="when" data-v="${k}">${l}</button>`).join('')}</div><p class="hint" style="margin:0">Asking later means more sales and fewer checks paid for. Asking earlier blocks bad actors sooner.</p></div></div></div>
      <div class="card" style="margin-top:14px"><div class="ch"><h3>Checks</h3></div><div class="cb fg">${sw('auto', 'Approve Automatically When Every Check Passes', 'Otherwise every check goes to the review queue')}${sw('addr', 'Ask for Proof of Address')}${sw('media', 'Search Negative News')}${sw('ongoing', 'Recheck Sanctions Lists Every Day', 'For funded traders')}
        <div class="srow"><span>Lowest Face Match to Pass</span><span class="il"><input type="number" min="50" max="99" value="${C.faceMin}" data-bind="set.faceMin" style="width:90px" aria-label="Face match percent">%</span></div><div class="srow"><span>Proof of Address No Older Than</span><span class="il"><input type="number" min="30" max="365" value="${C.poaDays}" data-bind="set.poaDays" style="width:90px" aria-label="Days">Days</span></div></div></div>`; }
  function vCtry() {
    return `<div class="ph"><div><h1>Countries</h1><p>People in these countries cannot sign up, buy or get paid. Set this list with your lawyer.</p></div></div>
      <div class="card"><div class="ch"><h3>Not Allowed</h3><span class="lab">${COUNTRIES_BLOCKED.length}</span><div class="r addr"><input id="cadd" placeholder="Country" aria-label="Country to add"><button class="pill sm" data-act="cadd">Add</button></div></div>${COUNTRIES_BLOCKED.map((c, i) => `<div class="srow pad"><span>${esc(c)}</span><button class="lnk" data-act="cdel" data-i="${i}">Remove</button></div>`).join('')}</div>
      <p class="hint">Sign-ups are checked by IP address and again by the KYC document. A VPN from an allowed country does not get past the document check.</p>`; }
  function vDocs() {
    return `<div class="ph"><div><h1>Accepted Documents</h1><p>What users can send to prove who they are and where they live.</p></div></div>
      <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Document</th><th>Used For</th><th>Accepted</th></tr></thead><tbody>${DOCS.map((x, i) => `<tr><td class="nw"><b>${x[0]}</b></td><td class="hint">${x[2]}</td><td><button class="sw ${x[1] ? 'on' : ''}" role="switch" aria-checked="${x[1]}" aria-label="Accept ${x[0]}" data-act="docT" data-i="${i}"><i></i></button></td></tr>`).join('')}</tbody></table></div></div>`; }
  function vRoles() {
    return `<div class="ph"><div><h1>Roles</h1><p>What each staff role can see and do with user accounts. Seeing documents and logging in as a user are always logged. Roles for every board are in ${XL('Team', 'roles', 'Team')}.</p></div></div>
      <div class="card"><div class="tsc"><table class="t rt"><thead><tr><th>Role</th>${PERMS.map((p) => `<th class="cen">${p}</th>`).join('')}</tr></thead><tbody>${ROLES.map((r, ri) => `<tr><td class="nw"><b>${r[0]}</b></td>${r[1].map((v, pi) => `<td class="cen"><label class="chk"><input type="checkbox" ${v ? 'checked' : ''} ${ri === 0 ? 'disabled' : ''} data-role="${ri}" data-perm="${pi}" aria-label="${r[0]}: ${PERMS[pi]}"></label></td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
      <p class="hint">Banning a user, rejecting KYC, changing a payout method and deleting personal data always need a second person, whatever the role.</p>`; }
  function vTeam() {
    return `<div class="ph"><div><h1>Team</h1><p>Staff who can open user accounts.</p></div><div class="act"><button class="pill" data-act="invite">Invite Staff</button></div></div>
      <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Name</th><th>Role</th><th>Two-Factor Sign-In</th><th>Last Active</th></tr></thead><tbody>${TEAM.map((t, i) => `<tr><td class="nw"><b>${esc(t[0])}</b></td><td><select data-team="${i}" aria-label="Role for ${esc(t[0])}" style="width:170px" ${i === 0 ? 'disabled' : ''}>${ROLES.map((r) => `<option ${r[0] === t[1] ? 'selected' : ''}>${r[0]}</option>`).join('')}</select></td><td>${t[2] ? '<span class="b live">On</span>' : '<span class="b err">Off · Blocked From User Data</span>'}</td><td class="nw hint">${t[3]}</td></tr>`).join('')}</tbody></table></div></div>`; }
  function vAudit() { const F = { all: () => true, docs: (a) => /Documents|Details/.test(a[2]), imp: (a) => /Logged In As/.test(a[2]), chg: (a) => /Changed|Banned|Locked|Rejected|Approved|Deleted|Refund/.test(a[2]) }; const l = AUDIT.filter(F[S.auf]);
    return `<div class="ph"><div><h1>Audit Log</h1><p>Every time staff open sensitive data or change a user. Entries cannot be edited or deleted. The log for every board is in ${XL('Team', 'audit', 'Team')}.</p></div><div class="act"><button class="pill" data-act="export">Export</button></div></div>
      <div class="card"><div class="ch lgf"><div class="seg">${[['all', 'All'], ['docs', 'Personal Data Viewed'], ['imp', 'Logged In As User'], ['chg', 'Changes']].map(([k, n]) => `<button class="${S.auf === k ? 'on' : ''}" data-act="auf" data-k="${k}">${n}</button>`).join('')}</div></div><div class="tsc"><table class="t"><thead><tr><th>When</th><th>Who</th><th>What</th><th>Detail</th></tr></thead><tbody>${l.map((a) => `<tr><td class="nw hint">${a[0]}</td><td class="nw">${esc(a[1])}</td><td class="nw"><b>${esc(a[2])}</b></td><td class="hint">${esc(a[3])}</td></tr>`).join('')}</tbody></table></div></div>`; }
  function vSettings() { const C = S.set;
    return `<div class="ph"><div><h1>Settings</h1><p>Privacy, sign-in security and how long data is kept.</p></div></div>
      <div class="two"><div class="card m0"><div class="ch"><h3>Privacy</h3></div><div class="cb fg">${sw('mask', 'Hide Personal Details Until Asked', 'Date of birth, address and documents')}${sw('reason', 'Ask for a Reason Before Showing Documents')}<div class="srow"><span>Keep KYC Documents After an Account Closes</span><select data-bind="set.retain" style="width:140px">${[['1', '1 Year'], ['5', '5 Years'], ['7', '7 Years']].map(([v, l]) => `<option value="${v}" ${C.retain === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div></div>
      <div class="card m0"><div class="ch"><h3>Sign-In Security</h3></div><div class="cb fg">${sw('staff2fa', 'Staff Need Two-Factor Sign-In')}<div class="srow"><span>Lock a User After Failed Sign-Ins</span><input type="number" min="3" max="20" value="${C.lockAfter}" data-bind="set.lockAfter" style="width:90px" aria-label="Failed sign-ins"></div><div class="srow"><span>Sign Staff Out After</span><select data-bind="set.timeout" style="width:140px">${[['15', '15 Minutes'], ['30', '30 Minutes'], ['60', '1 Hour']].map(([v, l]) => `<option value="${v}" ${C.timeout === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div></div></div>`; }

  // ---------- drawers ----------
  function drawer() {
    if (!S.drawer) return ''; const u = u0(); const k = S.drawer.k; let t = '', body = '', foot = '';
    const reasons = ['KYC review', 'Support ticket', 'Risk alert', 'Payout review', 'Chargeback', 'Legal request'];
    const rsel = `<div class="fl"><label for="drr">Reason</label><select id="drr">${reasons.map((r) => `<option>${r}</option>`).join('')}</select></div><div class="fl"><label for="drn">Ticket, Alert or Case Number</label><input id="drn" placeholder="Optional, for example T-4821"></div>`;
    if (k === 'reveal' || k === 'revealdoc') { t = k === 'reveal' ? 'Show Full Details' : 'Show Documents'; body = `<p class="lead">${esc(u.name)}'s ${k === 'reveal' ? 'date of birth and address' : 'identity documents'} will be shown to you. Your name, the reason and the time are written to the audit log${S.set.reason ? '' : ' (reason optional)'}.</p>${rsel}`; foot = `<button class="pill" data-act="closeDrw">Cancel</button><button class="pill pri" data-act="doReveal" data-k="${k}">Show</button>`; }
    if (k === 'imp') { t = 'Log In As User'; body = `<p class="lead">Opens Funded Sky as ${esc(u.name)} sees it. View only: you cannot buy, trade, request payouts or change settings. Every page you open is logged, and the user is not told.</p>${rsel}`; foot = `<button class="pill" data-act="closeDrw">Cancel</button><button class="pill pri" data-act="doImp">Start View-Only Session</button>`; }
    if (k === 'email') { t = 'Send Email'; body = `<div class="fl"><label>To</label><input value="${esc(u.email)}" disabled></div><div class="fl"><label for="ems">Subject</label><input id="ems" value="About Your Funded Sky Account"></div><div class="fl"><label for="emb">Message</label><textarea id="emb" rows="7">Hi ${esc(u.name.split(' ')[0])},\n\n</textarea></div><p class="hint" style="margin:0">Sent from support@ with the standard footer. A copy goes to the user's Support history.</p>`; foot = `<button class="pill" data-act="closeDrw">Cancel</button><button class="pill pri" data-act="doEmail">Send</button>`; }
    if (k === 'edit') { t = 'Edit Details'; body = `${[['name', 'Full Name', u.name], ['email', 'Email', u.email], ['city', 'City', u.city], ['ctry', 'Country', u.ctry]].map(([f, l, v]) => `<div class="fl"><label for="ed${f}">${l}</label><input id="ed${f}" value="${esc(v)}"></div>`).join('')}<p class="hint" style="margin:0">Changing the name or country after KYC asks the user for matching documents. Changing the email sends a confirmation to both addresses.</p>`; foot = `<button class="pill" data-act="closeDrw">Cancel</button><button class="pill pri" data-act="doEdit">Save</button>`; }
    if (k === 'resub') { t = 'Ask for New Documents'; body = `<p class="lead">${esc(u.name)} gets the New Documents Needed email with a link back to ${PROV}.</p><div class="fg">${(() => { const f = [...(u.ks.fail || []), ...(u.ks.warn || [])]; const def = f.includes('address') ? 'poa' : f.includes('face') ? 'selfie' : 'id'; return [['id', 'New Photo of ID'], ['selfie', 'New Selfie'], ['poa', 'Newer Proof of Address']].map(([kk, l]) => `<label class="evr il"><input type="checkbox" data-rs="${kk}" ${kk === def ? 'checked' : ''}>${l}</label>`).join(''); })()}</div><div class="fl"><label for="rsn">Message to the User</label><textarea id="rsn" rows="3">${esc(u.ks.why ? u.ks.why + '. Please send a clear, recent document.' : '')}</textarea></div>`; foot = `<button class="pill" data-act="closeDrw">Cancel</button><button class="pill pri" data-act="doResub">Send Request</button>`; }
    if (k === 'ban' || k === 'lock') { t = k === 'ban' ? 'Ban User' : 'Lock Account'; body = `<p class="lead">${k === 'ban' ? `${esc(u.name)} is signed out, cannot sign in again, and every open trading account closes. Devices, cards and wallets go on the Risk blocklist. Needs a second person to confirm.` : `${esc(u.name)} is signed out and cannot sign in until someone unlocks the account. Trading accounts stay as they are.`}</p><div class="fl"><label for="bnr">Reason</label><textarea id="bnr" rows="3" placeholder="Shown in the audit log"></textarea></div>`; foot = `<button class="pill" data-act="closeDrw">Cancel</button><button class="pill dng" data-act="doBan" data-k="${k}">${k === 'ban' ? 'Send to Second Reviewer' : 'Lock Account'}</button>`; }
    return `<div class="drw-bg" data-act="closeDrw"></div><div class="drw" role="dialog" aria-label="${t}"><div class="drw-h"><h3>${t}</h3><button class="ic" data-act="closeDrw" style="margin-left:auto" aria-label="Close">✕</button></div><div class="drw-b fg">${body}</div><div class="drw-f">${foot}</div></div>`;
  }

  // ---------- render ----------
  const toast = (x) => { S.toast = x; render(); clearTimeout(toast.t); toast.t = setTimeout(() => { S.toast = ''; render(); }, 2800); };
  const searchResults = (q) => { q = q.toLowerCase(); return USERS.filter((u) => (u.name + u.email + u.id + u.phone + (u.d ? u.d.accts.map((a) => a.id).join(' ') : '')).toLowerCase().includes(q)).slice(0, 7); };
  function render() {
    const keep = {}; ['.main', '.drw-b'].forEach((s) => { const el = root.querySelector(s); if (el) keep[s] = el.scrollTop; });
    const views = { overview: vOverview, users: vUsers, user: vUser, kycq: vKycQ, kycall: vKycAll, changes: vChanges, data: vData, kprov: vProv, kctry: vCtry, kdocs: vDocs, roles: vRoles, team: vTeam, audit: vAudit, settings: vSettings };
    const iu = S.imp && uById(S.imp.uid);
    root.innerHTML = `<div class="tb"><a class="pill bk" href="AdminHome.dc.html" aria-label="Back to Admin">←<span class="lg"> Back to Admin</span></a><span class="tb-t">Users</span>
      <div class="tb-mid hm"><div class="tb-stats"><div><span>Users</span><b>1,204</b></div><div><span>Verified</span><b>209</b></div><div><span>KYC Waiting</span><b class="${kycQ().length ? 'warnt' : ''}">${kycQ().length}</b></div><div><span>Open Requests</span><b>${openCh().length + openDr().length}</b></div><div><span>Locked</span><b>${USERS.filter((u) => u.st === 'Locked').length}</b></div></div></div>
      <div class="gs hm"><input type="search" placeholder="Find a User" value="${esc(S.gq)}" data-live="gq" data-key="gq" aria-label="Find a user">${S.gq.length > 1 ? `<div class="gsd">${searchResults(S.gq).map((u) => `<button data-act="user" data-id="${u.id}"><span class="uav sm">${ini(u.name)}</span><b>${esc(u.name)}</b><span class="hint">${u.id} · ${esc(u.email)}</span></button>`).join('') || '<div class="empty">Nothing found.</div>'}</div>` : ''}</div>
      <button class="pill" data-act="go" data-v="audit">Audit Log</button></div>
    ${iu ? `<div class="impb"><span class="il"><i></i><b>Viewing as ${esc(iu.name)}</b></span><span class="hint">View only · Reason: ${esc(S.imp.why)} · Every page is logged</span><button class="pill sm" data-act="endImp">End Session</button></div>` : ''}
    <div class="body"><div class="mnav"><select id="mnavsel" aria-label="Go to section">${mnavHtml()}</select></div><nav class="nav" aria-label="Users">${navHtml()}</nav><main class="main">${subtabs()}${(views[S.view] || views[(S.view = 'overview')])()}</main></div>
    ${drawer()}${S.toast ? `<div class="toast" role="status">${esc(S.toast)}</div>` : ''}`;
    Object.entries(keep).forEach(([s, v]) => { const el = root.querySelector(s); if (el) el.scrollTop = v; });
    if (S.focus) { const el = root.querySelector(`[data-key="${S.focus.k}"]`); if (el) { el.focus(); try { el.setSelectionRange(S.focus.s, S.focus.s); } catch (x) { /* not text */ } } S.focus = null; }
  }

  // ---------- events ----------
  const val = (sel) => { const el = root.querySelector(sel); return el ? el.value.trim() : ''; };
  const openUser = (id, tab, from) => { S.uid = id; S.view = 'user'; S.ptab = tab || 'overview'; S.from = from || null; S.drawer = null; S.menu = false; S.gq = ''; S.af = 'all'; const m = root.querySelector('.main'); if (m) m.scrollTop = 0; };
  const kycDecide = (u, st, what) => { u.kyc = st; u.kycToday = true; const k = detail(u).kyc; k.history.unshift(['Just now', what, (val('#kyn') || 'No note') + ' · ' + ME]); audit(ME, what, `${u.name}${val('#kyn') ? ' · ' + val('#kyn') : ''}`); detail(u).staffLog.unshift(['Just now', ME, what, val('#kyn') || 'No note']); };
  root.addEventListener('click', (ev) => {
    if (S.menu && !ev.target.closest('.mwrap')) { S.menu = false; if (!ev.target.closest('[data-act]')) { render(); return; } }
    const el = ev.target.closest('[data-act]'); if (!el || !root.contains(el)) return;
    if (el.tagName === 'INPUT' && el.type !== 'checkbox') return;
    const a = el.dataset.act, id = el.dataset.id, k = el.dataset.k; const u = u0();
    switch (a) {
      case 'go': S.view = el.dataset.v; S.drawer = null; break;
      case 'area': { const x = AREAS.find((y) => y.id === k); S.view = lastTab[x.id] || x.tabs[0][0]; S.drawer = null; break; }
      case 'user': openUser(id); break;
      case 'review': openUser(id, 'identity', 'kycq'); break;
      case 'ptab': S.ptab = k; S.menu = false; break;
      case 'risk': location.href = 'AdminRisk.dc.html'; return;
      case 'uf': S.uf = k; break;
      case 'af': S.af = k; break;
      case 'kq': S.kq = k; break;
      case 'auf': S.auf = k; break;
      case 'menu': S.menu = !S.menu; break;
      case 'closeDrw': S.drawer = null; break;
      case 'drw': S.drawer = { k }; break;
      case 'imp': S.drawer = { k: 'imp' }; break;
      case 'uact': S.menu = false;
        if (['edit', 'ban', 'lock'].includes(k)) { S.drawer = { k }; break; }
        if (k === 'pw') { audit(ME, 'Reset Password Link Sent', u.name); toast(`Password reset link sent to ${u.email}`); return; }
        if (k === '2fa') { u.twofa = false; audit(ME, 'Two-Factor Reset', u.name); toast('Two-factor sign-in removed. They set it up again at next sign-in.'); return; }
        if (k === 'out') { detail(u).sessions.forEach((s) => { s.live = false; }); audit(ME, 'Signed Out Everywhere', u.name); toast(`${u.name} signed out on every device`); return; }
        if (k === 'unlock') { u.st = 'Active'; u.locked = null; audit(ME, 'Account Unlocked', u.name); toast(`${u.name} can sign in again`); return; }
        if (k === 'exportu') { audit(ME, 'Downloaded All Data', u.name); toast(`Preparing ${u.id}.zip: profile, orders, trades, payouts, KYC results`); return; }
        if (k === 'unban') { audit(ME, 'Ban Lift Requested', `${u.name} · waiting for ${RV2}`); toast(`Sent to ${RV2} to confirm`); return; }
        return;
      case 'doReveal': { const why = val('#drr') + (val('#drn') ? ' ' + val('#drn') : ''); S.reveal[(k === 'revealdoc' ? 'doc' : '') + u.id] = true; audit(ME, k === 'revealdoc' ? 'Viewed Documents' : 'Viewed Full Details', `${u.name} · reason: ${why}`); detail(u).staffLog.unshift(['Just now', ME, k === 'revealdoc' ? 'Viewed Documents' : 'Viewed Full Details', why]); S.drawer = null; break; }
      case 'docs': if (k === 'hide') { delete S.reveal['doc' + u.id]; break; } audit(ME, 'Downloaded Documents', u.name); toast('Download started. Logged.'); return;
      case 'doImp': S.imp = { uid: u.id, why: val('#drr') + (val('#drn') ? ' ' + val('#drn') : '') }; audit(ME, 'Logged In As User', `${u.name} · view only · reason: ${S.imp.why}`); detail(u).staffLog.unshift(['Just now', ME, 'Logged In As User', S.imp.why]); S.drawer = null; toast('View-only session started in a new tab'); return;
      case 'endImp': audit(ME, 'Ended View-Only Session', uById(S.imp.uid).name); S.imp = null; break;
      case 'doEmail': detail(u).emails.unshift([val('#ems') || 'Message', 'Just now', 'Delivered']); audit(ME, 'Email Sent', `${u.name} · ${val('#ems')}`); S.drawer = null; toast('Email sent'); return;
      case 'doEdit': { const nm = val('#edname'), em = val('#edemail'); const ch = []; if (nm && nm !== u.name) { ch.push('name'); u.name = nm; } if (em && em !== u.email) { ch.push('email'); u.email = em; } u.city = val('#edcity') || u.city; S.drawer = null; audit(ME, 'Details Changed', `${u.name} · ${ch.join(', ') || 'city or country'}`); toast(ch.includes('name') ? 'Saved. The user is asked for a matching ID.' : ch.includes('email') ? 'Saved. Confirmation sent to both addresses.' : 'Saved'); return; }
      case 'doBan': { const why = val('#bnr'); if (!why) { toast('Write a reason first'); return; } if (k === 'lock') { u.st = 'Locked'; u.locked = { why, when: 'Just now' }; audit(ME, 'Account Locked', `${u.name} · ${why}`); S.drawer = null; toast(`${u.name} locked`); return; } audit(ME, 'Ban Proposed', `${u.name} · ${why} · waiting for ${RV2}`); S.drawer = null; u.banPending = true; toast(`Sent to ${RV2}. Banned once they confirm.`); return; }
      case 'kyc':
        if (k === 'approve') { kycDecide(u, 'verified', 'KYC Approved'); toast(`${u.name} verified. Identity Verified email sent.`); break; }
        if (k === 'reject') { if (!val('#kyn')) { toast('Write a note before rejecting'); return; } kycDecide(u, 'pending', 'KYC Rejection Proposed'); toast(`Sent to ${RV2} to confirm the rejection`); break; }
        if (k === 'rerun') { audit(ME, 'KYC Checks Run Again', u.name); toast(`Sent to ${PROV}. Results in about a minute.`); return; }
        if (k === 'prov') { toast(`Opens this check in ${PROV}`); return; }
        if (k === 'nudge') { audit(ME, 'KYC Reminder Sent', u.name); toast('Reminder email sent'); return; }
        if (k === 'next') { openUser(id, 'identity', 'kycq'); break; }
        return;
      case 'doResub': { const what = [...root.querySelectorAll('[data-rs]:checked')].map((x) => x.parentElement.textContent.trim()); if (!what.length) { toast('Pick at least one document'); return; } u.kyc = 'resubmit'; detail(u).kyc.history.unshift(['Just now', 'New Documents Asked For', what.join(', ') + ' · ' + ME]); detail(u).emails.unshift(['We Need New Documents', 'Just now', 'Delivered']); audit(ME, 'New KYC Documents Asked For', `${u.name} · ${what.join(', ')}`); S.drawer = null; toast('Request sent'); break; }
      case 'acc': { const ac = detail(u).accts[+el.dataset.i]; if (k === 'reset') { ac.st = 'Active'; ac.bal = ac.size; audit(ME, 'Free Reset Given', `${u.name} · ${ac.id}`); toast(`${ac.id} reset to ${money(ac.size)}`); break; } if (k === 'extend') { audit(ME, 'Evaluation Extended 14 Days', `${u.name} · ${ac.id}`); toast(`${ac.id}: 14 days added`); return; } toast(`${ac.plat} login sent to ${u.email}`); audit(ME, 'Platform Login Resent', ac.id); return; }
      case 'refund': { const o = detail(u).orders[+el.dataset.i]; if (!el.dataset.sure) { el.dataset.sure = '1'; el.textContent = `Refund ${money(o.amt)}?`; return; } o.st = 'Refunded'; u.spent -= o.amt; audit(ME, 'Refund Issued', `${u.name} · ${o.id} · ${money(o.amt)}`); toast(`${money(o.amt)} refunded to ${o.method}`); break; }
      case 'linkOk': { const l = ext(u, detail(u)).links[+el.dataset.i]; l.ok = true; l.lvl = 'lo'; audit(ME, 'Connection Marked Not Related', `${u.name} and ${l.name} · ${l.via}`); toast('Marked not related. Logged.'); break; }
      case 'sess': detail(u).sessions[+el.dataset.i].live = false; audit(ME, 'Session Ended', u.name); toast('Session ended'); break;
      case 'agreeDl': toast(`${k} PDF with signature, date and IP address`); return;
      case 'note': { const v = val('#unote'); if (!v) { toast('Write a note first'); return; } u.notes.unshift([ME, 'Just now', v]); detail(u).act.unshift(['staff', 'Today', 'Note Added by ' + ME, v]); audit(ME, 'Note Added', u.name); break; }
      case 'tag': { const v = val('#tagsel'); if (v) { u.tags.push(v); audit(ME, 'Tag Added', `${u.name} · ${v}`); } break; }
      case 'untag': { const t = u.tags.splice(+el.dataset.i, 1)[0]; audit(ME, 'Tag Removed', `${u.name} · ${t}`); break; }
      case 'chg': { const c = CHANGES.find((x) => x.id === id); const cu = uById(c.uid);
        if (k === 'ok' && c.two) { c.st = 'second'; audit(ME, 'Change Approved, Needs Second', `${c.id} · ${c.type}`); toast(`Sent to ${RV2} for the second approval`); break; }
        c.st = k === 'no' ? 'denied' : 'approved'; if (c.st === 'approved' && c.type === 'Name Change') cu.name = c.to; if (c.st === 'approved' && c.type === 'Email Change') cu.email = c.to;
        audit(k === 'ok2' ? `${ME} and ${RV2}` : ME, `${c.type} ${c.st === 'approved' ? 'Approved' : 'Denied'}`, `${cu.name} · ${c.id}`); toast(`${c.type} ${c.st}. ${cu.name.split(' ')[0]} gets an email.`); break; }
      case 'dreq': { const r = DATAREQ.find((x) => x.id === id); const ru = uById(r.uid); if (r.type === 'Delete My Account') { r.st = 'second'; audit(ME, 'Data Deletion Proposed', `${ru.name} · ${r.id}`); toast(`Sent to ${RV2} to confirm`); break; } r.st = 'done'; r.note = r.type === 'Copy of My Data' ? 'Sent as a download link, expires in 7 days.' : 'Unsubscribed from all marketing.'; if (r.type === 'Stop Marketing Emails') ru.mkt = false; audit(ME, r.type + ' Done', `${ru.name} · ${r.id}`); toast('Done. The user is told by email.'); break; }
      case 'dreq2': { const r = DATAREQ.find((x) => x.id === id); r.st = 'done'; r.note = 'Name, contact details and documents deleted. Legal records kept 5 years.'; audit(`${ME} and ${RV2}`, 'Personal Data Deleted', `${uById(r.uid).name} · ${r.id}`); toast('Personal data deleted'); break; }
      case 'export': audit(ME, 'Exported', S.view === 'audit' ? `${AUDIT.length} audit entries` : `${userList().length} users`); toast('Export ready. Logged with your name.'); return;
      case 'ptest': toast(`Test check sent to ${PROV}. Webhook answered in 380 ms.`); return;
      case 'prot': audit(ME, 'KYC API Key Replaced', PROV); toast('New key saved. The old key stops working in 24 hours.'); return;
      case 'cadd': { const v = val('#cadd'); if (!v) { toast('Type a country'); return; } COUNTRIES_BLOCKED.push(v); audit(ME, 'Country Blocked', v); break; }
      case 'cdel': { const c = COUNTRIES_BLOCKED.splice(+el.dataset.i, 1)[0]; audit(ME, 'Country Allowed', c); toast(`${c} removed`); break; }
      case 'docT': { const x = DOCS[+el.dataset.i]; x[1] = !x[1]; audit(ME, 'Accepted Documents Changed', `${x[0]} ${x[1] ? 'accepted' : 'not accepted'}`); break; }
      case 'invite': toast('Invite sent. They pick a role after setting up two-factor sign-in.'); return;
      case 'setT': S.set[k] = !S.set[k]; audit(ME, 'Setting Changed', k); break;
      case 'setV': S.set[k] = el.dataset.v; audit(ME, 'Setting Changed', `${k} · ${el.dataset.v}`); break;
      default: return;
    }
    render();
  });
  root.addEventListener('input', (ev) => { const el = ev.target; const lv = el.dataset.live; if (!lv) return; S[lv] = el.value; S.focus = { k: el.dataset.key, s: el.selectionStart }; render(); });
  root.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.id === 'mnavsel') { const x = AREAS.find((y) => 'a:' + y.id === el.value); if (!x) return; S.view = lastTab[x.id] || x.tabs[0][0]; S.drawer = null; render(); const m = root.querySelector('.main'); if (m) m.scrollTop = 0; return; }
    if (el.dataset.role) { const r = ROLES[+el.dataset.role]; r[1][+el.dataset.perm] = el.checked ? 1 : 0; audit(ME, 'Role Changed', `${r[0]} ${el.checked ? 'can now' : 'can no longer'} ${PERMS[+el.dataset.perm].toLowerCase()}`); toast('Saved and logged'); return; }
    if (el.dataset.team) { TEAM[+el.dataset.team][1] = el.value; audit(ME, 'Staff Role Changed', `${TEAM[+el.dataset.team][0]} → ${el.value}`); toast('Role changed'); return; }
    const b = el.dataset.bind; if (!b) return;
    if (b === 'us') S.us = el.value; else if (b.startsWith('set.')) { const kk = b.slice(4); S.set[kk] = el.type === 'number' ? +el.value : el.value; audit(ME, 'Setting Changed', kk); }
    render();
  });
  document.addEventListener('keydown', (ev) => { if (!root.isConnected) return; if (ev.key === 'Escape' && (S.drawer || S.gq || S.menu)) { S.drawer = null; S.gq = ''; S.menu = false; render(); } });

  function ROUTE(hv, P) { if (hv === 'user') { const q = (P.id || P.name || '').toLowerCase(); const u = USERS.find((x) => x.id.toLowerCase() === q || x.name.toLowerCase() === q || x.short.toLowerCase() === q); if (u) { S.uid = u.id; S.view = 'user'; S.ptab = P.tab || 'overview'; } return; } if (hv) S.view = hv; }
  // deep links: Board.dc.html#view?key=value
  const DEEP = () => { try { const raw = decodeURIComponent((location.hash || '').slice(1)); if (!raw) return; const [hv, hq] = raw.split('?'); const P = {}; (hq || '').split('&').forEach((kv) => { const [k, v] = kv.split('='); if (k) P[k] = v || ''; }); ROUTE(hv, P); } catch (e) { /* no deep link */ } };
  DEEP();
  window.addEventListener('hashchange', () => { if (!root.isConnected) return; if ('drawer' in S) S.drawer = null; DEEP(); render(); const mm = root.querySelector('.main'); if (mm) mm.scrollTop = 0; });
  render();

  // ===== richer profile (function declarations only: hoisted) =====
  function wkey(w) { if (!w || w === 'Today' || w === 'Just now') return [2026, 10]; const p = w.replace(',', '').split(' '); return [/\d{4}$/.test(w) ? +w.slice(-4) : 2026, MON.indexOf(p[0])]; }
  function ext(u, d) {
    if (d.x) return d.x; const r = rng('x' + u.id); const x = {};
    // journey
    const T = d.T; const passed = d.accts.some((a) => ['Passed', 'Funded'].includes(a.st)); const fp = d.payouts.length;
    x.steps = [['Signed Up', u.joined, true], ['First Evaluation', day(T.fe), d.orders.length > 0], ['Passed', day(T.pass), passed], ['KYC Verified', day(T.kyc), u.kyc === 'verified'], ['Funded', day(T.fund), u.funded > 0], ['First Payout', day(T.pay), fp > 0]];
    // money by month
    const months = Math.min(12, Math.max(3, Math.ceil(u.joinedAgo / 30) + 1)); x.money = [];
    for (let k = months - 1; k >= 0; k--) { const dt = new Date(2026, 10 - k, 1); x.money.push({ l: MON[dt.getMonth()], y: dt.getFullYear(), m: dt.getMonth(), s: 0, p: 0 }); }
    const slot = (w) => { const [y, m] = wkey(w); return x.money.find((b) => b.y === y && b.m === m); };
    d.orders.forEach((o) => { const b = slot(o.when); if (b && o.st === 'Paid') b.s += o.amt; });
    d.payouts.forEach((p) => { const b = slot(p.when); if (b) b.p += p.amt; });
    // risk parts
    const shared = d.devices.some((v) => v.shared.length) || u.i === 11;
    const raw = [['Limit Use', 2 + r() * 10], ['Trading Pattern', 2 + r() * 9], ['Open Alerts', u.i === 7 ? 22 : u.i === 11 ? 14 : r() * 3], ['Shared Devices, Cards or IPs', shared ? 18 : r() * 3], ['Chargebacks and Refunds', u.i === 11 ? 12 : d.orders.some((o) => o.st === 'Refunded') ? 5 : 0], ['New Account', u.joinedAgo < 60 ? 8 : 1], ['Identity', u.kyc === 'pending' && u.ks.sev === 'hi' ? 20 : u.kyc === 'verified' ? 0 : 4]];
    const tot = raw.reduce((s, q) => s + q[1], 0) || 1; x.risk = raw.map(([n, v]) => [n, Math.round(v / tot * u.risk)]).sort((a, b) => b[1] - a[1]);
    // engagement
    x.sign30 = u.lastAgo > 20 ? 1 : Math.round(6 + r() * 34); x.sess = Math.round(8 + r() * 40); x.open = Math.round(35 + r() * 55); x.nps = u.i === 3 ? 4 : Math.round(6 + r() * 4);
    x.churn = u.st !== 'Active' ? 'Gone' : u.lastAgo > 14 ? 'High' : u.lastAgo > 5 || x.sign30 < 8 ? 'Medium' : 'Low';
    x.seg = u.st === 'Banned' ? 'Banned' : u.funded && u.paid > u.spent ? 'Funded Earner' : u.funded ? 'Funded Trader' : d.orders.length >= 4 ? 'Repeat Buyer' : d.orders.length ? 'New Buyer' : 'Never Bought';
    x.next90 = u.st === 'Active' ? Math.round((u.spent / Math.max(1, u.joinedAgo / 30)) * 3 * (x.churn === 'Low' ? 1 : x.churn === 'Medium' ? 0.6 : 0.2) / 10) * 10 : 0;
    // trading
    if (d.accts.length) {
      const n = 40 + Math.floor(r() * 380); const win = 0.38 + r() * 0.26; const aw = Math.round(90 + r() * 260), al = Math.round(70 + r() * 220);
      x.tr = { n, win, aw, al, pf: (win * aw) / ((1 - win) * al), best: Math.round(aw * (2 + r() * 5)), worst: -Math.round(al * (2 + r() * 4)), hold: Math.round(30 + r() * 900), maxUse: Math.round(40 + r() * 60), news: Math.round(r() * 30), overnight: Math.floor(r() * 4), bestShare: Math.round(18 + r() * 40), longs: Math.round(40 + r() * 30) };
      const syms = [['NQ', 'Nasdaq 100'], ['ES', 'S&P 500'], ['MNQ', 'Micro Nasdaq'], ['CL', 'Crude Oil'], ['GC', 'Gold'], ['MES', 'Micro S&P'], ['YM', 'Dow']]; let left = 100; x.tr.sym = [];
      syms.slice().sort(() => r() - 0.5).slice(0, 4).forEach(([s, nm], k) => { const v = k === 3 ? left : Math.round(left * (0.4 + r() * 0.3)); left -= v; x.tr.sym.push([s, nm, v]); });
      const peak = r() < 0.7 ? 2 : 8; x.tr.heat = Array.from({ length: 5 }, () => Array.from({ length: 12 }, (_, h) => Math.max(0, Math.round((Math.exp(-Math.pow(h - peak, 2) / 6) * 0.9 + r() * 0.25) * 100))));
      let v = 0; x.tr.curve = Array.from({ length: 48 }, (_, k) => { v += (r() - (win > 0.5 ? 0.42 : 0.55)) * aw; if (u.funded && k > 30) v += aw * 0.15; return Math.round(v); });
      x.tr.breaks = d.accts.filter((a) => a.st === 'Breached').map((a) => [a.started, a.id, 'Daily Loss Limit', 'Account closed']);
      if (u.i === 7) x.tr.breaks.unshift(['Nov 20', d.accts[0].id, 'Hedging Across Accounts', 'Alert RK-1182 open']);
      if (x.tr.news > 22) x.tr.breaks.push(['Nov 6', d.accts[0].id, 'Trade During Big News', 'Warning email sent']);
    }
    // connections
    x.links = [];
    d.devices.forEach((v) => v.shared.forEach((s) => { const lu = USERS.find((z) => z.name === s); x.links.push({ id: lu ? lu.id : DUPID, name: lu ? lu.name : 'Closed Account ' + DUPID, via: 'Same Device', det: v.fp + ' · ' + v.dev, lvl: 'hi' }); }));
    if (u.i === 11) x.links.push({ id: USERS[10].id, name: USERS[10].name, via: 'Same Card', det: 'Visa •• 8841 paid for both', lvl: 'hi' });
    if (u.i === 16) x.links.push({ id: DUPID, name: 'Closed Account ' + DUPID, via: 'Same Passport', det: 'Passport number matches', lvl: 'hi' });
    if (r() < 0.3) { const o = USERS[(u.i + 5) % USERS.length]; x.links.push({ id: o.id, name: o.name, via: 'Same Wi-Fi', det: 'Same IP address on 3 days, different devices', lvl: 'lo' }); }
    if (u.i === 0) x.links.push({ id: USERS[26].id, name: USERS[26].name, via: 'Same Address', det: 'Same street address, different surname', lvl: 'md' });
    x.refBy = u.aff ? `Affiliate ${u.aff}` : u.i % 9 === 2 ? `Friend ${USERS[(u.i + 3) % USERS.length].name}` : '';
    x.refs = u.i === 4 ? Array.from({ length: 6 }, (_, k) => { const o = USERS[(k * 5 + 9) % USERS.length]; return [o.id, o.name, day(10 + k * 17), money(149 + k * 50)]; }) : u.i % 6 === 1 ? [[USERS[(u.i + 2) % USERS.length].id, USERS[(u.i + 2) % USERS.length].name, day(40), '$149']] : [];
    x.refEarn = u.i === 4 ? 1140 : x.refs.length * 15;
    d.x = x; return x;
  }
  function journeyHtml(x) {
    const cur = x.steps.findIndex((s) => !s[2]);
    return `<div class="card ujr"><ol>${x.steps.map((s, i) => `<li class="${s[2] ? 'done' : i === cur ? 'cur' : ''}"><i>${s[2] ? '✓' : i + 1}</i><div><b>${s[0]}</b><span>${s[2] ? s[1] : i === cur ? 'Next Step' : 'Not Yet'}</span></div></li>`).join('')}</ol></div>`;
  }
  function moneyChart(x) {
    const mx = Math.max(100, ...x.money.map((b) => Math.max(b.s, b.p)));
    return `<div class="umc">${x.money.map((b) => `<div><div class="umb"><i class="s" style="height:${b.s / mx * 100}%" title="Spent ${money(b.s)}"></i><i class="p" style="height:${b.p / mx * 100}%" title="Paid out ${money(b.p)}"></i></div><span>${b.l}</span></div>`).join('')}</div>`;
  }
  function graphSvg(u, x, big) {
    const W = big ? 640 : 420, H = big ? 300 : 210, cx = W / 2, cy = H / 2, R = big ? 115 : 78; const n = x.links.length;
    const grp = []; x.links.forEach((l) => { const g = grp.find((q) => q.id === l.id); if (g) { if (!g.via.includes(l.via)) g.via += ' + ' + l.via; if (l.lvl === 'hi') g.lvl = 'hi'; } else grp.push({ ...l }); }); const n2 = grp.length;
    const nodes = grp.map((l, k) => { const a = -Math.PI / 2 + (k / Math.max(1, n2)) * Math.PI * 2 + (n2 === 2 ? Math.PI / 2 : 0); return { ...l, x: cx + Math.cos(a) * R * 1.55, y: cy + Math.sin(a) * R }; });
    return `<svg viewBox="0 0 ${W} ${H}" class="ugr" role="img" aria-label="Users connected to ${esc(u.name)}">${nodes.map((nd) => `<line x1="${cx}" y1="${cy}" x2="${nd.x}" y2="${nd.y}" class="e ${nd.lvl}"/><text x="${cx + (nd.x - cx) * 0.5 + (Math.abs(nd.x - cx) < 20 ? 8 : 0)}" y="${cy + (nd.y - cy) * 0.5 - 6}" text-anchor="${Math.abs(nd.x - cx) < 20 ? 'start' : 'middle'}" class="el">${nd.via}</text>`).join('')}
      <circle cx="${cx}" cy="${cy}" r="${big ? 26 : 22}" class="me"/><text x="${cx}" y="${cy + 4}" text-anchor="middle" class="mt">${ini(u.name)}</text>
      ${nodes.map((nd) => `<g class="nd" data-act="user" data-id="${nd.id}"><circle cx="${nd.x}" cy="${nd.y}" r="${big ? 18 : 15}" class="o ${nd.lvl}"/><text x="${nd.x}" y="${nd.y + 4}" text-anchor="middle" class="ot">${ini(nd.name.replace('Closed Account ', '? '))}</text><text x="${nd.x}" y="${nd.y + (big ? 34 : 29)}" text-anchor="middle" class="on">${esc(nd.name.length > 20 ? nd.name.slice(0, 19) + '…' : nd.name)}</text></g>`).join('')}</svg>`;
  }
  function pOverview(u, d) {
    const x = ext(u, d); const flags = [];
    if (u.kyc === 'pending') flags.push(['KYC Waiting for Review', u.ks.why, 'identity', 'sched']);
    if (u.i === 7) flags.push(['Open Risk Alert', 'Hedging across accounts, RK-1182. Payouts are on hold.', 'risk', 'err']);
    if (u.i === 11) flags.push(['Chargeback Open', 'ORD-58911, $249. Card shared with another user.', 'payments', 'err']);
    if (x.links.some((l) => l.lvl === 'hi')) flags.push(['Connected to Other Accounts', x.links.filter((l) => l.lvl === 'hi').map((l) => `${l.via} as ${l.name}`).join(', '), 'links', 'err']);
    d.tickets.filter((t) => t.st === 'Open').forEach((t) => flags.push(['Open Support Ticket', `${t.id} · ${t.subj}`, 'support', 'sched']));
    if (u.funded && !d.payouts.length) flags.push(['Funded, No Payout Yet', 'Eligible after 5 winning days', 'payouts', 'plain']);
    const tr = x.tr; const sp = u.spent, pd = u.paid;
    const hs = Math.max(5, Math.min(99, Math.round(100 - u.risk * 0.7 + (u.funded ? 8 : 0) + Math.min(10, x.sign30 / 3)))); const hl = hs >= 70 ? ['Healthy', 'var(--ok)'] : hs >= 45 ? ['Watch', 'var(--wa)'] : ['At Risk', 'var(--no)'];
    return `${journeyHtml(x)}
      <div class="card uhealth" style="margin-bottom:14px"><div class="cb"><div class="uhs">${VZ.ring(hs, hs, 'Health', { s: 92, c: hl[1] })}<div class="uhst"><b>${hl[0]}</b><p class="hint">Blends risk score, how active they are, and whether they cost or make Funded Sky money.</p></div><div class="uhsm">${[['Risk', u.risk, u.risk >= 70 ? 'var(--no)' : u.risk >= 45 ? 'var(--wa)' : 'var(--ok)'], ['Activity', Math.min(100, x.sign30 * 4), 'var(--sky)'], ['Value to Firm', Math.max(4, Math.min(100, 50 + (u.spent - u.paid) / 40)), 'var(--sky)']].map(([l, v, c]) => `<div><div class="rowl"><span>${l}</span><b>${Math.round(v)}</b></div><div class="split"><i style="width:${v}%;background:${c}"></i></div></div>`).join('')}</div>${x.tr ? `<div class="uhsc"><span class="hint">Profit and loss, 48 days</span>${VZ.spark(x.tr.curve, { h: 44, c: x.tr.curve[x.tr.curve.length - 1] < 0 ? 'var(--no)' : 'var(--ok)' })}</div>` : ''}</div></div></div>
      <div class="tiles t6">${[['Lifetime Spent', money(u.spent), `${d.orders.length} orders`], ['Paid Out', money(u.paid), `${d.payouts.length} payouts`], ['Net to Firm', money(u.spent - u.paid), u.spent - u.paid < 0 ? 'Paid more than spent' : 'Spent more than paid'], ['Likely Next 90 Days', money(x.next90), 'Based on how they buy'], ['Risk Score', u.risk, x.risk[0] ? 'Mostly ' + x.risk[0][0].toLowerCase() : 'Out of 99'], ['Churn Risk', x.churn, `${x.sign30} sign-ins in 30 days`]].map(([l, v, s]) => `<div class="tile"><span>${l}</span><b class="${(l === 'Net to Firm' && u.spent - u.paid < 0) || (l === 'Risk Score' && u.risk >= 70) || ['High', 'Gone'].includes(v) ? 'dn' : v === 'Medium' ? 'warn' : ''}">${v}</b><small>${s}</small></div>`).join('')}</div>
      <div class="two wl eq"><div class="card m0"><div class="ch"><h3>Money Over Time</h3><span class="lab">${x.money.length >= 12 && u.joinedAgo > 330 ? 'Last 12 Months' : 'Since Joining'}</span><div class="r lab"><i class="lgs"></i>Spent<i class="lgp"></i>Paid Out</div></div><div class="cb">${moneyChart(x)}</div></div>
      <div class="card m0"><div class="ch"><h3>Needs Attention</h3><span class="lab">${flags.length || ''}</span></div>${flags.length ? flags.map(([t, s, go, c]) => `<button class="ali" data-act="${go === 'risk' ? 'risk' : 'ptab'}" data-k="${go}"><span class="b ${c}">${c === 'err' ? 'Risk' : c === 'sched' ? 'To Do' : 'Info'}</span><div><b>${t}</b><div class="hint">${esc(s)}</div></div><span class="chev">›</span></button>`).join('') : '<div class="empty">Nothing open on this user.</div>'}</div></div>
      <div class="two eq" style="margin-top:14px"><div class="card m0"><div class="ch"><h3>What Makes Up the Risk Score</h3><span class="sc ${u.risk >= 70 ? 'hi' : u.risk >= 45 ? 'md' : ''}">${u.risk}</span></div><div class="cb fg">${x.risk.filter((q) => q[1] > 0).map(([n, v]) => `<div><div class="rowl"><span>${n}</span><b>+${v}</b></div><div class="split"><i style="width:${v / Math.max(1, x.risk[0][1]) * 100}%;background:${v >= 15 ? 'var(--no)' : v >= 8 ? 'var(--wa)' : 'var(--sky)'}"></i></div></div>`).join('')}</div></div>
      <div class="card m0"><div class="ch"><h3>Engagement</h3><span class="b plain">${x.seg}</span></div><div class="cb"><div class="kv">${[['Customer For', u.joinedAgo > 60 ? Math.round(u.joinedAgo / 30) + ' Months' : u.joinedAgo + ' Days'], ['Sign-Ins, Last 30 Days', x.sign30], ['Average Session', x.sess + ' Minutes'], ['Emails Opened', x.open + '%'], ['Last Purchase', d.orders[0] ? d.orders[0].when : 'Never'], ['Satisfaction Score', x.nps + ' out of 10'], ['Referred By', x.refBy || 'Nobody']].map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join('')}</div></div></div></div>
      <div class="two eq" style="margin-top:14px"><div class="card m0"><div class="ch"><h3>Trading at a Glance</h3><div class="r">${tr ? '<button class="lnk" data-act="ptab" data-k="trading">All Trading</button>' : ''}</div></div>${tr ? `<div class="cb"><div class="ugl">${[['Trades', tr.n.toLocaleString('en-US')], ['Win Rate', Math.round(tr.win * 100) + '%'], ['Profit Factor', tr.pf.toFixed(2)], ['Average Hold', tr.hold > 120 ? Math.round(tr.hold / 60) + ' Min' : tr.hold + ' Sec']].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>${curveSvg(tr.curve, 120)}<div class="usy">${tr.sym.map((s) => `<span class="b plain">${s[0]} ${s[2]}%</span>`).join('')}</div></div>` : '<div class="empty">No trades yet.</div>'}</div>
      <div class="card m0"><div class="ch"><h3>Connections</h3><span class="lab">${new Set(x.links.map((l) => l.id)).size} Linked</span><div class="r"><button class="lnk" data-act="ptab" data-k="links">All Connections</button></div></div>${x.links.length ? `<div class="cb">${graphSvg(u, x, false)}</div>` : '<div class="empty">Not connected to any other user by device, card, IP, address or wallet.</div>'}</div></div>
      <div class="two eq" style="margin-top:14px"><div class="card m0"><div class="ch"><h3>Personal Details</h3><div class="r"><button class="lnk" data-act="uact" data-k="edit">Edit</button></div></div><div class="cb"><div class="kv">${[['Full Name', u.name], ['Email', u.email + (u.i === 6 ? ' · change waiting' : '')], ['Phone', u.phone], ['Date of Birth', S.set.mask && !S.reveal[u.id] ? '•• ••, ' + u.dob.slice(-4) : u.dob], ['Address', S.set.mask && !S.reveal[u.id] ? `•••, ${u.city}, ${u.ctry}` : `14 Harbor Street, ${u.city}, ${u.ctry}`], ['Time Zone', u.tz], ['Language', u.lang], ['Signed Up With', u.via], ['Two-Factor Sign-In', u.twofa ? 'On' : 'Off'], ['Marketing Emails', u.mkt ? 'Opted In' : 'Opted Out']].map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join('')}</div>${S.set.mask ? `<div class="cbf">${S.reveal[u.id] ? '<span class="hint">Showing full details. Your view was logged.</span>' : `<button class="pill sm" data-act="drw" data-k="reveal">Show Full Details</button><span class="hint">Asks for a reason and is logged</span>`}</div>` : ''}</div></div>
      <div class="card m0"><div class="ch"><h3>Recent Activity</h3><div class="r"><button class="lnk" data-act="ptab" data-k="activity">All Activity</button></div></div><div class="cb"><div class="tl2 tlx">${d.act.slice(0, 7).map((e) => `<div><i class="${e[0]}"></i><div><b>${esc(e[2])}</b><p>${esc(e[3])} · ${e[1]}</p></div></div>`).join('')}</div></div></div></div>`;
  }
  function curveSvg(c, h) {
    const W = 600, H = h, lo = Math.min(0, ...c), hi = Math.max(0, ...c), rg = hi - lo || 1; const y = (v) => 8 + (H - 16) - (v - lo) / rg * (H - 16); const xx = (i) => i / (c.length - 1) * W;
    const pts = c.map((v, i) => xx(i).toFixed(1) + ',' + y(v).toFixed(1)).join(' ');
    return `<svg viewBox="0 0 ${W} ${H}" class="ucv" style="height:${h}px" preserveAspectRatio="none" role="img" aria-label="Profit and loss over the last ${c.length} trading days"><line x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}" class="z"/><polygon points="0,${y(0)} ${pts} ${W},${y(0)}" class="f ${c[c.length - 1] < 0 ? 'neg' : ''}"/><polyline points="${pts}" class="l ${c[c.length - 1] < 0 ? 'neg' : ''}" vector-effect="non-scaling-stroke"/></svg>`;
  }
  function pTrading(u, d) {
    const x = ext(u, d); const tr = x.tr; if (!tr) return '<div class="card"><div class="empty emp2"><b>No Trades Yet</b><p class="hint">Stats show up after the first trade on any account.</p></div></div>';
    const total = tr.curve[tr.curve.length - 1];
    return `<div class="tiles t6">${[['Trades', tr.n.toLocaleString('en-US'), 'All accounts'], ['Win Rate', Math.round(tr.win * 100) + '%', `${Math.round(tr.n * tr.win)} winners`], ['Profit Factor', tr.pf.toFixed(2), tr.pf >= 1 ? 'Makes more than it loses' : 'Loses more than it makes'], ['Average Win / Loss', `${money(tr.aw)} / ${money(tr.al)}`, 'Per trade'], ['Best Day', money(tr.best), 'Worst ' + money(tr.worst)], ['Average Hold', tr.hold > 120 ? Math.round(tr.hold / 60) + ' Min' : tr.hold + ' Sec', `${tr.longs}% long`]].map(([l, v, s]) => `<div class="tile"><span>${l}</span><b class="${l === 'Profit Factor' && tr.pf < 1 ? 'dn' : ''} ${l.startsWith('Average Win') ? 'sm' : ''}">${v}</b><small>${s}</small></div>`).join('')}</div>
      <div class="card"><div class="ch"><h3>Profit and Loss</h3><span class="lab">Last 48 Trading Days, All Accounts</span><div class="r"><b class="${total < 0 ? 'dn' : 'up'}">${total < 0 ? '−' : '+'}${money(Math.abs(total))}</b></div></div><div class="cb">${curveSvg(tr.curve, 220)}</div></div>
      <div class="two"><div class="card m0"><div class="ch"><h3>Most Traded</h3></div><div class="cb fg">${tr.sym.map(([s, n, v]) => `<div><div class="rowl"><span><b class="mono">${s}</b> ${n}</span><b>${v}%</b></div><div class="split"><i style="width:${v}%"></i></div></div>`).join('')}</div></div>
      <div class="card m0"><div class="ch"><h3>When They Trade</h3><span class="lab">Eastern Time</span></div><div class="cb"><div class="uhm"><span></span>${Array.from({ length: 12 }, (_, h) => `<span class="hh">${h % 2 ? '' : ((h + 7) % 12 || 12) + (h + 7 < 12 ? 'a' : 'p')}</span>`).join('')}${tr.heat.map((row, di) => `<span class="hd">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][di]}</span>${row.map((v, h) => `<i style="opacity:${0.08 + v / 100 * 0.92}" title="${['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][di]} ${(h + 7) % 12 || 12}${h + 7 < 12 ? ' AM' : ' PM'}: ${v}% of peak"></i>`).join('')}`).join('')}</div></div></div></div>
      <div class="two" style="margin-top:14px"><div class="card m0"><div class="ch"><h3>Habits</h3></div><div class="cb"><div class="kv">${[['Most Contracts Used', tr.maxUse + '% of the limit', tr.maxUse > 90], ['Trades Near Big News', tr.news + '%', tr.news > 22], ['Held Overnight', tr.overnight + ' Times', tr.overnight > 2], ['Best Day Share of Profit', tr.bestShare + '%', tr.bestShare > 40], ['Long vs Short', `${tr.longs}% / ${100 - tr.longs}%`, false]].map(([k, v, bad]) => `<div><span>${k}</span><b class="${bad ? 'warnt' : ''}">${v}</b></div>`).join('')}</div></div></div>
      <div class="card m0"><div class="ch"><h3>Rule Breaks and Warnings</h3><span class="lab">${tr.breaks.length}</span></div>${tr.breaks.length ? `<div class="tsc"><table class="t"><tbody>${tr.breaks.map((b) => `<tr><td class="nw hint">${b[0]}</td><td class="nw mono">${b[1]}</td><td class="nw"><b>${b[2]}</b></td><td class="hint">${b[3]}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">No rule breaks.</div>'}</div></div>`;
  }
  function pLinks(u, d) {
    const x = ext(u, d);
    return `<div class="two wl"><div class="card m0"><div class="ch"><h3>Connected Users</h3><span class="lab">By device, card, IP, address, wallet or document</span></div>${x.links.length ? `<div class="cb">${graphSvg(u, x, true)}</div><div class="tsc"><table class="t"><thead><tr><th>User</th><th>How</th><th>Detail</th><th>Strength</th><th></th></tr></thead><tbody>${x.links.map((l, i) => `<tr><td class="nw">${uById(l.id) ? `<button class="lnk" data-act="user" data-id="${l.id}">${esc(l.name)}</button>` : esc(l.name)}</td><td class="nw"><b>${l.via}</b></td><td class="hint">${esc(l.det)}</td><td><span class="b ${l.lvl === 'hi' ? 'err' : l.lvl === 'md' ? 'draft' : 'plain'}">${{ hi: 'Strong', md: 'Medium', lo: 'Weak' }[l.lvl]}</span></td><td class="num nw">${l.ok ? '<span class="hint">Marked Not Related</span>' : `<button class="pill sm" data-act="linkOk" data-i="${i}">Not Related</button>`}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty emp2"><b>No Connections</b><p class="hint">This user shares no device, card, IP address, street address, wallet or document with anyone else.</p></div>'}</div>
      <div><div class="card m0"><div class="ch"><h3>Referrals</h3></div><div class="cb"><div class="kv"><div><span>Referred By</span><b>${u.aff ? XL('Affiliates', 'all', esc(x.refBy)) : esc(x.refBy || 'Nobody')}</b></div><div><span>People They Referred</span><b>${x.refs.length}</b></div><div><span>Referral Earnings</span><b>${money(x.refEarn)}</b></div></div></div>${x.refs.length ? `<div class="tsc"><table class="t"><thead><tr><th>Referred</th><th>Joined</th><th class="num">They Spent</th></tr></thead><tbody>${x.refs.map((q) => `<tr><td class="nw"><button class="lnk" data-act="user" data-id="${q[0]}">${esc(q[1])}</button></td><td class="nw hint">${q[2]}</td><td class="num">${q[3]}</td></tr>`).join('')}</tbody></table></div>` : ''}</div>
      <div class="card" style="margin-top:14px"><div class="ch"><h3>Shared With Nobody</h3></div><div class="cb"><div class="chks">${[['Devices', !d.devices.some((v) => v.shared.length)], ['Payment Cards', u.i !== 11], ['Payout Wallet or Bank', true], ['Street Address', u.i !== 0], ['Identity Document', u.i !== 16]].map(([n, ok]) => `<div class="ck2 ${ok ? '' : 'f'}"><i>${ok ? '✓' : '✕'}</i><div><b>${n}</b><div class="hint">${ok ? 'Only this user' : 'Also used by another account'}</div></div></div>`).join('')}</div></div></div></div></div>`;
  }

}
