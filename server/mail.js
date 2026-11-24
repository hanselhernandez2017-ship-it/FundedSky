// Outgoing email. Every message is stored in the outbox (visible in the back office Emails page).
// If RESEND_API_KEY is set, messages are also sent through Resend.
const db = require('./db');
const FROM = process.env.MAIL_FROM || 'Funded Sky <no-reply@fundedsky.com>';
async function send(to, subject, body, template = '') {
  const row = await db.one('INSERT INTO outbox(to_email,subject,body,template,status) VALUES($1,$2,$3,$4,$5) RETURNING id', [to, subject, body, template, process.env.RESEND_API_KEY ? 'queued' : 'logged']);
  if (!process.env.RESEND_API_KEY) { console.log(`[mail] ${to} · ${subject}\n${body}`); return; }
  try {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: FROM, to, subject, text: body }) });
    await db.q('UPDATE outbox SET status=$2 WHERE id=$1', [row.id, r.ok ? 'sent' : 'failed']);
  } catch (e) { await db.q("UPDATE outbox SET status='failed' WHERE id=$1", [row.id]); }
}
module.exports = { send };
