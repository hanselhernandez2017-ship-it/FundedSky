// Integration flows: identity (Sumsub), tax forms (Track1099), payouts (Rise), and their webhooks.
const crypto = require('crypto');
const db = require('./db');
const core = require('./core');
const I = require('./integrations');
const { bad, clean } = require('./util');
const pay = require('./payments');

// ---------- Sumsub ----------
async function sumsubToken(user) {
  const c = await I.cfg('sumsub'); if (!c) bad('Identity checks are not switched on yet. Use the form instead.');
  const j = await I.sumsub(c, 'POST', '/resources/accessTokens/sdk', { userId: 'fs-' + user.id, levelName: c.levelName, ttlInSecs: 1800, applicantIdentifiers: { email: user.email } });
  if (user.kyc_status === 'none' || user.kyc_status === 'rejected') await db.q("UPDATE users SET kyc_status='submitted', kyc_ref='fs-' || id WHERE id=$1", [user.id]);
  return { token: j.token, level: c.levelName };
}
async function sumsubHook(req, res) {
  const c = await I.cfg('sumsub'); if (!c) return res.status(400).send('not configured');
  const raw = req.body; const alg = String(req.headers['x-payload-digest-alg'] || 'HMAC_SHA256_HEX');
  const h = alg === 'HMAC_SHA512_HEX' ? 'sha512' : alg === 'HMAC_SHA1_HEX' ? 'sha1' : 'sha256';
  const exp = crypto.createHmac(h, c.webhookSecret || '').update(raw).digest('hex');
  if (!c.webhookSecret || exp !== String(req.headers['x-payload-digest'] || '')) { await pay.hookLog('sumsub', 'bad signature', false, ''); return res.status(400).send('bad signature'); }
  const ev = JSON.parse(raw.toString('utf8'));
  const uid = parseInt(String(ev.externalUserId || '').replace(/^fs-/, ''), 10);
  if (uid) {
    if (ev.type === 'applicantReviewed') {
      const ans = ev.reviewResult && ev.reviewResult.reviewAnswer;
      if (ans === 'GREEN') { await db.q("UPDATE users SET kyc_status='verified', kyc = kyc || $2 WHERE id=$1", [uid, JSON.stringify({ provider: 'Sumsub', applicantId: ev.applicantId, at: new Date().toISOString() })]); require('./mail').t('kycok', uid, { url: require('./auth').BASE() + '/app#payouts' }); await core.notify(null, uid, 'Identity verified', 'You can now receive payouts.', 'settings?tab=identity'); }
      if (ans === 'RED') { const final = ev.reviewResult.reviewRejectType === 'FINAL'; await db.q('UPDATE users SET kyc_status=$2 WHERE id=$1', [uid, final ? 'rejected' : 'none']); require('./mail').t(final ? 'kycno' : 'kycmore', uid, { reason: String(ev.reviewResult.moderationComment || 'We could not match your details to a valid identity document.').slice(0, 200), url: require('./auth').BASE() + '/app#settings?tab=identity' }); await core.notify(null, uid, final ? 'We could not verify your identity' : 'Your identity check needs another look', (ev.reviewResult.moderationComment || 'Open Settings, Identity to try again.').slice(0, 200), 'settings?tab=identity'); I.alert('kyc', `:x: Identity check failed for user ${uid} (${final ? 'final' : 'retry allowed'})`); }
      if (ans === 'GREEN' || ans === 'RED') { const wu = await db.one('SELECT tid, email, kyc_status FROM users WHERE id=$1', [uid]); if (wu) require('./integrations').outHooks('kyc', `Identity check ${wu.kyc_status}`, { user: { id: wu.tid, email: wu.email }, status: wu.kyc_status, provider: 'Sumsub', answer: ans, at: new Date().toISOString() }); }
    }
    if (ev.type === 'applicantPending' || ev.type === 'applicantCreated') await db.q("UPDATE users SET kyc_status='submitted' WHERE id=$1 AND kyc_status<>'verified'", [uid]);
  }
  await pay.hookLog('sumsub', ev.type, true, ev.externalUserId); res.json({ ok: true });
}

