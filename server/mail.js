// Outgoing email. Every message is stored in the outbox (back office Emails page).
// Sent through Resend when it is connected in Settings > Integrations (or RESEND_API_KEY).
const db = require('./db');
const I = require('./integrations');
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
function html(subject, body) {
  const linked = esc(body).replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color:#1C84DE">$1</a>').replace(/\n/g, '<br>');
  return `<div style="background:#F4F5F7;padding:32px 16px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;color:#101216;font-size:15px;line-height:1.6"><div style="font-weight:700;font-size:20px;letter-spacing:-.03em;margin-bottom:20px">fundedsky</div>${linked}<div style="margin-top:28px;padding-top:16px;border-top:1px solid #E1E4E9;color:#8A8F98;font-size:12px">Funded Sky · Simulated trading accounts. Fees are not deposits.</div></div></div>`;
}
async function send(to, subject, body, template = '') {
  const c = await I.cfg('resend').catch(() => null);
  const key = (c && c.apiKey) || process.env.RESEND_API_KEY;
  const row = await db.one('INSERT INTO outbox(to_email,subject,body,template,status) VALUES($1,$2,$3,$4,$5) RETURNING id', [to, subject, body, template, key ? 'queued' : 'logged']);
  if (!key) { console.log(`[mail] ${to} · ${subject}`); return; }
  try {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: (c && c.from) || process.env.MAIL_FROM || 'Funded Sky <no-reply@fundedsky.com>', reply_to: (c && c.replyTo) || undefined, to, subject, text: body, html: html(subject, body) }), signal: AbortSignal.timeout(15000) });
    const j = await r.json().catch(() => ({}));
    await db.q('UPDATE outbox SET status=$2 WHERE id=$1', [row.id, r.ok ? 'sent' : 'failed']);
    if (!r.ok) console.error('resend', j.message || r.status);
  } catch (e) { await db.q("UPDATE outbox SET status='failed' WHERE id=$1", [row.id]); }
}
module.exports = { send };
