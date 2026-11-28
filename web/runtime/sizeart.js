/* Funded Sky account-size badges ("Foil Tile"). One graphic per account size, drawn from data as inline SVG. No dependencies, no external assets.
   Served as /static/sizeart.js (copied by scripts/build-web.js) to the trader app, the checkout pages and the back office.
   Browser: window.FSSIZE.sizeBadge(25000, { px: 44, plan: 'prime', theme: 'dark' })  ->  '<svg ...>' string
   Node:    require('./sizeart.js').sizeBadge(...)
   size:  a number (25000) or a label ('25K', '$150K', '1M').
   px:    rendered size; the drawing simplifies itself below 40px (sm), 40-79px (md) and 80px+ (lg, hero).
   plan:  optional 'essential' | 'prime' | 'evaluation' | 'instant' | 'funded'; adds a small plan mark (40px and up) and, at hero size, a caption.
   theme: 'dark' (default) or 'light'.  key: optional text that keeps the gradient ids of two identical badges on one page apart.
   deco:  true when the text next to the badge already says the size (the badge is then hidden from screen readers).
   off:   true greys the badge out (closed and breached accounts).
   Gradient ids come from the options, so a page that redraws itself (morphdom) leaves unchanged badges alone.
   FSSIZE.retheme(el, 'light') redraws every badge inside el; FSSIZE.follow(el) does that whenever el gains or loses the class "light".
   On design-template pages <dc-import name="SizeBadge" size="..." px="40"></dc-import> draws one in the page's theme.
   Safety: the only data that reaches the markup is the size number (formatted here) and the aria-label (escaped). */