// ---------- Track1099 ----------
// Without Track1099 the trader fills in a simple W-9 or W-8BEN in Settings, Tax Form. The full form is kept for staff
// (kv taxform.<user id>, never sent to the browser); only the last 4 of the tax number are shown back.
async function taxSelf(user, b) {
  const formType = user.country === 'United States' ? 'W-9' : 'W-8BEN';
  if (user.tax_status === 'on_file') bad('Your tax form is already on file.');
  const name = clean(b.name, 120); if (name.length < 3) bad('Enter your full legal name.');
  const tin = clean(b.tin, 40).replace(/[\s-]/g, '');
  if (formType === 'W-9' && !/^\d{9}$/.test(tin)) bad('Enter your 9-digit SSN or EIN.');
  if (formType === 'W-8BEN' && !/^[A-Za-z0-9]{4,30}$/.test(tin)) bad('Enter the tax number from your country of residence.');
  const address = clean(b.address, 200); if (address.length < 8) bad('Enter your full street address.');
  const crow = require('./phone').DIAL.find((x) => x[0].toLowerCase() === clean(b.country, 60).toLowerCase()); if (!crow) bad('Choose your country from the list.');
  if (formType === 'W-9' && crow[0] !== 'United States') bad('A W-9 is for US persons. Contact support if you live outside the US.');
  if (formType === 'W-8BEN' && crow[0] === 'United States') bad('A W-8BEN is for people outside the US. Contact support if you live in the US.');
  if (b.certify !== true) bad('Check the box to confirm the form is correct.');
  if (clean(b.signature, 120).toLowerCase() !== name.toLowerCase()) bad('Type your full legal name to sign, exactly as above.');
  // The tax number and address are encrypted at rest (same key as wallet addresses); read them back with taxFormOf()
  const form = { formType, name, tin: I.enc(tin), tinLast4: tin.slice(-4), address: I.enc(address), country: crow[0], signedAt: new Date().toISOString() };
  await db.q('INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT (k) DO UPDATE SET v=$2, updated_at=now()', ['taxform.' + user.id, JSON.stringify(form)]);
  await db.q("UPDATE users SET tax_status='on_file', tax_ref=$2 WHERE id=$1", [user.id, 'self:' + formType]);
  await core.audit(user.id, 'tax.form', user.tid, { formType });
  return { ok: true, formType, onFile: true };
}
// The stored form with the tax number and address decrypted, for staff tools that need the full form
async function taxFormOf(userId) { const r = await db.one('SELECT v FROM kv WHERE k=$1', ['taxform.' + userId]); if (!r || !r.v) return null; return Object.assign({}, r.v, { tin: I.dec(r.v.tin), address: I.dec(r.v.address) }); }
// One-time on boot: forms saved before encryption was added are rewritten with the tax number and address encrypted
async function taxEncryptOld() { const rows = await db.all("SELECT k, v FROM kv WHERE k LIKE 'taxform.%'"); let n = 0;
  for (const r of rows) { const v = r.v || {}; const plain = (x) => typeof x === 'string' && x && !x.startsWith('enc:'); if (!plain(v.tin) && !plain(v.address)) continue;
    if (plain(v.tin)) { if (!v.tinLast4) v.tinLast4 = v.tin.slice(-4); v.tin = I.enc(v.tin); } if (plain(v.address)) v.address = I.enc(v.address);
    await db.q('UPDATE kv SET v=$2 WHERE k=$1', [r.k, JSON.stringify(v)]); n++; }
  return n; }
async function taxForm(user, body) {
  const c = await I.cfg('track1099'); if (!c) { if (body && body.formType !== undefined) return taxSelf(user, body); bad('Fill in the tax form in Settings, Tax Form.'); }
  if (!c.companyId) bad('Tax forms are not fully set up yet. Contact support.');
  const formType = user.country === 'United States' ? 'W-9' : 'W-8BEN';
  const j = await I.t1099(c, 'POST', '/api/v1/form_requests', { data: { type: 'form_request', attributes: { company_id: c.companyId, reference_id: user.tid, form_type: formType, email: user.email, name: `${user.first} ${user.last}` } } });
  const d = j.data || {}; const a = d.attributes || {};
  await db.q("UPDATE users SET tax_status='requested', tax_ref=$2 WHERE id=$1", [user.id, String(d.id || '')]);
  return { formType, url: a.signed_url || a.url || a.form_url || (d.links && d.links.self) || null, id: d.id, raw: a };
}
async function taxSync(user) {
  if (user.tax_status !== 'requested' || !user.tax_ref) return user.tax_status;
  const c = await I.cfg('track1099'); if (!c) return user.tax_status;
  try { const j = await I.t1099(c, 'GET', '/api/v1/form_requests/' + encodeURIComponent(user.tax_ref)); const a = (j.data && j.data.attributes) || {}; if (a.signed_at || a.status === 'completed' || a.completed_at) { await db.q("UPDATE users SET tax_status='on_file' WHERE id=$1", [user.id]); return 'on_file'; } } catch (e) { /* keep status */ }
  return user.tax_status;
}

