  // ===== live data layer shared by every back office board =====
  const API = async (path, body, method) => {
    const r = await fetch('/api/admin' + path, { method: method || (body === undefined ? 'GET' : 'POST'), headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), credentials: 'same-origin' });
    let j = {}; try { j = await r.json(); } catch (e) { /* empty */ }
    if (r.status === 401) { location.href = '/login?next=' + encodeURIComponent(location.pathname); throw new Error('Log in again'); }
    if (!r.ok) throw new Error(j.error || 'Something went wrong');
    return j;
  };
  const L = {
    get users() { return BO.users.filter((u) => S.showDemo !== false || !u.demo); },
    get accounts() { return BO.accounts.filter((a) => S.showDemo !== false || !a.demo); },
    get orders() { return BO.orders.filter((o) => S.showDemo !== false || !/@demo\.fundedsky\.test$/.test(o.email)); },
    get payouts() { return BO.payouts.filter((p) => S.showDemo !== false || !/@demo\.fundedsky\.test$/.test(p.email)); },
    get tickets() { return BO.tickets.filter((t) => S.showDemo !== false || !/@demo\.fundedsky\.test$/.test(t.email)); },
    user: (id) => BO.users.find((u) => u.id === +id),
    acct: (id) => BO.accounts.find((a) => a.id === id),
    plan: (id) => (BO.catalog.plans.find((p) => p.id === id) || { short: id, name: id }),
    K: (z) => '$' + z / 1000 + 'K',
    nm: (u) => (u ? `${u.first} ${u.last}` : '—'),
    dt: (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }) : '—'),
    dtt: (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) : '—'),
    ago: (d) => { if (!d) return '—'; const s = (Date.now() - new Date(d)) / 1000; return s < 60 ? 'Just now' : s < 3600 ? Math.floor(s / 60) + ' min ago' : s < 86400 ? Math.floor(s / 3600) + (s < 7200 ? ' hour ago' : ' hours ago') : s < 172800 ? 'Yesterday' : new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); },
    within: (d, days) => d && Date.now() - new Date(d) < days * 86400000,
    can: (...roles) => BO.me.role === 'admin' || roles.includes(BO.me.role),
    paid: () => L.orders.filter((o) => o.status === 'paid'),
    rev: (days) => L.paid().filter((o) => L.within(o.paid, days)).reduce((s, o) => s + o.total, 0),
    daysBack: (n) => Array.from({ length: n }, (_, k) => { const d = new Date(Date.now() - (n - 1 - k) * 86400000); return { iso: d.toISOString().slice(0, 10), l: `${MON[d.getMonth()]} ${d.getDate()}` }; }),
    byDay: (rows, dateKey, valFn, n) => L.daysBack(n).map(({ iso }) => rows.filter((r) => r[dateKey] && String(r[dateKey]).slice(0, 10) === iso).reduce((s, r) => s + valFn(r), 0)),
    async reload() { const r = await fetch('/api/admin/boot', { credentials: 'same-origin' }); if (r.ok) { const d = await r.json(); Object.keys(d).forEach((k) => { BO[k] = d[k]; }); } },
    async act(fn, ok, after) { try { await fn(); await L.reload(); if (after) after(); toast(ok); } catch (e) { toast(e.message); } },
    empty: (t) => `<div class="empty">${t}</div>`,
    demo: (x) => (x && x.demo ? ' <span class="b plain">Demo</span>' : '')
  };
  const metrics = () => {
    const m = {}; const os = L.paid();
    m.revAll = os.reduce((s, o) => s + o.total, 0); m.rev30 = L.rev(30); m.rev7 = L.rev(7); m.revToday = L.rev(1);
    m.paidOut = L.payouts.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    m.owed = L.payouts.filter((p) => ['requested', 'approved'].includes(p.status)).reduce((s, p) => s + p.amount, 0);
    const ev = L.accounts.filter((a) => a.kind === 'evaluation'); const dec = ev.filter((a) => a.passed || a.phase === 'breached' || a.phase === 'passed');
    m.decided = dec.length; m.passed = ev.filter((a) => a.passed || a.phase === 'passed').length; m.passRate = dec.length ? m.passed / dec.length * 100 : 0;
    const f = L.accounts.filter((a) => a.kind === 'funded'); m.funded = f.filter((a) => a.phase === 'active').length; m.fundedAll = f.length; m.fundedPaidRate = f.length ? f.filter((a) => a.payouts > 0).length / f.length * 100 : 0;
    m.liveEval = ev.filter((a) => a.phase === 'active').length;
    m.liability = f.filter((a) => a.phase === 'active').reduce((s, a) => s + Math.max(0, a.avail), 0);
    m.fundedInProfit = f.filter((a) => a.phase === 'active' && a.bal > a.start).length;
    m.ordersToday = os.filter((o) => L.within(o.paid, 1)).length;
    return m;
  };
  S.showDemo = (() => { try { return localStorage.getItem('fs_bo_demo') !== '0'; } catch (e) { return true; } })();
  // Links between boards always travel to /admin/<board>
  document.addEventListener('click', (ev) => { const a = ev.target.closest && ev.target.closest('a[href]'); if (!a) return; const h = a.getAttribute('href'); const m = /^Admin(\w+)\.dc\.html(#.*)?$/.exec(h || ''); if (m) a.setAttribute('href', '/admin/' + m[1].toLowerCase() + (m[2] || '')); }, true);
