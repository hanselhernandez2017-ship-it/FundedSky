  // ===== trader charts =====
  const kfmt = (v) => (Math.abs(v) >= 1000 ? (v < 0 ? '−' : '') + '$' + (Math.abs(v) / 1000).toFixed(Math.abs(v) >= 10000 ? 0 : 1) + 'K' : (v < 0 ? '−' : '') + '$' + Math.round(Math.abs(v)));
  // area chart with gridlines, y labels, optional reference lines and x labels
  function achart(vals, opt = {}) {
    const h = opt.h || 220, W = 1000; const lines = []; (opt.lines || []).forEach((l) => { const m = lines.find((x) => Math.abs(x.v - l.v) < 1e-6); if (m) m.l = m.l + ' · ' + l.l; else lines.push(Object.assign({}, l)); });
    const all = vals.concat(lines.map((l) => l.v)); let lo = Math.min(...all), hi = Math.max(...all); const pad = (hi - lo || 1) * 0.12; lo -= pad; hi += pad;
    const Y = (v) => (1 - (v - lo) / (hi - lo)) * h; const X = (i) => (i / (vals.length - 1)) * W;
    const d = vals.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
    const col = opt.c || 'var(--sky)'; const id = 'g' + Math.random().toString(36).slice(2, 8);
    const grid = [0, 1, 2, 3].map((k) => lo + ((hi - lo) * (k + 0.5)) / 4);
    const fm = opt.fmt || kfmt;
    return `<div class="ach" style="height:${h}px"><svg viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".32"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>${grid.map((g) => `<line x1="0" x2="${W}" y1="${Y(g).toFixed(1)}" y2="${Y(g).toFixed(1)}" class="gl"/>`).join('')}${lines.map((l) => `<line x1="0" x2="${W}" y1="${Y(l.v).toFixed(1)}" y2="${Y(l.v).toFixed(1)}" stroke="${l.c}" stroke-width="1.5" stroke-dasharray="6 6" vector-effect="non-scaling-stroke"/>`).join('')}<path d="${d} L${W} ${h} L0 ${h} Z" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${col}" stroke-width="2.2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>
      ${grid.map((g) => `<span class="yl" style="top:${((Y(g) / h) * 100).toFixed(1)}%">${fm(g)}</span>`).join('')}${(() => { const ls = lines.map((l) => ({ l, y: Y(l.v) })).sort((a2, b2) => a2.y - b2.y); for (let i = 1; i < ls.length; i++) if (ls[i].y - ls[i - 1].y < 25) ls[i].y = ls[i - 1].y + 25; for (let i = ls.length - 1; i >= 0; i--) { const cap = i === ls.length - 1 ? h - 12 : ls[i + 1].y - 25; if (ls[i].y > cap) ls[i].y = cap; } return ls.map(({ l, y }) => `<span class="rl" style="top:${((Math.min(h - 8, y) / h) * 100).toFixed(1)}%;color:${l.c};border-color:${l.c}">${l.l}</span>`).join(''); })()}<span class="dot" style="left:100%;top:${((Y(vals[vals.length - 1]) / h) * 100).toFixed(1)}%;background:${col}"></span>${opt.x ? `<div class="xl">${opt.x.map((t) => `<span>${t}</span>`).join('')}</div>` : ''}</div>`; }
  // vertical bars
  function vbars(items, opt = {}) { const mx = Math.max(...items.map((x) => Math.abs(x.v)), 1); const h = opt.h || 160; const neg = items.some((x) => x.v < 0);
    const bar = (x) => (!x.v ? '' : `<i class="${x.v < 0 ? 'n' : ''} ${x.cls || ''}" style="height:${((Math.abs(x.v) / mx) * 100).toFixed(1)}%"></i>`);
    return `<div class="vb${neg ? ' neg' : ''}" style="height:${h + 34}px">${items.map((x) => `<div class="c" title="${x.l}: ${x.t || x.v}">${neg ? `<div class="bw2"><div class="up">${x.v >= 0 ? bar(x) : ''}</div><div class="dh2">${x.v < 0 ? bar(x) : ''}</div></div>` : `<div class="bw">${bar(x)}</div>`}${opt.show ? `<em>${x.t || x.v}</em>` : ''}<span>${x.l}</span></div>`).join('')}</div>`; }
  // donut with segments
  function donut(segs, big, small, opt = {}) { const s = opt.s || 150, R = 15.9155, tot = segs.reduce((a, x) => a + x.v, 0) || 1; let off = 25;
    return `<div class="dn" style="width:${s}px;height:${s}px"><svg viewBox="0 0 42 42" aria-hidden="true"><circle cx="21" cy="21" r="${R}" fill="none" stroke="var(--p3)" stroke-width="${opt.w || 5}"/>${segs.map((x) => { const p = (x.v / tot) * 100; const el = `<circle cx="21" cy="21" r="${R}" fill="none" stroke="${x.c}" stroke-width="${opt.w || 5}" stroke-dasharray="${Math.max(0, p - (segs.length > 1 ? 1.2 : 0)).toFixed(2)} ${(100 - p + (segs.length > 1 ? 1.2 : 0)).toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" stroke-linecap="${segs.length > 1 ? 'butt' : 'round'}"/>`; off -= p; return el; }).join('')}</svg><div class="dc"><b>${big}</b>${small ? `<span>${small}</span>` : ''}</div></div>`; }
  const legend = (segs) => `<div class="lg2">${segs.map((x) => `<div><i style="background:${x.c}"></i><span>${x.l}</span><b>${x.t || x.v}</b></div>`).join('')}</div>`;
  // milestone track
  function track(val, marks, opt = {}) { const mx = opt.max || marks[marks.length - 1].v;
    return `<div class="trk"><div class="ln"><i style="width:${Math.min(100, (val / mx) * 100).toFixed(1)}%"></i></div>${marks.map((m) => `<div class="mk${val >= m.v ? ' y' : ''}" style="left:${((m.v / mx) * 100).toFixed(1)}%"><b></b><span>${m.l}</span><small>${m.s || ''}</small></div>`).join('')}<div class="me2" style="left:${Math.min(100, (val / mx) * 100).toFixed(1)}%"><em>${opt.me || ''}</em></div></div>`; }
  // a panel header icon chip
  const chip = (k, c) => `<span class="chp ${c || ''}">${ico(k, 'width="18" height="18"')}</span>`;
  // trader credit card visual
  const cardViz = (brand, last, exp, name) => `<div class="ccv"><div class="t"><span>${brand}</span><i></i></div><div class="n mono">•••• •••• •••• ${last}</div><div class="b"><span>${name}</span><span>${exp}</span></div></div>`;
