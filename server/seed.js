// Boot-time seed. Creates nothing unless asked:
//  - SEED_DEMO=1 adds clearly labelled demo traders (emails @demo.fundedsky.test, no usable password)
//    with simulated history, so the back office has data to show. Remove them from the back office later.
const db = require('./db');
const core = require('./core');
const sim = require('./sim');
const { rid } = require('./util');
const bcrypt = require('bcryptjs');

const DEMO = [
  ['Maya', 'Lopez', 'United States'], ['Theo', 'Murphy', 'Ireland'], ['Hana', 'Kim', 'South Korea'], ['Ravi', 'Mehta', 'India'],
  ['Grace', 'Tan', 'Philippines'], ['Felix', 'Bakker', 'Netherlands'], ['Kofi', 'Mensah', 'Ghana'], ['Pablo', 'Ortiz', 'Colombia'],
  ['Lena', 'Fischer', 'Germany'], ['Sam', 'Okafor', 'Nigeria'], ['Noah', 'Clark', 'Canada'], ['Aiko', 'Sato', 'Japan']
];
const PICK = [['prime', 50000], ['essential', 50000], ['prime', 100000], ['essential', 25000], ['instant', 50000], ['prime', 150000], ['essential', 100000], ['instant', 25000]];

async function run() {
  if (process.env.SEED_DEMO !== '1') return;
  const have = await db.one("SELECT count(*)::int n FROM users WHERE email LIKE '%@demo.fundedsky.test'");
  if (have.n > 0) return;
  console.log('[seed] creating demo traders');
  const cat = await core.catalog();
  let i = 0;
  for (const [first, last, country] of DEMO) {
    const n = (await db.one("SELECT nextval('seq_tid') n")).n;
    const email = `${first}.${last}`.toLowerCase() + '@demo.fundedsky.test';
    const u = await db.one(`INSERT INTO users(tid,email,pass_hash,first,last,country,role,verified,kyc_status,ref_code,settings,agreements,created_at)
      VALUES($1,$2,$3,$4,$5,$6,'trader',true,$7,$8,$9,$10, now() - ($11 || ' days')::interval) RETURNING *`,
    ['T-' + n, email, await bcrypt.hash(rid(18), 6), first, last, country, i % 3 === 0 ? 'verified' : i % 3 === 1 ? 'submitted' : 'none', 't' + n, { demo: true }, { terms: new Date().toISOString() }, String(30 + i * 3)]);
    const buys = 1 + (i % 3);
    for (let b = 0; b < buys; b++) {
      const [plan, size] = PICK[(i + b * 3) % PICK.length];
      const priced = await core.priceCart([{ plan, size, platform: 'Tradovate', addons: b === 1 ? ['reset'] : [], qty: 1 }]);
      const code = await core.ordCode();
      const o = await db.one(`INSERT INTO orders(code,user_id,kind,lines,items,subtotal,discount,total,status,pay_method,provider,paid_at,created_at,meta)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,'paid','Demo','test',now(),now(),'{"demo":true}') RETURNING id`,
      [code, u.id, plan === 'instant' ? 'instant' : 'evaluation', JSON.stringify(priced.lines), JSON.stringify(priced.items), priced.subtotal, priced.discount, priced.total]);
      const r = await core.fulfilOrder(o.id);
      for (const id of r.accounts) await sim.fastForward(id, 3 + ((i * 7 + b * 5) % 14));
    }
    // move passed accounts forward to funded where it makes sense
    const passed = await db.all("SELECT * FROM accounts WHERE user_id=$1 AND phase='passed'", [u.id]);
    for (const a of passed) {
      const sd = core.sizeDef(cat, a.plan, a.size);
      if (!sd.activation || i % 2 === 0) {
        await core.signAgreement(u.id, a.id).catch(() => {});
        if (sd.activation) await db.tx((c) => core.activateFunded(c, a.id, u.id, null));
      }
    }
    const funded = await db.all("SELECT id FROM accounts WHERE user_id=$1 AND kind='funded' AND phase='active'", [u.id]);
    for (const f of funded) await sim.fastForward(f.id, 6 + (i % 6));
    await db.q("INSERT INTO payout_methods(user_id,rail,label,is_default,unlock_at) VALUES($1,'Rise',$2,true,now() - interval '3 days')", [u.id, 'Rise · Bank •••• ' + (1000 + i * 37)]);
    i++;
  }
  // a couple of payout requests and tickets so the queues have work
  const ready = await db.all("SELECT a.*, u.id uid FROM accounts a JOIN users u ON u.id=a.user_id WHERE a.kind='funded' AND a.phase='active' AND u.email LIKE '%@demo.fundedsky.test'");
  const R = require('./rules');
  for (const a of ready) {
    const q = R.payoutQuote(cat, a);
    if (q.ok) { const m = await db.one('SELECT id FROM payout_methods WHERE user_id=$1', [a.user_id]); await core.requestPayout(a.user_id, a.id, q.max, m.id).catch((e) => console.log('[seed] payout', e.message)); }
  }
  const us = await db.all("SELECT id, first FROM users WHERE email LIKE '%@demo.fundedsky.test' ORDER BY id LIMIT 4");
  const T = [['When does my payout arrive?', 'Payouts'], ['Can I switch from Tradovate to NinjaTrader?', 'Platform and Login'], ['Why did my account breach?', 'Breach Dispute'], ['Activation fee question', 'Billing and Refunds']];
  for (let k = 0; k < us.length; k++) {
    const t = await db.one('INSERT INTO tickets(user_id,subject,category,channel,status) VALUES($1,$2,$3,$4,$5) RETURNING id', [us[k].id, T[k][0], T[k][1], k % 2 ? 'Email' : 'Live Chat', 'open']);
    await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,body) VALUES($1,$2,$3)', [t.id, us[k].id, `Hi, ${T[k][0].toLowerCase()} Thanks, ${us[k].first}`]);
  }
  console.log('[seed] done');
}
module.exports = { run };
