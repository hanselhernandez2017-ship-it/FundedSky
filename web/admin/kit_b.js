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
    root.innerHTML = `<div class="tb">${APP.home ? '' : `<a class="pill bk" href="/admin" aria-label="Back to Admin">←<span class="lg"> Back to Admin</span></a>`}<span class="tb-t">${APP.title}</span>
      ${st.length ? `<div class="tb-mid hm"><div class="tb-stats">${st.map(([l, v, c]) => `<div><span>${l}</span><b class="${c || ''}">${v}</b></div>`).join('')}</div></div>` : '<div class="tb-mid"></div>'}
      ${APP.search ? `<div class="gs hm"><input type="search" placeholder="${APP.searchPh || 'Search'}" value="${esc(q)}" data-live="gq" data-key="gq" aria-label="${APP.searchPh || 'Search'}">${res ? `<div class="gsd">${res.map(([t, s, act, id, k]) => `<button data-act="${act}" data-id="${esc(id || '')}" data-k="${esc(k || '')}"><b>${esc(t)}</b><span class="hint">${esc(s)}</span></button>`).join('') || '<div class="empty">Nothing found.</div>'}</div>` : ''}</div>` : ''}
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