(function (root) {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const FONT = "'Mona Sans','Inter',system-ui,-apple-system,'Segoe UI',sans-serif";

  // Tier ramp. Same colour language as the pack rarities and the certificate tones:
  // steel (under 25K) -> sky 25K -> violet 50K -> gold 100K -> prism platinum 150K -> ember (above 150K).
  // rim: the foil frame, light to deep. dk: dark-theme enamel face [top, bottom] and number [top, bottom]. lt: the same for the light theme.
  const TIERS = [
    { id: 'steel', name: 'Steel', max: 24999, rank: 1,
      rim: ['#FFFFFF', '#DCE3EC', '#9AA7B8', '#56606F', '#C9D2DE'], glow: 'rgba(200,210,224,.30)',
      dk: { face: ['#2A313B', '#0E1116'], num: ['#FFFFFF', '#C9D2DE'], acc: '#C9D2DE' },
      lt: { face: ['#FBFCFE', '#E4E9F0'], num: ['#3A4350', '#1B2029'], acc: '#56606F' } },
    { id: 'sky', name: 'Sky', max: 25000, rank: 1,
      rim: ['#E3F3FF', '#9BD3FF', '#4C9BE8', '#1C5FA8', '#BFE3FF'], glow: 'rgba(76,155,232,.45)',
      dk: { face: ['#17487E', '#071A30'], num: ['#FFFFFF', '#A9D8FF'], acc: '#7CC4FF' },
      lt: { face: ['#F3F9FF', '#D3E8FB'], num: ['#1C6FC0', '#0B3E73'], acc: '#1C84DE' } },
    { id: 'violet', name: 'Violet', max: 50000, rank: 2,
      rim: ['#F1ECFF', '#C3ADFF', '#8E6CF0', '#4E2DB8', '#DCD0FF'], glow: 'rgba(142,108,240,.45)',
      dk: { face: ['#3A2394', '#120934'], num: ['#FFFFFF', '#D5C6FF'], acc: '#C3ADFF' },
      lt: { face: ['#F7F4FF', '#E3DAFF'], num: ['#6A47D9', '#341A92'], acc: '#6A47D9' } },
    { id: 'gold', name: 'Gold', max: 100000, rank: 3,
      rim: ['#FFF6DA', '#FFE08A', '#E0A23A', '#8A5609', '#F5CD7A'], glow: 'rgba(245,192,78,.45)',
      dk: { face: ['#5A3A06', '#1A1002'], num: ['#FFF8E1', '#F5C04E'], acc: '#F5CD7A' },
      lt: { face: ['#FFFAEC', '#F8E4B2'], num: ['#A36A0C', '#5C3A03'], acc: '#A36A0C' } },
    { id: 'prism', name: 'Prism', max: 150000, rank: 4, holo: true,
      rim: ['#FFFFFF', '#D9FBFF', '#8FDDEA', '#3C97AA', '#F2FEFF'], glow: 'rgba(143,221,234,.50)',
      dk: { face: ['#14505C', '#06161B'], num: ['#FFFFFF', '#BDF3FB'], acc: '#8FDDEA' },
      lt: { face: ['#F4FDFF', '#D6F1F6'], num: ['#1E7D8F', '#0A3A44'], acc: '#1E7D8F' } },
    { id: 'ember', name: 'Ember', max: Infinity, rank: 5, holo: true,
      rim: ['#FFE6E8', '#FFB46B', '#F2777F', '#8E1E3A', '#FFD0D4'], glow: 'rgba(242,119,127,.48)',
      dk: { face: ['#8A1838', '#22040E'], num: ['#FFFFFF', '#FFC2C7'], acc: '#FF8A92' },
      lt: { face: ['#FFF5F6', '#FBDCE0'], num: ['#C2334E', '#6E1027'], acc: '#C2334E' } }
  ];

  const PLAN = {
    essential: { kind: 'evaluation', cap: 'Evaluation' }, prime: { kind: 'evaluation', cap: 'Evaluation' }, evaluation: { kind: 'evaluation', cap: 'Evaluation' },
    instant: { kind: 'instant', cap: 'Instant' }, funded: { kind: 'funded', cap: 'Funded' }
  };

  function toNumber(size) {
    if (typeof size === 'number') return size;
    const m = /^\s*\$?\s*([\d.]+)\s*([kKmM]?)/.exec(String(size || ''));
    if (!m) return 0; const n = parseFloat(m[1]);
    return m[2] ? n * (/m/i.test(m[2]) ? 1e6 : 1e3) : n;
  }
  function label(size) {
    const n = toNumber(size);
    if (n >= 1e6) return { num: String(+(n / 1e6).toFixed(2)), unit: 'M' };
    if (n >= 1e3) return { num: String(+(n / 1e3).toFixed(1)), unit: 'K' };
    return { num: String(Math.round(n)), unit: '' };
  }
  function tier(size) { const n = toNumber(size); return TIERS.find((t) => n <= t.max) || TIERS[TIERS.length - 1]; }

  // short stable hash for gradient ids
  const hash = (str) => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  // A 150deg-ish linear gradient from a list of colours
  const lin = (id, stops, x2 = 0.62, y2 = 1, x1 = 0, y1 = 0) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map((c, i) => `<stop offset="${(i / (stops.length - 1)).toFixed(3)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  const HOLO_STOPS = ['#FFB3DE', '#A9DBFF', '#B6FFD9', '#FFF0A8', '#FFB3DE'];

  // Number: big digits with a smaller unit, fitted to maxW (viewBox units). Two layers: a soft dark cut-shadow and the gradient face.
  function number(L, o) {
    const digits = L.num.replace('.', '').length + (L.num.includes('.') ? 0.35 : 0);
    let F = o.F; const uF = 0.6; // unit is 60% of the digits
    const est = (f) => f * (digits * 0.6 + (L.unit ? 0.64 * uF + 0.02 : 0)) - f * 0.03 * digits;
    while (est(F) > o.maxW && F > 10) F -= 0.5;
    const x = o.cx; const y = o.cy + F * 0.355;
    const t = (fill, dx, dy, extra = '') => `<text x="${x + dx}" y="${y + dy}" text-anchor="middle" font-family="${FONT}" font-weight="${o.w || 700}" font-size="${F}" letter-spacing="${(-0.03 * F).toFixed(2)}" fill="${fill}" ${extra}>${L.num}${L.unit ? `<tspan font-size="${(F * uF).toFixed(1)}" font-weight="${o.w || 700}" dx="${(0.03 * F).toFixed(2)}" fill-opacity="${o.unitOp || 0.86}">${L.unit}</tspan>` : ''}</text>`;
    return (o.shadow ? t(o.shadow, 0, o.sh || F * 0.05, `fill-opacity="${o.shOp || 0.55}"`) : '') + t(o.fill, 0, 0, o.stroke ? `stroke="${o.stroke}" stroke-width="${o.sw || 0.6}" paint-order="stroke"` : '');
  }

  // Plan mark: evaluation = target ring, instant = bolt, funded = wing. Drawn in a 24-unit circle centred on 0,0.
  function planGlyph(kind, ink) {
    if (kind === 'instant') return `<path d="M1.6-7.2L-4.6 1.2h4.3L-1.6 7.2 4.6-1.2H.3z" fill="${ink}"/>`;
    if (kind === 'funded') return `<path d="M-6.4 3.6c4.4 0 9.2-1.8 13.4-8.6-.6 6-3.6 10.2-8.6 11.6l-1.6-2.4z" fill="${ink}"/><path d="M-6.4 3.6l5.2 1.4" stroke="${ink}" stroke-width="1.5" stroke-linecap="round"/>`;
    return `<circle r="5.6" fill="none" stroke="${ink}" stroke-width="2"/><circle r="1.9" fill="${ink}"/>`;
  }
  function planMark(kind, t, th, u, x, y, r) {
    const ink = th === 'light' ? '#FFFFFF' : '#0B0D12';
    const fill = th === 'light' ? t.lt.num[1] : t.dk.acc;
    return `<g transform="translate(${x} ${y})"><circle r="${r + 2.6}" fill="${th === 'light' ? '#FFFFFF' : '#0B0D12'}"/><circle r="${r}" fill="url(#${u}rim)"/><circle r="${r - 1.6}" fill="${fill}"/><g transform="scale(${(r / 11.5).toFixed(3)})">${planGlyph(kind, ink)}</g></g>`;
  }

  // Sparkle used at hero size (the certificate's four-point star)
  const star = (x, y, s, c, op = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-10C.8-3 3-.8 10 0 3 .8.8 3 0 10-.8 3-3 .8-10 0-3-.8-.8-3 0-10z" fill="${c}" fill-opacity="${op}"/>`;

  // ---------- Direction A: foil tile (rounded square, drop-in for today's .asz tile) ----------
  function tileA(t, L, o, u) {
    const th = o.theme, P = th === 'light' ? t.lt : t.dk, lod = o.lod;
    const rimW = lod === 'sm' ? 5 : 4.2, R = lod === 'sm' ? 24 : 23, ir = R - rimW + 0.5;
    const plan = o.planKind && lod !== 'sm';
    let d = '<defs>';
    d += lin(u + 'rim', t.rim);
    d += lin(u + 'rim2', [t.rim[4], t.rim[2], t.rim[3]], 0, 1, 0, 0);
    d += `<radialGradient id="${u}face" cx=".32" cy=".18" r="1.05"><stop offset="0" stop-color="${P.face[0]}"/><stop offset="1" stop-color="${P.face[1]}"/></radialGradient>`;
    d += lin(u + 'num', P.num, 0, 1);
    d += `<linearGradient id="${u}gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${th === 'light' ? 0.75 : 0.16}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
    d += `<linearGradient id="${u}sheen" x1="0" y1="0" x2="1" y2="1"><stop offset=".30" stop-color="#fff" stop-opacity="0"/><stop offset=".44" stop-color="#fff" stop-opacity="${th === 'light' ? 0.55 : 0.13}"/><stop offset=".50" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
    if (t.holo) d += lin(u + 'holo', HOLO_STOPS, 1, 1);
    d += `<clipPath id="${u}fc"><rect x="${rimW}" y="${rimW}" width="${100 - 2 * rimW}" height="${100 - 2 * rimW}" rx="${ir}"/></clipPath>`;
    d += '</defs>';
    let s = d;
    // foil frame with a bevel: outer metal, a hairline of light on the top edge, a dark inner lip
    s += `<rect x="0" y="0" width="100" height="100" rx="${R}" fill="url(#${u}rim)"/>`;
    if (t.holo) s += `<rect x="0" y="0" width="100" height="100" rx="${R}" fill="url(#${u}holo)" opacity="${t.id === 'prism' ? 0.85 : 0.5}" style="mix-blend-mode:${t.id === 'prism' ? 'multiply' : 'soft-light'}"/>`;
    s += `<rect x=".9" y=".9" width="98.2" height="98.2" rx="${R - 0.9}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="${lod === 'sm' ? 1.6 : 1.1}"/>`;
    s += `<rect x="${rimW - 0.9}" y="${rimW - 0.9}" width="${100 - 2 * rimW + 1.8}" height="${100 - 2 * rimW + 1.8}" rx="${ir + 0.9}" fill="url(#${u}rim2)" opacity=".9"/>`;
    // enamel face
    s += `<rect x="${rimW}" y="${rimW}" width="${100 - 2 * rimW}" height="${100 - 2 * rimW}" rx="${ir}" fill="url(#${u}face)"/>`;
    s += `<g clip-path="url(#${u}fc)">`;
    if (lod !== 'sm') {
      // guilloche: fine concentric arcs from the top-left, like the certificate's background lines
      let g = ''; for (let i = 0; i < (lod === 'lg' ? 11 : 6); i++) g += `<circle cx="18" cy="-6" r="${30 + i * (lod === 'lg' ? 9 : 14)}" fill="none" stroke="${P.acc}" stroke-opacity="${th === 'light' ? 0.16 : 0.13}" stroke-width="${lod === 'lg' ? 0.6 : 0.9}"/>`;
      s += g;
    }
    const cap = lod === 'lg' && o.cap;
    if (lod === 'lg') {
      // light burst behind the number
      s += `<circle cx="50" cy="${o.planKind ? 44 : 50}" r="36" fill="${P.acc}" fill-opacity="${th === 'light' ? 0.10 : 0.16}"/>`;
      let rays = ''; for (let i = 0; i < 28; i++) if (!(cap && i > 10 && i < 18)) rays += `<rect x="-.55" y="-46" width="1.1" height="${[7, 11, 5, 9][i % 4]}" rx=".55" fill="${P.acc}" fill-opacity="${[0.5, 0.75, 0.35, 0.6][i % 4] * (th === 'light' ? 0.6 : 0.7)}" transform="rotate(${i * (360 / 28)})"/>`;
      s += `<g transform="translate(50 ${o.planKind ? 46 : 50})">${rays}</g>`;
    }
    if (t.id === 'prism') s += `<rect x="0" y="0" width="100" height="100" fill="url(#${u}holo)" opacity="${th === 'light' ? 0.32 : 0.16}"/>`;
    s += `<path d="M0 0H100V46C70 38 30 38 0 48Z" fill="url(#${u}gloss)"/>`;
    s += `<rect x="-20" y="-20" width="140" height="140" fill="url(#${u}sheen)"/>`;
    s += '</g>';
    s += `<rect x="${rimW}" y="${rimW}" width="${100 - 2 * rimW}" height="${100 - 2 * rimW}" rx="${ir}" fill="none" stroke="${th === 'light' ? '#000' : '#000'}" stroke-opacity="${th === 'light' ? 0.10 : 0.45}" stroke-width="${lod === 'sm' ? 1.2 : 0.8}"/>`;
    // number
    const cy = cap ? 44 : (plan ? 47 : 50);
    s += number(L, { cx: 50, cy, F: lod === 'sm' ? 44 : lod === 'md' ? 40 : 36, maxW: lod === 'sm' ? 84 - 2 * rimW : lod === 'md' ? 78 - 2 * rimW : 74 - 2 * rimW, fill: `url(#${u}num)`, shadow: th === 'light' ? '#fff' : '#000', shOp: th === 'light' ? 0.9 : 0.5, sh: lod === 'sm' ? 1.6 : 1.4 });
    // rank pips under the number (tier 1-5) from 56px
    if (o.px >= 56) {
      const n = t.rank; const k = lod === 'lg' ? 1.7 : 2.3; const gap = k * 3.6; const y0 = cap ? 66 : 77; let p = '';
      for (let i = 0; i < n; i++) p += `<rect x="${50 + (i - (n - 1) / 2) * gap - k}" y="${y0 - k}" width="${2 * k}" height="${2 * k}" transform="rotate(45 ${50 + (i - (n - 1) / 2) * gap} ${y0})" fill="${P.acc}"/>`;
      s += p;
    }
    if (cap) s += `<text x="50" y="80" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="6.6" letter-spacing="1.3" fill="${P.acc}">${esc(o.cap.toUpperCase())}</text>`;
    if (lod === 'lg') s += star(80, 19, 0.55, th === 'light' ? P.acc : '#fff', 0.95);
    if (plan && !cap) { const r = o.px < 56 ? 14 : o.px < 80 ? 12 : 9.5; s += planMark(o.planKind, t, th, u, 100 - r - 1, 100 - r - 1, r); }
    return s;
  }

  // Only direction A (foil tile) ships; the coin and crest studies were not chosen and are left out.

  function sizeBadge(size, opt) {
    const o = Object.assign({ px: 44, theme: 'dark', plan: '', caption: true, glow: true, key: '', deco: false, off: false }, opt || {});
    const px = Math.max(16, Math.round(+o.px || 44));
    const t = tier(size); const L = label(size); const pl = PLAN[String(o.plan || '').toLowerCase()] || null;
    const lod = px < 40 ? 'sm' : px < 80 ? 'md' : 'lg';
    const th = o.theme === 'light' ? 'light' : 'dark';
    const u = 'fsz' + hash([toNumber(size), px, th, pl ? pl.kind : '', o.caption ? 1 : 0, o.key].join('|')) + '_';
    const body = tileA(t, L, { px, lod, theme: th, planKind: pl && pl.kind, cap: o.caption && pl ? pl.cap : '' }, u);
    const aria = `$${L.num}${L.unit}${pl ? ' ' + pl.cap : ''} account`;
    // glow and contact shadow are CSS filters, so they paint outside the box and never shift layout
    const light = th === 'light';
    const blur = (k) => Math.max(1, Math.round(px * k));
    const flt = o.glow === false || o.off ? '' : light
      ? `filter:drop-shadow(0 ${Math.max(1, Math.round(px * 0.03))}px ${blur(0.05)}px rgba(16,18,22,.16)) drop-shadow(0 ${blur(0.08)}px ${blur(0.16)}px ${t.glow.replace(/[\d.]+\)$/, '.22)')});`
      : `filter:drop-shadow(0 ${Math.max(1, Math.round(px * 0.03))}px ${blur(0.04)}px rgba(0,0,0,.55)) drop-shadow(0 0 ${blur(lod === 'sm' ? 0.12 : 0.18)}px ${t.glow});`;
    const off = o.off ? 'filter:grayscale(1);opacity:.5;' : '';
    const data = esc([toNumber(size), px, o.plan || '', o.key || '', o.caption ? 1 : 0, o.deco ? 1 : 0, o.off ? 1 : 0, o.glow === false ? 0 : 1].join('|'));
    const a11y = o.deco ? 'aria-hidden="true" focusable="false"' : `role="img" aria-label="${esc(aria)}"`;
    return `<svg class="fs-szb fs-szb-${t.id}${o.off ? ' off' : ''}" data-tier="${t.id}" data-th="${th}" data-szb="${data}" viewBox="0 0 100 100" width="${px}" height="${px}" ${a11y} style="display:block;flex:none;overflow:visible;-webkit-user-select:none;user-select:none;${off || flt}" xmlns="http://www.w3.org/2000/svg">${o.deco ? '' : `<title>${esc(aria)}</title>`}${body}</svg>`;
  }

  // Redraw the badges inside el for another theme (the back office switches theme without redrawing the page)
  function retheme(el, theme) {
    if (!el || !el.querySelectorAll) return; const th = theme === 'light' ? 'light' : 'dark';
    el.querySelectorAll('svg.fs-szb[data-szb]').forEach((sv) => {
      if (sv.getAttribute('data-th') === th) return;
      const [size, px, plan, key, cap, deco, off, glow] = sv.getAttribute('data-szb').split('|');
      const w = document.createElement('div'); w.innerHTML = sizeBadge(+size, { px: +px, plan, key, caption: cap === '1', deco: deco === '1', off: off === '1', glow: glow !== '0', theme: th });
      sv.replaceWith(w.firstChild);
    });
  }
  function follow(el) {
    if (!el || el.__fsszb || typeof MutationObserver === 'undefined') return; el.__fsszb = 1;
    const th = () => (el.classList.contains('light') ? 'light' : 'dark');
    let last = th(); retheme(el, last);
    new MutationObserver(() => { const now = th(); if (now !== last) { last = now; retheme(el, now); } }).observe(el, { attributes: true, attributeFilter: ['class'] });
  }

  const api = { sizeBadge, retheme, follow, tier, label, toNumber, TIERS, PLAN };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }
  root.FSSIZE = api;
  // design-template pages (web/pages/*.dc.html, rendered by dc.js): <dc-import name="SizeBadge" size="{{ s.size }}" px="40"></dc-import>.
  // The theme is read from the page (light checkout pages set data-theme="light" on <html>), so the badge keeps its own light colours there.
  root.DCR = root.DCR || { COMP: {} }; root.DCR.COMP = root.DCR.COMP || {};
  root.DCR.COMP.SizeBadge = (p) => sizeBadge(p.size, { px: +p.px || 40, plan: p.plan || '', key: p.key || '', deco: p.deco === 'true' || p.deco === true, theme: (root.document && root.document.documentElement.dataset.theme) === 'light' ? 'light' : 'dark' });
})(typeof window !== 'undefined' ? window : globalThis);
