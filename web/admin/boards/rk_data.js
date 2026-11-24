  const ME = '[Your Name]';
  const RV2 = '[Risk Reviewer]';
  const rng = (seed) => { let h = 2166136261; for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; };
  const RULES = { 25000: { target: 1500, daily: 500, dd: 1500, max: 3 }, 50000: { target: 3000, daily: 1100, dd: 2500, max: 5 }, 100000: { target: 6000, daily: 2200, dd: 3000, max: 10 }, 150000: { target: 9000, daily: 3300, dd: 4500, max: 15 } };
  const PLANS = [['pa', '[Plan A Name]', [25000, 50000]], ['pb', '[Plan B Name]', [50000, 100000, 150000]], ['pc', '[Plan C Name]', [25000, 50000, 100000]]];
  const PLATS = ['Tradovate', 'NinjaTrader', 'TradingView', 'Rithmic'];
  const NAMES = ['Jane D.', 'Marcus T.', 'Priya S.', 'Diego R.', 'Amara O.', 'Kenji M.', 'Sofia L.', 'Liam K.', 'Noah B.', 'Elena V.', 'Omar H.', 'Chen W.', 'Lucas P.', 'Hana K.', 'Ivan P.', 'Zoe A.', 'Mateo G.', 'Aisha N.', 'Felix B.', 'Grace T.', 'Arjun R.', 'Nina S.', 'Theo M.', 'Yara F.', 'Jonas E.', 'Maya C.'];
  const COUNTRIES = ['United States', 'United Kingdom', 'India', 'Mexico', 'Nigeria', 'Japan', 'Spain', 'Canada', 'Australia', 'Germany', 'UAE', 'Singapore', 'Brazil', 'South Korea', 'Poland', 'Poland', 'Argentina', 'Kenya', 'Netherlands', 'Philippines', 'India', 'Italy', 'Ireland', 'Turkey', 'Sweden', 'Chile'];

  // ---------- accounts ----------
  const ACCTS = (() => { const r = rng('accts'); const out = []; let n = 10380;
    for (let i = 0; i < 44; i++) {
      const [pid, pname, sizes] = PLANS[Math.floor(r() * 3)]; const size = sizes[Math.floor(r() * sizes.length)]; const R = RULES[size];
      const funded = r() < 0.27; const ti = (i * 7) % NAMES.length;
      const total = Math.round((r() * 1.9 - 0.75) * (funded ? R.target * 0.7 : R.target));
      const high = Math.max(0, total) + Math.round(r() * R.target * 0.25);
      let today = Math.round((r() * 1.5 - 0.95) * R.daily); if (i < 6) today = -Math.round(R.daily * (0.72 + r() * 0.24));
      const floor = size + high - R.dd; let bal = size + total; if (bal - floor < R.dd * 0.06) { bal = floor + Math.round(R.dd * (0.06 + r() * 0.1)); }
      const open = Math.floor(r() * (R.max + 1)); const best = Math.round(18 + r() * 44);
      const st = i === 9 || i === 23 ? 'Paused' : i === 31 ? 'Closed' : 'Active';
      out.push({ id: (funded ? 'FS-F-' : 'FS-') + size / 1000 + 'K-' + (funded ? 2100 + i : ++n), funded, plan: pname, pid, size, R, trader: NAMES[ti], tid: 'T' + (1043 - ti * 3), country: COUNTRIES[ti], plat: PLATS[Math.floor(r() * 4)], bal, total: bal - size, today, high, floor, open, best, st, days: 1 + Math.floor(r() * 14), notes: [] });
    }
    return out; })();
  const dailyUsed = (a) => Math.max(0, -a.today) / a.R.daily * 100;
  const ddUsed = (a) => Math.min(100, Math.max(0, (a.size + a.high - a.bal) / a.R.dd * 100));
  const score = (a) => Math.round(Math.min(99, Math.max(dailyUsed(a), ddUsed(a)) * 0.7 + (a.open / a.R.max) * 18 + (a.best > 40 && a.funded ? 10 : 0) + (ALERTS_BY_ACCT[a.id] || 0) * 12));
  const ALERTS_BY_ACCT = {};

  // ---------- detectors ----------
  const DETECTORS = [
    { id: 'hedge', n: 'Hedging Across Accounts', d: 'Opposite positions in the same market on two accounts, opened close together.', th: [['Seconds Apart', 5], ['Times in 7 Days', 3]], sev: 'high', act: 'hold', on: true, hits: 14, conf: 79 },
    { id: 'copy', n: 'Copy Trading Between Traders', d: "Different traders placing the same trades within seconds of each other.", th: [['Seconds Apart', 3], ['Matching Trades', 10]], sev: 'high', act: 'hold', on: true, hits: 9, conf: 67 },
    { id: 'group', n: 'Group Trading', d: 'Three or more traders opening the same trade in the same few seconds, again and again.', th: [['Traders', 3], ['Seconds Apart', 5]], sev: 'high', act: 'alert', on: true, hits: 4, conf: 75 },
    { id: 'share', n: 'Shared Device or IP', d: "Two traders signing in from the same device or home IP address.", th: [['Shared Logins', 2]], sev: 'medium', act: 'alert', on: true, hits: 22, conf: 41 },
    { id: 'payment', n: 'Shared Card or Payout Wallet', d: 'The same card pays for, or the same wallet receives payouts for, different traders.', th: [['Traders', 2]], sev: 'high', act: 'hold', on: true, hits: 6, conf: 83 },
    { id: 'hft', n: 'Very Short Holds', d: 'Most trades held only a few seconds, which can exploit price delays on the simulator.', th: [['Hold Under (Seconds)', 5], ['Share of Trades (%)', 60]], sev: 'medium', act: 'alert', on: true, hits: 11, conf: 55 },
    { id: 'news', n: 'News Window Trade', d: 'A trade opened or closed within 2 minutes of a high-impact release.', th: [['Minutes Each Side', 2]], sev: 'medium', act: 'alert', on: true, hits: 31, conf: 88 },
    { id: 'contracts', n: 'Over Max Contracts', d: "More open contracts than the account's rule set allows.", th: [['Grace Period (Seconds)', 0]], sev: 'high', act: 'close', on: true, hits: 7, conf: 100 },
    { id: 'martingale', n: 'Doubling After Losses', d: 'Position size doubled after each loss, three or more times in a row.', th: [['Doublings in a Row', 3]], sev: 'medium', act: 'alert', on: true, hits: 5, conf: 60 },
    { id: 'allin', n: 'Max Size on Every Trade', d: 'Nearly every trade at the maximum contracts, a sign of gambling rather than a strategy.', th: [['Share at Max Size (%)', 80]], sev: 'low', act: 'alert', on: true, hits: 18, conf: 39 },
    { id: 'consistency', n: 'One Day Carries the Profit', d: 'A single day is more than the allowed share of total profit on a funded account.', th: [['Best Day Share (%)', 40]], sev: 'low', act: 'hold', on: true, hits: 26, conf: 92 },
    { id: 'vpn', n: 'Country Mismatch or VPN', d: "Sign-in or checkout country doesn't match the identity check, or comes through a VPN.", th: [['Mismatched Sign-Ins', 2]], sev: 'medium', act: 'alert', on: true, hits: 13, conf: 46 },
    { id: 'multi', n: 'Over the Account Limit', d: 'One person holding more active evaluations or funded accounts than allowed, across sign-ups.', th: [['Max Evaluations', 5], ['Max Funded', 3]], sev: 'high', act: 'hold', on: true, hits: 3, conf: 100 },
    { id: 'weekend', n: 'Held Over the Weekend', d: 'A position still open at Friday close.', th: [['Minutes After Close', 0]], sev: 'medium', act: 'close', on: true, hits: 8, conf: 100 },
    { id: 'chargeback', n: 'Chargeback Risk', d: 'Payment signals that often end in a chargeback: new card, mismatched country, several cards tried.', th: [['Cards Tried', 3]], sev: 'medium', act: 'alert', on: true, hits: 10, conf: 52 },
    { id: 'payoutpat', n: 'Payout Right After Passing', d: 'A funded account requests a payout on the first possible day with one large winning trade.', th: [['Share From One Trade (%)', 70]], sev: 'medium', act: 'hold', on: false, hits: 0, conf: 0 }
  ];
  const ACTS = { alert: 'Alert Only', hold: 'Hold Payouts', pause: 'Pause Trading', close: 'Close the Account' };
  const SEV = { high: ['High', 'err'], medium: ['Medium', 'draft'], low: ['Low', 'plain'] };

  // ---------- alerts ----------
  const ALERTS = [
    { id: 'RK-1182', type: 'hedge', sev: 'high', st: 'new', when: 'Today, 12:31 PM', ag: null, accts: ['FS-50K-10290', 'FS-50K-10291'], traders: ['Liam K.'], sum: 'Opposite NQ positions on two of his own accounts, opened 1 to 2 seconds apart, 6 times on Nov 20 and 4 times today.', ev: { h: ['Time ET', 'Account', 'Side', 'Qty', 'Price'], rows: [['12:30:41.204', 'FS-50K-10290', 'Buy', '2', '21,104.25'], ['12:30:42.018', 'FS-50K-10291', 'Sell', '2', '21,104.00'], ['12:34:10.551', 'FS-50K-10290', 'Sell', '2', '21,091.50'], ['12:34:10.902', 'FS-50K-10291', 'Buy', '2', '21,091.75']] }, rec: 'Confirm, close the losing account and hold payouts on the other. The prohibited strategy warning was already sent on Nov 20.' },
    { id: 'RK-1181', type: 'copy', sev: 'high', st: 'investigating', when: 'Today, 11:58 AM', ag: ME, accts: ['FS-100K-10405', 'FS-100K-10388', 'FS-F-50K-2131'], traders: ['Omar H.', 'Marcus T.', 'Chen W.'], sum: '41 matching ES trades across three traders, each within 1.4 seconds, over 5 days. Different countries, same order sizes.', ev: { h: ['Time ET', 'Omar H.', 'Marcus T.', 'Chen W.', 'Gap'], rows: [['09:42:03', 'Buy 2 ES', 'Buy 2 ES', 'Buy 4 ES', '0.8s'], ['09:58:47', 'Sell 2 ES', 'Sell 2 ES', 'Sell 4 ES', '1.1s'], ['10:20:12', 'Buy 2 ES', 'Buy 2 ES', 'Buy 4 ES', '1.4s'], ['11:05:39', 'Sell 2 ES', 'Sell 2 ES', 'Sell 4 ES', '0.9s']] }, rec: 'Likely a signal group or trade copier. Hold all payouts and ask each trader how they place trades.' },
    { id: 'RK-1179', type: 'payment', sev: 'high', st: 'new', when: 'Today, 10:14 AM', ag: null, accts: ['FS-25K-10412', 'FS-50K-10418'], traders: ['Ivan P.', 'Zoe A.'], sum: 'The same Visa ending 8841 paid for both traders, and both payout profiles point to the same USDC wallet.', ev: { h: ['Signal', 'Ivan P.', 'Zoe A.'], rows: [['Card', 'Visa ···8841', 'Visa ···8841'], ['Payout Wallet', '0x7a3…f19c', '0x7a3…f19c'], ['Device', 'Chrome · Windows', 'Safari · iPhone'], ['Country', 'Poland', 'Poland']] }, rec: 'Could be one person with two identities. Check the identity documents before any payout.' },
    { id: 'RK-1177', type: 'contracts', sev: 'high', st: 'confirmed', when: 'Today, 9:47 AM', ag: ME, accts: ['FS-25K-10310'], traders: ['Diego R.'], sum: '5 MNQ contracts open against a max of 3 for 38 seconds. The account was closed automatically.', ev: { h: ['Time ET', 'Event', 'Open Contracts', 'Max'], rows: [['09:46:58', 'Buy 3 MNQ', '3', '3'], ['09:47:02', 'Buy 2 MNQ', '5', '3'], ['09:47:40', 'Auto-closed', '0', '3']] }, rec: 'Closed by the rule. Nothing more to do unless the trader disputes it.' },
    { id: 'RK-1176', type: 'share', sev: 'medium', st: 'new', when: 'Today, 9:12 AM', ag: null, accts: ['FS-50K-10399', 'FS-25K-10421'], traders: ['Priya S.', 'Kenji M.'], sum: 'Both traders signed in from the same IP address 3 times this week. Different devices.', ev: { h: ['When', 'Trader', 'IP', 'Device'], rows: [['Nov 20, 8:02 PM', 'Priya S.', '103.21.x.x', 'Chrome · Mac'], ['Nov 20, 8:15 PM', 'Kenji M.', '103.21.x.x', 'Edge · Windows'], ['Nov 22, 7:40 AM', 'Priya S.', '103.21.x.x', 'Chrome · Mac']] }, rec: 'Often a shared office or university network. No trade overlap found. Dismiss unless trades start matching.' },
    { id: 'RK-1174', type: 'hft', sev: 'medium', st: 'new', when: 'Yesterday, 4:40 PM', ag: null, accts: ['FS-100K-10011'], traders: ['Sofia L.'], sum: '72% of 380 trades held under 4 seconds, mostly during fast markets.', ev: { h: ['Hold Time', 'Trades', 'Share', 'P&L'], rows: [['Under 2s', '161', '42%', '+$3,110'], ['2 to 5s', '113', '30%', '+$1,240'], ['Over 5s', '106', '28%', '−$300']] }, rec: 'Check whether profits depend on the simulator filling at stale prices before approving the funded account.' },
    { id: 'RK-1171', type: 'news', sev: 'medium', st: 'dismissed', when: 'Yesterday, 8:31 AM', ag: RV2, accts: ['FS-50K-10201'], traders: ['Marcus T.'], sum: 'Closed a CL position 40 seconds after the EIA release.', ev: { h: ['Time ET', 'Event'], rows: [['10:30:00', 'EIA Crude Inventories'], ['10:30:40', 'Sell 1 CL, closed']] }, rec: 'Dismissed: a stop order placed before the window. Stops that fill on their own are allowed.' },
    { id: 'RK-1169', type: 'martingale', sev: 'medium', st: 'investigating', when: 'Nov 21, 2:12 PM', ag: RV2, accts: ['FS-150K-10377'], traders: ['Felix B.'], sum: 'Size went 1, 2, 4, 8 contracts after three losses in a row, twice this week.', ev: { h: ['Trade', 'Size', 'Result'], rows: [['1', '1 ES', '−$212'], ['2', '2 ES', '−$450'], ['3', '4 ES', '−$875'], ['4', '8 ES', '+$1,610']] }, rec: 'Within the rules so far, but a breach is likely. Watch, and note it on any payout.' },
    { id: 'RK-1166', type: 'vpn', sev: 'medium', st: 'new', when: 'Nov 21, 11:05 AM', ag: null, accts: ['FS-50K-10398'], traders: ['Yara F.'], sum: 'Identity check from Brazil, but 9 of the last 10 sign-ins came through a VPN exit in the Netherlands.', ev: { h: ['When', 'Country', 'Network'], rows: [['Nov 21, 9:12 AM', 'Netherlands', 'VPN'], ['Nov 20, 6:40 PM', 'Netherlands', 'VPN'], ['Nov 2, 10:04 AM', 'Brazil', 'Home ISP']] }, rec: 'Ask the trader to sign in without the VPN before the next payout.' },
    { id: 'RK-1162', type: 'chargeback', sev: 'medium', st: 'new', when: 'Nov 20, 7:44 PM', ag: null, accts: ['FS-150K-10420'], traders: ['Nina S.'], sum: '4 different cards tried before a payment went through. Card country differs from sign-up country.', ev: { h: ['Try', 'Card', 'Country', 'Result'], rows: [['1', 'Mastercard ···2201', 'US', 'Declined'], ['2', 'Visa ···0912', 'US', 'Declined'], ['3', 'Visa ···7781', 'GB', 'Declined'], ['4', 'Visa ···4410', 'GB', 'Paid']] }, rec: 'Keep watching. If a chargeback arrives, the account closes automatically.' },
    { id: 'RK-1158', type: 'multi', sev: 'high', st: 'new', when: 'Nov 20, 1:20 PM', ag: null, accts: ['FS-F-50K-2107', 'FS-F-100K-2114', 'FS-F-50K-2120', 'FS-F-25K-2128'], traders: ['Theo M.', '[Second Sign-Up]'], sum: 'Four funded accounts across two sign-ups with the same identity document. The limit is 3 funded accounts per person.', ev: { h: ['Sign-Up', 'Email', 'Funded Accounts'], rows: [['Theo M.', 't***@gmail.com', '3'], ['[Second Sign-Up]', 't***@proton.me', '1']] }, rec: 'Close the newest funded account and merge the sign-ups.' },
    { id: 'RK-1155', type: 'weekend', sev: 'medium', st: 'confirmed', when: 'Nov 15, 5:01 PM', ag: ME, accts: ['FS-50K-10366'], traders: ['Hana K.'], sum: 'An NQ position was still open at Friday close and was closed automatically.', ev: { h: ['Time ET', 'Event'], rows: [['16:59:58', '1 NQ open'], ['17:00:00', 'Auto-closed at market close']] }, rec: 'Closed by the rule.' }
  ];
  ALERTS.filter((x) => ['new', 'investigating'].includes(x.st)).forEach((x) => x.accts.forEach((a) => { ALERTS_BY_ACCT[a] = (ALERTS_BY_ACCT[a] || 0) + 1; }));
  const ATYPE = Object.fromEntries(DETECTORS.map((d) => [d.id, d.n]));

  // ---------- payout reviews ----------
  const CHECKS = [['days', 'Minimum Trading Days Met'], ['consistency', 'Best Day 40% or Less of Profit'], ['rules', 'No Rule Broken on This Account'], ['kyc', 'Identity Verified'], ['agreement', 'Funded Agreement Signed'], ['tax', 'Tax Form on File'], ['alerts', 'No Open Risk Alerts'], ['device', 'Same Device and Country as Purchase'], ['copy', 'No Copy-Trading Match'], ['wallet', 'Payout Method Belongs to the Trader']];
  const PAYOUTS = [
    { id: 'PO-3321', trader: 'Jane D.', acct: 'FS-F-50K-2207', amt: 1840, split: 90, days: 9, req: 'Today, 10:12 AM', st: 'review', fail: [], warn: [] },
    { id: 'PO-3320', trader: 'Chen W.', acct: 'FS-F-50K-2131', amt: 4210, split: 90, days: 6, req: 'Today, 9:40 AM', st: 'review', fail: ['alerts', 'copy'], warn: [] },
    { id: 'PO-3318', trader: 'Sofia L.', acct: 'FS-F-100K-1984', amt: 6120, split: 90, days: 14, req: 'Today, 8:05 AM', st: 'review', fail: [], warn: ['consistency'] },
    { id: 'PO-3317', trader: 'Zoe A.', acct: 'FS-F-50K-2140', amt: 2980, split: 80, days: 5, req: 'Yesterday, 6:22 PM', st: 'hold', fail: ['wallet', 'alerts'], warn: ['device'], note: 'Same wallet as Ivan P. (RK-1179).' },
    { id: 'PO-3315', trader: 'Theo M.', acct: 'FS-F-100K-2114', amt: 7650, split: 90, days: 11, req: 'Yesterday, 3:10 PM', st: 'review', fail: ['alerts'], warn: [] },
    { id: 'PO-3314', trader: 'Grace T.', acct: 'FS-F-25K-2133', amt: 610, split: 90, days: 7, req: 'Yesterday, 1:02 PM', st: 'review', fail: [], warn: ['tax'] },
    { id: 'PO-3310', trader: 'Arjun R.', acct: 'FS-F-50K-2125', amt: 2140, split: 90, days: 12, req: 'Nov 21, 4:44 PM', st: 'approved', fail: [], warn: [], by: [ME] },
    { id: 'PO-3306', trader: 'Lucas P.', acct: 'FS-F-150K-2101', amt: 9300, split: 90, days: 15, req: 'Nov 20, 11:30 AM', st: 'approved', fail: [], warn: [], by: [ME, RV2] }
  ];

  // ---------- linked accounts ----------
  const CLUSTERS = [
    { id: 'CL-41', st: 'open', nodes: ['Omar H.', 'Marcus T.', 'Chen W.'], edges: [[0, 1, 'Same Trades'], [1, 2, 'Same Trades'], [0, 2, 'Same Trades']], payouts: 4210, alert: 'RK-1181' },
    { id: 'CL-38', st: 'open', nodes: ['Ivan P.', 'Zoe A.'], edges: [[0, 1, 'Card + Wallet']], payouts: 2980, alert: 'RK-1179' },
    { id: 'CL-36', st: 'open', nodes: ['Theo M.', '[Second Sign-Up]'], edges: [[0, 1, 'Same ID Document']], payouts: 7650, alert: 'RK-1158' },
    { id: 'CL-33', st: 'household', nodes: ['Priya S.', 'Kenji M.', 'Arjun R.', 'Aisha N.'], edges: [[0, 1, 'Same IP'], [0, 2, 'Same IP'], [2, 3, 'Same IP']], payouts: 2140, alert: 'RK-1176' },
    { id: 'CL-29', st: 'allowed', nodes: ['Mateo G.', 'Maya C.'], edges: [[0, 1, 'Same Address']], payouts: 0, note: 'Married couple, documents checked Nov 3.' }
  ];

  // ---------- breaches ----------
  const BREACHES = [
    ['Today, 12:02 PM', 'FS-50K-10414', 'Noah B.', 'Max Drawdown', '$47,412 vs floor $47,500', 'Auto-closed', ''],
    ['Today, 10:02 AM', 'FS-100K-10388', 'Marcus T.', 'Max Drawdown', '$96,912 vs floor $97,000', 'Auto-closed', 'Disputed · BR-212'],
    ['Today, 9:47 AM', 'FS-25K-10310', 'Diego R.', 'Over Max Contracts', '5 open vs max 3', 'Auto-closed', ''],
    ['Today, 9:31 AM', 'FS-50K-10357', 'Lucas P.', 'Daily Loss Limit', '−$1,140 vs −$1,100', 'Auto-closed', ''],
    ['Today, 9:30 AM', 'FS-25K-10402', 'Grace T.', 'Daily Loss Limit', '−$512 vs −$500', 'Auto-closed', ''],
    ['Yesterday, 3:58 PM', 'FS-150K-10370', 'Arjun R.', 'Max Drawdown', '$145,380 vs floor $145,500', 'Auto-closed', ''],
    ['Yesterday, 2:14 PM', 'FS-F-50K-2109', 'Nina S.', 'Daily Loss Limit', '−$1,160 vs −$1,100', 'Auto-closed', ''],
    ['Yesterday, 10:31 AM', 'FS-50K-10349', 'Jonas E.', 'News Window', 'Opened 30s after CPI', 'Closed by reviewer', ''],
    ['Yesterday, 9:33 AM', 'FS-100K-10360', 'Felix B.', 'Daily Loss Limit', '−$2,260 vs −$2,200', 'Auto-closed', ''],
    ['Nov 20, 4:59 PM', 'FS-50K-10366', 'Hana K.', 'Held Over Close', '1 NQ open at close', 'Auto-closed', ''],
    ['Nov 20, 11:20 AM', 'FS-25K-10333', 'Zoe A.', 'Max Drawdown', '$23,480 vs floor $23,500', 'Auto-closed', 'Disputed · Upheld'],
    ['Nov 20, 9:44 AM', 'FS-F-100K-2111', 'Maya C.', 'Max Drawdown', '$96,900 vs floor $97,000', 'Auto-closed', '']
  ];

  // ---------- blocklist, audit ----------
  const BLOCKS = [
    { k: 'Identity Document', v: 'Passport ···4471 (PL)', why: 'Two sign-ups, payout fraud', by: RV2, d: 'Nov 18' },
    { k: 'Payout Wallet', v: '0x9b1…c03e', why: 'Linked to 5 closed accounts', by: ME, d: 'Nov 14' },
    { k: 'Card', v: 'Visa ···5502', why: 'Chargeback', by: ME, d: 'Nov 11' },
    { k: 'Device', v: 'Device ID 8c2f…11a0', why: 'Copy trading group', by: RV2, d: 'Nov 9' },
    { k: 'Email', v: 'f***@tempmail.io', why: 'Disposable email', by: ME, d: 'Nov 6' },
    { k: 'IP Range', v: '185.220.x.x', why: 'Known VPN exit used for abuse', by: RV2, d: 'Oct 30' }
  ];
  const AUDIT = [
    ['Today, 12:31 PM', 'System', 'Alert RK-1182 raised', 'Hedging Across Accounts · FS-50K-10290, 10291'],
    ['Today, 12:02 PM', 'System', 'Account closed', 'FS-50K-10414 · Max Drawdown'],
    ['Today, 11:58 AM', ME, 'Took alert', 'RK-1181 · Copy Trading'],
    ['Today, 10:40 AM', ME, 'Payout held', 'PO-3317 · Zoe A. · $2,980'],
    ['Today, 9:47 AM', 'System', 'Account closed', 'FS-25K-10310 · Over Max Contracts'],
    ['Yesterday, 6:10 PM', RV2, 'Alert dismissed', 'RK-1171 · stop order filled on its own'],
    ['Yesterday, 2:30 PM', ME, 'Detection rule changed', 'Very Short Holds · threshold 3s → 5s'],
    ['Nov 21, 4:50 PM', ME, 'Payout approved', 'PO-3310 · Arjun R. · $2,140'],
    ['Nov 20, 11:35 AM', `${ME} and ${RV2}`, 'Payout approved', 'PO-3306 · Lucas P. · $9,300 · two approvals']
  ];

  // make sure every account named in alerts, payouts and breaches exists in the monitor
  (() => { const r = rng('ensure'); const add = (id, trader, closed) => { if (ACCTS.some((a) => a.id === id)) return; const m = id.match(/(\d+)K/); const size = m ? +m[1] * 1000 : 50000; const R = RULES[size] || RULES[50000]; const funded = id.startsWith('FS-F-');
      const total = Math.round((r() * 1.2 - 0.3) * R.target * (funded ? 0.8 : 1)); const high = Math.max(0, total) + Math.round(r() * R.target * 0.2); const ti = NAMES.indexOf(trader);
      const fl0 = size + high - R.dd; const b0 = Math.max(size + total, fl0 + Math.round(R.dd * 0.12)); ACCTS.push({ id, funded, plan: PLANS[1][1], pid: 'pb', size, R, trader, tid: 'T' + (1043 - Math.max(0, ti) * 3), country: COUNTRIES[Math.max(0, ti)] || 'United States', plat: PLATS[Math.floor(r() * 4)], bal: b0, total: b0 - size, today: Math.round((r() - 0.6) * R.daily * 0.8), high, floor: size + high - R.dd, open: Math.floor(r() * R.max), best: Math.round(20 + r() * 35), st: closed ? 'Closed' : 'Active', days: 3 + Math.floor(r() * 10), notes: [] }); };
    ALERTS.forEach((x) => x.accts.forEach((id, i) => add(id, x.traders[Math.min(i, x.traders.length - 1)], x.type === 'contracts' || x.type === 'weekend')));
    PAYOUTS.forEach((p) => add(p.acct, p.trader));
    PAYOUTS.find((p) => p.id === 'PO-3318').warn = ['consistency']; ACCTS.filter((a) => a.id === 'FS-F-100K-1984').forEach((a) => { a.best = 46; a.total = 6800; a.bal = a.size + 6800; });
    BREACHES.forEach((b) => add(b[1], b[2], true));
  })();
