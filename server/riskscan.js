// Risk detectors. Scans trades, sessions, payout methods, identities and payouts, and keeps alerts in kv store.risk.alerts.
// Each alert has a stable key so a re-scan updates it instead of making a new one; status set by staff is kept.
const db = require('./db');

const DEF = {
  hedge: { on: true, th: [5, 3], sev: 'high', act: 'hold' }, copy: { on: true, th: [3, 10], sev: 'high', act: 'hold' }, group: { on: true, th: [3, 5], sev: 'high', act: 'alert' },
  share: { on: true, th: [2], sev: 'medium', act: 'alert' }, payment: { on: true, th: [2], sev: 'high', act: 'hold' }, hft: { on: true, th: [1, 60], sev: 'medium', act: 'alert' },
  news: { on: true, th: [2], sev: 'medium', act: 'alert' }, contracts: { on: true, th: [0], sev: 'high', act: 'close' }, martingale: { on: true, th: [3], sev: 'medium', act: 'alert' },
  allin: { on: true, th: [80], sev: 'low', act: 'alert' }, consistency: { on: true, th: [40], sev: 'low', act: 'hold' }, vpn: { on: true, th: [1], sev: 'medium', act: 'alert' },
  multi: { on: true, th: [5, 3], sev: 'high', act: 'hold' }, weekend: { on: true, th: [0], sev: 'medium', act: 'close' }, chargeback: { on: true, th: [3], sev: 'medium', act: 'alert' }, payoutpat: { on: false, th: [70], sev: 'medium', act: 'hold' }
};
const kv = async (k) => ((await db.one('SELECT v FROM kv WHERE k=$1', [k])) || {}).v;
const put = (k, v) => db.q('INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT (k) DO UPDATE SET v=$2, updated_at=now()', [k, JSON.stringify(v)]);
const ET = (d) => new Date(new Date(d).toLocaleString('en-US', { timeZone: 'America/New_York' }));
const tET = (d) => new Date(d).toLocaleTimeString('en-US', { hour12: false, timeZone: 'America/New_York' });
const money = (v) => (v < 0 ? '−' : '+') + '$' + Math.abs(Math.round(v)).toLocaleString('en-US');
const short = (u) => `${u.first} ${(u.last || '').charAt(0)}.`;

