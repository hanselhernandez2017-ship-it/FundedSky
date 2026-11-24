/*LIVE*/

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
  // ---------- live data: designs from the server, edits and switches from the store ----------
  const F = window.FSG; const BO = F.BO; const EMD = window.__EM || { defs: { SENDERS: {}, SAMPLE: {}, E: {}, FLOWS: [], GROUP_LABEL: {} }, byDay: [], logs: [] };
  const SENDERS = EMD.defs.SENDERS; const SAMPLE = EMD.defs.SAMPLE;
  const MERGE = [['{first_name}', 'First name'], ['{account}', 'Account number'], ['{plan}', 'Plan name'], ['{size}', 'Account size'], ['{platform}', 'Platform'], ['{code}', 'One-time code'], ['{amount}', 'Amount'], ['{order}', 'Order number'], ['{ticket}', 'Ticket number']];
  const ST = Object.assign({ on: {}, paused: {}, custom: {}, customFlow: {}, hist: {} }, F.st('emails.state', {}));
  const TPL = F.st('emails.tpl', {});
  const E = {}; Object.entries(EMD.defs.E).forEach(([k, e]) => { E[k] = Object.assign({}, e, TPL[k] || {}); });
  Object.entries(ST.custom).forEach(([k, e]) => { E[k] = Object.assign({}, e, TPL[k] || {}, { custom: true }); });
  const FLOWS = EMD.defs.FLOWS.map((f) => ({ ...f, lanes: f.lanes.map((l) => l.slice()), paused: !!ST.paused[f.id] }));
  Object.entries(ST.customFlow).forEach(([k, at]) => { const f = FLOWS.find((x) => x.id === at.flow); if (f && E[k]) (f.lanes[at.lane] || f.lanes[0]).push('E:' + k); });
  const saveState = () => { const on = {}; Object.values(E).forEach((e) => { if (!e.req && !e.on) on[e.id] = false; }); const paused = {}; FLOWS.forEach((f) => { if (f.paused) paused[f.id] = true; }); const custom = {}; const customFlow = {}; Object.values(E).filter((e) => e.custom).forEach((e) => { custom[e.id] = { n: e.n, w: e.w, fr: e.fr, s: e.s, p: e.p, e: e.e, h: e.h, a: e.a, b: e.b, cta: e.cta, n2: e.n2, mk: e.mk, draft: e.draft }; const f = FLOWS.find((x) => x.lanes.some((l) => l.includes('E:' + e.id))); if (f) customFlow[e.id] = { flow: f.id, lane: f.lanes.findIndex((l) => l.includes('E:' + e.id)) }; }); const hist = {}; Object.values(E).forEach((e) => { if (e.hist && e.hist.length) hist[e.id] = e.hist.slice(0, 20); }); return F.put('emails.state', { on, paused, custom, customFlow, hist }).catch((x) => toast(x.message)); };
  const EDITF = ['n', 'w', 'fr', 'mk', 's', 'p', 'e', 'h', 'a', 'b', 'cta', 'n2'];
  // logs from the outbox
  const STMAP = { queued: 'Sent', sent: 'Sent', delivered: 'Delivered', opened: 'Opened', clicked: 'Clicked', bounced: 'Bounced', complaint: 'Complaint', failed: 'Failed', suppressed: 'Suppressed', logged: 'Not Sent', test: 'Test Mode' };
  const WHY = { Failed: 'The provider refused the message', 'Not Sent': 'Resend is not connected, so the email was only logged', Suppressed: 'On the Suppression List', 'Test Mode': 'Test Mode was on' };
  const mask = (a) => { const [u, d] = String(a).split('@'); return (u || '').slice(0, 1) + '***@' + (d || ''); };
  const LOGS = EMD.logs.map((o) => { const st = STMAP[o.status] || 'Sent'; const ev = o.events || []; const bo = ev.find((x) => x.k === 'bounced'); return { id: o.ext_id || 'out_' + o.id, oid: o.id, e: (({ reset: 'pwreset', verify: 'confirm', receipt: 'order', ticket: 'reply' })[o.template]) || (o.template || '').replace(/^test:/, ''), raw: o.template, subj: o.subject, to: mask(o.to_email), full: o.to_email, t: o.tid ? `${o.first} ${(o.last || '').slice(0, 1)}. · ${o.tid}` : 'Not a trader', uid: o.user_id, at: o.created_at, when: F.when ? F.when(o.created_at) : F.ago(o.created_at), st, why: (bo && bo.why) || WHY[st] || '', ev }; });
  const TRACK = LOGS.some((l) => l.ev.length);
  const EO = (x) => E[x.e] || { id: x.e, n: x.raw === 'notify' ? 'Message from Staff' : x.raw ? x.raw : 'Message from Staff', s: x.subj, p: '', fr: 'support', h: x.subj, a: '', b: [], other: true };
  const ME = '[Your Name]';
  const XL = (board, hash, label, cls) => `<a class="${cls || 'lnk'}" href="Admin${board}.dc.html${hash ? '#' + hash : ''}">${label}</a>`;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fill = (t) => String(t == null ? '' : t).replace(/\{(\w+)\}/g, (m, k) => SAMPLE[k] != null ? SAMPLE[k] : m);
  const fe = (t) => esc(fill(t));
  const num = (n) => Math.round(n).toLocaleString('en-US');
  const rng = (seed) => { let h = 2166136261; for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; };
  const uid = (p) => p + Date.now().toString(36);
  const CHEV = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

  // stats per email, from the outbox
  const dayN = (d) => Math.floor((Date.now() - new Date(d + 'T12:00:00Z')) / 864e5);
  const rowsFor = (id, days) => EMD.byDay.filter((r) => r.template === id && dayN(r.d) < days);
  const cnt = (rows, sts) => rows.filter((r) => !sts || sts.includes(r.status)).reduce((a, r) => a + r.n, 0);
  const SENT = ['queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complaint'];
  const statFor = (e, days) => { const rw = rowsFor(e.id, days); const sent = cnt(rw, SENT); const pc = (sts) => (sent ? Math.round(cnt(rw, sts) / sent * 1000) / 10 : 0); return { sent, open: pc(['opened', 'clicked']), click: pc(['clicked']), bounce: pc(['bounced']), spam: pc(['complaint']), failed: cnt(rw, ['failed']), unsub: 0 }; };
  Object.entries(E).forEach(([id, e]) => {
    e.id = id; e.on = e.req ? true : ST.on[id] !== false && !(e.custom && e.draft); e.hist = (ST.hist[id] || []).slice(); e.v = 1 + e.hist.length;
    Object.assign(e, statFor(e, 30)); e.open = Math.round(e.open); e.click = Math.round(e.click);
  });
  const pct = (v, sent) => (!sent ? '—' : TRACK ? v + '%' : '—');
  const flowOf = (id) => FLOWS.find((f) => f.lanes.some((l) => l.includes('E:' + id)));
  const emailsIn = (f) => f.lanes.flat().filter((x) => x.startsWith('E:')).map((x) => E[x.slice(2)]);
  const isOn = (e) => e.req || (e.on && !(flowOf(e.id) || {}).paused);
  const totals = () => { const all = Object.values(E); const sent = all.reduce((a, e) => a + e.sent, 0); const w = (k) => Math.round(all.reduce((a, e) => a + e.sent * e[k], 0) / Math.max(1, sent)); const d = (n) => EMD.byDay.filter((r) => dayN(r.d) < n && SENT.includes(r.status)).reduce((a, r) => a + r.n, 0); return { sent, today: d(1), week: d(7), open: w('open'), click: w('click'), failed: EMD.byDay.filter((r) => dayN(r.d) < 30 && ['failed', 'bounced'].includes(r.status)).reduce((a, r) => a + r.n, 0) }; };
  const flowStats = (f) => { const es = emailsIn(f); const sent = es.reduce((a, e) => a + e.sent, 0); const w = (k) => sent ? Math.round(es.reduce((a, e) => a + e.sent * e[k], 0) / sent) : 0; return { sent, open: w('open'), click: w('click') }; };

  const S = {
    view: 'flow', flow: 'signup', sel: 'welcome', open: { signup: true }, tab: 'preview', dev: 'desktop', full: false, panel: false,
    edit: null, who: { q: '', f: 'all', row: -1 }, range: 30, toast: '',
    logs: { status: 'all', q: '', em: 'all', row: null },
    rules: Object.assign({ quiet: true, qFrom: '21:00', qTo: '08:00', capDay: '1', capWeek: '3', pauseMk: false, noMkAfterBreach: true, test: false, testTo: (BO.me || {}).email || '', failover: true }, F.st('emails.rules', {})),
    brand: Object.assign({ address: (((BO.settings || {}).company || {}).address) || '', support: 'support@fundedsky.com', legal: 'All Funded Sky accounts trade in a simulated environment. Nothing in this email is investment advice.', x: 'x.com/fundedsky', ig: '', discord: 'discord.gg/[invite]' }, F.st('emails.brand', {})),
    supp: F.st('emails.supp', []).map((x) => ({ a: x.a, k: x.k, why: x.why, d: x.at ? F.md(x.at) : x.d || '' })),
    focus: null, dom: null
  };
  F.watch(() => S.rules, 'emails.rules'); F.watch(() => S.brand, 'emails.brand');
  const saveSupp = () => F.put('emails.supp', S.supp.map((x) => ({ a: x.a, k: x.k, why: x.why, at: x.at || new Date().toISOString(), d: x.d }))).catch((x) => toast(x.message));

  const recipients = (e) => LOGS.filter((l) => l.e === e.id).slice(0, 200);
  const STB = { Sent: 'plain', 'Not Sent': 'ret', 'Test Mode': 'ret', Delivered: 'plain', Opened: 'sched', Clicked: 'live', Bounced: 'err', Failed: 'err', Complaint: 'draft', Suppressed: 'ret' };

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
        <div>${['Funded Sky', S.brand.address, S.brand.support].filter((x) => x && !/^\[/.test(x)).map(esc).join(' · ')}</div>
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
      return `<button class="nd ndm ${S.sel === e.id ? 'sel' : ''} ${on ? '' : 'off'}" data-act="pick" data-id="${e.id}"><div class="k"><i></i>${e.mk ? 'Marketing Email' : 'Email'}<span class="tg ${e.req ? 'lock' : on ? 'on' : ''}">${tag}</span></div><h4>${esc(e.n)}</h4><p>${esc(e.w)}</p><div class="st"><div><span>Sent</span><b>${num(e.sent)}</b></div><div><span>Opened</span><b>${pct(e.open, e.sent)}</b></div><div><span>Clicked</span><b>${pct(e.click, e.sent)}</b></div></div></button>`;
    }
    const [t, sub] = rest.split('|');
    if (k === 'T') return `<div class="nd trg"><div class="k"><i></i>Trigger</div><h4>${esc(t)}</h4>${sub ? `<p>${esc(sub)}</p>` : ''}</div>`;
    return `<div class="nd wt"><div class="k"><i></i>${k === 'W' ? 'Wait' : 'Only If'}</div><h4>${esc(t)}</h4>${sub ? `<p>${esc(sub)}</p>` : ''}</div>`;
  }
  function vFlow() {
    const f = FLOWS.find((x) => x.id === S.flow); const st = flowStats(f); const opt = emailsIn(f).filter((e) => !e.req).length;
    const lanes = f.lanes.map((l, li) => `<div class="lane">${l.map((s, i) => node(s, f, li, i === l.length - 1)).join('<div class="cn"></div>')}<div class="cn"></div><div class="nd end"><span>Flow Ends</span><button class="lnk" data-act="addEmail" data-id="${f.id}" data-i="${li}">+ Add Email</button></div></div>`).join('');
    return `<div class="fh"><div class="fht"><h1>${esc(f.name)}</h1><p>${esc(f.desc)}</p></div><div class="fhr"><div class="ms"><span>Sent</span><b>${num(st.sent)}</b></div><div class="ms"><span>Opened</span><b>${pct(st.open, st.sent)}</b></div><div class="ms"><span>Clicked</span><b>${pct(st.click, st.sent)}</b></div>${opt ? `<label class="wf">Whole Flow<button class="sw ${f.paused ? '' : 'on'}" data-act="flowOn" data-id="${f.id}" role="switch" aria-checked="${!f.paused}" aria-label="Whole flow on or off"></button></label>` : '<span class="b plain lock" title="Every email here is required">Always On</span>'}</div></div>
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
    const X = statFor(e, S.range); const sent = X.sent; const del = Math.round(sent * (1 - X.bounce / 100));
    const n = S.range === 7 ? 7 : S.range === 30 ? 30 : 45; const vals = Array.from({ length: n }, (_, i) => cnt(EMD.byDay.filter((r) => r.template === e.id && dayN(r.d) === n - 1 - i), SENT)); const mx = Math.max(1, ...vals);
    const tile = (l, v, s2) => `<div class="tile"><span>${l}</span><b>${v}</b>${s2 ? `<small>${s2}</small>` : ''}</div>`;
    const lk = {}; LOGS.filter((l) => l.e === e.id).forEach((l) => l.ev.filter((v) => v.k === 'clicked').forEach((v) => { const u = v.link || 'Link'; lk[u] = (lk[u] || 0) + 1; })); const lt = Object.values(lk).reduce((a, b) => a + b, 0); const links = Object.entries(lk).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([u, v]) => [u.replace(/^https?:\/\/[^/]+/, '') || u, Math.round(v / lt * 100)]);
    const pv = (v, c) => (sent ? (TRACK ? v + '%' : '—') : '—');
    const sh = sent ? [['Delivered or Opened', Math.max(0, 100 - X.bounce - X.spam)], ['Bounced', X.bounce]] : [];
    return `<div class="seg" style="margin-bottom:14px">${[7, 30, 90].map((d) => `<button class="${S.range === d ? 'on' : ''}" data-act="range" data-k="${d}">${d} Days</button>`).join('')}</div>
      <div class="tiles t3">${tile('Sent', num(sent))}${tile('Delivered', sent && TRACK ? ((del / sent) * 100).toFixed(1) + '%' : '—', TRACK ? num(del) : 'Needs the Resend webhook')}${tile('Opened', pv(X.open), TRACK ? num(sent * X.open / 100) : '')}${tile('Clicked', pv(X.click), TRACK ? num(sent * X.click / 100) : '')}${tile('Bounced', pv(X.bounce), TRACK ? num(sent * X.bounce / 100) : '')}${e.mk ? tile('Unsubscribed', '—', 'Not tracked yet') : tile('Spam Reports', pv(X.spam), TRACK ? num(sent * X.spam / 100) : '')}</div>
      <div class="card"><div class="ch"><h3>Sent per Day</h3><span class="lab">Last ${S.range} Days</span></div><div class="cb">${sent ? `<div class="bars">${vals.map((v) => `<i style="height:${Math.max(2, Math.round(v / mx * 100))}%" title="${v}"></i>`).join('')}</div>` : '<div class="empty">Nothing sent in this period.</div>'}</div></div>
      ${links.length ? `<div class="card"><div class="ch"><h3>Links Clicked</h3><span class="lab">Share of Clicks</span></div><table class="t"><tbody>${links.map(([l, v]) => `<tr><td class="mono">${esc(l)}</td><td class="num">${v}%</td></tr>`).join('')}</tbody></table></div>` : ''}
      ${sh.length && TRACK ? `<div class="card m0"><div class="ch"><h3>What Happened</h3></div><div class="cb"><div class="split"><i style="width:${sh[0][1]}%"></i></div><div class="splitl">${sh.map(([l, v]) => `<span>${l} ${v.toFixed ? v.toFixed(1).replace('.0', '') : v}%</span>`).join('')}</div></div></div>` : ''}`;
  }

  const evLine = (x, e) => { const lab = { delivered: 'Delivered', opened: 'Opened', clicked: 'Clicked', bounced: 'Bounced', complained: 'Marked as Spam' }; const ev = [['Queued', F.when ? F.when(x.at) : x.when]]; if (x.st === 'Not Sent' || x.st === 'Test Mode' || x.st === 'Suppressed') { ev.push([x.st, x.why]); return ev; } ev.push(['Sent to Resend', 'Same second']); if (x.st === 'Failed') ev.push(['Failed', x.why]); x.ev.forEach((v) => { if (lab[v.k]) ev.push([lab[v.k], v.k === 'clicked' ? (v.link || 'Link') : v.k === 'bounced' ? (v.why || 'Bounced') : (F.when ? F.when(v.at) : F.ago(v.at))]); }); return ev; };
  function tWho(e) {
    const all = recipients(e); const q = S.who.q.toLowerCase();
    const list = all.filter((x) => (S.who.f === 'all' || x.st.toLowerCase() === S.who.f) && (!q || (x.t + x.to).toLowerCase().includes(q)));
    const tl = (x) => { const ev = evLine(x, e); return `<div class="tl">${ev.map(([a, b]) => `<div><i></i><b>${a}</b><span>${esc(b)}</span></div>`).join('')}</div>`; };
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
      <div class="card m0"><div class="ch"><h3>Version History</h3></div><table class="t"><tbody>${[...e.hist, { v: 1, who: e.custom ? (e.by || ME) : 'Funded Sky', when: e.custom ? (e.at ? F.md(e.at) : '') : 'At launch', text: e.custom ? 'Created' : 'Wording at launch' }].slice(0, 6).map((h) => `<tr><td class="nw mono">v${h.v}</td><td>${esc(h.text)}<div class="hint">${esc(h.who)} · ${esc(h.when)}</div></td></tr>`).join('')}</tbody></table></div>
    </div>`;
  }

  // ---------- tool views ----------
  function vLogs() {
    const L = S.logs; const q = L.q.toLowerCase();
    const list = LOGS.filter((x) => (L.status === 'all' || x.st === L.status) && (L.em === 'all' || x.e === L.em) && (!q || (x.to + x.t + x.id + EO(x).n + x.subj).toLowerCase().includes(q)));
    const tot = {}; LOGS.forEach((x) => { tot[x.st] = (tot[x.st] || 0) + 1; }); tot.Delivered = (tot.Delivered || 0) + (tot.Opened || 0) + (tot.Clicked || 0) + (tot.Complaint || 0) + (TRACK ? 0 : tot.Sent || 0); tot.Opened = (tot.Opened || 0) + (tot.Clicked || 0);
    return `<div class="ph"><div><h1>Email Logs</h1><p>Every email sent in the last 30 days, with what happened to it. Failed and bounced emails can be sent again.</p></div></div>
      <div class="tiles t6">${[['Delivered', 'Delivered'], ['Opened', 'Opened'], ['Clicked', 'Clicked'], ['Bounced', 'Bounced'], ['Failed', 'Failed'], ['Complaint', 'Spam Reports']].map(([k, l]) => `<button class="tile lk ${L.status === k ? 'sel' : ''}" data-act="logF" data-k="${k}"><span>${l}</span><b>${num(tot[k] || 0)}</b><small>${L.status === k ? 'Filtering below' : 'Last 30 days'}</small></button>`).join('')}</div>
      <div class="card"><div class="ch lgf"><input type="search" placeholder="Search Email, Trader or Message ID" value="${esc(L.q)}" data-live="logs.q" data-key="logq" aria-label="Search logs"><select data-bind="logs.em" aria-label="Email">${'<option value="all">All Emails</option>' + Object.values(E).filter((e) => LOGS.some((l) => l.e === e.id)).sort((a, b) => a.n.localeCompare(b.n)).map((e) => `<option value="${e.id}" ${L.em === e.id ? 'selected' : ''}>${esc(e.n)}</option>`).join('')}</select><div class="r"><div class="seg">${['all', 'Failed', 'Bounced'].map((k) => `<button class="${L.status === k ? 'on' : ''}" data-act="logF" data-k="${k}">${k === 'all' ? 'All' : k}</button>`).join('')}</div></div></div>
        <div class="tsc"><table class="t"><thead><tr><th>When</th><th>Trader</th><th>Email</th><th>Status</th><th>Details</th><th></th></tr></thead><tbody>${list.length ? list.map((x) => `<tr class="lk" data-act="logRow" data-id="${x.id}"><td class="nw">${esc(x.when)}</td><td class="nw"><b>${esc(x.t)}</b><div class="hint mono">${esc(x.to)}</div></td><td class="nw">${esc(EO(x).n)}</td><td><span class="b ${STB[x.st]}">${x.st === 'Complaint' ? 'Spam Report' : x.st}</span></td><td class="hint">${esc(x.why || '—')}</td><td class="num nw">${['Failed', 'Bounced'].includes(x.st) ? `<button class="lnk" data-act="resend" data-id="${x.id}">Send Again</button>` : ''}</td></tr>`).join('') : '<tr><td colspan="6" class="empty">No emails match.</td></tr>'}</tbody></table></div></div>
      <p class="hint">Logs are kept for 30 days. Message IDs match the ones in Resend. ${TRACK ? '' : 'Delivered, opened and clicked need the Resend webhook: add it in ' + XL('Settings', 'integrations', 'Integrations') + '.'}</p>`;
  }
  function logDrawer() {
    const x = LOGS.find((l) => l.id === S.logs.row); if (!x) return ''; const e = EO(x);
    const ev = evLine(x, e);
    return `<div class="drw-bg" data-act="closeLog"></div><div class="drw" role="dialog" aria-label="Message details"><div class="drw-h"><h3>${esc(e.n)}</h3><button class="ic" data-act="closeLog" style="margin-left:auto" aria-label="Close">✕</button></div><div class="drw-b">
      <div class="sec"><h4>Message</h4><div class="kv"><div><span>To</span><b class="mono">${esc(x.to)}</b></div><div><span>Trader</span><b>${esc(x.t)}</b></div><div><span>Subject</span><b>${esc(x.subj)}</b></div><div><span>From</span><b>${esc(sender(e)[1])}</b></div><div><span>Message ID</span><b class="mono">${x.id}</b></div><div><span>Status</span><b><span class="b ${STB[x.st]}">${x.st === 'Complaint' ? 'Spam Report' : x.st}</span></b></div></div></div>
      <div class="sec"><h4>What Happened</h4><div class="tl">${ev.map(([a, b]) => `<div><i></i><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('')}</div></div>
      ${e.other ? '' : `<div class="sec"><h4>Email</h4><div class="pvw desktop">${emailHtml(e, 'desktop')}</div></div>`}
    </div><div class="drw-f">${['Failed', 'Bounced'].includes(x.st) ? `<button class="pill pri" data-act="resend" data-id="${x.id}">Send Again</button>` : ''}${e.other ? '' : `<button class="pill" data-act="viewEmail" data-id="${x.e}">Open This Email</button>`}<button class="pill" data-act="closeLog">Close</button></div></div>`;
  }
  const loadDom = () => { S.dom = { loading: true }; F.api('/emails/domain').then((d) => { S.dom = d; render(); }).catch((x) => { S.dom = { err: x.message }; render(); }); };
  function vDomain() {
    const R = S.rules; if (!S.dom) loadDom(); const D = S.dom || {}; const dm = D.domain; const on = F.on('resend');
    const stB = (st) => (st === 'verified' ? '<span class="b live">Verified</span>' : st === 'failure' || st === 'failed' ? '<span class="b err">Failed</span>' : st ? `<span class="b ret">${esc(st.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()))}</span>` : '<span class="b ret">Not Checked</span>');
    const purpose = (x) => (x.rec === 'SPF' ? (x.type === 'MX' ? 'Return Path' : 'SPF') : x.rec === 'DKIM' ? 'DKIM' : x.rec || x.type);
    const dns = dm ? dm.records : [];
    return `<div class="ph"><div><h1>Sending Domain</h1><p>Where emails come from, and the records that keep them out of spam folders. All domains are listed in ${XL('Settings', 'domains', 'Settings')}.</p></div></div>
      <div class="two">
        <div class="card m0"><div class="ch"><h3>Provider</h3></div><div class="cb fg">
          <div class="prov"><span class="imono">EM</span><div><b>Resend</b><div class="hint">Primary · sends every email</div></div>${on ? '<span class="b live">Connected</span>' : '<span class="b ret">Not Connected</span>'}</div>
          <div class="prov"><span class="imono">BK</span><div><b>Backup Provider</b><div class="hint">Takes over if the primary fails</div></div><span class="b ret">Not Set Up</span></div>
          <label class="chk"><input type="checkbox" ${R.failover ? 'checked' : ''} data-bind="rules.failover"> Switch to the Backup Automatically After 3 Failed Sends in a Row</label>
          <button class="pill" data-act="goIntg" style="justify-self:start">Manage Keys in Integrations</button>
        </div></div>
        <div class="card m0"><div class="ch"><h3>Domain</h3><div class="r">${dm ? stB(dm.status) : ''}</div></div><div class="cb">${D.loading ? '<div class="empty">Checking with Resend…</div>' : D.err ? `<div class="empty">${esc(D.err)}</div>` : !D.connected ? '<div class="empty">Connect Resend in Integrations to see the sending domain.</div>' : `<div class="kv"><div><span>Domain</span><b class="mono">${esc(dm ? dm.name : '—')}</b></div><div><span>Added</span><b>${dm && dm.created ? F.md(dm.created) : '—'}</b></div><div><span>Region</span><b>${esc(dm && dm.region || '—')}</b></div><div><span>From Address</span><b class="mono">${esc(D.from || '—')}</b></div><div><span>Sent Today</span><b>${num(totals().today)}</b></div></div>`}</div></div>
      </div>
      <div class="card" style="margin-top:14px"><div class="ch"><h3>DNS Records</h3><span class="lab">Add These at Your Domain Host</span><div class="r"><button class="pill sm" data-act="checkDns">Check Again</button></div></div><div class="tsc"><table class="t"><thead><tr><th>Purpose</th><th>Type</th><th>Host</th><th>Value</th><th>Status</th><th></th></tr></thead><tbody>${dns.length ? dns.map((x) => `<tr><td class="nw"><b>${esc(purpose(x))}</b></td><td class="mono">${esc(x.type)}</td><td class="mono nw">${esc(x.name)}</td><td class="mono dnsv">${esc(x.value)}</td><td>${stB(x.status)}</td><td class="num"><button class="lnk" data-act="copy" data-k="${esc(x.value)}">Copy</button></td></tr>`).join('') : `<tr><td colspan="6" class="empty">${D.connected ? 'No domain added in Resend yet.' : 'Records appear once Resend is connected.'}</td></tr>`}</tbody></table></div></div>
      <div class="card"><div class="ch"><h3>Sender Addresses</h3><span class="lab">Replies Go to Support</span></div><div class="tsc"><table class="t"><thead><tr><th>Name</th><th>Address</th><th>Used For</th><th class="num">Emails</th></tr></thead><tbody>${Object.entries(SENDERS).map(([k, [n, a]]) => { const c = Object.values(E).filter((e) => e.fr === k); const dom2 = ((S.dom && S.dom.from || '').match(/@([^>\s]+)/) || [])[1]; return `<tr><td class="nw"><b>${esc(n)}</b></td><td class="mono">${esc(dom2 ? a.split('@')[0] + '@' + dom2 : a)}</td><td>${esc(c.slice(0, 3).map((e) => e.n).join(', '))}${c.length > 3 ? ` and ${c.length - 3} more` : ''}</td><td class="num">${c.length}</td></tr>`; }).join('')}</tbody></table></div></div>`;
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
      <div class="tb-mid hm"><div class="tb-stats"><div><span>Sent Today</span><b>${num(T.today)}</b></div><div><span>7 Days</span><b>${num(T.week)}</b></div><div><span>30 Days</span><b>${num(T.sent)}</b></div><div><span>Opened</span><b>${pct(T.open, T.sent)}</b></div><div><span>Clicked</span><b>${pct(T.click, T.sent)}</b></div><div><span>Failed</span><b class="${T.failed ? 'bad' : ''}">${T.failed}</b></div></div></div>
      <div class="igs hm"><button class="ig" data-act="go" data-v="domain" title="Resend: ${F.on('resend') ? 'connected' : 'not connected'}" aria-label="Email provider"><span>EM</span><i style="background:var(${F.on('resend') ? '--ok' : '--fa'})"></i></button><button class="sendw" data-act="go" data-v="domain">${F.on('resend') ? 'Sending with Resend' : 'Resend Not Connected'}</button></div>
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
      case 'emOn': { const x = E[id]; x.on = !x.on; if (x.draft && x.on) x.draft = false; saveState(); toast(`${x.n} ${x.on ? 'turned on' : 'turned off'}`); return; }
      case 'flowOn': { const f = FLOWS.find((x) => x.id === id); f.paused = !f.paused; saveState(); toast(f.paused ? `${f.name} paused. Always-on emails still send.` : `${f.name} is on`); return; }
      case 'dev': S.dev = k; break;
      case 'test': { const d = S.edit && S.edit.id === e.id ? S.edit.f : null; F.api('/emails/test', { key: e.id, draft: d ? Object.fromEntries(EDITF.map((k2) => [k2, d[k2]])) : null }).then((r2) => toast(`Test of "${e.n}" sent to ${r2.to}`)).catch((x) => toast(x.message)); return; }
      case 'full': S.full = true; break;
      case 'closeFull': S.full = false; break;
      case 'range': S.range = +k; break;
      case 'whoF': S.who.f = k; S.who.row = -1; break;
      case 'whoRow': S.who.row = S.who.row === i ? -1 : i; break;
      case 'efType': if (e.req) return; startEdit(e).mk = k === 'mk' ? 1 : 0; break;
      case 'copyMerge': try { navigator.clipboard.writeText(k); } catch (x) { /* clipboard blocked */ } toast(`Copied ${k}`); return;
      case 'saveEdit': { if (!S.edit) return; const f = S.edit.f; const keep = { id: e.id, sent: e.sent, open: e.open, click: e.click, bounce: e.bounce, unsub: e.unsub, on: e.on, hist: e.hist, custom: e.custom, draft: e.draft, req: e.req };
        Object.assign(e, f, keep); e.v += 1; e.hist.unshift({ v: e.v, who: ME, when: F.md(new Date()), text: 'Edited wording' }); S.edit = null;
        const T2 = Object.assign({}, F.st('emails.tpl', {})); const base = EMD.defs.E[e.id]; if (base) { const o = {}; EDITF.forEach((k2) => { if (JSON.stringify(e[k2]) !== JSON.stringify(base[k2])) o[k2] = e[k2]; }); if (Object.keys(o).length) T2[e.id] = o; else delete T2[e.id]; }
        F.put('emails.tpl', T2).then(() => saveState()).then(() => toast(`Saved. Version ${e.v} sends from now on.`)).catch((x) => toast(x.message)); render(); return; }
      case 'discardEdit': S.edit = null; break;
      case 'delEmail': { const f = flowOf(e.id); f.lanes.forEach((l) => { const j = l.indexOf('E:' + e.id); if (j >= 0) l.splice(j, 1); }); delete E[e.id]; S.sel = (emailsIn(f)[0] || {}).id; S.edit = null; S.tab = 'preview'; saveState(); toast('Email deleted'); return; }
      case 'addEmail': { const f = FLOWS.find((x) => x.id === id); const nid = uid('custom'); E[nid] = { id: nid, n: '[New Email]', w: 'Set when this sends', fr: 'hello', s: '[Subject]', p: '[Preview text]', e: '[Small Heading]', h: '[Headline]', a: '', b: ['[Body]'], cta: '', sent: 0, open: 0, click: 0, bounce: 0, unsub: 0, on: false, draft: true, custom: true, v: 1, hist: [], by: ME, at: new Date().toISOString() }; f.lanes[i].push('E:' + nid); saveState(); S.sel = nid; S.tab = 'edit'; S.panel = true; startEdit(E[nid]); toast('New email added as a draft. It stays off until you turn it on.'); return; }
      case 'logF': S.logs.status = S.logs.status === k ? 'all' : k; break;
      case 'logRow': S.logs.row = id; break;
      case 'closeLog': S.logs.row = null; break;
      case 'resend': { const x = LOGS.find((l) => l.id === id); if (S.supp.some((s2) => s2.a.toLowerCase() === x.full.toLowerCase() && s2.k !== 'Unsubscribed')) { toast(`${x.to} is on the Suppression List. Remove it first.`); return; } F.api('/emails/resend/' + x.oid, {}).then(() => { x.why = 'Sent again by ' + ME; toast('Sent again'); }).catch((y) => toast(y.message)); return; }
      case 'viewEmail': S.view = 'flow'; S.flow = flowOf(id).id; S.open = { [S.flow]: true }; S.sel = id; S.panel = true; S.tab = 'preview'; S.logs.row = null; break;
      case 'goIntg': location.href = '/admin/settings#integrations'; return;
      case 'checkDns': loadDom(); break;
      case 'copy': try { navigator.clipboard.writeText(k); } catch (x) { /* clipboard blocked */ } toast('Copied'); return;
      case 'rule': S.rules[k] = !S.rules[k]; break;
      case 'suppDel': { const x = S.supp.splice(i, 1)[0]; saveSupp(); toast(`${x.a} removed`); return; }
      case 'suppAdd': { const inp = root.querySelector('#suppadd'); const v = (inp.value || '').trim(); if (!/^\S+@\S+\.\S+$/.test(v)) { toast('Enter a full email address'); return; } S.supp.unshift({ a: v, k: 'Unsubscribed', why: 'Added by ' + ME, d: F.md(new Date()), at: new Date().toISOString() }); saveSupp(); toast(`${v} added`); return; }
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