// ---------- Rise ----------
// riseEmail: the Rise account email the trader saved with their Rise payout method (their sign-in email when left out)
async function riseInvite(user, riseEmail) {
  const c = await I.cfg('rise'); if (!c || !c.privateKey || !c.teamNanoid) return null;
  try {
    const cl = await I.rise(c);
    await cl.invites.send({ nanoid: c.teamNanoid, invites: [{ email: riseEmail || user.email }], role: 'contractor' });
    await db.q("UPDATE users SET rise_status='invited' WHERE id=$1", [user.id]);
    return 'invited';
  } catch (e) { console.error('rise invite', e.message); return 'error: ' + e.message; }
}
async function riseFindUser(cl, team, email) {
  let offset = 0;
  for (let i = 0; i < 20; i++) {
    const r = await cl.teams.getUsers({ team_nanoid: team, offset, limit: 100 }).catch(() => cl.teams.getUsers({ team_nanoid: team }));
    const u = (r.data.users || []).find((x) => String(x.email).toLowerCase() === email.toLowerCase()); if (u) return u;
    const pg = r.data.pagination; if (!pg || !pg.has_more) return null; offset = pg.next_offset;
  }
  return null;
}
async function riseSend(actorId, code, batchId) {
  const c = await I.cfg('rise'); if (!c || !c.privateKey) bad('Rise is not connected. Add the keys in Settings, Integrations.');
  const p = await db.one('SELECT p.*, u.email FROM payouts p JOIN users u ON u.id=p.user_id WHERE p.code=$1', [clean(code, 30)]);
  if (!p) bad('Payout not found', 404); await core.canSend(p.code);
  const cl = await I.rise(c);
  // Paid to the Rise email saved with the payout method; older Rise methods have none and use the trader's sign-in email
  const saved = p.dest ? I.dec(p.dest) : ''; const riseTo = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(saved) ? saved : p.email;
  const ru = await riseFindUser(cl, c.teamNanoid, riseTo);
  if (!ru) { await riseInvite({ id: p.user_id, email: p.email }, riseTo); bad('This trader has not joined your Rise team yet. We sent them a new invite.'); }
  const r = await cl.payments.sendPayment({ from: c.teamNanoid, to: [{ to: ru.nanoid, amount_cents: Math.round(Number(p.amount) * 100), currency_symbol: 'USD' }], pay_now: true, idempotencyKey: 'fs-' + p.code });
  if (r.failed_payments && r.failed_payments.length) bad('Rise did not send it: ' + JSON.stringify(r.failed_payments[0]).slice(0, 200));
  const tx = r.data && (r.data.transaction || r.data.transaction_nanoid || r.data.nanoid);
  await db.q('UPDATE payouts SET provider_ref=$2 WHERE id=$1', [p.id, typeof tx === 'string' ? tx : JSON.stringify(tx || {}).slice(0, 200)]);
  await core.reviewPayout(actorId, p.code, 'pay', 'Sent through Rise', batchId, { sent: true });
  await db.q("UPDATE users SET rise_status='active' WHERE id=$1", [p.user_id]);
  return { ok: true, tx };
}
async function riseHook(req, res) {
  const c = await I.cfg('rise'); if (!c || !c.webhookSecret) return res.status(400).send('not configured');
  try {
    const { WebhookValidator } = await import('@riseworks/sdk');
    const ev = new WebhookValidator(c.webhookSecret).validateEvent(req.body.toString('utf8'), req.headers['x-rise-signature']);
    const t = ev.event_type || ''; const email = ev.data && (ev.data.email || (ev.data.user && ev.data.user.email));
    if (/invite\.(accepted|completed)/.test(t) && email) await db.q("UPDATE users SET rise_status='active' WHERE lower(email)=lower($1) OR id IN (SELECT user_id FROM payout_methods WHERE rail='Rise' AND dest_hash=$2)", [email, I.mac('Rise:' + String(email).toLowerCase())]);
    await pay.hookLog('rise', t, true, email || ''); res.json({ received: true });
  } catch (e) { await pay.hookLog('rise', 'bad signature', false, e.message); res.status(400).send('bad signature'); }
}

module.exports = { sumsubToken, sumsubHook, taxForm, taxFormOf, taxEncryptOld, taxSync, riseInvite, riseSend, riseHook };