async function scan() {
  const cfg = Object.assign({}, DEF, (await kv('store.risk.detectors')) || {});
  Object.keys(DEF).forEach((k) => { cfg[k] = Object.assign({}, DEF[k], cfg[k] || {}); });
  const since = new Date(Date.now() - 7 * 864e5);
  const [trades, accts, users, sess, methods, payouts, orders, content] = await Promise.all([
    db.all('SELECT t.account_id, t.ts, t.instrument, t.side, t.qty, t.pnl::float pnl, t.hold_min, a.user_id, a.size, a.plan, a.kind FROM trades t JOIN accounts a ON a.id=t.account_id WHERE t.ts > $1 ORDER BY t.ts', [since]),
    db.all('SELECT id, user_id, plan, size, kind, phase, start_bal::float start_bal, balance::float balance, funded_at, created_at, payout_count, rs FROM accounts'),
    db.all("SELECT id, first, last, email, country, kyc, role FROM users WHERE role='trader'"),
    db.all("SELECT s.user_id, s.ip, s.ua, s.created_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE u.role='trader'"),
    db.all('SELECT user_id, label, dest_hash FROM payout_methods'),
    db.all("SELECT p.code, p.user_id, p.account_id, p.amount::float amount, p.requested_at, p.status FROM payouts p WHERE p.status IN ('requested','approved')"),
    db.all("SELECT user_id, status, created_at FROM orders WHERE created_at > now() - interval '30 days'"),
    db.all("SELECT k, v FROM kv WHERE k IN ('content.news')")
  ]);
  const U = Object.fromEntries(users.map((u) => [u.id, u])); const A = Object.fromEntries(accts.map((a) => [a.id, a]));
  const cat = await require('./core').catalog();
  const rules = (a) => { try { return require('./rules').rulesFor(cat, a); } catch (e) { return {}; } };
  const out = [];
  const add = (key, type, accIds, uids, sum, ev, rec, when) => { if (!cfg[type] || cfg[type].on === false) return; out.push({ key, type, sev: cfg[type].sev, accts: [...new Set(accIds)], uids: [...new Set(uids)], traders: [...new Set(uids)].map((i) => (U[i] ? short(U[i]) : '?')), sum, ev, rec, when: when || new Date().toISOString() }); };

  // copy trading: different traders, same instrument and side within N seconds
  { const N = cfg.copy.th[0] * 1000, min = cfg.copy.th[1]; const pair = {};
    for (let i = 0; i < trades.length; i++) for (let j = i + 1; j < trades.length && new Date(trades[j].ts) - new Date(trades[i].ts) <= N; j++) { const a = trades[i], b = trades[j]; if (a.user_id === b.user_id || a.instrument !== b.instrument || a.side !== b.side) continue; const k = [a.user_id, b.user_id].sort().join('-'); (pair[k] = pair[k] || []).push([a, b]); }
    Object.entries(pair).filter(([, v]) => v.length >= min).forEach(([k, v]) => add('copy:' + k, 'copy', v.flatMap(([a, b]) => [a.account_id, b.account_id]), v.flatMap(([a, b]) => [a.user_id, b.user_id]), `${v.length} matching ${v[0][0].instrument} trades between two traders, each within ${cfg.copy.th[0]} seconds, in the last 7 days.`, { h: ['Time ET', 'Trader 1', 'Trader 2', 'Gap'], rows: v.slice(0, 12).map(([a, b]) => [tET(a.ts), `${a.side} ${a.qty} ${a.instrument}`, `${b.side} ${b.qty} ${b.instrument}`, ((new Date(b.ts) - new Date(a.ts)) / 1000).toFixed(1) + 's']) }, 'Compare their order sizes and entry times. Hold payouts until it is clear they trade independently.', v[v.length - 1][1].ts)); }
  // hedging: same trader, two accounts, opposite sides within N seconds
  { const N = cfg.hedge.th[0] * 1000, min = cfg.hedge.th[1]; const by = {};
    for (let i = 0; i < trades.length; i++) for (let j = i + 1; j < trades.length && new Date(trades[j].ts) - new Date(trades[i].ts) <= N; j++) { const a = trades[i], b = trades[j]; if (a.user_id !== b.user_id || a.account_id === b.account_id || a.instrument !== b.instrument || a.side === b.side) continue; (by[a.user_id] = by[a.user_id] || []).push([a, b]); }
    Object.entries(by).filter(([, v]) => v.length >= min).forEach(([uid, v]) => add('hedge:' + uid, 'hedge', v.flatMap(([a, b]) => [a.account_id, b.account_id]), [+uid], `Opposite ${v[0][0].instrument} positions on two of their own accounts, opened within ${cfg.hedge.th[0]} seconds, ${v.length} times in 7 days.`, { h: ['Time ET', 'Account', 'Side', 'Qty'], rows: v.slice(0, 6).flatMap(([a, b]) => [[tET(a.ts), a.account_id, a.side, String(a.qty)], [tET(b.ts), b.account_id, b.side, String(b.qty)]]) }, 'Hedging across accounts breaks the rules. Hold payouts and close the accounts if confirmed.', v[v.length - 1][1].ts)); }
  // shared IP
  { const by = {}; sess.forEach((s) => { if (!s.ip || /^(127\.|::1|::ffff:127)/.test(s.ip)) return; (by[s.ip] = by[s.ip] || new Set()).add(s.user_id); });
    Object.entries(by).filter(([, v]) => v.size >= cfg.share.th[0]).forEach(([ip, v]) => { const ids = [...v]; add('share:' + ip, 'share', accts.filter((a) => v.has(a.user_id) && ['active', 'passed', 'review'].includes(a.phase)).map((a) => a.id), ids, `${ids.length} traders signed in from the same IP address.`, { h: ['Trader', 'IP', 'Device'], rows: sess.filter((s) => s.ip === ip).slice(0, 10).map((s) => [U[s.user_id] ? short(U[s.user_id]) : '?', ip.replace(/\.\d+\.\d+$/, '.x.x'), (s.ua || '').slice(0, 40)]) }, 'Could be a household or an office. Check identities and trades before acting.'); }); }
  // shared payout method
  // matched on the full destination (keyed hash); methods saved before full addresses were kept fall back to the label
  { const by = {}; const labOf = {}; methods.forEach((m) => { const k = m.dest_hash || 'label:' + m.label; labOf[k] = m.label; (by[k] = by[k] || new Set()).add(m.user_id); });
    Object.entries(by).filter(([, v]) => v.size >= cfg.payment.th[0]).forEach(([key, v]) => { const lab = labOf[key]; add('payment:' + (key.startsWith('label:') ? lab : key.slice(0, 16)), 'payment', accts.filter((a) => v.has(a.user_id) && a.kind === 'funded').map((a) => a.id), [...v], `The same payout method is saved by ${v.size} different traders.`, { h: ['Signal', ...[...v].map((i) => (U[i] ? short(U[i]) : '?'))], rows: [['Payout method', ...[...v].map(() => lab)]] }, 'Two traders paid to one wallet or account is a strong sign of one person. Hold payouts.'); }); }
  // very short holds
  { const by = {}; trades.forEach((t) => { (by[t.account_id] = by[t.account_id] || []).push(t); });
    Object.entries(by).forEach(([id, ts]) => { if (ts.length < 20) return; const sh = ts.filter((t) => (t.hold_min || 0) < cfg.hft.th[0]).length / ts.length * 100; if (sh >= cfg.hft.th[1]) add('hft:' + id, 'hft', [id], [ts[0].user_id], `${Math.round(sh)}% of ${ts.length} trades held under ${cfg.hft.th[0]} minute.`, { h: ['Hold Time', 'Trades', 'Share', 'P&L'], rows: [['Under ' + cfg.hft.th[0] + ' min', String(ts.filter((t) => (t.hold_min || 0) < cfg.hft.th[0]).length), Math.round(sh) + '%', money(ts.filter((t) => (t.hold_min || 0) < cfg.hft.th[0]).reduce((s, t) => s + t.pnl, 0))]] }, 'Check whether the profit comes from price delays on the simulator.'); });
    // over max contracts and max size on every trade
    Object.entries(by).forEach(([id, ts]) => { const a = A[id]; if (!a) return; const rr = rules(a); const mx = rr.fullContracts && rr.scaling ? rr.fullContracts : rr.contracts; if (!mx) return; const over = ts.filter((t) => t.qty > mx); if (over.length) add('contracts:' + id, 'contracts', [id], [a.user_id], `${over.length} trades above the max of ${mx} contracts.`, { h: ['Time ET', 'Trade', 'Contracts', 'Max'], rows: over.slice(0, 8).map((t) => [tET(t.ts), `${t.side} ${t.instrument}`, String(t.qty), String(mx)]) }, 'Trading above the contract limit breaks the rules.', over[over.length - 1].ts);
      if (ts.length >= 20) { const sh = ts.filter((t) => t.qty >= mx).length / ts.length * 100; if (sh >= cfg.allin.th[0]) add('allin:' + id, 'allin', [id], [a.user_id], `${Math.round(sh)}% of ${ts.length} trades at the max size of ${mx} contracts.`, { h: ['Trades', 'At Max', 'Share'], rows: [[String(ts.length), String(ts.filter((t) => t.qty >= mx).length), Math.round(sh) + '%']] }, 'Within the rules, but a sign of gambling. Watch it.'); }
      // doubling after losses
      let run = 0, best = 0, seq = []; for (let i = 1; i < ts.length; i++) { if (ts[i - 1].pnl < 0 && ts[i].qty >= ts[i - 1].qty * 2) { run++; seq.push(ts[i - 1], ts[i]); best = Math.max(best, run); } else { run = 0; } }
      if (best >= cfg.martingale.th[0]) add('martingale:' + id, 'martingale', [id], [a.user_id], `Position size doubled after a loss ${best} times in a row.`, { h: ['Trade', 'Size', 'Result'], rows: seq.slice(-8).map((t, i) => [String(i + 1), `${t.qty} ${t.instrument}`, money(t.pnl)]) }, 'Within the rules unless it breaks a limit. Watch the account.'); }); }
  // news windows
  { const news = ((content.find((c) => c.k === 'content.news') || {}).v || require('./content').seed.news || []).filter((n) => /high/i.test(n[3]) && /\d/.test(n[1])); const yr = new Date().getFullYear(); const W = cfg.news.th[0] * 60000;
    const etDate = (str) => { const d = new Date(str + ' UTC'); if (isNaN(d)) return null; const off = ET(d).getTime() - new Date(d.toLocaleString('en-US', { timeZone: 'UTC' })).getTime(); return new Date(d.getTime() - off); };
    const evs = news.map((n) => { const at = etDate(`${String(n[0]).replace(/^\w+\s/, '')} ${yr} ${n[1]}`); return at ? { at, n: n[2] } : null; }).filter(Boolean);
    const hits = {}; trades.forEach((t) => { const a = A[t.account_id]; const r = a ? rules(a) : {}; if (a && r.kind && !r.news) return; const w = r.news && r.news.win ? r.news.win * 60000 : W; const e = evs.find((x) => Math.abs(new Date(t.ts) - x.at) <= w); if (e) (hits[t.account_id] = hits[t.account_id] || []).push([t, e]); });
    Object.entries(hits).forEach(([id, v]) => add('news:' + id + ':' + v[0][1].n, 'news', [id], [v[0][0].user_id], `${v.length} trades within ${cfg.news.th[0]} minutes of ${v[0][1].n}.`, { h: ['Time ET', 'Event', 'Trade'], rows: v.slice(0, 8).map(([t, e]) => [tET(t.ts), e.n, `${t.side} ${t.qty} ${t.instrument}`]) }, 'Check the news rule for this plan. Stops that fill on their own are allowed.', v[0][0].ts)); }
  // positions held past the daily close or over the weekend, when the account's rules say flat by the close
  { const hm = (d) => { const x = ET(d); return x.getHours() * 60 + x.getMinutes(); };
    const hold = {}, wk = {}; trades.forEach((t) => { const a = A[t.account_id]; if (!a) return; const r = rules(a); if (!r.kind) return; const close = String(r.closeAt || '16:55').split(':').map(Number); const cm = close[0] * 60 + close[1];
      const end = new Date(t.ts), start = new Date(end - (Number(t.hold_min) || 0) * 60000); const s0 = ET(start), e0 = ET(end);
      const crossed = s0.toDateString() !== e0.toDateString() ? true : (hm(start) < cm && hm(end) > cm);
      const weekend = s0.getDay() === 5 && (e0.getDay() !== 5 || hm(end) > cm) || [6, 0].includes(e0.getDay()) && e0.getDay() !== s0.getDay();
      if (weekend && r.weekend === false) (wk[t.account_id] = wk[t.account_id] || []).push(t); else if (crossed && r.overnight === false) (hold[t.account_id] = hold[t.account_id] || []).push(t); });
    Object.entries(hold).forEach(([id, v]) => add('overnight:' + id, 'weekend', [id], [A[id].user_id], `${v.length} trade${v.length > 1 ? 's' : ''} held past the ${rules(A[id]).closeAt || '16:55'} ET close.`, { h: ['Closed ET', 'Trade', 'Held'], rows: v.slice(0, 8).map((t) => [tET(t.ts), `${t.side} ${t.qty} ${t.instrument}`, `${t.hold_min} min`]) }, 'Positions must be flat by the daily close on this plan.'));
    Object.entries(wk).forEach(([id, v]) => add('weekend:' + id, 'weekend', [id], [A[id].user_id], `${v.length} trade${v.length > 1 ? 's' : ''} held over the weekend.`, { h: ['Closed ET', 'Trade', 'Held'], rows: v.slice(0, 8).map((t) => [tET(t.ts), `${t.side} ${t.qty} ${t.instrument}`, `${t.hold_min} min`]) }, 'Positions must be flat before the weekend on this plan.')); }
  // one day carries the profit (funded)
  { const days = await db.all("SELECT d.account_id, d.day, d.pnl::float pnl FROM days d JOIN accounts a ON a.id=d.account_id WHERE a.kind='funded' AND a.phase IN ('active','review')");
    const by = {}; days.forEach((d) => { (by[d.account_id] = by[d.account_id] || []).push(d); });
    Object.entries(by).forEach(([id, ds]) => { const pos = ds.filter((d) => d.pnl > 0); const tot = pos.reduce((s, d) => s + d.pnl, 0); if (tot <= 0) return; const b = pos.sort((x, y) => y.pnl - x.pnl)[0]; const sh = b.pnl / tot * 100; if (sh > cfg.consistency.th[0] && pos.length >= 2 && A[id]) add('consistency:' + id, 'consistency', [id], [A[id].user_id], `Best day is ${Math.round(sh)}% of all profit on this funded account.`, { h: ['Day', 'Profit', 'Share'], rows: pos.slice(0, 5).map((d) => [String(d.day).slice(0, 10), money(d.pnl), Math.round(d.pnl / tot * 100) + '%']) }, 'The consistency rule holds payouts until other days catch up.'); }); }
  // country mismatch
  users.forEach((u) => { if (u.kyc && u.kyc.country && u.country && u.kyc.country !== u.country) add('vpn:' + u.id, 'vpn', accts.filter((a) => a.user_id === u.id && ['active', 'passed', 'review'].includes(a.phase)).map((a) => a.id), [u.id], `Signed up from ${u.country}, identity document from ${u.kyc.country}.`, { h: ['Signal', 'Country'], rows: [['Sign-up', u.country], ['Identity document', u.kyc.country]] }, 'Ask where they live and trade from.'); });
  // one person over the account limit
  { const by = {}; users.forEach((u) => { if (u.kyc && u.kyc.name && u.kyc.dob) { const k = u.kyc.name.toLowerCase() + '|' + u.kyc.dob; (by[k] = by[k] || []).push(u.id); } });
    Object.entries(by).forEach(([k, ids]) => { const ac = accts.filter((a) => ids.includes(a.user_id) && ['active', 'review'].includes(a.phase)); const ev = ac.filter((a) => a.kind === 'evaluation').length, fu = ac.filter((a) => a.kind === 'funded').length; if (ev > cfg.multi.th[0] || fu > cfg.multi.th[1] || ids.length > 1 && fu > 1) add('multi:' + k, 'multi', ac.map((a) => a.id), ids, `${ids.length > 1 ? ids.length + ' sign-ups with the same identity hold' : 'Holds'} ${ev} evaluations and ${fu} funded accounts.`, { h: ['Sign-Up', 'Email', 'Open Accounts'], rows: ids.map((i) => [short(U[i]), U[i].email.replace(/^(.).*(@.*)$/, '$1***$2'), String(ac.filter((a) => a.user_id === i).length)]) }, 'One person may hold a limited number of accounts.'); }); }
  // payment trouble before buying
  { const by = {}; orders.forEach((o) => { if (o.status === 'pending' && new Date(o.created_at) < new Date(Date.now() - 1800000)) by[o.user_id] = (by[o.user_id] || 0) + 1; });
    Object.entries(by).filter(([, n]) => n >= cfg.chargeback.th[0]).forEach(([uid, n]) => add('chargeback:' + uid, 'chargeback', accts.filter((a) => a.user_id === +uid && a.phase === 'active').map((a) => a.id), [+uid], `${n} checkouts started and not paid in 30 days.`, { h: ['Signal', 'Count'], rows: [['Unpaid checkouts', String(n)]] }, 'Several failed payments often end in a chargeback.')); }
  // payout right after passing
  { payouts.forEach((p) => { const a = A[p.account_id]; if (!a || !a.funded_at) return; if (new Date(p.requested_at) - new Date(a.funded_at) > 3 * 864e5) return; const ts = trades.filter((t) => t.account_id === p.account_id && t.pnl > 0); const tot = ts.reduce((s, t) => s + t.pnl, 0); const big = ts.sort((x, y) => y.pnl - x.pnl)[0]; if (big && tot > 0 && big.pnl / tot * 100 >= cfg.payoutpat.th[0]) add('payoutpat:' + p.code, 'payoutpat', [p.account_id], [p.user_id], `Payout ${p.code} asked for soon after funding, ${Math.round(big.pnl / tot * 100)}% of profit from one trade.`, { h: ['Payout', 'Amount', 'Biggest Trade'], rows: [[p.code, money(p.amount), money(big.pnl)]] }, 'Review the trade before approving.', p.requested_at); }); }

  // merge with stored alerts, keep staff decisions
  const old = (await kv('store.risk.alerts')) || []; const byKey = Object.fromEntries(old.map((a) => [a.key, a])); let n = old.reduce((m, a) => Math.max(m, +String(a.id).replace(/\D/g, '') || 0), 1000);
  const merged = out.map((x) => { const o = byKey[x.key]; if (o) return Object.assign({}, o, { sum: x.sum, ev: x.ev, accts: x.accts, uids: x.uids, traders: x.traders, sev: x.sev, last: x.when }); n++; return Object.assign(x, { id: 'RK-' + n, st: 'new', ag: null, first: x.when, last: x.when }); });
  old.filter((a) => !out.some((x) => x.key === a.key)).forEach((a) => merged.push(Object.assign({}, a, { gone: true })));
  merged.sort((a, b) => String(b.first).localeCompare(String(a.first)));
  await put('store.risk.alerts', merged.slice(0, 500));
  const fresh = merged.filter((a) => a.st === 'new' && !byKey[a.key]); if (fresh.length) require('./integrations').alert('breach', `:mag: ${fresh.length} new risk ${fresh.length === 1 ? 'alert' : 'alerts'}: ${fresh.slice(0, 3).map((a) => a.type).join(', ')}`);
  return { alerts: merged.length, fresh: fresh.length };
}
let timer = null;
function start() { if (timer) return; const run = () => scan().catch((e) => console.error('risk scan', e.message)); timer = setInterval(run, 10 * 60000); setTimeout(run, 20000); }
module.exports = { scan, start, DEF };
