  // ===== Funded Sky back office (live data) =====
  const BO = window.__BO;
  const API = async (path, body, method) => {
    const r = await fetch('/api/admin' + path, { method: method || 'POST', headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), credentials: 'same-origin' });
    let j = {}; try { j = await r.json(); } catch (e) { /* empty */ }
    if (!r.ok) throw new Error(j.error || 'Something went wrong');
    return j;
  };
  const K = (z) => '$' + z / 1000 + 'K';
  const dt = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }) : '—');
  const dtt = (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) : '—');
  const ago = (d) => { if (!d) return '—'; const s = (Date.now() - new Date(d)) / 1000; return s < 3600 ? Math.max(1, Math.floor(s / 60)) + ' min ago' : s < 86400 ? Math.floor(s / 3600) + ' h ago' : Math.floor(s / 86400) + ' d ago'; };
  const PN = (id) => { const p = BO.catalog.plans.find((x) => x.id === id); return p ? p.short : id; };
  const userById = (id) => BO.users.find((u) => u.id === id);
  const nm = (u) => (u ? `${u.first} ${u.last}` : '—');
  const UL2 = (id, label) => `<button class="lnk" data-act="user" data-id="${id}">${esc(label || nm(userById(id)))}</button>`;
  const AL = (id) => `<button class="lnk mono" data-act="acct" data-id="${esc(id)}">${esc(id)}</button>`;
  const phaseB = (a) => (a.phase === 'breached' ? b('Breached', 'err') : a.phase === 'passed' ? b('Passed', 'live') : a.phase === 'closed' ? b('Closed', 'ended') : a.phase === 'review' ? b('In Review', 'sched') : a.kind === 'funded' ? b(a.plan === 'instant' ? 'Instant' : 'Funded', 'live') : b('Evaluation', 'sched'));
  const kycB = (k) => (k === 'verified' ? b('Verified', 'live') : k === 'submitted' ? b('In Review', 'sched') : k === 'rejected' ? b('Rejected', 'err') : b('Not Started', 'plain'));
  const poB = (s) => (s === 'paid' ? b('Sent', 'live') : s === 'approved' ? b('Approved', 'sched') : s === 'denied' ? b('Denied', 'err') : b('To Review', 'draft'));
  const ordB = (s) => (s === 'paid' ? b('Paid', 'live') : s === 'refunded' ? b('Refunded', 'ended') : s === 'pending' ? b('Not Paid', 'draft') : b(s, 'err'));
  const tkB = (s) => (s === 'open' ? b('Open', 'draft') : s === 'pending' ? b('Replied', 'sched') : b('Solved', 'live'));
  const real = (x) => !x.demo;
  S.showDemo = S.showDemo == null ? true : S.showDemo;
  const U = () => BO.users.filter((u) => S.showDemo || real(u));
  const A = () => BO.accounts.filter((a) => S.showDemo || !a.demo);
  const O = () => BO.orders.filter((o) => S.showDemo || !/@demo\.fundedsky\.test$/.test(o.email));
  const P = () => BO.payouts.filter((p) => S.showDemo || !/@demo\.fundedsky\.test$/.test(p.email));
  const T = () => BO.tickets.filter((t) => S.showDemo || !/@demo\.fundedsky\.test$/.test(t.email));
  const canDo = (...roles) => BO.me.role === 'admin' || roles.includes(BO.me.role);
  async function act(fn, ok, after) { try { S.busy = true; await fn(); await reload(); if (after) after(); toast(ok); } catch (e) { S.busy = false; toast(e.message); } }
  async function reload() { const r = await fetch('/api/admin/boot', { credentials: 'same-origin' }); if (r.ok) { const d = await r.json(); Object.keys(d).forEach((k) => { BO[k] = d[k]; }); } S.busy = false; }
  const val = (sel) => { const el = root.querySelector(sel); return el ? el.value : ''; };

  // ---------- numbers ----------
  function metrics() {
    const os = O().filter((o) => o.status === 'paid'); const now = Date.now();
    const within = (d, days) => d && now - new Date(d) < days * 86400000;
    const rev = (days) => os.filter((o) => within(o.paid, days)).reduce((s2, o) => s2 + o.total, 0);
    const refunds = O().filter((o) => o.status === 'refunded').reduce((s2, o) => s2 + o.total, 0);
    const paidOut = P().filter((p) => p.status === 'paid').reduce((s2, p) => s2 + p.amount, 0);
    const owed = P().filter((p) => ['requested', 'approved'].includes(p.status)).reduce((s2, p) => s2 + p.amount, 0);
    const evals = A().filter((a) => a.kind === 'evaluation'); const decided = evals.filter((a) => ['passed', 'breached', 'closed'].includes(a.phase) && a.breach !== 'Order refunded');
    const passed = decided.filter((a) => a.passed || a.phase === 'passed').length;
    const funded = A().filter((a) => a.kind === 'funded'); const fundedPaid = funded.filter((a) => a.payouts > 0).length;
    const revAll = os.reduce((s2, o) => s2 + o.total, 0);
    return { rev7: rev(7), rev30: rev(30), revAll, refunds, paidOut, owed, passRate: decided.length ? passed / decided.length * 100 : 0, decided: decided.length, passed, fundedN: funded.length, fundedPaidRate: funded.length ? fundedPaid / funded.length * 100 : 0, payoutRatio: revAll ? (paidOut + owed) / revAll * 100 : 0, liveEval: evals.filter((a) => a.phase === 'active').length, liveFunded: funded.filter((a) => a.phase === 'active').length };
  }
  const daily = (days) => { const out = []; for (let i = days - 1; i >= 0; i--) { const d = new Date(Date.now() - i * 86400000); const iso = d.toISOString().slice(0, 10); out.push([d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), iso]); } return out; };

  // ---------- views ----------
  const V = {};
  V.home = () => { const m = metrics(); const d = daily(30);
    const revS = d.map(([, iso]) => O().filter((o) => o.status === 'paid' && o.paid && o.paid.slice(0, 10) === iso).reduce((s2, o) => s2 + o.total, 0));
    const poS = d.map(([, iso]) => P().filter((p) => p.status === 'paid' && p.paid && p.paid.slice(0, 10) === iso).reduce((s2, p) => s2 + p.amount, 0));
    const q1 = P().filter((p) => p.status === 'requested'); const q2 = P().filter((p) => p.status === 'approved'); const kq = U().filter((u) => u.kyc_status === 'submitted'); const tq = T().filter((t) => t.status === 'open'); const pass = A().filter((a) => a.phase === 'passed');
    const watch = [m.passRate > 20 && m.decided >= 20 ? ['Pass rate is above 20%', `${pct(m.passRate)} of ${m.decided} finished evaluations. Consider tighter targets or fewer promos.`, 'err'] : null, m.fundedPaidRate > 39 && m.fundedN >= 10 ? ['Funded payout rate is above 39%', `${pct(m.fundedPaidRate)} of funded accounts have been paid.`, 'err'] : null, m.payoutRatio > 60 && m.revAll > 2000 ? ['Payouts are above 60% of revenue', `${pct(m.payoutRatio)} paid or owed against ${kmoney(m.revAll)} in sales.`, 'err'] : null].filter(Boolean);
    return ph('Good ' + (new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening') + ', ' + esc(BO.me.first), `Live numbers from the platform · ${BO.payments === 'test' ? 'payments in test mode' : BO.payments === 'stripe-test' ? 'Stripe test mode' : 'Stripe live'}`)
      + tiles([['Sales, 7 Days', kmoney(m.rev7), `${kmoney(m.rev30)} in 30 days`, '', 'orders'], ['Paid Out', kmoney(m.paidOut), `${kmoney(m.owed)} waiting`, '', 'po_hist'], ['Pass Rate', pct(m.passRate), `${m.passed} of ${m.decided} finished`, m.passRate > 20 ? 'neg' : '', 'acc_all'], ['Live Accounts', num(m.liveEval + m.liveFunded), `${m.liveEval} evaluating · ${m.liveFunded} funded`, '', 'acc_active']])
      + `<div class="g2" style="display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:20px;margin-top:20px">`
      + card('Sales and Payouts', 'Last 30 days', cb(lineChart('h30', d.map((x) => x[0]), [{ name: 'Sales', v: revS }, { name: 'Payouts sent', v: poS, cls: 'l2' }], (v) => kmoney(v))))
      + card('Needs You Now', '', cb([[`${q1.length} payout${q1.length === 1 ? '' : 's'} to review`, q1.reduce((s2, p) => s2 + p.amount, 0), 'po_queue'], [`${q2.length} approved payout${q2.length === 1 ? '' : 's'} to send`, q2.reduce((s2, p) => s2 + p.amount, 0), 'po_approved'], [`${kq.length} identity check${kq.length === 1 ? '' : 's'}`, null, 'kyc'], [`${tq.length} open ticket${tq.length === 1 ? '' : 's'}`, null, 'tk_open'], [`${pass.length} passed, not yet funded`, null, 'acc_passed']].map(([t, v, go]) => `<button class="srow lk" data-act="go" data-v="${go}" style="width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--ln2);padding:12px 0;cursor:pointer;color:inherit;font:inherit"><span>${t}</span><b>${v != null ? money(v) : '→'}</b></button>`).join('')))
      + `</div><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:20px">`
      + card('Risk Guardrails', watch.length ? watch.length + ' alert' + (watch.length > 1 ? 's' : '') : 'All clear', cb(watch.length ? watch.map(([t, s2]) => `<div class="note bad" style="margin-bottom:10px"><b>${t}</b><br><span class="hint">${s2}</span></div>`).join('') : kv([['Pass rate', pct(m.passRate), m.passRate > 20 ? 'neg' : 'pos'], ['Funded accounts paid', pct(m.fundedPaidRate), m.fundedPaidRate > 39 ? 'neg' : 'pos'], ['Payouts vs sales', pct(m.payoutRatio), m.payoutRatio > 60 ? 'neg' : 'pos']]) + '<p class="hint" style="margin:10px 0 0">Targets from the pricing model: pass rate under 20%, funded payout rate under 39%.</p>'))
      + card('By Plan', 'Paid orders', cb(hbars(BO.catalog.plans.map((p) => [p.short, O().filter((o) => o.status === 'paid').reduce((s2, o) => s2 + (o.items || []).filter((i) => i.plan === p.id).reduce((s3, i) => s3 + i.unit * i.qty, 0), 0)]), kmoney)))
      + card('Latest Activity', '', cb(tl(BO.audit.slice(0, 6).map((x) => [x.action.replace('.', ' · '), `${esc(x.by)} · ${esc(x.target)} · ${ago(x.at)}`])) || '<div class="empty">No staff actions yet.</div>'))
      + '</div>'; };

  // Traders
  V.traders = () => { const q = (S.uq || '').toLowerCase(); const list = U().filter((u) => !q || (u.first + ' ' + u.last + ' ' + u.email + ' ' + u.tid).toLowerCase().includes(q));
    return ph('Traders', `${U().length} people`, `<input type="search" placeholder="Name, email or ID" value="${esc(S.uq || '')}" data-live="uq" data-key="uq" style="width:260px">`)
      + card('All Traders', list.length, table(['Trader', 'ID', 'Country', 'Role', 'Identity', ['Accounts', 'num'], ['Spent', 'num'], 'Joined', 'Last Login'], list.slice(0, 300).map((u) => { const ac = A().filter((a) => a.user === u.id); const sp = O().filter((o) => o.user === u.id && o.status === 'paid').reduce((s2, o) => s2 + o.total, 0); return [UL2(u.id, nm(u)) + (u.demo ? ' ' + b('Demo', 'plain') : '') + (u.status !== 'active' ? ' ' + b(u.status, 'err') : ''), `<span class="mono">${u.tid}</span>`, esc(u.country), u.role === 'trader' ? 'Trader' : b(u.role, 'sched'), kycB(u.kyc_status), ac.length, money(sp), dt(u.created_at), ago(u.last_login)]; }), { empty: 'No traders match.' }));
  };
  V.kyc = () => { const list = U().filter((u) => u.kyc_status === 'submitted');
    return ph('Identity Review', 'Check each submission before approving payouts') + card('Waiting for Review', list.length, table(['Trader', 'Legal Name', 'Date of Birth', 'Country', 'ID', 'Sent', ''], list.map((u) => [UL2(u.id), esc(u.kyc ? u.kyc.name : ''), esc(u.kyc ? u.kyc.dob : ''), esc(u.kyc ? u.kyc.country : ''), esc(u.kyc ? `${u.kyc.idType} ···${u.kyc.idLast4}` : ''), ago(u.kyc && u.kyc.at), `<button class="pill sm pri" data-act="kycOk" data-id="${u.id}">Verify</button> <button class="pill sm dng" data-act="kycNo" data-id="${u.id}">Reject</button>`]), { empty: 'Nothing to review.' }));
  };

  // Accounts
  const acctTable = (list, empty) => table(['Account', 'Trader', 'Plan', 'Status', ['Balance', 'num'], ['Profit', 'num'], ['Room to Floor', 'num'], ['Days', 'num'], ['Payouts', 'num'], 'Opened'], list.slice(0, 400).map((a) => [AL(a.id) + (a.demo ? ' ' + b('Demo', 'plain') : ''), UL2(a.user, a.name), `${PN(a.plan)} ${K(a.size)}`, phaseB(a) + (a.ready ? ' ' + b('Payout Ready', 'live') : '') + (a.halted ? ' ' + b('DLL Hit', 'err') : '') + (a.sim && a.sim.paused ? ' ' + b('Paused', 'plain') : ''), money(a.bal), `<span class="${a.bal >= a.start ? 'pos' : 'neg'}">${money(a.bal - a.start)}</span>`, money(Math.max(0, a.bal - a.floor)), a.days, a.payouts ? `${a.payouts} · ${money(a.paid)}` : '0', dt(a.created)]), { empty });
  V.acc_active = () => { const list = A().filter((a) => a.phase === 'active' || a.phase === 'review'); const atRisk = list.filter((a) => a.bal - a.floor < a.maxLoss * 0.25);
    return ph('Accounts', `${list.length} live · ${atRisk.length} within 25% of their floor`, `<button class="pill" data-act="simTick">Run Feed Tick</button>`) + tiles([['Evaluations', num(list.filter((a) => a.kind === 'evaluation').length), 'Live now'], ['Funded', num(list.filter((a) => a.kind === 'funded').length), `${list.filter((a) => a.ready).length} payout ready`], ['Near Floor', num(atRisk.length), 'Under 25% room', atRisk.length ? 'neg' : ''], ['Open Balance', kmoney(list.reduce((s2, a) => s2 + a.bal - a.start, 0)), 'Profit across live accounts']]) + card('Live Accounts', list.length, acctTable(list, 'No live accounts.'), '', 'mt');
  };
  V.acc_passed = () => { const list = A().filter((a) => a.phase === 'passed'); return ph('Passed Evaluations', 'Waiting for the trader to sign, or to pay the activation fee') + card('Passed', list.length, acctTable(list, 'Nobody is waiting.')); };
  V.acc_breached = () => { const list = A().filter((a) => a.phase === 'breached'); return ph('Breached Accounts', 'Every breach with the rule that ended it') + card('Breached', list.length, table(['Account', 'Trader', 'Plan', 'Reason', ['Ended At', 'num'], 'When', ''], list.map((a) => [AL(a.id), UL2(a.user, a.name), `${PN(a.plan)} ${K(a.size)}`, esc(a.breach || ''), money(a.bal), dtt(a.breached), canDo('risk') ? `<button class="pill sm" data-act="reinstate" data-id="${a.id}">Reinstate</button>` : '']), { empty: 'No breaches.' })); };
  V.acc_all = () => { const list = A(); const by = (f) => list.filter(f).length; return ph('All Accounts', `${list.length} accounts`) + tiles([['Evaluations Sold', num(by((a) => a.kind === 'evaluation')), 'All time'], ['Passed', num(by((a) => !!a.passed)), pct(by((a) => !!a.passed) / Math.max(1, by((a) => a.kind === 'evaluation')) * 100) + ' of evaluations'], ['Breached', num(by((a) => a.phase === 'breached')), 'All plans'], ['Funded', num(by((a) => a.kind === 'funded')), `${by((a) => a.kind === 'funded' && a.payouts > 0)} paid at least once`]]) + card('Every Account', list.length, acctTable(list, 'No accounts yet.'), '', 'mt'); };

  // Payouts
  const poTable = (list, actions) => table(['Payout', 'Trader', 'Account', '#', ['From Balance', 'num'], ['To Trader', 'num'], 'Method', 'Identity', 'Requested', ''], list.map((p) => [`<button class="lnk mono" data-act="po" data-id="${p.code}">${p.code}</button>`, UL2(p.user, p.name), AL(p.account), p.number, money(p.gross, 2), `<b>${money(p.amount)}</b>`, esc(p.method), kycB(p.kyc), dtt(p.requested), actions(p)]), { empty: 'Nothing here.' });
  V.po_queue = () => { const list = P().filter((p) => p.status === 'requested'); return ph('Payouts to Review', `${list.length} requests · ${money(list.reduce((s2, p) => s2 + p.amount, 0))}`) + card('To Review', list.length, poTable(list, (p) => canDo('finance', 'risk') ? `<button class="pill sm" data-act="po" data-id="${p.code}">Review</button>` : '')); };
  V.po_approved = () => { const list = P().filter((p) => p.status === 'approved'); return ph('Approved, Ready to Send', 'Send the money through Rise or the wallet, then mark it sent') + card('To Send', list.length, poTable(list, (p) => canDo('finance') ? `<button class="pill sm pri" data-act="poPay" data-id="${p.code}">Mark Sent</button>` : '')); };
  V.po_hist = () => { const list = P().filter((p) => ['paid', 'denied'].includes(p.status)); return ph('Payout History', `${money(list.filter((p) => p.status === 'paid').reduce((s2, p) => s2 + p.amount, 0))} sent`) + card('History', list.length, table(['Payout', 'Trader', 'Account', ['To Trader', 'num'], 'Method', 'Batch', 'Status', 'Sent', 'Note'], list.map((p) => [`<button class="lnk mono" data-act="po" data-id="${p.code}">${p.code}</button>`, UL2(p.user, p.name), AL(p.account), money(p.amount), esc(p.method), esc(p.batch || '—'), poB(p.status), dt(p.paid || p.denied), esc(p.note || '')]), { empty: 'No payouts yet.' })); };

  // Orders
  V.orders = () => { const q = (S.oq || '').toLowerCase(); const list = O().filter((o) => !q || (o.code + ' ' + o.name + ' ' + o.email + ' ' + (o.promo || '')).toLowerCase().includes(q));
    return ph('Orders', `${list.filter((o) => o.status === 'paid').length} paid · ${money(list.filter((o) => o.status === 'paid').reduce((s2, o) => s2 + o.total, 0), 2)}`, `<input type="search" placeholder="Order, trader or code" value="${esc(S.oq || '')}" data-live="oq" data-key="oq" style="width:240px">`)
      + card('All Orders', list.length, table(['Order', 'Trader', 'Type', 'What', 'Code', ['Total', 'num'], 'Paid With', 'Status', 'Date'], list.slice(0, 400).map((o) => [`<button class="lnk mono" data-act="ord" data-id="${o.code}">${o.code}</button>`, UL2(o.user, o.name), esc(o.kind), esc(o.lines.filter((l) => l.kind === 'plan').map((l) => l.label).join(', ')), o.promo ? `<span class="mono">${esc(o.promo)}</span>` : '—', money(o.total, 2), esc(o.method || '—'), ordB(o.status), dtt(o.created)]), { empty: 'No orders yet.' }));
  };
  V.revenue = () => { const d = daily(30); const m = metrics(); const paid = O().filter((o) => o.status === 'paid');
    const byKind = ['evaluation', 'instant', 'mixed', 'reset', 'activation'].map((k) => [k === 'mixed' ? 'Mixed cart' : k[0].toUpperCase() + k.slice(1), paid.filter((o) => o.kind === k).reduce((s2, o) => s2 + o.total, 0)]).filter((x) => x[1]);
    const disc = paid.reduce((s2, o) => s2 + o.discount, 0);
    return ph('Revenue', 'Paid orders, refunds and payouts') + tiles([['Sales, All Time', kmoney(m.revAll), `${paid.length} orders`], ['Discounts Given', kmoney(disc), pct(disc / Math.max(1, m.revAll + disc) * 100) + ' of list price'], ['Refunded', kmoney(m.refunds), ''], ['Net After Payouts', kmoney(m.revAll - m.paidOut - m.owed), 'Sales minus paid and owed payouts', m.revAll - m.paidOut - m.owed >= 0 ? 'pos' : 'neg']])
      + `<div style="display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:20px;margin-top:20px">` + card('Daily Sales', 'Last 30 days', cb(vbars(d.map(([l, iso]) => [l, paid.filter((o) => o.paid && o.paid.slice(0, 10) === iso).reduce((s2, o) => s2 + o.total, 0)]), kmoney))) + card('By Order Type', '', cb(hbars(byKind, kmoney))) + '</div>'; };

  // Support
  const tkTable = (list) => table(['Ticket', 'Trader', 'Topic', 'Channel', 'Status', 'Updated', ''], list.map((t) => [`<button class="lnk" data-act="tk" data-id="${t.id}">#${t.id} ${esc(t.subject)}</button>`, UL2(t.user, t.name), esc(t.category), esc(t.channel), tkB(t.status), ago(t.updated), `<button class="pill sm" data-act="tk" data-id="${t.id}">Open</button>`]), { empty: 'No tickets.' });
  V.tk_open = () => { const list = T().filter((t) => t.status === 'open'); return ph('Support', `${list.length} waiting on us`) + card('Open Tickets', list.length, tkTable(list)); };
  V.tk_all = () => ph('All Tickets', `${T().length} tickets`) + card('All', T().length, tkTable(T()));
  V.outbox = () => ph('Emails', 'Every email the platform sends, newest first') + card('Outbox', BO.outbox.length, table(['To', 'Subject', 'Type', 'Status', 'Sent'], BO.outbox.map((m) => [esc(m.to_email), esc(m.subject), esc(m.template), m.status === 'sent' ? b('Sent', 'live') : m.status === 'logged' ? b('Logged Only', 'plain') : m.status === 'failed' ? b('Failed', 'err') : b('Queued', 'sched'), dtt(m.created_at)]), { empty: 'No emails yet.' })) + `<p class="hint" style="margin:14px 0 0">“Logged Only” means no email provider is connected yet. Add a Resend API key to send for real.</p>`;

  // Catalog
  const C = () => S.cat || (S.cat = JSON.parse(JSON.stringify(BO.catalog)));
  const nIn = (path, v, w) => `<input type="number" class="catin" data-cat="${path}" value="${v}" style="width:${w || 90}px">`;
  const catBar = () => `<div class="act">${S.cat ? `<button class="pill" data-act="catReset">Discard Changes</button>` : ''}<button class="pill pri" data-act="catSave" ${S.cat ? '' : 'disabled'}>Save Catalog</button></div>`;
  V.cat_plans = () => { const c = C(); return ph('Plans and Prices', 'Changes apply to new orders right away', catBar())
    + c.plans.map((p, pi) => card(p.name, p.kind === 'funded' ? 'Instant funded' : 'Evaluation', cb(`<div style="display:flex;gap:18px;flex-wrap:wrap;margin-bottom:14px"><label class="hint">Name <input class="catin" data-cat="plans.${pi}.name" data-str="1" value="${esc(p.name)}" style="width:180px"></label><label class="hint">Short <input class="catin" data-cat="plans.${pi}.short" data-str="1" value="${esc(p.short)}" style="width:110px"></label><label class="hint">Badge <input class="catin" data-cat="plans.${pi}.badge" data-str="1" value="${esc(p.badge || '')}" style="width:140px"></label><label class="hint"><input type="checkbox" class="catin" data-cat="plans.${pi}.active" data-bool="1" ${p.active ? 'checked' : ''}> On sale</label></div>`
      + table(['Size', ['Price', 'num'], ['Activation Fee', 'num'], ['Reset Price', 'num']], p.sizes.map((s2, si) => [K(s2.size), nIn(`plans.${pi}.sizes.${si}.price`, s2.price), nIn(`plans.${pi}.sizes.${si}.activation`, s2.activation), money(Math.round(s2.price * c.resetPct / 100))]))), '', 'mt')).join('')
    + card('Add-Ons and Resets', '', cb(kv(Object.entries(c.addons).map(([k, a]) => [a.name, `${nIn('addons.' + k + '.pct', a.pct, 70)} % of the plan price`]).concat([['Reset', `${nIn('resetPct', c.resetPct, 70)} % of the plan price`]]))), '', 'mt'); };
  V.cat_rules = () => { const c = C(); const sizes = [25000, 50000, 100000, 150000];
    const grid = (title, base, keys, szs) => card(title, '', table(['Rule'].concat(szs.map(K)), keys.map(([k, l]) => [l].concat(szs.map((z) => nIn(`${base}.${z}.${k}`, c[base][z][k], 90))))), '', 'mt');
    return ph('Rules and Caps', 'Changes apply to every account at its next check, so change rules carefully', catBar())
      + grid('Evaluation Rules (Essential and Prime)', 'evalRules', [['target', 'Profit target'], ['maxLoss', 'Max loss'], ['dll', 'Daily loss limit'], ['contracts', 'Contracts']], sizes)
      + card('Evaluation and Funded Settings', '', cb(kv([['Minimum trading days to pass', nIn('evalCommon.minDays', c.evalCommon.minDays, 70)], ['Consistency to pass, %', nIn('evalCommon.consistency', c.evalCommon.consistency, 70)], ['Funded: winning days per payout', nIn('fundedCommon.winDays', c.fundedCommon.winDays, 70)], ['Funded: winning day minimum, $', nIn('fundedCommon.winDayMin', c.fundedCommon.winDayMin, 70)], ['Funded: consistency, %', nIn('fundedCommon.consistency', c.fundedCommon.consistency, 70)], ['Funded: split, %', nIn('fundedCommon.split', c.fundedCommon.split, 70)], ['Funded: minimum payout, $', nIn('fundedCommon.payoutMin', c.fundedCommon.payoutMin, 70)], ['Funded: floor locks above start, $', nIn('fundedCommon.lockAbove', c.fundedCommon.lockAbove, 70)], ['Review after this many payouts', nIn('fundedCommon.reviewAfter', c.fundedCommon.reviewAfter, 70)]])), '', 'mt')
      + grid('Funded Payout Caps', 'fundedCaps', [['first', 'Payouts 1 to 3'], ['later', 'Payouts 4 to 6'], ['lifetime', 'Lifetime per account']], sizes)
      + grid('Instant Rules', 'instantRules', [['goal', 'Profit goal before first payout'], ['maxLoss', 'Max loss'], ['dll', 'Daily loss limit'], ['contracts', 'Contracts']], [25000, 50000, 100000])
      + grid('Instant Payout Caps', 'instantCaps', [['first', 'Payouts 1 to 3'], ['later', 'Payouts 4 to 6'], ['lifetime', 'Lifetime per account']], [25000, 50000, 100000]); };
  V.cat_promos = () => { const c = C(); return ph('Promo Codes', `Capped at ${c.maxPromoPct}% off, from the pricing model`, `${catBar()}<button class="pill" data-act="promoAdd">+ New Code</button>`)
    + card('Codes', (c.promos || []).length, table(['Code', 'Name', ['% Off', 'num'], 'Plans', 'Starts', 'Ends', 'One Use', 'On', ''], (c.promos || []).map((p, i) => [`<input class="catin mono" data-cat="promos.${i}.code" data-str="1" value="${esc(p.code)}" style="width:130px">`, `<input class="catin" data-cat="promos.${i}.name" data-str="1" value="${esc(p.name)}" style="width:140px">`, nIn(`promos.${i}.pct`, p.pct, 60), c.plans.map((pl) => `<label class="hint" style="margin-right:8px"><input type="checkbox" class="catin" data-cat="promos.${i}.plans" data-list="${pl.id}" ${(p.plans || []).includes(pl.id) ? 'checked' : ''}> ${pl.short}</label>`).join(''), `<input type="date" class="catin" data-cat="promos.${i}.starts" data-str="1" value="${esc(p.starts || '')}">`, `<input type="date" class="catin" data-cat="promos.${i}.ends" data-str="1" value="${esc(p.ends || '')}">`, `<input type="checkbox" class="catin" data-cat="promos.${i}.once" data-bool="1" ${p.once ? 'checked' : ''}>`, `<input type="checkbox" class="catin" data-cat="promos.${i}.active" data-bool="1" ${p.active ? 'checked' : ''}>`, `<button class="pill sm dng" data-act="promoDel" data-k="${i}">Remove</button>`]), { empty: 'No promo codes.' }))
    + card('Bundles', 'Applied automatically, never stacked with a promo code', table(['Bundle', 'Text', ['Min Accounts', 'num'], ['% Off', 'num']], (c.bundles || []).map((x, i) => [esc(x.buy), `<input class="catin" data-cat="bundles.${i}.get" data-str="1" value="${esc(x.get)}" style="width:220px">`, nIn(`bundles.${i}.min`, x.min, 60), nIn(`bundles.${i}.pct`, x.pct, 60)])), '', 'mt'); };

  // Content
  const CK = { news: 'News calendar (rows: day, time, event, High / Medium / Holiday)', articles: 'Help articles (rows: category, title, text)', courses: 'Courses', rewards: 'Rewards', competitions: 'Competitions', cprizes: 'Competition prizes' };
  V.content = () => { const k = S.ck || 'news'; const cur = (BO.content && BO.content[k]) || null;
    return ph('Site Content', 'What traders see in Resources, Support, Education, Rewards and Competitions', seg('ck', Object.keys(CK).map((x) => [x, x[0].toUpperCase() + x.slice(1)])))
      + card(CK[k], cur ? 'Edited' : 'Default', cb(`<textarea id="cjson" spellcheck="false" style="width:100%;min-height:420px;font-family:'Geist Mono',monospace;font-size:12.5px;line-height:1.5">${esc(JSON.stringify(cur || S.cdef[k], null, 1))}</textarea><div style="display:flex;gap:10px;margin-top:12px"><button class="pill pri" data-act="contentSave" data-k="${k}">Save</button><span class="hint" style="align-self:center">Edit the list and save. Traders see it within a minute.</span></div>`), '', 'mt'); };

  // System
  V.sys = () => { const demoU = BO.users.filter((u) => u.demo).length;
    return ph('System', 'Payments, simulated feed and demo data')
      + `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px">`
      + card('Payments', '', cb(kv([['Mode', BO.payments === 'test' ? b('Built-in test mode', 'draft') : BO.payments === 'stripe-test' ? b('Stripe test mode', 'sched') : b('Stripe live', 'live')], ['How to change', 'Set STRIPE_SECRET_KEY on the server']]) + '<p class="hint" style="margin:12px 0 0">In test mode, checkout accepts the card 4242 4242 4242 4242 and nothing is charged.</p>'))
      + card('Simulated Feed', '', cb(kv([['Status', b('Running', 'live')], ['What it does', 'Places trades on live accounts during market hours. Trading stops at 5:00 PM ET and each day is closed at 6:00 PM ET']]) + `<div style="display:flex;gap:10px;margin-top:12px"><button class="pill" data-act="simTick">Run One Tick Now</button></div><p class="hint" style="margin:12px 0 0">Replace with a platform connection (Tradovate, Rithmic, ProjectX) once you have a firm agreement.</p>`))
      + card('Demo Data', demoU ? demoU + ' demo traders' : 'None', cb(`<p class="hint" style="margin:0 0 12px">Demo traders use emails ending @demo.fundedsky.test and have no usable password. They exist so every screen has data to show.</p><label class="hint" style="display:flex;gap:8px;align-items:center;margin-bottom:12px"><input type="checkbox" data-act="toggleDemo" ${S.showDemo ? 'checked' : ''}> Show demo data in the back office</label>${demoU && BO.me.role === 'admin' ? '<button class="pill dng" data-act="purgeDemo">Delete All Demo Data</button>' : ''}`))
      + card('You', '', cb(kv([['Name', esc(nm(BO.me))], ['Email', esc(BO.me.email)], ['Role', esc(BO.me.role)]]) + '<div style="display:flex;gap:10px;margin-top:12px"><a class="pill" href="/app">Trader View</a><button class="pill" data-act="logout">Log Out</button></div>'))
      + '</div>'; };
  V.team = () => { const staff = BO.users.filter((u) => u.role !== 'trader');
    return ph('Team', 'Who can use the back office') + card('Staff', staff.length, table(['Name', 'Email', 'Role', ''], staff.map((u) => [esc(nm(u)), esc(u.email), b(u.role, 'sched'), u.id !== BO.me.id && BO.me.role === 'admin' ? `<button class="pill sm" data-act="user" data-id="${u.id}">Change</button>` : '']), { empty: 'Only you.' })) + '<p class="hint" style="margin:14px 0 0">To add someone, ask them to sign up, then open their profile in Traders and give them a role. Roles: admin (everything), finance (payouts and refunds), risk (accounts, identity, payouts), support (tickets, resets, points).</p>'; };
  V.audit = () => ph('Audit Log', 'Every staff action') + card('Recent', BO.audit.length, table(['When', 'Who', 'Action', 'Target'], BO.audit.map((x) => [dtt(x.at), esc(x.by), esc(x.action), `<span class="mono">${esc(x.target)}</span>`]), { empty: 'No actions yet.' }));

  // ---------- drawers ----------
  function drawerOf(d) {
    if (d.k === 'user') { const u = userById(+d.id); if (!u) return null; const ac = A().filter((a) => a.user === u.id); const os = O().filter((o) => o.user === u.id); const ps = P().filter((p) => p.user === u.id); const ts = T().filter((t) => t.user === u.id);
      return { title: nm(u), wide: true, body: kv([['Trader ID', `<span class="mono">${u.tid}</span>`], ['Email', esc(u.email) + (u.verified ? ' ' + b('Verified', 'live') : ' ' + b('Not Verified', 'draft'))], ['Country', esc(u.country)], ['Joined', dt(u.created_at)], ['Points', num(u.points)], ['Identity', kycB(u.kyc_status) + (u.kyc ? ` <span class="hint">${esc(u.kyc.name)} · ${esc(u.kyc.dob)} · ${esc(u.kyc.idType)} ···${esc(u.kyc.idLast4)}</span>` : '')], ['Referred by', u.referred_by ? UL2(u.referred_by) : '—']])
        + `<h4 style="margin:20px 0 8px">Accounts</h4>${table(['Account', 'Plan', 'Status', ['Balance', 'num']], ac.map((a) => [AL(a.id), `${PN(a.plan)} ${K(a.size)}`, phaseB(a), money(a.bal)]), { empty: 'No accounts.' })}
        <h4 style="margin:20px 0 8px">Orders</h4>${table(['Order', 'What', ['Total', 'num'], 'Status'], os.map((o) => [`<button class="lnk mono" data-act="ord" data-id="${o.code}">${o.code}</button>`, esc(o.kind), money(o.total, 2), ordB(o.status)]), { empty: 'No orders.' })}
        <h4 style="margin:20px 0 8px">Payouts and Tickets</h4>${table(['Item', 'Detail', 'Status'], ps.map((p) => [`<button class="lnk mono" data-act="po" data-id="${p.code}">${p.code}</button>`, money(p.amount), poB(p.status)]).concat(ts.map((t) => [`<button class="lnk" data-act="tk" data-id="${t.id}">#${t.id}</button>`, esc(t.subject), tkB(t.status)])), { empty: 'None.' })}
        ${BO.me.role === 'admin' && u.id !== BO.me.id ? `<h4 style="margin:20px 0 8px">Role</h4><div style="display:flex;gap:10px">${sel('x.role', ['trader', 'support', 'risk', 'finance', 'admin'], u.role, 'Role')}<button class="pill" data-act="setRole" data-id="${u.id}">Save Role</button></div>` : ''}`,
        foot: `${u.kyc_status === 'submitted' && canDo('risk', 'support') ? `<button class="pill pri" data-act="kycOk" data-id="${u.id}">Verify Identity</button><button class="pill" data-act="kycNo" data-id="${u.id}">Reject</button>` : ''}${canDo('support') ? `<button class="pill" data-act="pts" data-id="${u.id}">Adjust Points</button>` : ''}${canDo('support', 'risk') ? (u.status === 'active' ? `<button class="pill dng" data-act="ustatus" data-id="${u.id}" data-k="suspended">Suspend</button>` : `<button class="pill" data-act="ustatus" data-id="${u.id}" data-k="active">Reactivate</button>`) : ''}` };
    }
    if (d.k === 'acct') { const a = BO.accounts.find((x) => x.id === d.id); if (!a) return null;
      return { title: a.id, wide: true, body: `<div style="display:flex;gap:8px;margin-bottom:14px">${phaseB(a)}${a.ready ? b('Payout Ready', 'live') : ''}${a.halted ? b('Daily Loss Limit Hit', 'err') : ''}</div>` + kv([['Trader', UL2(a.user, a.name)], ['Plan', `${PN(a.plan)} ${K(a.size)} · ${esc(a.platform)}`], ['Balance', money(a.bal, 2)], ['Start', money(a.start)], ['Floor', money(a.floor, 2)], ['Peak end of day', money(a.peak, 2)], ['Today', money(a.today, 2)], ['Days traded', a.days], ['Best day', money(a.best, 2)], [a.kind === 'funded' ? 'Profit goal' : 'Target', a.target ? money(a.target) : '—'], ['Max loss · daily limit', `${money(a.maxLoss)} · ${money(a.dll)}`], ['Payouts', `${a.payouts} · ${money(a.paid)} paid · ${money(a.avail)} available`], ['Winning days this cycle', a.winDays], ['Add-ons', (a.addons || []).join(', ') || 'None'], ['Resets', `${a.resets} used · ${a.freeResets} free left`], ['Opened', dtt(a.created)], ['Passed', dtt(a.passed)], ['Funded', dtt(a.funded)], ['Breached', a.breached ? dtt(a.breached) + ' · ' + esc(a.breach || '') : '—'], ['Simulated skill', a.sim ? String(a.sim.skill) : '—']]),
        foot: `${a.phase === 'active' && canDo('risk') ? `<button class="pill dng" data-act="breach" data-id="${a.id}">Close Account</button>${a.sim && a.sim.paused ? `<button class="pill" data-act="resume" data-id="${a.id}">Resume Feed</button>` : `<button class="pill" data-act="pause" data-id="${a.id}">Pause Feed</button>`}` : ''}${a.phase === 'breached' && canDo('risk') ? `<button class="pill" data-act="reinstate" data-id="${a.id}">Reinstate</button>` : ''}${a.kind === 'evaluation' && ['active', 'breached'].includes(a.phase) && canDo('support') ? `<button class="pill" data-act="resetA" data-id="${a.id}">Reset Free</button>` : ''}${a.phase === 'passed' && canDo('risk') ? `<button class="pill pri" data-act="fund" data-id="${a.id}">Fund Now</button>` : ''}${a.phase === 'active' && BO.me.role === 'admin' ? `<button class="pill" data-act="ff" data-id="${a.id}">Simulate 5 Days</button>` : ''}` };
    }
    if (d.k === 'po') { const p = BO.payouts.find((x) => x.code === d.id); if (!p) return null; const a = BO.accounts.find((x) => x.id === p.account); const u = userById(p.user); const others = P().filter((x) => x.user === p.user && x.code !== p.code);
      return { title: 'Payout ' + p.code, body: `<div style="display:flex;gap:8px;margin-bottom:14px">${poB(p.status)}${kycB(p.kyc)}</div>` + kv([['Trader', UL2(p.user, p.name)], ['Country', esc(p.country)], ['Account', AL(p.account) + (a ? ` · ${PN(a.plan)} ${K(a.size)}` : '')], ['Payout number', `${p.number} on this account`], ['Taken from balance', money(p.gross, 2)], ['Split', p.split + '%'], ['Pay the trader', `<b>${money(p.amount)}</b>`], ['Method', esc(p.method)], ['Requested', dtt(p.requested)], ['Account balance now', a ? money(a.bal, 2) : '—'], ['Account days traded', a ? a.days : '—'], ['Other payouts to this trader', others.length ? others.map((x) => `${x.code} ${money(x.amount)} ${x.status}`).join(', ') : 'None'], ['Email', u ? esc(u.email) : '']])
        + (p.kyc !== 'verified' ? '<div class="note bad" style="margin-top:14px">Identity is not verified. Verify it before approving.</div>' : '') + `<div class="fl" style="margin-top:16px"><label for="ponote">Note to the trader (optional)</label><input id="ponote" placeholder="Shown in their notification"></div>`,
        foot: p.status === 'requested' && canDo('finance', 'risk') ? `<button class="pill pri" data-act="poOk" data-id="${p.code}">Approve</button><button class="pill dng" data-act="poNo" data-id="${p.code}">Deny and Return Funds</button>` : p.status === 'approved' && canDo('finance') ? `<button class="pill pri" data-act="poPay" data-id="${p.code}">Mark Sent</button><button class="pill dng" data-act="poNo" data-id="${p.code}">Deny and Return Funds</button>` : '' };
    }
    if (d.k === 'ord') { const o = BO.orders.find((x) => x.code === d.id); if (!o) return null;
      return { title: 'Order ' + o.code, body: `<div style="margin-bottom:14px">${ordB(o.status)}</div>` + kv([['Trader', UL2(o.user, o.name)], ['Type', esc(o.kind)], ['Paid with', esc(o.method || '—')], ['Provider', esc(o.provider || '—')], ['Created', dtt(o.created)], ['Paid', dtt(o.paid)], ['Accounts', (o.accounts || []).map(AL).join(', ') || (o.account ? AL(o.account) : '—')]]) + `<h4 style="margin:20px 0 8px">Lines</h4>${table(['Item', ['Amount', 'num']], o.lines.map((l) => [esc(l.label), money(l.amount, 2)]).concat([['<b>Total</b>', `<b>${money(o.total, 2)}</b>`]]))}<p class="hint" style="margin:14px 0 0">Refunding closes any account from this order that is still open.</p>`,
        foot: `<a class="pill" href="/api/orders/${o.code}/receipt" target="_blank">Receipt</a>${o.status === 'paid' && canDo('finance', 'support') ? `<button class="pill dng" data-act="refund" data-id="${o.code}">Refund ${money(o.total, 2)}</button>` : ''}` };
    }
    if (d.k === 'tk') { const t = BO.tickets.find((x) => x.id === +d.id); if (!t) return null;
      return { title: `#${t.id} ${t.subject}`, wide: true, body: `<div style="display:flex;gap:8px;margin-bottom:14px">${tkB(t.status)}<span class="hint">${esc(t.category)} · ${UL2(t.user, t.name)} · ${esc(t.email)}</span></div>` + t.msgs.map((m) => `<div style="margin:0 0 12px;padding:12px 14px;border-radius:10px;border:1px solid var(--ln);background:${m.staff ? 'var(--skyt)' : 'var(--p3)'}"><div class="hint" style="margin-bottom:6px">${m.staff ? esc(m.by || 'Support') + ' (staff)' : esc(t.name)} · ${dtt(m.at)}</div><div style="white-space:pre-wrap">${esc(m.body)}</div></div>`).join('') + `<div class="fl" style="margin-top:12px"><label for="tkr">Reply</label><textarea id="tkr" style="min-height:120px" placeholder="Your reply is emailed to the trader"></textarea></div>`,
        foot: `<button class="pill pri" data-act="tkReply" data-id="${t.id}">Send Reply</button><button class="pill" data-act="tkSolve" data-id="${t.id}">Reply and Solve</button>${t.status !== 'solved' ? `<button class="pill" data-act="tkClose" data-id="${t.id}">Mark Solved</button>` : `<button class="pill" data-act="tkOpen" data-id="${t.id}">Reopen</button>`}` };
    }
    return null;
  }

  // ---------- app ----------
  const q1 = () => P().filter((p) => p.status === 'requested').length;
  const APP = {
    title: 'Funded Sky Back Office', home: true, searchPh: 'Search traders, accounts, orders',
    areas: [
      { h: 'Today' },
      { id: 'home', n: 'Home', tabs: [['home', 'Home']] },
      { h: 'Traders' },
      { id: 'tr', n: 'Traders', b: () => U().filter((u) => u.kyc_status === 'submitted').length || null, tabs: [['traders', 'All Traders'], ['kyc', 'Identity Review', () => U().filter((u) => u.kyc_status === 'submitted').length || null]] },
      { id: 'ac', n: 'Accounts', tabs: [['acc_active', 'Live'], ['acc_passed', 'Passed', () => A().filter((a) => a.phase === 'passed').length || null], ['acc_breached', 'Breached'], ['acc_all', 'All']] },
      { h: 'Money' },
      { id: 'po', n: 'Payouts', b: () => q1() || null, bad: true, tabs: [['po_queue', 'To Review', () => q1() || null, true], ['po_approved', 'To Send', () => P().filter((p) => p.status === 'approved').length || null], ['po_hist', 'History']] },
      { id: 'or', n: 'Orders and Revenue', tabs: [['orders', 'Orders'], ['revenue', 'Revenue']] },
      { h: 'Customers' },
      { id: 'su', n: 'Support', b: () => T().filter((t) => t.status === 'open').length || null, tabs: [['tk_open', 'Open', () => T().filter((t) => t.status === 'open').length || null], ['tk_all', 'All Tickets']] },
      { id: 'em', n: 'Emails', tabs: [['outbox', 'Outbox']] },
      { h: 'Setup' },
      { id: 'ca', n: 'Catalog', tabs: [['cat_plans', 'Plans and Prices'], ['cat_rules', 'Rules and Caps'], ['cat_promos', 'Promo Codes']] },
      { id: 'co', n: 'Content', tabs: [['content', 'Site Content']] },
      { id: 'sy', n: 'System', tabs: [['sys', 'System'], ['team', 'Team'], ['audit', 'Audit Log']] }
    ],
    views: V,
    stats: () => { const m = metrics(); return [['Sales 7D', kmoney(m.rev7)], ['Payouts Owed', kmoney(m.owed), m.owed ? 'neg' : ''], ['Pass Rate', pct(m.passRate)]]; },
    right: () => `<button class="pill sm" data-act="theme">${root.classList.contains('light') ? 'Dark' : 'Light'}</button><a class="pill sm" href="/app">Trader View</a>`,
    banner: () => (BO.payments === 'test' ? '<div class="tbn">Payments are in test mode. Nothing is charged. Add a Stripe key to take real payments.</div>' : ''),
    search: (q) => { q = q.toLowerCase(); const out = [];
      BO.users.filter((u) => (u.first + ' ' + u.last + ' ' + u.email + ' ' + u.tid).toLowerCase().includes(q)).slice(0, 6).forEach((u) => out.push([nm(u), u.email + ' · ' + u.tid, 'user', u.id]));
      BO.accounts.filter((a) => a.id.toLowerCase().includes(q)).slice(0, 6).forEach((a) => out.push([a.id, `${a.name} · ${a.phase}`, 'acct', a.id]));
      BO.orders.filter((o) => o.code.toLowerCase().includes(q)).slice(0, 4).forEach((o) => out.push([o.code, `${o.name} · ${money(o.total, 2)}`, 'ord', o.code]));
      BO.payouts.filter((p) => p.code.toLowerCase().includes(q)).slice(0, 4).forEach((p) => out.push([p.code, `${p.name} · ${money(p.amount)}`, 'po', p.code]));
      return out; },
    drawer: drawerOf,
    click: (a, el, id, k) => {
      const D = (kind) => { S.drawer = { k: kind, id }; S.gq = ''; return true; };
      switch (a) {
        case 'user': return D('user'); case 'acct': return D('acct'); case 'po': return D('po'); case 'ord': return D('ord'); case 'tk': return D('tk');
        case 'theme': { const l = !root.classList.contains('light'); root.classList.toggle('light', l); try { localStorage.setItem('fs_admin_theme', l ? 'light' : 'dark'); } catch (e) { /* ignore */ } return true; }
        case 'logout': fetch('/api/auth/logout', { method: 'POST' }).finally(() => { location.href = '/login'; }); return false;
        case 'kycOk': act(() => API('/users/' + id, { kyc_status: 'verified' }), 'Identity verified'); return false;
        case 'kycNo': { const r = prompt('Why? The trader sees this.', 'We could not match your details. Please check them and submit again.'); if (r === null) return false; act(() => API('/users/' + id, { kyc_status: 'rejected', reason: r }), 'Marked as not verified'); return false; }
        case 'ustatus': act(() => API('/users/' + id, { status: k }), k === 'active' ? 'Reactivated' : 'Suspended'); return false;
        case 'setRole': act(() => API('/users/' + id, { role: (S.x || {}).role || (root.querySelector('select[data-bind="x.role"]') || {}).value }), 'Role saved'); return false;
        case 'pts': { const v = prompt('Points to add (use a minus sign to remove):', '500'); if (!v) return false; const r = prompt('Reason, shown in their history:', 'Goodwill credit'); act(() => API('/users/' + id, { points: parseInt(v, 10), reason: r }), 'Points updated'); return false; }
        case 'breach': { const r = prompt('Reason for closing the account. The trader sees this.', 'Closed after risk review'); if (r === null) return false; act(() => API('/accounts/' + id + '/breach', { reason: r }), 'Account closed'); return false; }
        case 'reinstate': if (!confirm('Reinstate ' + id + '? It becomes active again.')) return false; act(() => API('/accounts/' + id + '/reinstate', {}), 'Reinstated'); return false;
        case 'pause': act(() => API('/accounts/' + id + '/pause', {}), 'Feed paused for this account'); return false;
        case 'resume': act(() => API('/accounts/' + id + '/resume', {}), 'Feed resumed'); return false;
        case 'resetA': if (!confirm('Reset ' + id + ' at no charge?')) return false; act(() => API('/accounts/' + id + '/reset', {}), 'Account reset'); return false;
        case 'fund': act(() => API('/accounts/' + id + '/fund', {}), 'Funded account created'); return false;
        case 'ff': act(() => API('/accounts/' + id + '/fastforward', { days: 5 }), 'Simulated 5 trading days'); return false;
        case 'simTick': act(() => API('/sim/tick', {}), 'Feed tick done'); return false;
        case 'poOk': act(() => API('/payouts/' + id + '/approve', { note: val('#ponote') }), 'Payout approved', () => { S.drawer = null; }); return false;
        case 'poPay': if (!confirm('Mark ' + id + ' as sent? Only do this after the money has gone out.')) return false; act(() => API('/payouts/' + id + '/pay', {}), 'Marked as sent', () => { S.drawer = null; }); return false;
        case 'poNo': { const r = val('#ponote') || prompt('Reason for denying. The trader sees this.', 'This payout broke the consistency rule.'); if (!r) return false; act(() => API('/payouts/' + id + '/deny', { note: r }), 'Payout denied, funds returned', () => { S.drawer = null; }); return false; }
        case 'refund': if (!confirm('Refund ' + id + '? This also closes any open account from the order.')) return false; act(() => API('/orders/' + id + '/refund', { note: 'Refunded by staff' }), 'Refunded', () => { S.drawer = null; }); return false;
        case 'tkReply': case 'tkSolve': { const body = val('#tkr').trim(); if (!body) { toast('Write a reply first.'); return false; } act(() => API('/tickets/' + id + '/reply', { body, solve: a === 'tkSolve' }), a === 'tkSolve' ? 'Replied and solved' : 'Reply sent'); return false; }
        case 'tkClose': act(() => API('/tickets/' + id + '/status', { status: 'solved' }), 'Marked solved'); return false;
        case 'tkOpen': act(() => API('/tickets/' + id + '/status', { status: 'open' }), 'Reopened'); return false;
        case 'catReset': S.cat = null; return true;
        case 'catSave': act(() => API('/catalog', S.cat, 'PUT'), 'Catalog saved. New orders use it now', () => { S.cat = null; }); return false;
        case 'promoAdd': { C().promos = (C().promos || []).concat([{ code: 'NEWCODE', name: 'New promo', pct: 10, plans: ['essential', 'prime'], starts: new Date().toISOString().slice(0, 10), ends: '', once: true, active: false, desc: '10% off evaluations' }]); return true; }
        case 'promoDel': C().promos.splice(+k, 1); return true;
        case 'contentSave': { let v; try { v = JSON.parse(val('#cjson')); } catch (e) { toast('That is not valid JSON. Check commas and quotes.'); return false; } act(() => API('/content/' + k, { value: v }, 'PUT'), 'Content saved'); return false; }
        case 'toggleDemo': S.showDemo = !S.showDemo; return true;
        case 'purgeDemo': if (!confirm('Delete every demo trader, account, order and payout? Real data is not touched.')) return false; act(() => API('/demo/purge', {}), 'Demo data deleted'); return false;
        default: return false;
      }
    },
    change: (el) => {
      if (!el.classList.contains('catin')) return false;
      const path = el.dataset.cat.split('.'); let o = C(); for (let i = 0; i < path.length - 1; i++) o = o[path[i]];
      const last = path[path.length - 1];
      if (el.dataset.list) { const arr = o[last] || (o[last] = []); const v = el.dataset.list; const i = arr.indexOf(v); if (el.checked && i < 0) arr.push(v); if (!el.checked && i >= 0) arr.splice(i, 1); }
      else if (el.dataset.bool) o[last] = el.checked; else if (el.dataset.str) o[last] = el.value; else o[last] = Number(el.value);
      return true;
    }
  };
  S.cdef = window.__BO_DEF || {};
  try { if (localStorage.getItem('fs_admin_theme') === 'light') root.classList.add('light'); } catch (e) { /* ignore */ }
  { const m = /^\/admin\/?([a-z_]+)?/.exec(location.pathname); const map = { payouts: 'po_queue', traders: 'traders', accounts: 'acc_active', orders: 'orders', support: 'tk_open', catalog: 'cat_plans', content: 'content', system: 'sys', emails: 'outbox', kyc: 'kyc' }; if (m && m[1] && (map[m[1]] || V[m[1]])) S.view = map[m[1]] || m[1]; }
  setInterval(() => { if (document.visibilityState === 'visible' && !S.drawer && !S.cat && !document.querySelector('input:focus,textarea:focus')) reload().then(() => render()); }, 30000);
