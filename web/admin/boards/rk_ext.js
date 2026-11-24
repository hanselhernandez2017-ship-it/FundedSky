  // =================== extra tools ===================
  const WATCH = [
    { who: 'Felix B.', acct: 'FS-150K-10377', why: 'Doubling after losses (RK-1169)', until: 'Dec 1', by: RV2, ping: true },
    { who: 'Sofia L.', acct: 'FS-100K-10011', why: 'Very short holds before funding (RK-1174)', until: 'Dec 6', by: ME, ping: true },
    { who: 'Nina S.', acct: 'FS-150K-10420', why: 'Four cards tried (RK-1162)', until: 'Dec 20', by: ME, ping: false }
  ];
  const CASES = [
    { id: 'CS-88', title: 'Signal group trading the same ES entries', st: 'open', owner: ME, opened: 'Nov 22', due: 'Nov 25', traders: ['Omar H.', 'Marcus T.', 'Chen W.'], alerts: ['RK-1181'], log: [['Nov 22, 12:05 PM', ME, 'Opened from RK-1181. Payout PO-3320 held.'], ['Nov 22, 12:40 PM', ME, 'Asked all three traders by email how they place their trades.']], decision: '' },
    { id: 'CS-87', title: 'One person behind two identities, shared wallet', st: 'open', owner: RV2, opened: 'Nov 22', due: 'Nov 24', traders: ['Ivan P.', 'Zoe A.'], alerts: ['RK-1179'], log: [['Nov 22, 10:30 AM', RV2, 'Requested the identity check files for both traders.']], decision: '' },
    { id: 'CS-85', title: 'Four funded accounts on one passport', st: 'decided', owner: ME, opened: 'Nov 20', due: 'Nov 22', traders: ['Theo M.'], alerts: ['RK-1158'], log: [['Nov 20, 2:00 PM', ME, 'Confirmed the same document on both sign-ups.'], ['Nov 21, 9:15 AM', `${ME} and ${RV2}`, 'Closed the newest funded account. Sign-ups merged.']], decision: 'Closed the newest funded account, kept the other three' }
  ];
  const CHARGEBACKS = [
    { id: 'CB-142', trader: 'Nina S.', order: 'FS-ORD-2240', amt: 349, reason: 'Fraud: card not authorized', code: '10.4', due: 'Nov 29', st: 'evidence', ev: { terms: true, kyc: false, logins: true, trades: true, emails: true } },
    { id: 'CB-139', trader: 'Elena V.', order: 'FS-ORD-2190', amt: 79, reason: 'Product not as described', code: '13.3', due: 'Nov 26', st: 'evidence', ev: { terms: true, kyc: false, logins: true, trades: false, emails: true } },
    { id: 'CB-131', trader: 'Jonas E.', order: 'FS-ORD-2102', amt: 169, reason: 'Subscription cancelled', code: '13.2', due: 'Nov 12', st: 'submitted', ev: { terms: true, kyc: true, logins: true, trades: true, emails: true } },
    { id: 'CB-120', trader: 'Grace T.', order: 'FS-ORD-1988', amt: 99, reason: 'Duplicate charge', code: '12.6', due: 'Oct 30', st: 'lost', ev: { terms: true, kyc: false, logins: true, trades: true, emails: true } },
    { id: 'CB-114', trader: 'Ivan P.', order: 'FS-ORD-1931', amt: 259, reason: 'Fraud: card not authorized', code: '10.4', due: 'Oct 24', st: 'won', ev: { terms: true, kyc: true, logins: true, trades: true, emails: true } }
  ];
  const EVK = [['terms', 'Terms Accepted at Checkout', 'Time, IP and agreement version'], ['kyc', 'Identity Check Result', 'Only if the trader reached funding'], ['logins', 'Sign-In History', 'Devices and countries after purchase'], ['trades', 'Trading Activity', 'Proof the evaluation was used'], ['emails', 'Emails Delivered', 'Order confirmation and account login']];
  const ADJ = [
    { id: 'AJ-61', acct: 'FS-50K-10414', trader: 'Noah B.', amt: 420, why: 'Tradovate outage Nov 21, 9:31 to 9:44 AM: stop did not fill', st: 'second', by: ME, when: 'Today, 11:50 AM' },
    { id: 'AJ-59', acct: 'FS-100K-10011', trader: 'Sofia L.', amt: 2250, why: 'Reinstated after BR-205: balance restored to before the breach', st: 'done', by: `${ME} and ${RV2}`, when: 'Nov 16, 10:02 AM' },
    { id: 'AJ-57', acct: 'FS-25K-10333', trader: 'Zoe A.', amt: -120, why: 'Fill at a stale simulator price removed', st: 'done', by: `${ME} and ${RV2}`, when: 'Nov 14, 4:30 PM' }
  ];
  const NEWS = [
    { d: 'Mon, Nov 23', t: '10:00 AM', e: 'Consumer Confidence', mk: 'ES, NQ', imp: 'medium', flat: false, warned: false },
    { d: 'Tue, Nov 24', t: '8:30 AM', e: 'CPI', mk: 'All Index, Rates, Gold', imp: 'high', flat: false, warned: true },
    { d: 'Tue, Nov 24', t: '10:30 AM', e: 'EIA Crude Inventories', mk: 'CL, MCL', imp: 'high', flat: false, warned: false },
    { d: 'Wed, Nov 25', t: '8:30 AM', e: 'GDP (Second Estimate)', mk: 'All Index, Rates', imp: 'high', flat: false, warned: false },
    { d: 'Wed, Nov 25', t: '2:00 PM', e: 'FOMC Minutes', mk: 'All', imp: 'high', flat: true, warned: false },
    { d: 'Thu, Nov 26', t: 'All Day', e: 'Thanksgiving: Markets Closed', mk: 'All', imp: 'holiday', flat: true, warned: true },
    { d: 'Fri, Nov 27', t: '1:00 PM', e: 'Early Close', mk: 'All', imp: 'holiday', flat: true, warned: true }
  ];
  const HEALTH = [
    { n: 'Tradovate', k: 'Platform', st: 'ok', lat: 38, tick: '0.2s ago', note: '' },
    { n: 'NinjaTrader', k: 'Platform', st: 'ok', lat: 41, tick: '0.3s ago', note: '' },
    { n: 'Rithmic', k: 'Platform', st: 'slow', lat: 412, tick: '1.8s ago', note: 'Slower fills since 12:20 PM' },
    { n: 'TradingView', k: 'Platform', st: 'ok', lat: 55, tick: '0.4s ago', note: '' },
    { n: '[Data Vendor] Price Feed', k: 'Prices', st: 'ok', lat: 12, tick: '0.1s ago', note: 'Used to check every rule' },
    { n: 'Rule Engine', k: 'Funded Sky', st: 'ok', lat: 6, tick: 'Checking 66 accounts', note: '' },
    { n: 'Rise', k: 'Payouts', st: 'ok', lat: 220, tick: 'Last payout 9:40 AM', note: '' },
    { n: 'Sumsub', k: 'Identity', st: 'ok', lat: 310, tick: 'Last check 11:02 AM', note: '' }
  ];
  const SWITCHES = { trading: false, freeze: false, payouts: false, sales: false };
  const TRADES = (() => { const r = rng('trades'); const out = []; const syms = ['ES', 'NQ', 'MNQ', 'CL', 'GC', 'MES', 'RTY'];
    const accts = ACCTS.filter((a) => a.st !== 'Closed');
    for (let i = 0; i < 150; i++) { const a = accts[Math.floor(r() * accts.length)]; const s = syms[Math.floor(r() * syms.length)]; const sec = 9.5 * 3600 + Math.floor(r() * 3.2 * 3600); const q = 1 + Math.floor(r() * a.R.max);
      out.push({ acct: a.id, trader: a.trader, s, side: r() > 0.5 ? 'Buy' : 'Sell', q, sec, hold: r() < 0.15 ? 1 + Math.floor(r() * 4) : 8 + Math.floor(r() * 900), pl: Math.round((r() - 0.5) * a.R.daily * 0.4) }); }
    [['FS-100K-10405', 'Omar H.', 2], ['FS-100K-10388', 'Marcus T.', 2], ['FS-F-50K-2131', 'Chen W.', 4]].forEach(([acct, trader, q], j) => [[34923, 'Buy'], [35927, 'Sell'], [37212, 'Buy'], [39939, 'Sell']].forEach(([sec, side]) => out.push({ acct, trader, s: 'ES', side, q, sec: sec + j, hold: 400 + j * 3, pl: side === 'Sell' ? 310 * q / 2 : 0 })));
    [['FS-50K-10290', 'Buy'], ['FS-50K-10291', 'Sell']].forEach(([acct, side], j) => out.push({ acct, trader: 'Liam K.', s: 'NQ', side, q: 2, sec: 45041 + j, hold: 210, pl: j ? -180 : 175 }));
    return out.sort((a, b) => b.sec - a.sec); })();
  const hms = (s) => { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`; };
  const traders = () => { const m = {}; ACCTS.forEach((a) => { const t = m[a.trader] = m[a.trader] || { name: a.trader, country: a.country, accts: [], restricted: false }; t.accts.push(a); }); return Object.values(m); };
  const TSTATE = {};

  // ---------- trader profiles ----------
  function tScore(t) { return Math.max(...t.accts.map(score)); }
  function tStatus(n) { return TSTATE[n] || (WATCH.some((w) => w.who === n) ? 'Watching' : 'Normal'); }
  function vTraders() {
    const q = (S.tq || '').toLowerCase(); const l = traders().filter((t) => !q || t.name.toLowerCase().includes(q)).sort((a, b) => tScore(b) - tScore(a));
    const stc = { Normal: 'plain', Watching: 'sched', Restricted: 'draft', Banned: 'err' };
    return `<div class="ph"><div><h1>Trader Profiles</h1><p>Everything about one trader in one place: every account, alert, payout, link and decision. Restrict or ban from here. The full customer profile, KYC and payments are in ${XL('Users', 'users', 'Users')}.</p></div></div>
      <div class="card"><div class="ch lgf"><input type="search" placeholder="Search Trader" value="${esc(S.tq || '')}" data-live="tq" data-key="tq" aria-label="Search traders"><span class="lab">${l.length} Traders</span></div><div class="tsc"><table class="t"><thead><tr><th>Trader</th><th>Country</th><th class="num">Accounts</th><th class="num">Funded</th><th class="num">Open Alerts</th><th class="num">Paid Out</th><th class="num">Highest Score</th><th>Status</th></tr></thead><tbody>${l.map((t) => { const al = ALERTS.filter((x) => x.traders.includes(t.name) && ['new', 'investigating', 'second'].includes(x.st)).length; const paid = PAYOUTS.filter((p) => p.trader === t.name && p.st === 'approved').reduce((s, p) => s + p.amt, 0); const sc = tScore(t);
        return `<tr class="lk" data-act="trader" data-id="${esc(t.name)}"><td class="nw"><b>${esc(t.name)}</b></td><td class="nw">${esc(t.country)}</td><td class="num">${t.accts.length}</td><td class="num">${t.accts.filter((a) => a.funded).length}</td><td class="num ${al ? 'warnt' : ''}">${al}</td><td class="num">${paid ? money(paid) : '—'}</td><td class="num"><span class="sc ${sc >= 70 ? 'hi' : sc >= 45 ? 'md' : ''}">${sc}</span></td><td><span class="b ${stc[tStatus(t.name)]}">${tStatus(t.name)}</span></td></tr>`; }).join('')}</tbody></table></div></div>`;
  }
  function traderDrawer(name) {
    const t = traders().find((x) => x.name === name) || { name, country: '—', accts: [] };
    const al = ALERTS.filter((x) => x.traders.includes(name)); const po = PAYOUTS.filter((p) => p.trader === name); const cl = CLUSTERS.filter((c) => c.nodes.includes(name)); const cs = CASES.filter((c) => c.traders.includes(name));
    const st = tStatus(name);
    return { title: name, wide: true, body: `
      <div class="ahd"><div><b>${esc(name)}</b><div class="hint">${esc(t.country)} · Identity Verified · Joined 2026 · Trader ID <span class="mono">${t.accts[0] ? t.accts[0].tid : ''}</span></div></div><span class="b ${st === 'Banned' ? 'err' : st === 'Restricted' ? 'draft' : st === 'Watching' ? 'sched' : 'plain'}">${st}</span></div>
      <div class="tiles t4"><div class="tile"><span>Accounts</span><b>${t.accts.length}</b><small>${t.accts.filter((a) => a.funded).length} funded</small></div><div class="tile"><span>Highest Score</span><b>${t.accts.length ? tScore(t) : '—'}</b><small>Out of 99</small></div><div class="tile"><span>Alerts</span><b>${al.length}</b><small>${al.filter((x) => x.st === 'confirmed').length} confirmed</small></div><div class="tile"><span>Paid Out</span><b>${money(po.filter((p) => p.st === 'approved').reduce((s, p) => s + p.amt, 0))}</b><small>${po.length} requests</small></div></div>
      <div class="card m0"><div class="ch"><h3>Accounts</h3></div><div class="tsc"><table class="t"><tbody>${t.accts.map((a) => `<tr class="lk" data-act="acct" data-id="${a.id}"><td class="mono nw">${a.id}</td><td class="nw hint">${esc(a.plan)} ${K(a.size)}</td><td class="num nw">${money(a.bal)}</td><td>${meter(Math.max(dailyUsed(a), ddUsed(a)))}</td><td><span class="b ${a.st === 'Active' ? 'live' : a.st === 'Paused' ? 'draft' : 'err'}">${a.st}</span></td></tr>`).join('') || '<tr><td class="empty">No accounts.</td></tr>'}</tbody></table></div></div>
      ${al.length ? `<div class="sec"><h4>Alerts</h4>${al.map((x) => `<button class="ali" data-act="alert" data-id="${x.id}"><span class="b ${SEV[x.sev][1]}">${SEV[x.sev][0]}</span><div><b>${ATYPE[x.type]}</b><div class="hint">${x.id} · ${ALST[x.st][0]} · ${x.when}</div></div><span class="chev">›</span></button>`).join('')}</div>` : ''}
      ${po.length ? `<div class="sec"><h4>Payouts</h4>${po.map((p) => `<button class="ali" data-act="payout" data-id="${p.id}"><span class="mono">${p.id}</span><div><b>${money(p.amt)}</b><div class="hint">${p.req}</div></div><span class="b ${POST[p.st][1]}">${POST[p.st][0]}</span></button>`).join('')}</div>` : ''}
      ${cl.length || cs.length ? `<div class="sec"><h4>Links and Cases</h4>${cl.map((c) => `<button class="ali" data-act="go" data-v="links"><span class="mono">${c.id}</span><div><b>Linked to ${esc(c.nodes.filter((n) => n !== name).join(', '))}</b><div class="hint">${esc([...new Set(c.edges.map((e) => e[2]))].join(', '))}</div></div><span class="chev">›</span></button>`).join('')}${cs.map((c) => `<button class="ali" data-act="case" data-id="${c.id}"><span class="mono">${c.id}</span><div><b>${esc(c.title)}</b><div class="hint">${c.st === 'open' ? 'Open' : 'Decided'} · ${esc(c.owner)}</div></div><span class="chev">›</span></button>`).join('')}</div>` : ''}`,
      foot: `<button class="pill dng" data-act="tDo" data-k="ban" data-id="${esc(name)}" style="margin-right:auto">${st === 'Banned' ? 'Lift Ban' : 'Ban'}</button><button class="pill" data-act="tDo" data-k="case" data-id="${esc(name)}">Open a Case</button><button class="pill" data-act="tDo" data-k="watch" data-id="${esc(name)}">${WATCH.some((w) => w.who === name) ? 'Stop Watching' : 'Watch'}</button><button class="pill" data-act="tDo" data-k="restrict" data-id="${esc(name)}">${st === 'Restricted' ? 'Lift Restriction' : 'Restrict Purchases'}</button>` };
  }
  // ---------- cases ----------
  function vCases() {
    return `<div class="ph"><div><h1>Cases</h1><p>Investigations that need more than one alert: notes, evidence, a deadline and a final decision in one place.</p></div><div class="act"><button class="pill" data-act="newCase">+ New Case</button></div></div>
      <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Case</th><th>Traders</th><th>Alerts</th><th>Owner</th><th>Opened</th><th>Due</th><th>Status</th></tr></thead><tbody>${CASES.map((c) => `<tr class="lk" data-act="case" data-id="${c.id}"><td><b>${esc(c.title)}</b><div class="hint mono">${c.id}</div></td><td class="nw">${esc(c.traders.join(', '))}</td><td class="nw mono">${c.alerts.join(', ') || '—'}</td><td class="nw">${esc(c.owner)}</td><td class="nw">${c.opened}</td><td class="nw ${c.st === 'open' && c.due === 'Nov 22' ? 'dn' : ''}">${c.due}</td><td><span class="b ${c.st === 'open' ? 'sched' : c.st === 'second' ? 'draft' : 'live'}">${c.st === 'open' ? 'Open' : c.st === 'second' ? 'Waiting for Second Reviewer' : 'Decided'}</span></td></tr>`).join('')}</tbody></table></div></div>`;
  }
  function caseDrawer(id) {
    const c = CASES.find((x) => x.id === id);
    return { title: `${c.id} · ${c.title}`, wide: true, body: `
      <div class="kv"><div><span>Traders</span><b>${c.traders.map((n) => `<button class="lnk" data-act="trader" data-id="${esc(n)}">${esc(n)}</button>`).join(', ')}</b></div><div><span>Alerts</span><b>${c.alerts.map((a) => `<button class="lnk" data-act="alert" data-id="${a}">${a}</button>`).join(', ') || '—'}</b></div><div><span>Owner</span><b>${esc(c.owner)}</b></div><div><span>Due</span><b>${c.due}</b></div>${c.decision ? `<div><span>Decision</span><b>${esc(c.decision)}</b></div>` : ''}</div>
      <div class="sec"><h4>Timeline</h4><div class="tl2">${c.log.map(([w, who, x]) => `<div><i></i><div><b>${esc(who)}</b><span class="hint"> · ${w}</span><p>${esc(x)}</p></div></div>`).join('')}</div><div class="rowx" style="grid-template-columns:1fr auto;margin-top:10px"><input id="cnote" placeholder="Add to the timeline"><button class="pill sm" data-act="caseNote" data-id="${c.id}">Add</button></div></div>
      ${c.st === 'open' ? `<div class="fl"><label>Decision</label><select id="cdec">${['No action: the trading was allowed', 'Warn the traders', 'Deny payouts, keep accounts open', 'Close accounts and deny payouts', 'Ban the traders'].map((o) => `<option>${o}</option>`).join('')}</select><span class="hint">Closing or banning asks ${RV2} to confirm.</span></div>` : ''}`,
      foot: c.st === 'open' ? `<button class="pill pri" data-act="caseDecide" data-id="${c.id}">Record Decision</button>` : c.st === 'second' ? `<button class="pill pri" data-act="caseConfirm" data-id="${c.id}">Confirm as ${RV2}</button>` : '<button class="pill" data-act="closeDrw">Close</button>' };
  }
  // ---------- trade search ----------
  function vTrades() {
    const f = S.tf || (S.tf = { s: 'all', side: 'all', q: '', maxHold: '', minQty: '', sel: null, win: 3 });
    const q = f.q.toLowerCase();
    const l = TRADES.filter((t) => (f.s === 'all' || t.s === f.s) && (f.side === 'all' || t.side === f.side) && (!q || (t.acct + t.trader).toLowerCase().includes(q)) && (!f.maxHold || t.hold <= +f.maxHold) && (!f.minQty || t.q >= +f.minQty)).slice(0, 60);
    const sel = f.sel != null ? TRADES[f.sel] : null;
    const matches = sel ? TRADES.filter((t) => t !== sel && t.s === sel.s && t.trader !== sel.trader && Math.abs(t.sec - sel.sec) <= f.win) : [];
    return `<div class="ph"><div><h1>Trade Search</h1><p>Every fill from today across all platforms. Pick a trade and Find Matches shows other traders who did the same thing within seconds.</p></div></div>
      <div class="card"><div class="ch lgf"><input type="search" placeholder="Account or Trader" value="${esc(f.q)}" data-live="tfq" data-key="tfq" aria-label="Account or trader"><select data-bind="tf.s" aria-label="Market"><option value="all">All Markets</option>${['ES', 'NQ', 'MNQ', 'MES', 'RTY', 'CL', 'GC'].map((s) => `<option ${f.s === s ? 'selected' : ''}>${s}</option>`).join('')}</select><select data-bind="tf.side" aria-label="Side"><option value="all">Buys and Sells</option><option ${f.side === 'Buy' ? 'selected' : ''}>Buy</option><option ${f.side === 'Sell' ? 'selected' : ''}>Sell</option></select><input type="number" min="0" placeholder="Held Up To (s)" value="${f.maxHold}" data-bind="tf.maxHold" class="nin" aria-label="Held up to seconds"><input type="number" min="0" placeholder="Min Qty" value="${f.minQty}" data-bind="tf.minQty" class="nin" aria-label="Minimum quantity"></div>
      <div class="tsc"><table class="t"><thead><tr><th>Time ET</th><th>Account</th><th>Trader</th><th>Market</th><th>Side</th><th class="num">Qty</th><th class="num">Held</th><th class="num">P&amp;L</th><th></th></tr></thead><tbody>${l.map((t) => { const i = TRADES.indexOf(t); return `<tr class="${f.sel === i ? 'rsel' : ''}"><td class="mono nw">${hms(t.sec)}</td><td class="mono nw">${t.acct}</td><td class="nw">${esc(t.trader)}</td><td>${t.s}</td><td>${t.side}</td><td class="num">${t.q}</td><td class="num ${t.hold < 5 ? 'warnt' : ''}">${t.hold}s</td><td class="num nw ${t.pl < 0 ? 'dn' : t.pl > 0 ? 'up' : ''}">${money(t.pl, 1)}</td><td class="num nw"><button class="lnk" data-act="tMatch" data-i="${i}">Find Matches</button></td></tr>`; }).join('') || '<tr><td colspan="9" class="empty">No trades match.</td></tr>'}</tbody></table></div></div>
      ${sel ? `<div class="card"><div class="ch"><h3>Matches for ${sel.side} ${sel.q} ${sel.s} at ${hms(sel.sec)}</h3><span class="lab">${esc(sel.trader)}</span><div class="r"><label class="wlab">Within<select data-bind="tf.win">${[1, 3, 5, 10, 30].map((w) => `<option value="${w}" ${+f.win === w ? 'selected' : ''}>${w}s</option>`).join('')}</select></label></div></div><div class="tsc"><table class="t"><tbody>${matches.length ? matches.map((t) => `<tr><td class="mono nw">${hms(t.sec)}</td><td class="nw"><b>${esc(t.trader)}</b></td><td class="mono nw">${t.acct}</td><td class="nw">${t.side} ${t.q} ${t.s}</td><td class="num nw">${t.sec - sel.sec >= 0 ? '+' : ''}${t.sec - sel.sec}s</td><td class="num nw"><span class="b ${t.side === sel.side ? 'err' : 'draft'} plain">${t.side === sel.side ? 'Same Direction' : 'Opposite'}</span></td></tr>`).join('') : '<tr><td class="empty">No other trader traded this market within the window.</td></tr>'}</tbody></table></div>${matches.length ? `<div class="cb edact"><button class="pill sm" data-act="tAlert">Raise an Alert From These</button></div>` : ''}</div>` : ''}`;
  }
  // ---------- watchlist ----------
  function vWatch() {
    return `<div class="ph"><div><h1>Watchlist</h1><p>Traders you want an eye on. You get a ping when they trade, request a payout or buy another account.</p></div></div>
      <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Trader</th><th>Account</th><th>Why</th><th>Until</th><th>Added By</th><th>Ping Me</th><th></th></tr></thead><tbody>${WATCH.length ? WATCH.map((w, i) => `<tr><td class="nw"><button class="lnk" data-act="trader" data-id="${esc(w.who)}">${esc(w.who)}</button></td><td class="mono nw">${w.acct || '—'}</td><td>${esc(w.why)}</td><td class="nw">${w.until}</td><td class="nw hint">${esc(w.by)}</td><td><button class="sw ${w.ping ? 'on' : ''}" data-act="wPing" data-i="${i}" role="switch" aria-checked="${w.ping}" aria-label="Ping me"></button></td><td class="num"><button class="lnk" data-act="wDel" data-i="${i}">Remove</button></td></tr>`).join('') : '<tr><td colspan="7" class="empty">Nobody on the watchlist.</td></tr>'}</tbody></table></div></div>
      <p class="hint">Add traders from any account or trader profile. Entries end on their date unless renewed.</p>`;
  }
  // ---------- platform health ----------
  function vHealth() {
    const sw = (k, l, d) => `<div class="kill ${SWITCHES[k] ? 'on' : ''}"><div><b>${l}</b><div class="hint">${d}</div></div><button class="sw ${SWITCHES[k] ? 'on' : ''}" data-act="kill" data-k="${k}" role="switch" aria-checked="${SWITCHES[k]}" aria-label="${esc(l)}"></button></div>`;
    return `<div class="ph"><div><h1>Platform Health</h1><p>Whether the platforms, price feed and partners are working, and the switches to use when they aren't.</p></div></div>
      <div class="card"><div class="ch"><h3>Emergency Switches</h3><span class="lab">Each change is logged and announced to the team</span></div><div class="cb kills">${sw('trading', 'Pause New Trades Everywhere', 'Traders can close positions but not open new ones.')}${sw('freeze', 'Freeze Automatic Closures', 'Breaches during an outage go to review instead of closing the account.')}${sw('payouts', 'Pause Payouts', 'Approved payouts wait until this is off.')}${sw('sales', 'Pause New Sales', 'Checkout shows a short notice instead of taking payments.')}</div></div>
      <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Service</th><th>Type</th><th>Status</th><th class="num">Response</th><th>Last Activity</th><th>Note</th></tr></thead><tbody>${HEALTH.map((h) => `<tr><td class="nw"><b>${esc(h.n)}</b></td><td class="nw hint">${h.k}</td><td><span class="b ${h.st === 'ok' ? 'live' : h.st === 'slow' ? 'draft' : 'err'}">${h.st === 'ok' ? 'Working' : h.st === 'slow' ? 'Slow' : 'Down'}</span></td><td class="num ${h.lat > 300 ? 'warnt' : ''}">${h.lat} ms</td><td class="nw hint">${h.tick}</td><td class="hint nw">${esc(h.note || '—')}</td></tr>`).join('')}</tbody></table></div></div>
      <p class="hint">When a platform is slow or down, turn on Freeze Automatic Closures and send the Platform Issue Update email from ${XL('Emails', 'flow', 'Emails')}.</p>`;
  }
  // ---------- news ----------
  function vNews() {
    return `<div class="ph"><div><h1>News Calendar</h1><p>High-impact releases this week. No new trades 2 minutes either side; for the biggest ones you can require traders to be flat.</p></div><div class="act"><button class="pill" data-act="newsAdd">+ Add Event</button></div></div>
      <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Day</th><th>Time ET</th><th>Event</th><th>Markets</th><th>Impact</th><th class="num">Accounts in These Markets</th><th>Must Be Flat</th><th></th></tr></thead><tbody>${NEWS.map((n, i) => `<tr><td class="nw">${n.d}</td><td class="nw mono">${n.t}</td><td class="nw"><b>${esc(n.e)}</b></td><td class="hint nw">${esc(n.mk)}</td><td><span class="b ${n.imp === 'high' ? 'err' : n.imp === 'medium' ? 'draft' : 'plain'} plain">${n.imp === 'holiday' ? 'Market Hours' : n.imp === 'high' ? 'High' : 'Medium'}</span></td><td class="num">${n.imp === 'holiday' ? '—' : 6 + (i * 7) % 19}</td><td><button class="sw ${n.flat ? 'on' : ''}" data-act="newsFlat" data-i="${i}" role="switch" aria-checked="${n.flat}" aria-label="Must be flat"></button></td><td class="num nw">${n.warned ? '<span class="hint">Traders Told</span>' : `<button class="lnk" data-act="newsWarn" data-i="${i}">Email Traders</button>`}</td></tr>`).join('')}</tbody></table></div></div>
      <p class="hint">Events come from the economic calendar feed. Must Be Flat closes open positions 2 minutes before the release.</p>`;
  }
  // ---------- chargebacks ----------
  function vChargebacks() {
    const lab = { evidence: ['Needs Evidence', 'draft'], submitted: ['Submitted', 'sched'], won: ['Won', 'live'], lost: ['Lost', 'err'], accepted: ['Accepted', 'plain'] };
    const open = CHARGEBACKS.filter((c) => c.st === 'evidence');
    return `<div class="ph"><div><h1>Chargebacks</h1><p>Disputes from the card processor. Deadlines, early warnings and win rates are on the ${XL('Disputes', 'open', 'Disputes')} board.</p></div><div class="act">${XL('Disputes', 'open', 'Open Disputes Board', 'pill')}</div></div>
      <div class="tiles"><div class="tile"><span>Need Evidence</span><b class="${open.length ? 'warn' : ''}">${open.length}</b><small>${money(open.reduce((s, c) => s + c.amt, 0))} at stake</small></div><div class="tile"><span>Win Rate</span><b>${Math.round(CHARGEBACKS.filter((c) => c.st === 'won').length / Math.max(1, CHARGEBACKS.filter((c) => ['won', 'lost'].includes(c.st)).length) * 100)}%</b><small>Last 90 days</small></div><div class="tile"><span>Chargeback Rate</span><b>0.41%</b><small>Card networks flag above 1%</small></div><div class="tile"><span>After a Chargeback</span><b style="font-size:16px;margin:6px 0 4px">Close and Block</b><small>Account closed, card added to the Blocklist</small></div></div>
      <div class="card"><div class="tsc"><table class="t"><thead><tr><th>Dispute</th><th>Trader</th><th>Order</th><th class="num">Amount</th><th>Reason</th><th>Answer By</th><th>Evidence</th><th>Status</th></tr></thead><tbody>${CHARGEBACKS.map((c) => { const n = Object.values(c.ev).filter(Boolean).length; return `<tr class="lk" data-act="cb" data-id="${c.id}"><td class="mono nw">${c.id}</td><td class="nw">${esc(c.trader)}</td><td class="mono nw">${c.order}</td><td class="num">${money(c.amt)}</td><td class="nw">${esc(c.reason)} <span class="hint">· ${c.code}</span></td><td class="nw ${c.st === 'evidence' ? 'warnt' : ''}">${c.due}</td><td class="nw">${n} of ${EVK.length}</td><td><span class="b ${lab[c.st][1]}">${lab[c.st][0]}</span></td></tr>`; }).join('')}</tbody></table></div></div>`;
  }
  function cbDrawer(id) {
    const c = CHARGEBACKS.find((x) => x.id === id);
    return { title: `${c.id} · ${money(c.amt)}`, body: `
      <div class="kv"><div><span>Trader</span><b><button class="lnk" data-act="trader" data-id="${esc(c.trader)}">${esc(c.trader)}</button></b></div><div><span>Order</span><b class="mono">${c.order}</b></div><div><span>Reason</span><b>${esc(c.reason)} · ${c.code}</b></div><div><span>Answer By</span><b>${c.due}</b></div></div>
      <div class="sec"><h4>Evidence Pack</h4>${EVK.map(([k, l, d]) => `<label class="chk evr"><input type="checkbox" ${c.ev[k] ? 'checked' : ''} data-cbev="${k}" ${c.st !== 'evidence' ? 'disabled' : ''}><span><b>${l}</b><span class="hint">${d}</span></span></label>`).join('')}</div>`,
      foot: c.st === 'evidence' ? `<button class="pill" data-act="cbDo" data-k="accept" data-id="${c.id}" style="margin-right:auto">Accept the Loss</button><button class="pill" data-act="cbDo" data-k="pack" data-id="${c.id}">Download Pack</button><button class="pill pri" data-act="cbDo" data-k="submit" data-id="${c.id}">Submit to Processor</button>` : '<button class="pill" data-act="closeDrw">Close</button>' };
  }
  // ---------- adjustments ----------
  function vAdjust() {
    return `<div class="ph"><div><h1>Balance Adjustments</h1><p>Corrections to an account balance, for example after a platform outage or a stale fill. Every adjustment needs two people.</p></div><div class="act"><button class="pill" data-act="newAdj">+ New Adjustment</button></div></div>
      <div class="card"><div class="tsc"><table class="t"><thead><tr><th>ID</th><th>Account</th><th>Trader</th><th class="num">Amount</th><th>Why</th><th>By</th><th>When</th><th>Status</th><th></th></tr></thead><tbody>${ADJ.map((a) => `<tr><td class="mono nw">${a.id}</td><td class="mono nw">${a.acct}</td><td class="nw">${esc(a.trader)}</td><td class="num nw ${a.amt < 0 ? 'dn' : 'up'}">${money(a.amt, 1)}</td><td class="sumc hint">${esc(a.why)}</td><td class="nw hint">${esc(a.by)}</td><td class="nw">${a.when}</td><td><span class="b ${a.st === 'done' ? 'live' : 'sched'}">${a.st === 'done' ? 'Applied' : 'Waiting for Second Reviewer'}</span></td><td class="num nw">${a.st === 'second' ? `<button class="lnk" data-act="adjOk" data-id="${a.id}">Approve as ${RV2}</button>` : ''}</td></tr>`).join('')}</tbody></table></div></div>
      <p class="hint">Adjustments change the balance used by the rules, not the trader's trade history. The trader sees them as a line on their dashboard.</p>`;
  }
  function adjDrawer() {
    const f = S.drawer.f;
    return { title: 'New Adjustment', body: `<div class="fl"><label>Account</label><select data-df="acct">${ACCTS.filter((a) => a.st !== 'Closed').map((a) => `<option value="${a.id}" ${f.acct === a.id ? 'selected' : ''}>${a.id} · ${esc(a.trader)}</option>`).join('')}</select></div><div class="fl"><label>Amount ($)</label><input type="number" value="${f.amt}" data-df="amt"><span class="hint">Use a minus sign to take money off.</span></div><div class="fl"><label>Why</label><textarea data-df="why" placeholder="What happened, with times. The trader sees a short version.">${esc(f.why)}</textarea></div>`,
      foot: '<button class="pill" data-act="closeDrw">Cancel</button><button class="pill pri" data-act="adjSave">Send for Second Approval</button>' };
  }
  // ---------- rule simulator ----------
  function vSim() {
    const f = S.sim || (S.sim = { size: 50000, daily: 1100, dd: 2500, target: 3000, cons: 40, days: 5 });
    const b = RULES[f.size]; const base = { pass: 11.4, breach: 412, payout: 18940, rev: 30390 };
    const ease = (b.dd ? (f.dd - b.dd) / b.dd : 0) * 0.9 + (f.daily - b.daily) / b.daily * 0.6 - (f.target - b.target) / b.target * 1.1 - (f.days - 5) * 0.04 + (f.cons - 40) / 100;
    const pass = Math.max(2, +(base.pass * (1 + ease)).toFixed(1)); const breach = Math.round(base.breach * (1 - ease * 0.8)); const payout = Math.round(base.payout * (pass / base.pass) * (1 + (f.cons - 40) / 200));
    const row = (l, a, c, fmt, good) => { const d = c - a; const better = good === 'up' ? d > 0 : d < 0; return `<tr><td><b>${l}</b></td><td class="num">${fmt(a)}</td><td class="num">${fmt(c)}</td><td class="num ${d === 0 ? '' : better ? 'up' : 'dn'}">${d === 0 ? '—' : (d > 0 ? '+' : '') + fmt(d).replace('$-', '−$')}</td></tr>`; };
    const inp = (k, l) => `<div class="fl"><label>${l}</label><input type="number" min="0" value="${f[k]}" data-bind="sim.${k}"></div>`;
    return `<div class="ph"><div><h1>Rule Simulator</h1><p>Change a rule and see what it would have done over the last 90 days of real trades, before you change it in the ${XL('Catalog', '', 'Checkout Catalog')}.</p></div></div>
      <div class="two wl2"><div class="card m0"><div class="ch"><h3>Rules to Try</h3><div class="r"><select data-bind="sim.size" aria-label="Account size">${Object.keys(RULES).map((s) => `<option value="${s}" ${+f.size === +s ? 'selected' : ''}>${K(+s)}</option>`).join('')}</select></div></div><div class="cb fg"><div class="fg2">${inp('daily', 'Daily Loss Limit ($)')}${inp('dd', 'Max Drawdown ($)')}${inp('target', 'Profit Target ($)')}${inp('days', 'Minimum Trading Days')}</div>${inp('cons', 'Consistency: Best Day Up To (%)')}<span class="hint">Now: daily ${money(b.daily)}, drawdown ${money(b.dd)}, target ${money(b.target)}, 5 days, 40%.</span><button class="pill sm" data-act="simReset" style="justify-self:start">Back to Current Rules</button></div></div>
      <div class="card m0"><div class="ch"><h3>What Would Have Happened</h3><span class="lab">Last 90 Days · ${K(+f.size)}</span></div><div class="tsc"><table class="t"><thead><tr><th></th><th class="num">Current</th><th class="num">With Changes</th><th class="num">Difference</th></tr></thead><tbody>${row('Pass Rate', base.pass, pass, (v) => v.toFixed(1) + '%', 'none')}${row('Breaches', base.breach, breach, (v) => String(Math.round(v)), 'down')}${row('Payouts', base.payout, payout, (v) => money(v), 'down')}${row('Payouts / Revenue', Math.round(base.payout / base.rev * 100), Math.round(payout / base.rev * 100), (v) => Math.round(v) + '%', 'down')}</tbody></table></div><div class="cb"><p class="hint" style="margin:0 0 12px">Easier rules raise the pass rate and payouts; revenue only changes if traders buy more because of it. Estimates from replaying past trades.</p><button class="pill sm" data-act="simSend">Send to Checkout Catalog as a Draft</button></div></div></div>`;
  }

  // ---------- global search ----------
  function searchResults(q) {
    q = q.toLowerCase(); if (q.length < 2) return [];
    const out = [];
    traders().filter((t) => t.name.toLowerCase().includes(q)).slice(0, 4).forEach((t) => out.push(['trader', t.name, 'Trader', `${t.accts.length} accounts`]));
    ACCTS.filter((a) => a.id.toLowerCase().includes(q)).slice(0, 4).forEach((a) => out.push(['acct', a.id, 'Account', a.trader]));
    ALERTS.filter((x) => (x.id + ATYPE[x.type]).toLowerCase().includes(q)).slice(0, 3).forEach((x) => out.push(['alert', x.id, 'Alert', ATYPE[x.type]]));
    PAYOUTS.filter((p) => p.id.toLowerCase().includes(q)).slice(0, 3).forEach((p) => out.push(['payout', p.id, 'Payout', money(p.amt)]));
    CASES.filter((c) => (c.id + c.title).toLowerCase().includes(q)).slice(0, 3).forEach((c) => out.push(['case', c.id, 'Case', c.title]));
    return out.slice(0, 9);
  }

  // ---------- ext events ----------
  function extDrawer(kind, id) { return kind === 'trader' ? traderDrawer(id) : kind === 'case' ? caseDrawer(id) : kind === 'cb' ? cbDrawer(id) : kind === 'adj' ? adjDrawer() : null; }
  function extClick(a, el) {
    const id = el.dataset.id, k = el.dataset.k, i = +el.dataset.i; const v = (sel) => { const x = root.querySelector(sel); return x ? x.value.trim() : ''; };
    switch (a) {
      case 'trader': S.drawer = { kind: 'trader', id }; S.gq = ''; return true;
      case 'case': S.drawer = { kind: 'case', id }; S.gq = ''; return true;
      case 'cb': S.drawer = { kind: 'cb', id }; return true;
      case 'tDo': {
        if (k === 'watch') { const j = WATCH.findIndex((w) => w.who === id); if (j >= 0) WATCH.splice(j, 1); else WATCH.unshift({ who: id, acct: (traders().find((t) => t.name === id) || { accts: [{}] }).accts[0].id, why: 'Added from the profile', until: 'Dec 22', by: ME, ping: true }); audit(ME, j >= 0 ? 'Removed from watchlist' : 'Added to watchlist', id); toast(j >= 0 ? 'Removed from the watchlist' : 'Watching. You get a ping on their next trade.'); return 'noRender'; }
        if (k === 'restrict') { TSTATE[id] = TSTATE[id] === 'Restricted' ? undefined : 'Restricted'; audit(ME, TSTATE[id] ? 'Purchases restricted' : 'Restriction lifted', id); toast(TSTATE[id] ? `${id} can't buy new accounts. Open accounts keep trading.` : 'Restriction lifted'); return 'noRender'; }
        if (k === 'ban') { if (TSTATE[id] === 'Banned') { TSTATE[id] = undefined; audit(ME, 'Ban lifted', id); toast('Ban lifted'); return 'noRender'; } TSTATE[id] = 'Banned'; BLOCKS.unshift({ k: 'Identity Document', v: `Document of ${id}`, why: 'Banned trader', by: ME, d: 'Nov 22' }); audit(ME, 'Trader banned', `${id} · waiting for ${RV2} to confirm`); toast(`${id} banned. Identity added to the Blocklist. ${RV2} is asked to confirm.`); return 'noRender'; }
        if (k === 'case') { const cid = 'CS-' + (89 + CASES.length - 3); CASES.unshift({ id: cid, title: `Review of ${id}`, st: 'open', owner: ME, opened: 'Nov 22', due: 'Nov 25', traders: [id], alerts: ALERTS.filter((x) => x.traders.includes(id)).map((x) => x.id), log: [['Just now', ME, 'Case opened from the trader profile.']], decision: '' }); audit(ME, 'Case opened', cid); S.drawer = { kind: 'case', id: cid }; return true; }
        return false; }
      case 'newCase': { const cid = 'CS-' + (89 + CASES.length - 3); CASES.unshift({ id: cid, title: '[New Case]', st: 'open', owner: ME, opened: 'Nov 22', due: 'Nov 25', traders: [], alerts: [], log: [['Just now', ME, 'Case opened.']], decision: '' }); S.drawer = { kind: 'case', id: cid }; return true; }
      case 'caseNote': { const t = v('#cnote'); if (!t) { toast('Write something first'); return 'noRender'; } CASES.find((c) => c.id === id).log.push(['Just now', ME, t]); return true; }
      case 'caseDecide': { const c = CASES.find((x) => x.id === id); const d = v('#cdec'); c.decision = d; c.log.push(['Just now', ME, 'Decision: ' + d]); if (/Close|Ban/.test(d)) { c.st = 'second'; toast(`Sent to ${RV2} to confirm`); } else { c.st = 'decided'; toast('Decision recorded'); } audit(ME, 'Case decision', `${c.id} · ${d}`); return true; }
      case 'caseConfirm': { const c = CASES.find((x) => x.id === id); c.st = 'decided'; c.log.push(['Just now', RV2, 'Confirmed the decision.']); audit(`${ME} and ${RV2}`, 'Case decided', `${c.id} · ${c.decision}`); toast('Confirmed and carried out'); return true; }
      case 'tMatch': S.tf.sel = S.tf.sel === i ? null : i; return true;
      case 'tAlert': { const sel = TRADES[S.tf.sel]; const ms = TRADES.filter((t) => t !== sel && t.s === sel.s && t.trader !== sel.trader && Math.abs(t.sec - sel.sec) <= S.tf.win); const nid = 'RK-' + (1183 + ALERTS.length - 12); ALERTS.unshift({ id: nid, type: 'copy', sev: 'high', st: 'new', when: 'Just now', ag: ME, accts: [...new Set([sel.acct, ...ms.map((t) => t.acct)])], traders: [...new Set([sel.trader, ...ms.map((t) => t.trader)])], sum: `Raised by hand from Trade Search: ${ms.length + 1} ${sel.s} trades within ${S.tf.win}s at ${hms(sel.sec)}.`, ev: { h: ['Time ET', 'Trader', 'Trade'], rows: [sel, ...ms].map((t) => [hms(t.sec), t.trader, `${t.side} ${t.q} ${t.s}`]) }, rec: 'Check whether these traders match on other days too.' }); audit(ME, 'Alert raised by hand', nid); toast(`${nid} raised`); return true; }
      case 'wPing': WATCH[i].ping = !WATCH[i].ping; return true;
      case 'wDel': { const w = WATCH.splice(i, 1)[0]; audit(ME, 'Removed from watchlist', w.who); return true; }
      case 'kill': { SWITCHES[k] = !SWITCHES[k]; const n = { trading: 'Pause New Trades Everywhere', freeze: 'Freeze Automatic Closures', payouts: 'Pause Payouts', sales: 'Pause New Sales' }[k]; audit(ME, `${n} ${SWITCHES[k] ? 'turned on' : 'turned off'}`, 'Emergency switch'); toast(`${n}: ${SWITCHES[k] ? 'on. The team has been told.' : 'off'}`); return 'noRender'; }
      case 'newsFlat': NEWS[i].flat = !NEWS[i].flat; audit(ME, 'News rule changed', `${NEWS[i].e} · must be flat ${NEWS[i].flat ? 'on' : 'off'}`); return true;
      case 'newsWarn': NEWS[i].warned = true; audit(ME, 'News email sent', NEWS[i].e); toast('High-Impact News email sent to traders in these markets'); return 'noRender';
      case 'newsAdd': NEWS.push({ d: 'Fri, Nov 27', t: '8:30 AM', e: '[New Event]', mk: 'All', imp: 'high', flat: false, warned: false }); toast('Event added. Edit it in the calendar feed settings.'); return 'noRender';
      case 'cbDo': { const c = CHARGEBACKS.find((x) => x.id === id); if (k === 'pack') { toast('Evidence pack downloaded as a PDF'); return 'noRender'; } if (k === 'accept') { c.st = 'accepted'; audit(ME, 'Chargeback accepted', `${c.id} · ${money(c.amt)}`); } else { const n = Object.values(c.ev).filter(Boolean).length; if (n < 3) { toast('Add at least 3 pieces of evidence'); return 'noRender'; } c.st = 'submitted'; audit(ME, 'Chargeback evidence submitted', `${c.id} · ${n} items`); } S.drawer = null; toast(c.st === 'submitted' ? 'Submitted. The processor decides in 30 to 75 days.' : 'Accepted. The card is on the Blocklist.'); return 'noRender'; }
      case 'newAdj': S.drawer = { kind: 'adj', f: { acct: ACCTS[0].id, amt: 0, why: '' } }; return true;
      case 'adjSave': { const f = S.drawer.f; if (!+f.amt || !f.why.trim()) { toast('Add an amount and a reason'); return 'noRender'; } const a = acct(f.acct); ADJ.unshift({ id: 'AJ-' + (62 + ADJ.length - 3), acct: f.acct, trader: a.trader, amt: +f.amt, why: f.why, st: 'second', by: ME, when: 'Just now' }); audit(ME, 'Adjustment requested', `${f.acct} · ${money(+f.amt, 1)}`); S.drawer = null; toast(`Sent to ${RV2} to approve`); return true; }
      case 'adjOk': { const x = ADJ.find((z) => z.id === id); x.st = 'done'; x.by = `${x.by} and ${RV2}`; const a = acct(x.acct); if (a) { a.bal += x.amt; a.total += x.amt; } audit(x.by, 'Adjustment applied', `${x.acct} · ${money(x.amt, 1)}`); toast('Applied. The trader sees it on their dashboard.'); return 'noRender'; }
      case 'simReset': { const b = RULES[S.sim.size]; S.sim = { size: S.sim.size, daily: b.daily, dd: b.dd, target: b.target, cons: 40, days: 5 }; return true; }
      case 'simSend': audit(ME, 'Rule change sent to the catalog', `${K(+S.sim.size)} · daily ${money(S.sim.daily)}, drawdown ${money(S.sim.dd)}, target ${money(S.sim.target)}`); toast('Draft rule set created in the Checkout Catalog. It needs approval there.'); return 'noRender';
      case 'watchAcct': { const ac = acct(id); if (!WATCH.some((w) => w.who === ac.trader)) WATCH.unshift({ who: ac.trader, acct: ac.id, why: 'Added from the account', until: 'Dec 22', by: ME, ping: true }); audit(ME, 'Added to watchlist', ac.trader); toast(`Watching ${ac.trader}`); return 'noRender'; }
      case 'bulk': { const ids = [...(S.bsel || [])]; ids.forEach((x) => { const ac = acct(x); if (!ac) return; if (k === 'pause') ac.st = 'Paused'; if (k === 'flatten') ac.open = 0; if (k === 'watch' && !WATCH.some((w) => w.who === ac.trader)) WATCH.unshift({ who: ac.trader, acct: ac.id, why: 'Added in bulk', until: 'Dec 22', by: ME, ping: true }); }); audit(ME, { pause: 'Trading paused', flatten: 'Positions flattened', watch: 'Added to watchlist' }[k], `${ids.length} accounts`); S.bsel = new Set(); toast(`${ids.length} accounts updated`); return true; }
      case 'bclear': S.bsel = new Set(); return true;
      case 'gopen': { const [kind, oid] = [el.dataset.k, id]; S.gq = ''; S.drawer = { kind, id: oid }; return true; }
      default: return false;
    }
  }
  function extChange(el) {
    const b = el.dataset.bind;
    if (el.dataset.cbev) { const c = CHARGEBACKS.find((x) => x.id === S.drawer.id); c.ev[el.dataset.cbev] = el.checked; return true; }
    if (el.dataset.bsel) { S.bsel = S.bsel || new Set(); if (el.checked) S.bsel.add(el.dataset.bsel); else S.bsel.delete(el.dataset.bsel); return true; }
    if (!b) return false;
    if (b.startsWith('tf.')) { S.tf[b.slice(3)] = el.value; if (b === 'tf.win') S.tf.win = +el.value; return true; }
    if (b.startsWith('sim.')) { S.sim[b.slice(4)] = +el.value; if (b === 'sim.size') { const R0 = RULES[+el.value]; Object.assign(S.sim, { daily: R0.daily, dd: R0.dd, target: R0.target }); } return true; }
    return false;
  }
