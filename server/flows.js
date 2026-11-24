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
      if (ans === 'GREEN') { await db.q("UPDATE users SET kyc_status='verified', kyc = kyc || $2 WHERE id=$1", [uid, JSON.stringify({ provider: 'Sumsub', applicantId: ev.applicantId, at: new Date().toISOString() })]); await core.notify(null, uid, 'Identity verified', 'You can now receive payouts.', 'settings?tab=identity'); }
      if (ans === 'RED') { const final = ev.reviewResult.reviewRejectType === 'FINAL'; await db.q('UPDATE users SET kyc_status=$2 WHERE id=$1', [uid, final ? 'rejected' : 'none']); await core.notify(null, uid, final ? 'We could not verify your identity' : 'Your identity check needs another look', (ev.reviewResult.moderationComment || 'Open Settings, Identity to try again.').slice(0, 200), 'settings?tab=identity'); I.alert('kyc', `:x: Identity check failed for user ${uid} (${final ? 'final' : 'retry allowed'})`); }
    }
    if (ev.type === 'applicantPending' || ev.type === 'applicantCreated') await db.q("UPDATE users SET kyc_status='submitted' WHERE id=$1 AND kyc_status<>'verified'", [uid]);
  }
  await pay.hookLog('sumsub', ev.type, true, ev.externalUserId); res.json({ ok: true });
}

// ---------- Track1099 ----------
async function taxForm(user) {
  const c = await I.cfg('track1099'); if (!c) bad('Tax forms are not switched on yet. Our team will email you the form.');
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
async function riseInvite(user) {
  const c = await I.cfg('rise'); if (!c || !c.privateKey || !c.teamNanoid) return null;
  try {
    const cl = await I.rise(c);
    await cl.invites.send({ nanoid: c.teamNanoid, invites: [{ email: user.email }], role: 'contractor' });
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
async function riseSend(actorId, code) {
  const c = await I.cfg('rise'); if (!c || !c.privateKey) bad('Rise is not connected. Add the keys in Settings, Integrations.');
  const p = await db.one('SELECT p.*, u.email FROM payouts p JOIN users u ON u.id=p.user_id WHERE p.code=$1', [clean(code, 30)]);
  if (!p) bad('Payout not found', 404); if (p.status !== 'approved') bad('Approve the payout first');
  const cl = await I.rise(c);
  const ru = await riseFindUser(cl, c.teamNanoid, p.email);
  if (!ru) { await riseInvite({ id: p.user_id, email: p.email }); bad('This trader has not joined your Rise team yet. We sent them a new invite.'); }
  const r = await cl.payments.sendPayment({ from: c.teamNanoid, to: [{ to: ru.nanoid, amount_cents: Math.round(Number(p.amount) * 100), currency_symbol: 'USD' }], pay_now: true, idempotencyKey: 'fs-' + p.code });
  if (r.failed_payments && r.failed_payments.length) bad('Rise did not send it: ' + JSON.stringify(r.failed_payments[0]).slice(0, 200));
  const tx = r.data && (r.data.transaction || r.data.transaction_nanoid || r.data.nanoid);
  await db.q('UPDATE payouts SET provider_ref=$2 WHERE id=$1', [p.id, typeof tx === 'string' ? tx : JSON.stringify(tx || {}).slice(0, 200)]);
  await core.reviewPayout(actorId, p.code, 'pay', 'Sent through Rise');
  await db.q("UPDATE users SET rise_status='active' WHERE id=$1", [p.user_id]);
  return { ok: true, tx };
}
async function riseHook(req, res) {
  const c = await I.cfg('rise'); if (!c || !c.webhookSecret) return res.status(400).send('not configured');
  try {
    const { WebhookValidator } = await import('@riseworks/sdk');
    const ev = new WebhookValidator(c.webhookSecret).validateEvent(req.body.toString('utf8'), req.headers['x-rise-signature']);
    const t = ev.event_type || ''; const email = ev.data && (ev.data.email || (ev.data.user && ev.data.user.email));
    if (/invite\.(accepted|completed)/.test(t) && email) await db.q("UPDATE users SET rise_status='active' WHERE lower(email)=lower($1)", [email]);
    await pay.hookLog('rise', t, true, email || ''); res.json({ received: true });
  } catch (e) { await pay.hookLog('rise', 'bad signature', false, e.message); res.status(400).send('bad signature'); }
}

module.exports = { sumsubToken, sumsubHook, taxForm, taxSync, riseInvite, riseSend, riseHook };
