// ===== live layer shared by every designed board: API calls, names, dates, search index and notifications =====
(function () {
  const BO = window.__BO;
  const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const TZ = 'America/New_York';
  const F = {
    BO,
    demoOff: () => { try { return localStorage.getItem('fs_bo_demo') === '0'; } catch (e) { return false; } },
    async api(path, body, method) {
      const r = await fetch('/api/admin' + path, { method: method || (body === undefined ? 'GET' : 'POST'), headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), credentials: 'same-origin' });
      let j = {}; try { j = await r.json(); } catch (e) { /* empty */ }
      if (r.status === 401) { location.href = '/login?next=' + encodeURIComponent(location.pathname); throw new Error('Log in again.'); }
      if (!r.ok) throw new Error(j.error || 'Something went wrong');
      return j;
    },
    async reload() { const r = await fetch('/api/admin/boot', { credentials: 'same-origin' }); if (r.ok) { const d = await r.json(); Object.keys(d).forEach((k) => { BO[k] = d[k]; }); } },
    // Names as the design shows them: "Jane D." and "Jane Dalton"
    short: (u) => (u && u.first ? `${u.first}${u.last ? ' ' + u.last.charAt(0) + '.' : ''}` : '—'),
    full: (u) => (u && u.first ? `${u.first} ${u.last || ''}`.trim() : '—'),
    // A user by ID. Every row the boards load comes with its owner; if one is ever missing, the name sent on the row itself is used, so a board never prints "undefined"
    user: (id) => BO.users.find((u) => u.id === +id) || F.stub(+id),
    stub: (id) => { const r = [BO.accounts, BO.orders, BO.payouts, BO.tickets].map((l) => (l || []).find((x) => x.user === id)).find(Boolean); if (!r) return undefined; const nm = String(r.name || '').trim().split(/\s+/); return { id, tid: r.tid || '', first: nm[0] || 'Unknown', last: nm.slice(1).join(' '), email: r.email || '', country: r.country || '', role: 'trader', status: 'active', kyc_status: r.kyc || 'none', settings: {}, agreements: {}, stub: true }; },
    // The user list is capped at the newest sign-ups. For an older trader, build the name from their account, order or payout row (never "undefined").
    userOr: (id) => F.user(id) || (() => { const r = BO.accounts.find((x) => x.user === +id) || BO.orders.find((x) => x.user === +id) || BO.payouts.find((x) => x.user === +id); if (!r) return {}; const nm = String(r.name || '').trim().split(/\s+/); return { id: +id, tid: r.tid, email: r.email, first: nm[0] || '', last: nm.slice(1).join(' '), country: r.country, partial: true }; })(),
    byShort: (n) => BO.users.find((u) => F.short(u) === n || F.full(u) === n),
    // Dates in the design's style, Eastern time
    et: (d) => new Date(new Date(d).toLocaleString('en-US', { timeZone: TZ })),
    dayLabel: (d) => { if (!d) return '—'; const x = F.et(d); const n = F.et(Date.now()); const days = Math.round((new Date(n.getFullYear(), n.getMonth(), n.getDate()) - new Date(x.getFullYear(), x.getMonth(), x.getDate())) / 864e5); return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${MONS[x.getMonth()]} ${x.getDate()}${x.getFullYear() !== n.getFullYear() ? ', ' + x.getFullYear() : ''}`; },
    time: (d) => (d ? new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ }) : ''),
    when: (d) => { if (!d) return '—'; const l = F.dayLabel(d); return l === 'Today' || l === 'Yesterday' ? `${l}, ${F.time(d)}` : l; },
    md: (d) => { if (!d) return '—'; const x = F.et(d); return `${MONS[x.getMonth()]} ${x.getDate()}`; },
    ago: (d) => { if (!d) return '—'; const s = (Date.now() - new Date(d)) / 1000; return s < 60 ? 'Just now' : s < 3600 ? Math.floor(s / 60) + ' min' : s < 86400 ? Math.floor(s / 3600) + (s < 7200 ? ' hour' : ' hours') : s < 172800 ? 'Yesterday' : F.md(d); },
    hoursSince: (d) => (d ? (Date.now() - new Date(d)) / 36e5 : 0),
    within: (d, days) => !!d && Date.now() - new Date(d) < days * 864e5,
    K: (z) => '$' + z / 1000 + 'K',
    plan: (id) => (BO.catalog.plans.find((p) => p.id === id) || { id, short: id, name: id }),
    pname: (a) => `${F.plan(a.plan).short} ${F.K(a.size)}`,
    paid: () => BO.orders.filter((o) => o.status === 'paid'),
    integ: (id) => (BO.integrations || []).find((x) => x.id === id) || { id, enabled: false },
    on: (id) => { const x = F.integ(id); return !!x.enabled; },
    can: (...roles) => BO.me.role === 'admin' || roles.includes(BO.me.role),
    me: () => `${BO.me.first} ${BO.me.last}`
  };
  // Daily series for the last n days (Eastern dates), oldest first
  F.isoET = (d) => { const x = F.et(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
  F.daysIso = (n) => Array.from({ length: n }, (_, k) => F.isoET(Date.now() - (n - 1 - k) * 864e5));
  F.series = (rows, key, fn, n) => { const days = F.daysIso(n || 30); const m = {}; rows.forEach((r) => { if (!r[key]) return; const k = F.isoET(r[key]); m[k] = (m[k] || 0) + (fn ? fn(r) : 1); }); return days.map((d) => Math.round((m[d] || 0) * 100) / 100); };
  F.sum = (a) => a.reduce((s, x) => s + x, 0);
  F.today = (d) => !!d && F.isoET(d) === F.isoET(Date.now());
  F.greet = () => { const h = F.et(Date.now()).getHours(); return h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening'; };
  F.longDate = () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: TZ });
  // Board settings kept on the server (kv store.*)
  BO.store = BO.store || {};
  F.st = (k, def) => (BO.store[k] === undefined || BO.store[k] === null ? def : BO.store[k]);
  F.put = (k, v) => { BO.store[k] = v; return F.api('/store/' + k, { value: v }, 'PUT'); };
  // Save an object whenever it changes (settings switches and inputs bound by the board kit)
  F.watch = (get, k) => { let last = JSON.stringify(get()); setInterval(() => { const now = JSON.stringify(get()); if (now !== last) { last = now; F.put(k, JSON.parse(now)).catch((e) => console.error(e)); } }, 800); };
  F.staff = (id) => { const u = F.user(id); return u ? F.full(u) : ''; };
  // Search index for the global search
  F.index = () => ({
    traders: BO.users.filter((u) => u.role === 'trader').slice(0, 600).map((u) => [F.short(u), F.full(u), u.country || '', u.tid]),
    accts: BO.accounts.slice(0, 1500).map((a) => a.id),
    pos: BO.payouts.slice(0, 600).map((p) => p.code),
    tks: BO.tickets.slice(0, 400).map((t) => [String(t.id), t.subject]),
    cbs: (BO.disputes || []).map((d) => { const u = F.user(d.user); return [d.id, F.short(u), d.reason]; }),
    cls: []
  });
  // Bell notifications worked out from live data
  F.notes = () => {
    const N = []; const add = (id, cat, t, s, at, href, bad) => N.push({ id, cat, t, s, ago: F.ago(at), href, bad: bad ? 1 : 0, at: new Date(at || Date.now()).getTime() });
    BO.payouts.filter((p) => p.status === 'requested').slice(0, 5).forEach((p) => add('po' + p.code, 'Payments', 'Payout waiting for review', `${p.code} · ${p.name} · $${Math.round(p.amount).toLocaleString('en-US')}`, p.requested, '/admin/risk#payouts?payout=' + p.code));
    BO.users.filter((u) => u.role === 'trader' && u.kyc_status === 'submitted').slice(0, 5).forEach((u) => add('kyc' + u.id, 'Identity', 'Identity check needs a person', F.short(u), u.kyc && u.kyc.at, '/admin/users#kycq'));
    BO.tickets.filter((t) => { if (t.status !== 'open') return false; const sla = ((F.st('support.settings', {}).sla || {})[t.priority || 'normal']) || { urgent: [15, 240], high: [60, 480], normal: [240, 1440], low: [480, 2880] }[t.priority || 'normal'] || [240, 1440]; const replied = (t.msgs || []).some((m) => m.staff && !m.internal); return F.hoursSince(t.updated) * 60 > (replied ? sla[1] : sla[0]); }).slice(0, 5).forEach((t) => add('tk' + t.id, 'Support', 'Ticket past its reply target', `#${t.id} · ${t.subject}`, t.updated, '/admin/support#inbox?q=late&t=' + t.id, 1));
    (BO.disputes || []).filter((d) => d.status === 'open').forEach((d) => add('cb' + d.id, 'Disputes', d.due ? `Chargeback due ${F.md(d.due)}` : 'Chargeback opened', `${d.id} · ${d.order}`, d.opened, '/admin/disputes#open?cb=' + d.id, 1));
    (BO.integrations || []).filter((x) => x.enabled && x.status !== 'live' && x.lastError).forEach((x) => add('int' + x.id, 'System', `${x.name} needs attention`, x.lastError, x.lastCheck, '/admin/settings#int', 1));
    (BO.hooks || []).filter((h) => !h.ok).slice(0, 3).forEach((h, i) => add('wh' + i + h.created_at, 'System', 'Webhook failed', `${h.provider} · ${h.event}`, h.created_at, '/admin/health#hooks', 1));
    BO.accounts.filter((a) => a.phase === 'active' && a.dll && a.today < 0 && -a.today / a.dll >= 0.8).slice(0, 5).forEach((a) => add('dll' + a.id, 'Risk', 'Account near daily loss limit', `${a.id} · ${a.name} · ${Math.round(-a.today / a.dll * 100)}% used`, BO.now, '/admin/risk#accounts?acct=' + a.id));
    return N.sort((a, b) => b.at - a.at);
  };
  // CSV files built in the browser: every cell quoted, and text that a spreadsheet would run as a formula (=, +, -, @, tab, return) gets a leading '
  F.csvCell = (v) => { let t = v == null ? '' : String(v); if (/^[=+\-@\t\r]/.test(t) && !/^-?\d+(\.\d+)?$/.test(t)) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; };
  F.csv = (rows) => rows.map((r) => r.map(F.csvCell).join(',')).join('\r\n');
  F.csvDl = (name, rows) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + F.csv(rows)], { type: 'text/csv;charset=utf-8' })); a.download = /\.csv$/i.test(name) ? name : name + '.csv'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
  // Referral link clicks for a set of codes (links are stored as typed, so letter case is ignored)
  F.clicksOf = (codes) => { const want = new Set(codes.filter(Boolean).map((c) => String(c).toUpperCase())); let n = 0; Object.entries(BO.clicks || {}).forEach(([k, v]) => { if (want.has(k.toUpperCase())) n += typeof v === 'object' && v ? Object.values(v).reduce((a, x) => a + (+x || 0), 0) : (+v || 0); }); return n; };
  // One definition of affiliate quality and customer value, shared by the Affiliates board and Analytics.
  // Quality starts at 100 and loses 4 for each point of refund rate, 10 for each chargeback, and up to 40 for payouts as a share of revenue.
  F.affQuality = (r) => Math.max(0, Math.min(100, Math.round(100 - (r.refundRate || 0) * 4 - (r.cbs || 0) * 10 - (r.rev > 0 ? Math.min(1, (r.pay || 0) / r.rev) * 40 : 0))));
  // Net value per customer: revenue minus payouts and commission, for each customer who bought
  F.affNet = (r) => (r.buyers ? ((r.rev || 0) - (r.pay || 0) - (r.com || 0)) / r.buyers : 0);
  // ---- Lists at any size. The boards hold the newest rows of each kind plus everything still waiting on a person; counts come from SQL (BO.counts).
  const CNT = BO.counts || {}; const CAPD = CNT.capped || {}; const LOADED = CNT.loaded || {}; const CAPS = CNT.cap || {};
  const KINDS = { users: ['lu', 'users', 20000], accounts: ['la', 'accounts', 50000], orders: ['lo', 'orders', 30000], payouts: ['lp', 'payouts', 20000] };
  F.capped = (kind) => !!CAPD[kind];
  F.total = (kind) => (CNT[kind] == null ? (BO[kind] || []).length : CNT[kind]);
  // A link to a trader, account or payout always carries its id; opening one that is not loaded reloads the board with it (see __BOQ)
  F.userHref = (u) => '/admin/users#user?id=' + encodeURIComponent(typeof u === 'object' && u ? (u.tid || u.id) : u);
  F.openUser = (idOrTid) => { location.href = F.userHref(idOrTid); if (/\/admin\/users$/.test(location.pathname)) location.reload(); };
  F.loadMore = (kinds) => { let m = {}; try { m = JSON.parse(sessionStorage.getItem('fs_bo_more') || '{}'); } catch (e) { m = {}; } kinds.forEach((k) => { const [q, , max] = KINDS[k]; m[q] = Math.min(max, (CAPS[k] || 0) * 4); }); try { sessionStorage.setItem('fs_bo_more', JSON.stringify(m)); } catch (e) { /* storage off */ } location.reload(); };
  // Which lists each board reads; a board whose lists are cut says so under its tabs
  const BOARD_LISTS = { risk: ['accounts', 'payouts'], finance: ['orders', 'payouts'], analytics: ['orders', 'accounts', 'users'], insights: ['orders', 'accounts', 'users'], affiliates: ['users', 'orders'], rewards: ['users'], compliance: ['users', 'payouts'], fraud: ['users', 'accounts'], platforms: ['accounts'], disputes: ['orders'], competitions: ['users'], catalog: ['orders'], content: ['users'] };
  // Boards where only one view reads the lists: the note shows on that view only (matched by its heading)
  const BOARD_VIEW = { content: /^Education$/ };
  F.capNote = (kinds) => { const cut = (kinds || []).filter((k) => CAPD[k]); if (!cut.length) return ''; const nf = (n) => Number(n || 0).toLocaleString('en-US');
    const parts = cut.map((k) => `${nf(LOADED[k])} of ${nf(CNT[k])} ${k}`); const more = cut.filter((k) => (CAPS[k] || 0) < KINDS[k][2]);
    return `<div class="capnote" role="note"><span><b>Not everything is loaded.</b> This board has the newest ${parts.join(parts.length > 2 ? ', ' : ' and ')}, plus everything still waiting on a person. Charts and totals built from these lists cover the loaded rows only. Search Everything finds older ones by name, email or ID.</span>${more.length ? `<button class="pill sm" data-capmore="${more.join(',')}">Load More</button>` : ''}</div>`; };
  (function () { const key = (location.pathname.split('/').filter(Boolean)[1] || 'home').toLowerCase(); const kinds = BOARD_LISTS[key]; if (!kinds || !F.capNote(kinds)) return;
    const put = () => { const root = document.getElementById('fsbo'); const m = root && root.querySelector('.main'); if (!m || m.querySelector('.capnote')) return; if (BOARD_VIEW[key]) { const h = m.querySelector('h1'); if (!h || !BOARD_VIEW[key].test(h.textContent.trim())) return; } const t = document.createElement('div'); t.innerHTML = F.capNote(kinds); const n = t.firstChild; const sub = m.querySelector(':scope > .subt'); if (sub) sub.after(n); else m.prepend(n); };
    const start = () => { const root = document.getElementById('fsbo'); if (!root) return; new MutationObserver(put).observe(root, { childList: true, subtree: true }); put(); }; setTimeout(start, 0); })();
  document.addEventListener('click', (ev) => { const b = ev.target.closest && ev.target.closest('[data-capmore]'); if (b) F.loadMore(b.dataset.capmore.split(',')); });
  F.find = (q) => F.api('/find?q=' + encodeURIComponent(q));
  // ---- One form drawer for every board, instead of the browser's prompt boxes. Resolves with the values, or null when closed.
  // fields: { k, label, value, type: text | textarea | number | date | select | copy, options, hint, req, max, check(v, all) => message }
  F.form = (o) => new Promise((resolve) => {
    const root = document.getElementById('fsbo'); const E = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const host = document.createElement('div'); host.className = 'fsbo fsask' + (root && root.classList.contains('light') ? ' light' : ''); const fields = o.fields || [];
    const fld = (f, i) => { const id = 'fsask' + i; const v = f.value == null ? '' : f.value;
      const inp = f.type === 'textarea' ? `<textarea id="${id}" rows="${f.rows || 4}" maxlength="${f.max || 2000}">${E(v)}</textarea>` : f.type === 'select' ? `<select id="${id}">${(f.options || []).map((x) => { const [val, lab] = Array.isArray(x) ? x : [x, x]; return `<option value="${E(val)}" ${String(val) === String(v) ? 'selected' : ''}>${E(lab)}</option>`; }).join('')}</select>`
        : f.type === 'copy' ? `<div class="askcopy"><input id="${id}" class="mono" readonly value="${E(v)}"><button type="button" class="pill sm" data-askcopy="${id}">Copy</button></div>` : `<input id="${id}" type="${f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}" ${f.type === 'number' ? 'step="any" inputmode="decimal"' : ''} maxlength="${f.max || 300}" value="${E(v)}" ${f.ph ? `placeholder="${E(f.ph)}"` : ''}>`;
      return `<div class="fl"><label for="${id}">${E(f.label)}</label>${inp}${f.hint ? `<span class="hint">${E(f.hint)}</span>` : ''}</div>`; };
    host.innerHTML = `<div class="drw-bg" data-ask="x"></div><div class="drw" role="dialog" aria-modal="true" aria-label="${E(o.title)}"><div class="drw-h"><h3>${E(o.title)}</h3><button class="ic" data-ask="x" style="margin-left:auto" aria-label="Close">✕</button></div>
      <div class="drw-b fg">${o.intro ? `<p class="hint askintro">${E(o.intro)}</p>` : ''}${fields.map(fld).join('')}<p class="askerr" role="alert" hidden></p></div>
      <div class="drw-f">${o.only ? `<button class="pill pri" data-ask="x">${E(o.only)}</button>` : `<button class="pill" data-ask="x">Cancel</button><button class="pill ${o.dng ? 'dng' : 'pri'}" data-ask="ok">${E(o.ok || 'Save')}</button>`}</div></div>`;
    (root && root.parentNode ? root.parentNode : document.body).appendChild(host);
    const done = (v) => { document.removeEventListener('keydown', onKey, true); host.remove(); resolve(v); };
    const submit = () => { const out = {}; const err = host.querySelector('.askerr'); let msg = '';
      fields.forEach((f, i) => { const el = host.querySelector('#fsask' + i); out[f.k] = String(el.value == null ? '' : el.value).trim(); });
      fields.forEach((f) => { if (msg) return; const v = out[f.k]; if (f.req && !v) msg = typeof f.req === 'string' ? f.req : `Fill in ${f.label}`; else if (f.type === 'number' && v !== '' && isNaN(+v)) msg = `${f.label} must be a number`; else if (f.check) msg = f.check(v, out) || ''; });
      if (msg) { err.textContent = msg; err.hidden = false; return; } done(out); };
    const onKey = (ev) => { if (ev.key === 'Escape') { ev.stopPropagation(); done(null); } else if (ev.key === 'Enter' && ev.target.tagName === 'INPUT' && host.contains(ev.target) && !o.only) { ev.preventDefault(); submit(); } };
    document.addEventListener('keydown', onKey, true);
    host.addEventListener('click', (ev) => { const c = ev.target.closest('[data-askcopy]'); if (c) { const el = host.querySelector('#' + c.dataset.askcopy); el.select(); try { navigator.clipboard.writeText(el.value).then(() => { c.textContent = 'Copied'; }, () => { document.execCommand('copy'); c.textContent = 'Copied'; }); } catch (e) { try { document.execCommand('copy'); c.textContent = 'Copied'; } catch (e2) { /* select and copy by hand */ } } return; }
      const b = ev.target.closest('[data-ask]'); if (!b) return; if (b.dataset.ask === 'ok') submit(); else done(null); });
    const first = host.querySelector('.drw-b input:not([readonly]), .drw-b textarea, .drw-b select') || host.querySelector('.drw-b input'); if (first) { first.focus(); if (first.select && first.tagName !== 'SELECT') first.select(); }
  });
  // A yes or no question in the same drawer
  F.confirm = (title, text, ok, dng) => F.form({ title, intro: text, ok: ok || 'Confirm', dng: !!dng }).then((v) => !!v);
  // Something to read or copy (a full address, a key shown once)
  F.show = (title, text, label, value) => F.form({ title, intro: text, fields: [{ k: 'v', label, value, type: 'copy' }], only: 'Done' });
  window.FSG = F;
})();
