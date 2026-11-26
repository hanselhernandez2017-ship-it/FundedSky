/* Funded Sky page runtime: renders the design templates (sc-if, sc-for, {{ }}) with live state.
   Templates come from <template id="dc-tpl">; the page script defines `class Component extends DCLogic`. */
(function () {
  const BOOL = new Set(['checked', 'disabled', 'selected', 'readonly', 'required', 'hidden', 'open', 'multiple', 'autofocus']);
  const EVT = { onclick: 'click', onchange: 'change', oninput: 'input', onsubmit: 'submit', onkeydown: 'keydown', onblur: 'focusout', onfocus: 'focusin', onscroll: 'scroll' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function get(path, ctx) {
    path = path.trim();
    if (path === 'true') return true; if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    let cur = ctx;
    for (const p of path.split('.')) { if (cur == null) return undefined; cur = cur[p]; }
    return cur;
  }
  let FNS = [];
  function attrs(tagSrc, ctx) {
    // tagSrc: the inside of an opening tag after the name, e.g. ' class="x" onClick="{{ f }}"'
    return tagSrc.replace(/\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)="\{\{([^}]*)\}\}"/g, (m, name, expr) => {
      const v = get(expr, ctx); const low = name.toLowerCase();
      if (EVT[low]) { if (typeof v !== 'function') return ''; FNS.push(v); return ` data-dc-${EVT[low]}="${FNS.length - 1}"`; }
      if (BOOL.has(low)) return v ? ` ${name}` : '';
      if (v === false || v == null) return low.startsWith('aria-') ? ` ${name}="false"` : '';
      return ` ${name}="${esc(v)}"`;
    });
  }
  function interp(text, ctx) {
    // design components (<dc-import name="PackCover" ...>) come from packart.js when the page loads it
    if (window.DCR) text = text.replace(/<dc-import\b([^>]*)><\/dc-import>/g, (m, a) => { const pr = {}; a.replace(/([\w-]+)="([^"]*)"/g, (x, k, v) => { const e = /^\{\{(.*)\}\}$/.exec(v.trim()); pr[k] = e ? get(e[1], ctx) : v; }); const c = window.DCR.COMP[pr.name]; return c ? '\u0001' + encodeURIComponent(c(pr)) + '\u0002' : ''; });
    // attributes inside tags first, then text
    text = text.replace(/<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s>=]+(?:="[^"]*")?)*)\s*(\/?)>/g, (m, tag, rest, sl) => `<${tag}${attrs(rest, ctx)}${sl ? ' /' : ''}>`);
    return text.replace(/\{\{([^}]*)\}\}/g, (m, e) => { const v = get(e, ctx); return typeof v === 'function' ? '' : esc(v); }).replace(/\u0001([^\u0002]*)\u0002/g, (m, x) => decodeURIComponent(x));
  }
  const OPEN = /<(sc-for|sc-if)\b([^>]*)>/g;
  function render(t, ctx) {
    let out = ''; let pos = 0; OPEN.lastIndex = 0;
    for (;;) {
      OPEN.lastIndex = pos; const m = OPEN.exec(t);
      if (!m) { out += interp(t.slice(pos), ctx); break; }
      out += interp(t.slice(pos, m.index), ctx);
      const tag = m[1]; let depth = 1; let k = OPEN.lastIndex; const re = new RegExp(`<${tag}\\b|</${tag}>`, 'g'); let mm;
      while (depth) { re.lastIndex = k; mm = re.exec(t); if (!mm) throw new Error('unclosed ' + tag); depth += mm[0][1] === '/' ? -1 : 1; k = re.lastIndex; }
      const inner = t.slice(OPEN.lastIndex, mm.index);
      const at = {}; m[2].replace(/([\w-]+)="([^"]*)"/g, (x, a, b) => { at[a] = b; });
      const ex = (s) => (s || '').replace(/^\{\{|\}\}$/g, '');
      if (tag === 'sc-for') { const list = get(ex(at.list), ctx) || []; list.forEach((it, i) => { out += render(inner, Object.assign({}, ctx, { [at.as]: it, $index: i })); }); }
      else if (get(ex(at.value), ctx)) out += render(inner, ctx);
      pos = k;
    }
    return out;
  }
  let comp = null, root = null, tpl = '', queued = false;
  function paint() {
    queued = false; FNS = [];
    const vals = comp.renderVals ? comp.renderVals() : {};
    const html = render(tpl, vals);
    const next = document.createElement('div'); next.innerHTML = html;
    if (window.morphdom) window.morphdom(root, next, { childrenOnly: true, onBeforeElUpdated: (from, to) => { if (from.hasAttribute && from.hasAttribute('data-keep')) return false; if (from === document.activeElement && (from.tagName === 'INPUT' || from.tagName === 'TEXTAREA') && from.type !== 'checkbox' && from.type !== 'radio') { to.value = from.value; } return true; } });
    else root.innerHTML = html;
    root._fns = FNS;
    if (comp.componentDidUpdate) comp.componentDidUpdate();
  }
  function schedule() { if (!queued) { queued = true; Promise.resolve().then(paint); } }
  class DCLogic { constructor(props) { this.props = props || {}; this.state = {}; } setState(x) { Object.assign(this.state, typeof x === 'function' ? x(this.state) : x); schedule(); } forceUpdate() { schedule(); } }
  function fire(type, ev) {
    let el = ev.target;
    while (el && el !== root.parentNode) {
      if (el.dataset && el.dataset['dc' + type[0].toUpperCase() + type.slice(1)] != null) {
        const fn = root._fns[+el.dataset['dc' + type[0].toUpperCase() + type.slice(1)]];
        if (fn) { if (type === 'submit') ev.preventDefault(); fn(ev); }
        return;
      }
      el = el.parentNode;
    }
  }
  function mount(Component, props) {
    const t = document.getElementById('dc-tpl'); tpl = t.innerHTML;
    root = document.getElementById('dc-root');
    comp = new Component(props || {}); comp.state = comp.state || {};
    root.addEventListener('scroll', (ev) => fire('scroll', ev), true);
    ['click', 'input', 'change', 'submit', 'keydown', 'focusout', 'focusin'].forEach((type) => root.addEventListener(type, (ev) => {
      if (type === 'input') { fire('input', ev); const tg = ev.target; if (tg.type !== 'checkbox' && tg.type !== 'radio' && tg.tagName !== 'SELECT') fire('change', ev); return; }
      if (type === 'change') { const tg = ev.target; if (tg.type === 'checkbox' || tg.type === 'radio' || tg.tagName === 'SELECT') fire('change', ev); return; }
      fire(type, ev);
    }));
    paint();
    if (comp.componentDidMount) comp.componentDidMount();
  }
  // Small helpers shared by pages
  async function api(path, body, method) {
    const r = await fetch(path, { method: method || (body ? 'POST' : 'GET'), headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' });
    let j = {}; try { j = await r.json(); } catch (e) { /* empty */ }
    if (!r.ok) { const e = new Error(j.error || 'Something went wrong. Try again.'); e.status = r.status; e.fallback = !!j.fallback; e.repriced = !!j.repriced; throw e; }
    return j;
  }
  const qs = (k) => new URLSearchParams(location.search).get(k);
  window.DCLogic = DCLogic; window.DC = { mount, schedule, api, qs, esc };
})();
