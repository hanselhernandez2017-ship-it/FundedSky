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
      if (r.status === 401) { location.href = '/login?next=' + encodeURIComponent(location.pathname); throw new Error('Log in again'); }
      if (!r.ok) throw new Error(j.error || 'Something went wrong');
      return j;
    },
    async reload() { const r = await fetch('/api/admin/boot', { credentials: 'same-origin' }); if (r.ok) { const d = await r.json(); Object.keys(d).forEach((k) => { BO[k] = d[k]; }); } },
    // Names as the design shows them: "Jane D." and "Jane Dalton"
    short: (u) => (u ? `${u.first} ${(u.last || '').charAt(0)}.` : '—'),
    full: (u) => (u ? `${u.first} ${u.last}` : '—'),
    user: (id) => BO.users.find((u) => u.id === +id),
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
    traders: BO.users.filter((u) => u.role === 'trader').slice(0, 600).map((u) => [F.short(u), F.full(u), u.country || '']),
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
    BO.users.filter((u) => u.kyc_status === 'submitted').slice(0, 5).forEach((u) => add('kyc' + u.id, 'Identity', 'Identity check needs a person', F.short(u), u.kyc && u.kyc.at, '/admin/users#kycq'));
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
  window.FSG = F;
})();
