  // ===== Fraud and Multi-Accounting =====
  const CL = [
    { id: 'CL-44', st: 'new', why: 'Same device and IP', who: ['Lucas P.', 'Hana K.', 'Felix B.'], sig: ['dev7c02', 'ip91'], pay: 0, open: 3, alert: '', first: 'Today' },
    { id: 'CL-41', st: 'open', why: 'Same trades within 2 seconds', who: ['Omar H.', 'Marcus T.', 'Chen W.'], sig: ['trA7', 'ip185'], pay: 4210, open: 3, alert: 'RK-1181', first: 'Nov 19' },
    { id: 'CL-38', st: 'open', why: 'Same card and crypto wallet', who: ['Ivan P.', 'Zoe A.'], sig: ['card4417', 'wal9f'], pay: 2980, open: 2, alert: 'RK-1179', first: 'Nov 17' },
    { id: 'CL-36', st: 'open', why: 'Same ID document', who: ['Theo M.', '[Second Sign-Up]'], sig: ['doc821'], pay: 7650, open: 2, alert: 'RK-1158', first: 'Nov 12' },
    { id: 'CL-33', st: 'household', why: 'Same home internet', who: ['Priya S.', 'Kenji M.', 'Arjun R.', 'Aisha N.'], sig: ['ip73'], pay: 2140, open: 4, alert: 'RK-1176', first: 'Nov 8' },
    { id: 'CL-29', st: 'allowed', why: 'Same address', who: ['Mateo G.', 'Maya C.'], sig: ['addr1'], pay: 0, open: 2, alert: '', first: 'Nov 3', note: 'Married couple, documents checked Nov 3.' }
  ];
  const SIG = { dev7c02: ['Device 7c02', 'device', 'Windows laptop · Chrome', 'Today'], ip91: ['IP 91.204.x.x', 'ip', 'VPN · Netherlands', 'Today'], trA7: ['Trade Pattern A7', 'device', 'Same entries within 2 s, 41 times', 'Nov 19'], ip185: ['IP 185.22.x.x', 'ip', 'Data center · Germany', 'Nov 19'],
    card4417: ['Card •••• 4417', 'card', 'Visa · issued in Serbia', 'Nov 17'], wal9f: ['Wallet 0x9f…2c', 'card', 'USDT payout wallet', 'Nov 17'], doc821: ['Passport •••821', 'addr', 'Same document number', 'Nov 12'], ip73: ['IP 73.48.x.x', 'ip', 'Home internet · Pune', 'Nov 8'], addr1: ['[Shared Address]', 'addr', 'Same street address', 'Nov 3'] };
  const SKIND = { device: 'Device', ip: 'IP Address', card: 'Payment Method', addr: 'Identity or Address' };
  const WTS = [['Same ID Document', 95], ['Same Card or Wallet', 80], ['Same Device', 70], ['Same Trades Within 5 s', 85], ['Same IP, Data Center or VPN', 55], ['Same IP, Home Internet', 25], ['Same Address', 30], ['Sign-Ups Within 1 Hour', 20]];
  const DEC = [['Today, 2:14 PM', 'CL-38', 'Payouts held for both traders', ME], ['Nov 21', 'CL-33', 'Marked as household. Payouts allowed, one funded account each.', RV2], ['Nov 18', 'CL-27', 'Banned 3 accounts. $5,120 in payouts refused.', ME], ['Nov 14', 'CL-25', 'False alarm: shared office internet', RV2], ['Nov 3', 'CL-29', 'Allowed: married couple, documents checked', ME]];
  Object.assign(S, { cl: 'all', sel: null, thr: 60 });
  const trId = (n) => 't:' + n;
  const nodesFor = (list) => { const N = [], Ed = [], seen = new Set();
    list.forEach((c) => { c.who.forEach((w) => { if (!seen.has(trId(w))) { seen.add(trId(w)); N.push({ id: trId(w), n: w, t: 'trader', flag: c.st === 'open' || c.st === 'new' ? 'flag' : c.st === 'household' ? 'warn' : '' }); } });
      c.sig.forEach((s) => { if (!seen.has(s)) { seen.add(s); N.push({ id: s, n: SIG[s][0], t: SIG[s][1], flag: c.st === 'open' || c.st === 'new' ? 'flag' : '' }); } c.who.forEach((w) => Ed.push([trId(w), s])); }); });
    return [N, Ed]; };
  const curCl = () => (S.cl === 'all' ? CL : CL.filter((c) => c.id === S.cl));
  const clOf = (nodeId) => CL.find((c) => c.who.some((w) => trId(w) === nodeId) || c.sig.includes(nodeId));
  const stB = (st) => (st === 'new' ? b('New', 'err') : st === 'open' ? b('Open', 'err') : st === 'household' ? b('Household', 'draft') : st === 'banned' ? b('Banned', 'ended') : b('Allowed', 'live'));
  const atRisk = () => CL.filter((c) => c.st === 'open' || c.st === 'new').reduce((a, c) => a + c.pay, 0);
  function side() {
    const c = S.sel ? clOf(S.sel) : S.cl !== 'all' ? CL.find((x) => x.id === S.cl) : null;
    if (!c) return card('How to Read This', '', cb(`<p class="hint" style="margin:0 0 12px">Circles are traders. Squares are the things they share: devices, IP addresses, cards, wallets and documents. A line means a trader used that thing.</p><div class="vzleg" style="flex-direction:column;gap:8px"><span><i style="background:var(--no)"></i>Open: needs a decision</span><span><i style="background:var(--wa)"></i>Household: allowed with limits</span><span><i></i>Allowed</span></div><p class="hint" style="margin:14px 0 0">Click any circle or square to see the group.</p>`));
    const isT = S.sel && S.sel.startsWith('t:'); const sigInfo = S.sel && !isT ? SIG[S.sel] : null;
    return card(c.id, '', cb(`<div class="r" style="gap:8px;margin-bottom:12px">${stB(c.st)}<span class="hint">${esc(c.why)} · since ${c.first}</span></div>
      ${sigInfo ? `<div class="kv" style="margin-bottom:12px"><div><span>${SKIND[sigInfo[1]]}</span><b>${esc(sigInfo[0])}</b></div><div><span>Details</span><b>${esc(sigInfo[2])}</b></div></div>` : ''}
      ${kv([['Traders', c.who.length], ['Payouts at Stake', money(c.pay)], ['Shared', c.sig.map((s) => esc(SIG[s][0])).join(', ')]])}
      <h4 class="sh" style="margin:16px 0 6px">Traders</h4><div class="vzrank">${c.who.map((w, i) => `<div><em>${i + 1}</em><span>${w.startsWith('[') ? esc(w) : UL(w)}</span>${w.startsWith('[') ? '<span class="hint">Not verified</span>' : XL('Users', 'user?name=' + encodeURIComponent(w) + '&tab=links', 'Links', 'lnk')}</div>`).join('')}</div>
      ${c.note ? `<p class="hint" style="margin:12px 0 0">${esc(c.note)}</p>` : ''}
      <div class="r" style="gap:8px;margin-top:16px;flex-wrap:wrap">${c.st === 'open' || c.st === 'new' ? `<button class="pill dng sm" data-act="ban" data-id="${c.id}">Ban Group</button><button class="pill sm" data-act="household" data-id="${c.id}">Household</button><button class="pill sm" data-act="allow" data-id="${c.id}">Allow</button>` : ''}${c.alert ? XL('Risk', 'links', 'Open in Risk', 'pill sm') : ''}${XL('Risk', 'payouts', 'Payouts', 'pill sm')}</div>`));
  }
  function vNetwork() { const [N, Ed] = nodesFor(curCl());
    return `${ph('Network Map', 'Traders who share a device, IP address, card, wallet or document. Groups are found on every sign-up, purchase and payout request.')}
      ${tiles([['Open Groups', CL.filter((c) => c.st === 'open' || c.st === 'new').length, 'Need a decision', 'warn'], ['Traders Linked', CL.reduce((a, c) => a + c.who.length, 0), 'Across all groups'], ['Payouts at Stake', money(atRisk()), 'Held until decided'], ['Blocked Today', 7, 'Sign-ups stopped at checkout', '', 'signals']])}
      <div class="vzchips">${[['all', 'All Groups']].concat(CL.map((c) => [c.id, c.id])).map(([v, l]) => `<button class="${S.cl === v ? 'on' : ''}" data-act="cl" data-k="${v}">${l}${v !== 'all' && (CL.find((c) => c.id === v).st === 'new') ? ' · New' : ''}</button>`).join('')}</div>
      <div class="two wl" style="grid-template-columns:minmax(0,1.7fr) minmax(300px,1fr)">${card(S.cl === 'all' ? 'All Linked Traders' : S.cl, `${N.filter((n) => n.t === 'trader').length} traders · ${N.filter((n) => n.t !== 'trader').length} shared things`, `<div class="cb" style="padding:8px">${VZ.graph('g-' + S.cl, N, Ed, { act: 'node', sel: S.sel, h: S.cl === 'all' ? 520 : 360, label: 'Linked accounts network' })}</div>`)}${side()}</div>`; }
  function vSignals() { const rows = Object.entries(SIG).map(([k, s]) => { const c = clOf(k); return [k, s, c]; });
    return `${ph('Shared Signals', `Things used by more than one trader. Blocking one stops it at checkout and sign-up. The full blocklist is in ${XL('Risk', 'blocks', 'Risk')}.`)}
      <div class="card m0">${table(['Signal', 'Type', 'Details', 'Traders', 'Group', 'First Seen', ''], rows.map(([k, s, c]) => [`<b>${esc(s[0])}</b>`, `<span class="hint">${SKIND[s[1]]}</span>`, `<span class="hint">${esc(s[2])}</span>`, c.who.map((w) => (w.startsWith('[') ? esc(w) : UL(w))).join(', '), `<button class="lnk" data-act="cl" data-k="${c.id}">${c.id}</button>`, `<span class="hint">${s[3]}</span>`, S.blocked && S.blocked[k] ? b('Blocked', 'ended') : `<button class="pill sm" data-act="block" data-id="${k}">Block</button>`]))}</div>`; }
  function vVelocity() { const g = rng('vel'); const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; const hrs = Array.from({ length: 24 }, (_, h) => (h % 12 || 12) + (h < 12 ? 'a' : 'p'));
    const m = days.map((d, i) => hrs.map((_, h) => Math.round((h > 1 && h < 6 ? 6 : 1.5) * g() * (i === 6 ? 2 : 1))));
    const flagged = series30('flg', 9, 0.4, 0.5);
    return `${ph('Sign-Up Velocity', 'Many sign-ups from one place in a short time is the most common sign of multi-accounting.')}
      <div class="two">${card('Flagged Sign-Ups', 'Last 30 days', cb(lineChart('flg', days30, [{ name: 'Flagged', v: flagged }], (v) => num(v), { h: 200 })))}${card('Where Flagged Sign-Ups Come From', 'Last 30 days', cb(VZ.map([{ n: 'Netherlands', v: 41, c: 'var(--no)' }, { n: 'Germany', v: 33, c: 'var(--no)' }, { n: 'Serbia', v: 0 }, { n: 'India', v: 28, c: 'var(--wa)' }, { n: 'Nigeria', v: 22, c: 'var(--wa)' }, { n: 'United States', v: 14 }, { n: 'Brazil', v: 11 }, { n: 'Turkey', v: 9 }, { n: 'Philippines', v: 8 }], { label: 'Flagged sign-ups by country' }) + '<div class="vzleg" style="margin-top:10px"><span><i style="background:var(--no)"></i>Mostly VPN or data center</span><span><i style="background:var(--wa)"></i>Mostly shared home internet</span><span><i></i>Other</span></div>'))}</div>
      ${card('When Flagged Sign-Ups Happen', 'Eastern Time · last 4 weeks', cb(VZ.heat(days, hrs, m, (v) => v + ' sign-ups', { skip: 3 })), '', 'mt14')}`; }
  function vWeights() { const sc = (c) => Math.min(100, Math.max(...c.sig.map((s) => ({ device: 70, ip: c.st === 'household' ? 25 : 55, card: 80, addr: s === 'doc821' ? 95 : 30 })[SIG[s][1]] || 0)) + (c.who.length > 2 ? 10 : 0));
    const would = CL.filter((c) => sc(c) >= S.thr).length;
    return `${ph('Signal Weights', 'How strongly each shared thing counts. Groups above the line are flagged for a person to review.')}
      <div class="two">${card('Weights', '', cb(`<div class="fg">${WTS.map(([n, w], k) => `<div class="srow"><span>${n}</span><span class="il"><input type="range" min="0" max="100" value="${w}" data-act="wt" data-k="${k}" aria-label="${n} weight" style="width:160px"><b style="width:30px;text-align:right">${w}</b></span></div>`).join('')}</div>`))}
      ${card('Flag Line', '', cb(`<div class="gline">${VZ.gauge(S.thr, S.thr, 'Flag at this score', { c: 'var(--sky)' })}<div><p style="margin:0 0 6px">At ${S.thr}, <b>${would} of ${CL.length}</b> current groups would be flagged.</p><p class="hint" style="margin:0">Lower catches more, but more households get flagged.</p></div></div><div class="fl" style="margin-top:16px"><label for="thr">Score</label><input id="thr" type="range" min="20" max="95" value="${S.thr}" data-bind="thr" aria-label="Flag score"></div><button class="pill pri" style="margin-top:12px" data-act="saveW">Save Weights</button>`))}</div>`; }
  function vDecisions() { return `${ph('Decisions', `Every decision on a group, with who made it. Bans also appear in the ${XL('Team', 'audit', 'audit log')}.`)}
      <div class="card m0">${table(['When', 'Group', 'Decision', 'By'], DEC.map((d) => [`<span class="hint nw">${d[0]}</span>`, CL.some((c) => c.id === d[1]) ? `<button class="lnk" data-act="cl" data-k="${d[1]}">${d[1]}</button>` : d[1], d[2], esc(d[3])]))}</div>`; }
  const decide = (id, st, what) => { const c = CL.find((x) => x.id === id); c.st = st; DEC.unshift(['Just now', id, what, ME]); audit('Linked Accounts', `${id}: ${what}`); toast(`${id}: ${what}`); };
  const APP = { title: 'Fraud and Multi-Accounting', stats: () => [['Open Groups', CL.filter((c) => c.st === 'open' || c.st === 'new').length, 'warnt'], ['Payouts at Stake', money(atRisk())], ['Blocked Today', 7]],
    areas: [{ h: 'Investigate' }, { id: 'net', n: 'Network Map', b: () => CL.filter((c) => c.st === 'open' || c.st === 'new').length || null, bad: true, tabs: [['network', 'Network Map']] }, { id: 'sig', n: 'Signals', tabs: [['signals', 'Shared Signals'], ['velocity', 'Sign-Up Velocity']] }, { h: 'Setup' }, { id: 'wt', n: 'Signal Weights', tabs: [['weights', 'Signal Weights']] }, { id: 'dec', n: 'Decisions', tabs: [['decisions', 'Decisions']] }],
    views: { network: vNetwork, signals: vSignals, velocity: vVelocity, weights: vWeights, decisions: vDecisions },
    click: (a, el, id, k) => { switch (a) {
      case 'cl': S.cl = k; S.sel = null; S.view = 'network'; return 1;
      case 'node': S.sel = S.sel === id ? null : id; return 1;
      case 'ban': decide(id, 'banned', 'Banned group. Open payouts refused.'); return 0;
      case 'household': decide(id, 'household', 'Marked as household. One funded account each.'); return 0;
      case 'allow': decide(id, 'allowed', 'Allowed after review.'); return 0;
      case 'block': { S.blocked = S.blocked || {}; S.blocked[id] = true; audit('Signal Blocked', SIG[id][0]); toast(`${SIG[id][0]} blocked at sign-up and checkout`); return 0; }
      case 'saveW': audit('Signal Weights Changed', 'Flag at ' + S.thr); toast('Weights saved. New sign-ups use them now.'); return 0;
      default: return 0; } },
    change: (el) => { if (el.dataset.act === 'wt') { WTS[+el.dataset.k][1] = +el.value; return true; } return false; },
    route: (hv, P) => { if (P.cl) { S.cl = P.cl; S.view = 'network'; } },
    drawer: () => null };
