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
