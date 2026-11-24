  const ME = '[Your Name]';
  const XL = (board, hash, label, cls) => `<a class="${cls || 'lnk'}" href="Admin${board}.dc.html${hash ? '#' + hash : ''}">${label}</a>`;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fill = (t) => String(t == null ? '' : t).replace(/\{(\w+)\}/g, (m, k) => SAMPLE[k] != null ? SAMPLE[k] : m);
  const fe = (t) => esc(fill(t));
  const num = (n) => Math.round(n).toLocaleString('en-US');
  const rng = (seed) => { let h = 2166136261; for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; };
  let seq = 500; const uid = (p) => p + (++seq);
  const CHEV = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

  // stats per email
  Object.entries(E).forEach(([id, e]) => {
    const r = rng(id); e.id = id; e.on = !e.off; e.v = 1 + Math.floor(r() * 4);
    const base = e.req ? (e.fr === 'security' ? 0.78 : 0.64) : e.mk ? 0.34 : 0.52;
    e.open = Math.round((base + (r() - 0.5) * 0.12) * 100); e.click = e.cta ? Math.max(2, Math.round(e.open * (0.18 + r() * 0.22))) : Math.round(e.open * 0.04);
    e.bounce = +(0.3 + r() * 0.9).toFixed(1); e.unsub = e.mk ? +(0.2 + r() * 0.6).toFixed(1) : 0;
    e.hist = [];
  });
  const flowOf = (id) => FLOWS.find((f) => f.lanes.some((l) => l.includes('E:' + id)));
  const emailsIn = (f) => f.lanes.flat().filter((x) => x.startsWith('E:')).map((x) => E[x.slice(2)]);
  const isOn = (e) => e.req || (e.on && !(flowOf(e.id) || {}).paused);
  const totals = () => { const all = Object.values(E); const sent = all.reduce((a, e) => a + e.sent, 0); const w = (k) => Math.round(all.reduce((a, e) => a + e.sent * e[k], 0) / Math.max(1, sent)); return { sent, today: Math.round(sent / 30 * 0.42), week: Math.round(sent / 30 * 7.1), open: w('open'), click: w('click'), failed: 141 }; };
  const flowStats = (f) => { const es = emailsIn(f); const sent = es.reduce((a, e) => a + e.sent, 0); const w = (k) => sent ? Math.round(es.reduce((a, e) => a + e.sent * e[k], 0) / sent) : 0; return { sent, open: w('open'), click: w('click') }; };

  const S = {
    view: 'flow', flow: 'signup', sel: 'welcome', open: { signup: true }, tab: 'preview', dev: 'desktop', full: false, panel: false,
    edit: null, who: { q: '', f: 'all', row: -1 }, range: 30, toast: '',
    logs: { status: 'all', q: '', em: 'all', row: null },
    rules: { quiet: true, qFrom: '21:00', qTo: '08:00', capDay: '1', capWeek: '3', pauseMk: false, noMkAfterBreach: true, test: false, testTo: '[your-email]@fundedsky.com', failover: true },
    brand: { address: '[Company Address]', support: 'support@fundedsky.com', legal: 'All Funded Sky accounts trade in a simulated environment. Nothing in this email is investment advice.', x: 'x.com/fundedsky', ig: '', discord: 'discord.gg/[invite]' },
    supp: [],
    focus: null
  };

  // suppression list
  [['m***@outlook.com', 'Bounced', 'Mailbox does not exist', 'Nov 21'], ['k***@yahoo.com', 'Complained', 'Marked as spam', 'Nov 20'], ['t***@gmail.com', 'Unsubscribed', 'Marketing only', 'Nov 20'], ['a***@proton.me', 'Unsubscribed', 'Marketing only', 'Nov 19'], ['r***@hotmail.com', 'Bounced', 'Domain not found', 'Nov 18'], ['d***@icloud.com', 'Unsubscribed', 'Marketing only', 'Nov 17'], ['j***@gmx.de', 'Bounced', 'Mailbox full, 3 tries', 'Nov 16'], ['s***@gmail.com', 'Complained', 'Marked as spam', 'Nov 14'], ['p***@mail.ru', 'Unsubscribed', 'Marketing only', 'Nov 12'], ['l***@outlook.com', 'Bounced', 'Mailbox does not exist', 'Nov 10']].forEach(([a, k, why, d]) => S.supp.push({ a, k, why, d }));

  // recipients and logs
  const MAILS = ['j***@gmail.com', 'm***@outlook.com', 'a***@proton.me', 'd***@yahoo.com', 'k***@icloud.com', 'r***@gmail.com', 'c***@hotmail.com', 's***@gmail.com', 'b***@gmx.de', 'e***@outlook.com', 'n***@gmail.com', 'o***@yahoo.com'];
  const TIMES = ['Today, 12:41 PM', 'Today, 12:02 PM', 'Today, 11:18 AM', 'Today, 10:55 AM', 'Today, 9:30 AM', 'Today, 8:12 AM', 'Yesterday, 9:41 PM', 'Yesterday, 6:20 PM', 'Yesterday, 3:20 PM', 'Yesterday, 11:05 AM', 'Nov 20, 7:44 PM', 'Nov 20, 2:10 PM', 'Nov 19, 5:02 PM', 'Nov 19, 9:15 AM'];
  const recipients = (e) => { const r = rng('who' + e.id); const n = Math.min(14, Math.max(e.sent ? 4 : 0, e.sent)); const out = []; for (let i = 0; i < n; i++) { const x = r(); const st = x < e.bounce / 40 + 0.03 ? 'Bounced' : x < 0.03 + e.click / 100 ? 'Clicked' : x < 0.03 + e.open / 100 ? 'Opened' : 'Delivered'; out.push({ t: '[Trader] #' + (1043 - i * 3 - Math.floor(r() * 3)), to: MAILS[(i + Math.floor(r() * 5)) % MAILS.length], when: TIMES[i], st }); } return out; };
  const REASONS = ['Mailbox does not exist', 'Mailbox full', 'Suppressed: unsubscribed from marketing', 'Domain not found', 'Rejected as spam by the receiving server', 'Suppressed: earlier bounce'];
  const LOGS = (() => { const r = rng('logs'); const ids = Object.keys(E).filter((k) => E[k].sent > 0); const out = []; for (let i = 0; i < 64; i++) { const e = E[ids[Math.floor(Math.pow(r(), 1.6) * ids.length)]]; const x = r(); const st = x < 0.06 ? 'Failed' : x < 0.1 ? 'Bounced' : x < 0.12 ? 'Complaint' : x < 0.3 ? 'Clicked' : x < 0.62 ? 'Opened' : 'Delivered'; const mins = 2 + i * 23 + Math.floor(r() * 18); const d = new Date(Date.UTC(2026, 10, 22, 17, 58) - mins * 60000); const hh = d.getUTCHours() - 5; const day = hh < 0 ? 'Yesterday' : 'Today'; const h24 = (hh + 24) % 24; const when = `${day}, ${((h24 + 11) % 12) + 1}:${String(d.getUTCMinutes()).padStart(2, '0')} ${h24 >= 12 ? 'PM' : 'AM'}`; out.push({ id: 'msg_' + (9000000 + Math.floor(r() * 999999)).toString(36), e: e.id, to: MAILS[Math.floor(r() * MAILS.length)], t: '[Trader] #' + (1043 - Math.floor(r() * 40)), when, st, why: ['Failed', 'Bounced'].includes(st) ? REASONS[Math.floor(r() * REASONS.length)] : st === 'Complaint' ? 'Marked as spam by the recipient' : '' }); } return out; })();
  const STB = { Delivered: 'plain', Opened: 'sched', Clicked: 'live', Bounced: 'err', Failed: 'err', Complaint: 'draft', Suppressed: 'ret' };

  // ---------- email preview ----------
  const GROUP_LABEL = { signup: 'Welcome', orders: 'Orders', abandon: 'Checkout', progress: 'Evaluation', breach: 'Evaluation', funded: 'Funded', payouts: 'Payouts', billing: 'Billing', security: 'Security', rules: 'Rules', platforms: 'Platforms', affiliates: 'Affiliates', support: 'Support', marketing: 'News' };
  function emailHtml(e, dev) {
    const f = flowOf(e.id) || {}; const paras = [].concat(e.b || []).filter(Boolean);
    const money = (v) => '$' + Number(v).toLocaleString('en-US');
    const pg = e.pg ? `<div class="em-pg"><div class="em-pgh"><span>${esc(e.pg[0])}</span><b>${e.pg[2] === 100 ? e.pg[1] + '%' : e.pg[2] > 100 ? money(e.pg[1]) + ' of ' + money(e.pg[2]) : e.pg[1] + ' of ' + e.pg[2]}</b></div><div class="em-bar"><i style="width:${Math.min(100, e.pg[1] / e.pg[2] * 100)}%"></i></div><div class="em-pgs">${esc(e.pg[3])}</div></div>` : '';
    return `<div class="em ${dev === 'phone' ? 'ph' : ''}">
      <div class="em-top"><span class="em-logo">fundedsky<i>futures</i></span><span class="em-lab">${esc(GROUP_LABEL[f.id] || 'Funded Sky')}</span></div>
      <div class="em-b">
        ${e.e ? `<div class="em-eb">${fe(e.e)}</div>` : ''}
        <h1>${fe(e.h)}${e.a ? ` <span>${fe(e.a)}</span>` : ''}</h1>
        ${e.al ? `<div class="em-al ${e.al[0]}">${fe(e.al[1])}</div>` : ''}
        ${paras.map((p) => `<p>${fe(p)}</p>`).join('')}
        ${e.c ? `<div class="em-code">${fe(e.c)}</div>` : ''}
        ${pg}
        ${e.r ? `<div class="em-rows">${e.r.map(([k, v]) => `<div><span>${fe(k)}</span><b>${fe(v)}</b></div>`).join('')}</div>` : ''}
        ${e.st ? `<div class="em-steps">${e.st.map(([t, d], i) => `<div class="em-s"><span class="em-n">${i + 1}</span><div><b>${fe(t)}</b><p>${fe(d)}</p></div></div>`).join('')}</div>` : ''}
        ${e.cta ? `<div class="em-ctaw"><span class="em-cta">${fe(e.cta)}</span></div>` : ''}
        ${e.n2 ? `<div class="em-n2">${fe(e.n2)}</div>` : ''}
      </div>
      <div class="em-foot">
        <div>${e.mk ? '<u>Unsubscribe</u> · <u>Email Preferences</u>' : "You're getting this because you have a Funded Sky account. It's about your account, so it can't be turned off."}</div>
        <div>Funded Sky · ${esc(S.brand.address)} · ${esc(S.brand.support)}</div>
        <div>${esc(S.brand.legal)}</div>
      </div></div>`;
  }

  // ---------- nav ----------
  const TOOLS = [['logs', 'Email Logs'], ['domain', 'Sending Domain'], ['rules', 'Sending Rules'], ['brand', 'Brand and Footer'], ['supp', 'Suppression List']];
  function navHtml() {
    let h = '<h6>Flows</h6>';
    FLOWS.forEach((f) => {
      const es = emailsIn(f); const on = es.filter(isOn).length; const open = S.open[f.id];
      h += `<button class="ng ${S.view === 'flow' && S.flow === f.id ? 'on' : ''} ${open ? 'open' : ''}" data-act="flow" data-id="${f.id}" aria-expanded="${!!open}"><span class="chv">${CHEV}</span><span class="ngt">${esc(f.name)}</span><i>${on} of ${es.length} On</i></button>`;
      if (open) h += `<div class="ngl">${es.map((e) => `<button class="ni sub ${S.view === 'flow' && S.sel === e.id ? 'on' : ''}" data-act="pick" data-id="${e.id}"><span class="dot" style="background:${e.draft ? 'var(--wa)' : isOn(e) ? 'var(--ok)' : 'var(--fa)'}"></span><span class="nit">${esc(e.n)}</span></button>`).join('')}</div>`;
    });
    h += '<h6>Tools</h6>' + TOOLS.map(([v, l]) => `<button class="ni ${S.view === v ? 'on' : ''}" data-act="go" data-v="${v}">${l}${v === 'logs' ? `<i>${LOGS.filter((x) => ['Failed', 'Bounced'].includes(x.st)).length}</i>` : v === 'supp' ? `<i>${S.supp.length}</i>` : ''}</button>`).join('');
    return h;
  }
  function mnavHtml() {
    let h = '<optgroup label="Flows">' + FLOWS.map((f) => `<option value="f:${f.id}" ${S.view === 'flow' && S.flow === f.id ? 'selected' : ''}>${esc(f.name)} (${emailsIn(f).filter(isOn).length} of ${emailsIn(f).length} On)</option>`).join('') + '</optgroup>';
    return h + '<optgroup label="Tools">' + TOOLS.map(([v, l]) => `<option value="v:${v}" ${S.view === v ? 'selected' : ''}>${l}</option>`).join('') + '</optgroup>';
  }

  // ---------- flow canvas ----------
  function node(step, f, li, last) {
    const [k, rest] = [step[0], step.slice(2)];
    if (k === 'E') {
      const e = E[rest]; const on = isOn(e);
      const tag = e.req ? 'Always On' : e.draft ? 'Draft' : on ? 'On' : 'Off';
      return `<button class="nd ndm ${S.sel === e.id ? 'sel' : ''} ${on ? '' : 'off'}" data-act="pick" data-id="${e.id}"><div class="k"><i></i>${e.mk ? 'Marketing Email' : 'Email'}<span class="tg ${e.req ? 'lock' : on ? 'on' : ''}">${tag}</span></div><h4>${esc(e.n)}</h4><p>${esc(e.w)}</p><div class="st"><div><span>Sent</span><b>${num(e.sent)}</b></div><div><span>Opened</span><b>${e.sent ? e.open + '%' : '—'}</b></div><div><span>Clicked</span><b>${e.sent ? e.click + '%' : '—'}</b></div></div></button>`;
    }
    const [t, sub] = rest.split('|');
    if (k === 'T') return `<div class="nd trg"><div class="k"><i></i>Trigger</div><h4>${esc(t)}</h4>${sub ? `<p>${esc(sub)}</p>` : ''}</div>`;
    return `<div class="nd wt"><div class="k"><i></i>${k === 'W' ? 'Wait' : 'Only If'}</div><h4>${esc(t)}</h4>${sub ? `<p>${esc(sub)}</p>` : ''}</div>`;
  }
  function vFlow() {
    const f = FLOWS.find((x) => x.id === S.flow); const st = flowStats(f); const opt = emailsIn(f).filter((e) => !e.req).length;
    const lanes = f.lanes.map((l, li) => `<div class="lane">${l.map((s, i) => node(s, f, li, i === l.length - 1)).join('<div class="cn"></div>')}<div class="cn"></div><div class="nd end"><span>Flow Ends</span><button class="lnk" data-act="addEmail" data-id="${f.id}" data-i="${li}">+ Add Email</button></div></div>`).join('');
    return `<div class="fh"><div class="fht"><h1>${esc(f.name)}</h1><p>${esc(f.desc)}</p></div><div class="fhr"><div class="ms"><span>Sent</span><b>${num(st.sent)}</b></div><div class="ms"><span>Opened</span><b>${st.open}%</b></div><div class="ms"><span>Clicked</span><b>${st.click}%</b></div>${opt ? `<label class="wf">Whole Flow<button class="sw ${f.paused ? '' : 'on'}" data-act="flowOn" data-id="${f.id}" role="switch" aria-checked="${!f.paused}" aria-label="Whole flow on or off"></button></label>` : '<span class="b plain lock" title="Every email here is required">Always On</span>'}</div></div>
      ${f.paused ? '<div class="fbar">This flow is paused. Always-on emails in it still send.</div>' : ''}
      <div class="cv"><div class="lanes ${f.lanes.length === 1 ? 'one' : ''}">${lanes}</div></div>`;
  }

  // ---------- email panel ----------
  const cur = () => E[S.sel];
  const draftOf = (e) => (S.edit && S.edit.id === e.id ? S.edit.f : e);
  function panel() {
    const e = cur(); if (!e) return '';
    const tabs = [['preview', 'Preview'], ['numbers', 'Numbers'], ['who', 'Who Got It'], ['edit', 'Edit']];
    const body = { preview: tPreview, numbers: tNumbers, who: tWho, edit: tEdit }[S.tab](e);
    return `<div class="ep-h"><div class="ep-t"><div class="ep-tt"><h2>${esc(e.n)}</h2><p>${esc(e.w)}</p></div>${e.req ? '<span class="b plain lock" title="Required: this email always sends">Always On</span>' : `<button class="sw ${e.on ? 'on' : ''}" data-act="emOn" data-id="${e.id}" role="switch" aria-checked="${e.on}" aria-label="Email on or off"></button>`}<button class="ic epx" data-act="closePanel" aria-label="Close">✕</button></div>
      <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button class="${S.tab === k ? 'on' : ''}" data-act="tab" data-k="${k}" role="tab" aria-selected="${S.tab === k}">${l}${k === 'edit' && S.edit && S.edit.id === e.id ? '<i class="udot"></i>' : ''}</button>`).join('')}</div></div>
      <div class="ep-b">${body}</div>`;
  }
  const sender = (e) => SENDERS[e.fr] || SENDERS.hello;
  function inbox(d) { const s = sender(d); return `<div class="inbox"><div><span>From</span><b>${esc(s[0])} <em>&lt;${esc(s[1])}&gt;</em></b></div><div><span>Subject</span><b>${fe(d.s)}</b></div><div><span>Preview Text</span><b class="mu">${fe(d.p)}</b></div></div>`; }
  function tPreview(e) {
    const d = draftOf(e);
    return `<div class="pvact"><button class="pill" data-act="test">Send Me a Test</button><button class="pill" data-act="full">Open Full Size</button><div class="seg" role="group" aria-label="Preview size"><button class="${S.dev === 'desktop' ? 'on' : ''}" data-act="dev" data-k="desktop">Desktop</button><button class="${S.dev === 'phone' ? 'on' : ''}" data-act="dev" data-k="phone">Phone</button></div></div>
      ${d !== e ? '<div class="unsaved">Showing unsaved changes from Edit.</div>' : ''}
      ${inbox(d)}<div class="pvw ${S.dev}">${emailHtml(d, S.dev)}</div>`;
  }
  function tNumbers(e) {
    const k = S.range / 30; const sent = Math.round(e.sent * k); const del = Math.round(sent * (1 - e.bounce / 100));
    const r = rng('bars' + e.id + S.range); const n = S.range === 7 ? 7 : S.range === 30 ? 30 : 45; const vals = Array.from({ length: n }, () => 0.25 + r() * 0.75); const mx = Math.max(...vals);
    const tile = (l, v, s) => `<div class="tile"><span>${l}</span><b>${v}</b>${s ? `<small>${s}</small>` : ''}</div>`;
    const links = e.cta ? [[e.cta, Math.round(e.click * 0.82)], ['Logo', Math.round(e.click * 0.1)], [e.mk ? 'Email Preferences' : 'Help Center', Math.round(e.click * 0.08)]] : [];
    return `<div class="seg" style="margin-bottom:14px">${[7, 30, 90].map((d) => `<button class="${S.range === d ? 'on' : ''}" data-act="range" data-k="${d}">${d} Days</button>`).join('')}</div>
      <div class="tiles t3">${tile('Sent', num(sent))}${tile('Delivered', sent ? ((del / sent) * 100).toFixed(1) + '%' : '—', num(del))}${tile('Opened', sent ? e.open + '%' : '—', num(del * e.open / 100))}${tile('Clicked', sent ? e.click + '%' : '—', num(del * e.click / 100))}${tile('Bounced', sent ? e.bounce + '%' : '—', num(sent * e.bounce / 100))}${e.mk ? tile('Unsubscribed', e.unsub + '%', num(del * e.unsub / 100)) : tile('Spam Reports', '0.0%', '0')}</div>
      <div class="card"><div class="ch"><h3>Sent per Day</h3><span class="lab">Last ${S.range} Days</span></div><div class="cb">${sent ? `<div class="bars">${vals.map((v) => `<i style="height:${Math.round(v / mx * 100)}%"></i>`).join('')}</div>` : '<div class="empty">Nothing sent in this period.</div>'}</div></div>
      ${links.length ? `<div class="card"><div class="ch"><h3>Links Clicked</h3><span class="lab">Share of Clicks</span></div><table class="t"><tbody>${links.map(([l, v]) => `<tr><td>${fe(l)}</td><td class="num">${v}%</td></tr>`).join('')}</tbody></table></div>` : ''}
      <div class="card m0"><div class="ch"><h3>Opened On</h3></div><div class="cb"><div class="split"><i style="width:64%"></i></div><div class="splitl"><span>Phone 64%</span><span>Desktop 36%</span></div></div></div>`;
  }
  function tWho(e) {
    const all = recipients(e); const q = S.who.q.toLowerCase();
    const list = all.filter((x) => (S.who.f === 'all' || x.st.toLowerCase() === S.who.f) && (!q || (x.t + x.to).toLowerCase().includes(q)));
    const tl = (x) => { const ev = [['Sent', x.when]]; if (x.st === 'Bounced') ev.push(['Bounced', 'Mailbox does not exist']); else { ev.push(['Delivered', 'A few seconds later']); if (x.st !== 'Delivered') ev.push(['Opened', 'Within the hour']); if (x.st === 'Clicked') ev.push(['Clicked', e.cta ? fill(e.cta) : 'Link']); } return `<div class="tl">${ev.map(([a, b]) => `<div><i></i><b>${a}</b><span>${esc(b)}</span></div>`).join('')}</div>`; };
    return `<div class="whof"><input type="search" placeholder="Search Trader or Email" value="${esc(S.who.q)}" data-live="who.q" data-key="whoq" aria-label="Search recipients"><div class="seg">${[['all', 'All'], ['opened', 'Opened'], ['clicked', 'Clicked'], ['bounced', 'Bounced']].map(([k, l]) => `<button class="${S.who.f === k ? 'on' : ''}" data-act="whoF" data-k="${k}">${l}</button>`).join('')}</div></div>
      <div class="card m0 tsc"><table class="t whot"><thead><tr><th>Trader</th><th>Sent</th><th>Status</th></tr></thead><tbody>${list.length ? list.map((x, i) => `<tr class="lk" data-act="whoRow" data-i="${i}"><td><b>${esc(x.t)}</b><div class="hint mono">${esc(x.to)}</div></td><td class="nw">${esc(x.when)}</td><td><span class="b ${STB[x.st]}">${x.st}</span></td></tr>${S.who.row === i ? `<tr class="tlr"><td colspan="3">${tl(x)}</td></tr>` : ''}`).join('') : '<tr><td colspan="3" class="empty">No one matches.</td></tr>'}</tbody></table></div>
      <p class="hint">Addresses are masked. Open Email Logs for every message.</p>`;
  }
  function tEdit(e) {
    const d = draftOf(e); const ed = !!(S.edit && S.edit.id === e.id);
    const fld = (k, l, ph, ta) => `<div class="fl"><label>${l}</label>${ta ? `<textarea data-live="ef.${k}" data-key="ef${k}" placeholder="${esc(ph || '')}">${esc([].concat(d[k] || []).join('\n\n'))}</textarea>` : `<input value="${esc(d[k] || '')}" data-live="ef.${k}" data-key="ef${k}" placeholder="${esc(ph || '')}">`}</div>`;
    return `<div class="fg">
      <div class="fg2"><div class="fl"><label>From</label><select data-bind="ef.fr">${Object.entries(SENDERS).map(([k, [n, a]]) => `<option value="${k}" ${d.fr === k ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div><div class="fl"><label>Type</label><div class="seg">${[['tx', 'Account Email'], ['mk', 'Marketing']].map(([k, l]) => `<button class="${(d.mk ? 'mk' : 'tx') === k ? 'on' : ''}" data-act="efType" data-k="${k}" ${e.req ? 'disabled' : ''}>${l}</button>`).join('')}</div></div></div>
      ${fld('w', 'When It Sends', 'Describe the trigger')}
      ${fld('s', 'Subject')}${fld('p', 'Preview Text', 'Shown next to the subject in the inbox')}
      <div class="fg2">${fld('e', 'Small Heading')}${fld('cta', 'Button Text', 'No button')}</div>
      <div class="fg2">${fld('h', 'Headline')}${fld('a', 'Highlighted Words', 'Shown in sky blue')}</div>
      ${fld('b', 'Body', 'Leave a blank line between paragraphs', true)}
      ${fld('n2', 'Small Print', 'Optional')}
      ${d.r || d.st || d.c || d.pg || d.al ? `<div class="hint">This email also has ${[d.r && 'a details table', d.st && 'numbered steps', d.c && 'a one-time code', d.pg && 'a progress bar', d.al && 'a warning box'].filter(Boolean).join(', ')}, filled in automatically for each trader.</div>` : ''}
      <div class="fl"><label>Merge Fields</label><div class="chips">${MERGE.map(([t, l]) => `<button class="chip" data-act="copyMerge" data-k="${t}" title="${l}">${t}</button>`).join('')}</div><span class="hint">Click to copy, then paste into any field above.</span></div>
      <div class="edact"><button class="pill pri" data-act="saveEdit" ${ed ? '' : 'disabled'}>Save Changes</button><button class="pill" data-act="discardEdit" ${ed ? '' : 'disabled'}>Discard</button>${e.custom ? '<button class="pill dng" data-act="delEmail">Delete Email</button>' : ''}<span class="hint" style="margin-left:auto">${ed ? 'Unsaved changes' : 'Version ' + e.v}</span></div>
      <div class="sec"><h4>Live Preview</h4>${inbox(d)}<div class="pvw desktop">${emailHtml(d, 'desktop')}</div></div>
      <div class="card m0"><div class="ch"><h3>Version History</h3></div><table class="t"><tbody>${[...e.hist, { v: Math.max(1, e.v - e.hist.length), who: ME, when: 'Nov 3, 2026', text: e.custom ? 'Created' : 'Wording at launch' }].slice(0, 6).map((h) => `<tr><td class="nw mono">v${h.v}</td><td>${esc(h.text)}<div class="hint">${esc(h.who)} · ${esc(h.when)}</div></td></tr>`).join('')}</tbody></table></div>
    </div>`;
  }

  // ---------- tool views ----------
  function vLogs() {
    const L = S.logs; const q = L.q.toLowerCase();
    const list = LOGS.filter((x) => (L.status === 'all' || x.st === L.status) && (L.em === 'all' || x.e === L.em) && (!q || (x.to + x.t + x.id + E[x.e].n).toLowerCase().includes(q)));
    const T = totals(); const bnc = Math.round(T.sent * 0.006); const tot = { Delivered: T.sent - T.failed - bnc, Opened: Math.round(T.sent * T.open / 100), Clicked: Math.round(T.sent * T.click / 100), Bounced: bnc, Failed: T.failed, Complaint: 6 };
    return `<div class="ph"><div><h1>Email Logs</h1><p>Every email sent in the last 30 days, with what happened to it. Failed and bounced emails can be sent again.</p></div></div>
      <div class="tiles t6">${[['Delivered', 'Delivered'], ['Opened', 'Opened'], ['Clicked', 'Clicked'], ['Bounced', 'Bounced'], ['Failed', 'Failed'], ['Complaint', 'Spam Reports']].map(([k, l]) => `<button class="tile lk ${L.status === k ? 'sel' : ''}" data-act="logF" data-k="${k}"><span>${l}</span><b>${num(tot[k])}</b><small>${L.status === k ? 'Filtering below' : 'Last 30 days'}</small></button>`).join('')}</div>
      <div class="card"><div class="ch lgf"><input type="search" placeholder="Search Email, Trader or Message ID" value="${esc(L.q)}" data-live="logs.q" data-key="logq" aria-label="Search logs"><select data-bind="logs.em" aria-label="Email">${'<option value="all">All Emails</option>' + Object.values(E).filter((e) => e.sent).sort((a, b) => a.n.localeCompare(b.n)).map((e) => `<option value="${e.id}" ${L.em === e.id ? 'selected' : ''}>${esc(e.n)}</option>`).join('')}</select><div class="r"><div class="seg">${['all', 'Failed', 'Bounced'].map((k) => `<button class="${L.status === k ? 'on' : ''}" data-act="logF" data-k="${k}">${k === 'all' ? 'All' : k}</button>`).join('')}</div></div></div>
        <div class="tsc"><table class="t"><thead><tr><th>When</th><th>Trader</th><th>Email</th><th>Status</th><th>Details</th><th></th></tr></thead><tbody>${list.length ? list.map((x) => `<tr class="lk" data-act="logRow" data-id="${x.id}"><td class="nw">${esc(x.when)}</td><td class="nw"><b>${esc(x.t)}</b><div class="hint mono">${esc(x.to)}</div></td><td class="nw">${esc(E[x.e].n)}</td><td><span class="b ${STB[x.st]}">${x.st === 'Complaint' ? 'Spam Report' : x.st}</span></td><td class="hint">${esc(x.why || '—')}</td><td class="num nw">${['Failed', 'Bounced'].includes(x.st) ? `<button class="lnk" data-act="resend" data-id="${x.id}">Send Again</button>` : ''}</td></tr>`).join('') : '<tr><td colspan="6" class="empty">No emails match.</td></tr>'}</tbody></table></div></div>
      <p class="hint">Logs are kept for 30 days. Message IDs match the ones in [Email Provider].</p>`;
  }
  function logDrawer() {
    const x = LOGS.find((l) => l.id === S.logs.row); if (!x) return ''; const e = E[x.e];
    const ev = [['Queued', x.when], ['Sent to [Email Provider]', 'Same second']];
    if (x.st === 'Failed') ev.push(['Failed', x.why]); else if (x.st === 'Bounced') ev.push(['Bounced', x.why]); else { ev.push(['Delivered', 'A few seconds later']); if (['Opened', 'Clicked', 'Complaint'].includes(x.st)) ev.push(['Opened', 'Within the hour']); if (x.st === 'Clicked') ev.push(['Clicked', fill(e.cta || 'Link')]); if (x.st === 'Complaint') ev.push(['Spam Report', 'The address was added to the Suppression List']); }
    return `<div class="drw-bg" data-act="closeLog"></div><div class="drw" role="dialog" aria-label="Message details"><div class="drw-h"><h3>${esc(e.n)}</h3><button class="ic" data-act="closeLog" style="margin-left:auto" aria-label="Close">✕</button></div><div class="drw-b">
      <div class="sec"><h4>Message</h4><div class="kv"><div><span>To</span><b class="mono">${esc(x.to)}</b></div><div><span>Trader</span><b>${esc(x.t)}</b></div><div><span>Subject</span><b>${fe(e.s)}</b></div><div><span>From</span><b>${esc(sender(e)[1])}</b></div><div><span>Message ID</span><b class="mono">${x.id}</b></div><div><span>Status</span><b><span class="b ${STB[x.st]}">${x.st === 'Complaint' ? 'Spam Report' : x.st}</span></b></div></div></div>
      <div class="sec"><h4>What Happened</h4><div class="tl">${ev.map(([a, b]) => `<div><i></i><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('')}</div></div>
      <div class="sec"><h4>Email</h4><div class="pvw desktop">${emailHtml(e, 'desktop')}</div></div>
    </div><div class="drw-f">${['Failed', 'Bounced'].includes(x.st) ? `<button class="pill pri" data-act="resend" data-id="${x.id}">Send Again</button>` : ''}<button class="pill" data-act="viewEmail" data-id="${x.e}">Open This Email</button><button class="pill" data-act="closeLog">Close</button></div></div>`;
  }
  function vDomain() {
    const R = S.rules;
    const dns = [['TXT', 'mail.fundedsky.com', 'v=spf1 include:[provider-spf] ~all', 'SPF'], ['CNAME', 'fs1._domainkey.mail.fundedsky.com', 'fs1.dkim.[provider].com', 'DKIM'], ['CNAME', 'fs2._domainkey.mail.fundedsky.com', 'fs2.dkim.[provider].com', 'DKIM'], ['MX', 'bounce.mail.fundedsky.com', 'feedback-smtp.[provider].com', 'Return Path'], ['TXT', '_dmarc.fundedsky.com', 'v=DMARC1; p=quarantine; rua=mailto:dmarc@fundedsky.com', 'DMARC']];
    return `<div class="ph"><div><h1>Sending Domain</h1><p>Where emails come from, and the records that keep them out of spam folders. All domains are listed in ${XL('Settings', 'domains', 'Settings')}.</p></div></div>
      <div class="two">
        <div class="card m0"><div class="ch"><h3>Provider</h3></div><div class="cb fg">
          <div class="prov"><span class="imono">EM</span><div><b>[Email Provider]</b><div class="hint">Primary · sends every email</div></div><span class="b live">Connected</span></div>
          <div class="prov"><span class="imono">BK</span><div><b>[Backup Provider]</b><div class="hint">Takes over if the primary fails</div></div><span class="b ret">Not Set Up</span></div>
          <label class="chk"><input type="checkbox" ${R.failover ? 'checked' : ''} data-bind="rules.failover"> Switch to the Backup Automatically After 3 Failed Sends in a Row</label>
          <button class="pill" data-act="goIntg" style="justify-self:start">Manage Keys in Integrations</button>
        </div></div>
        <div class="card m0"><div class="ch"><h3>Domain</h3><div class="r"><span class="b live">Verified</span></div></div><div class="cb"><div class="kv"><div><span>Domain</span><b class="mono">mail.fundedsky.com</b></div><div><span>Verified</span><b>Nov 2, 2026</b></div><div><span>Daily Limit</span><b>50,000</b></div><div><span>Sent Today</span><b>${num(totals().today)}</b></div></div></div></div>
      </div>
      <div class="card" style="margin-top:14px"><div class="ch"><h3>DNS Records</h3><span class="lab">Add These at Your Domain Host</span><div class="r"><button class="pill sm" data-act="checkDns">Check Again</button></div></div><div class="tsc"><table class="t"><thead><tr><th>Purpose</th><th>Type</th><th>Host</th><th>Value</th><th>Status</th><th></th></tr></thead><tbody>${dns.map(([t, h, v, p]) => `<tr><td class="nw"><b>${p}</b></td><td class="mono">${t}</td><td class="mono nw">${h}</td><td class="mono dnsv">${esc(v)}</td><td><span class="b live">Verified</span></td><td class="num"><button class="lnk" data-act="copy" data-k="${esc(v)}">Copy</button></td></tr>`).join('')}</tbody></table></div></div>
      <div class="card"><div class="ch"><h3>Sender Addresses</h3><span class="lab">Replies Go to Support</span></div><div class="tsc"><table class="t"><thead><tr><th>Name</th><th>Address</th><th>Used For</th><th class="num">Emails</th></tr></thead><tbody>${Object.entries(SENDERS).map(([k, [n, a]]) => { const c = Object.values(E).filter((e) => e.fr === k); return `<tr><td class="nw"><b>${esc(n)}</b></td><td class="mono">${a}</td><td>${esc(c.slice(0, 3).map((e) => e.n).join(', '))}${c.length > 3 ? ` and ${c.length - 3} more` : ''}</td><td class="num">${c.length}</td></tr>`; }).join('')}</tbody></table></div></div>`;
  }
  function vRules() {
    const R = S.rules; const mk = Object.values(E).filter((e) => e.mk);
    return `<div class="ph"><div><h1>Sending Rules</h1><p>Limits on marketing emails. Account emails, like codes, receipts and risk alerts, always send right away. Customer segments for campaigns come from ${XL('Analytics', 'segments', 'Analytics')}.</p></div></div>
      <div class="card ${R.pauseMk ? 'warnc' : ''}"><div class="ch"><h3>Pause All Marketing</h3><span class="lab">${mk.length} Marketing Emails</span><div class="r"><button class="sw ${R.pauseMk ? 'on' : ''}" data-act="rule" data-k="pauseMk" role="switch" aria-checked="${R.pauseMk}" aria-label="Pause all marketing"></button></div></div><div class="cb hint">Stops every marketing email at once, for example during an outage. Account emails keep sending.</div></div>
      <div class="two">
        <div class="card m0"><div class="ch"><h3>Quiet Hours</h3><div class="r"><button class="sw ${R.quiet ? 'on' : ''}" data-act="rule" data-k="quiet" role="switch" aria-checked="${R.quiet}" aria-label="Quiet hours"></button></div></div><div class="cb fg"><div class="fg2"><div class="fl"><label>From</label><input type="time" value="${R.qFrom}" data-bind="rules.qFrom"></div><div class="fl"><label>Until</label><input type="time" value="${R.qTo}" data-bind="rules.qTo"></div></div><span class="hint">In each trader's own time zone. Marketing emails due in quiet hours wait until morning.</span></div></div>
        <div class="card m0"><div class="ch"><h3>How Often</h3></div><div class="cb fg"><div class="fg2"><div class="fl"><label>Most Marketing Emails per Day</label><select data-bind="rules.capDay">${['1', '2', '3'].map((v) => `<option ${R.capDay === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div><div class="fl"><label>Most per Week</label><select data-bind="rules.capWeek">${['2', '3', '5', '7'].map((v) => `<option ${R.capWeek === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div><label class="chk"><input type="checkbox" ${R.noMkAfterBreach ? 'checked' : ''} data-bind="rules.noMkAfterBreach"> No Marketing for 24 Hours After an Account Closes</label></div></div>
      </div>
      <div class="card" style="margin-top:14px"><div class="ch"><h3>Test Mode</h3><span class="lab">${R.test ? 'On: No Trader Gets Anything' : 'Off'}</span><div class="r"><button class="sw ${R.test ? 'on' : ''}" data-act="rule" data-k="test" role="switch" aria-checked="${R.test}" aria-label="Test mode"></button></div></div><div class="cb fg"><div class="fl"><label>Send Everything To</label><input value="${esc(R.testTo)}" data-bind="rules.testTo"></div><span class="hint">Every email, account emails included, goes to this inbox instead of the trader. Use it on staging, never in production.</span></div></div>`;
  }
  function vBrand() {
    const B = S.brand;
    return `<div class="ph"><div><h1>Brand and Footer</h1><p>The header and footer every email shares. Changes apply to all ${Object.keys(E).length} emails. Logo and colors come from ${XL('Settings', 'brand', 'Settings')}.</p></div></div>
      <div class="two wl"><div class="card m0"><div class="ch"><h3>Footer</h3></div><div class="cb fg">
        <div class="fl"><label>Company Address</label><input value="${esc(B.address)}" data-live="brand.address" data-key="baddr"><span class="hint">Required by anti-spam laws in most countries.</span></div>
        <div class="fl"><label>Support Email</label><input value="${esc(B.support)}" data-live="brand.support" data-key="bsup"></div>
        <div class="fl"><label>Legal Line</label><textarea data-live="brand.legal" data-key="blegal">${esc(B.legal)}</textarea></div>
        <div class="fg2"><div class="fl"><label>X</label><input value="${esc(B.x)}" data-live="brand.x" data-key="bx"></div><div class="fl"><label>Discord</label><input value="${esc(B.discord)}" data-live="brand.discord" data-key="bd"></div></div>
        <div class="fl"><label>Header</label><div class="brandrow"><span class="em-logo">fundedsky<i>futures</i></span><span class="hint">Logo and sky accent come from the Funded Sky design system.</span></div></div>
      </div></div>
      <div class="card m0"><div class="ch"><h3>Preview</h3><span class="lab">Welcome to Funded Sky</span></div><div class="cb"><div class="pvw desktop">${emailHtml(E.welcome, 'desktop')}</div></div></div></div>`;
  }
  function vSupp() {
    const c = (k) => S.supp.filter((x) => x.k === k).length;
    return `<div class="ph"><div><h1>Suppression List</h1><p>Addresses that won't get some or all emails. Bounces and spam reports are added automatically.</p></div></div>
      <div class="tiles t3">${[['Bounced', 'Get nothing until removed'], ['Complained', 'Get account emails only'], ['Unsubscribed', 'Get account emails only']].map(([k, s]) => `<div class="tile"><span>${k === 'Complained' ? 'Spam Reports' : k}</span><b>${c(k)}</b><small>${s}</small></div>`).join('')}</div>
      <div class="card"><div class="ch"><h3>Addresses</h3><div class="r addr"><input placeholder="name@example.com" data-key="suppadd" id="suppadd" aria-label="Address to add"><button class="pill sm" data-act="suppAdd">Add Address</button></div></div><div class="tsc"><table class="t"><thead><tr><th>Address</th><th>Reason</th><th>Details</th><th>Added</th><th></th></tr></thead><tbody>${S.supp.length ? S.supp.map((x, i) => `<tr><td class="mono">${esc(x.a)}</td><td><span class="b ${x.k === 'Bounced' ? 'err' : x.k === 'Complained' ? 'draft' : 'plain'}">${x.k === 'Complained' ? 'Spam Report' : x.k}</span></td><td class="hint">${esc(x.why)}</td><td class="nw">${esc(x.d)}</td><td class="num"><button class="lnk" data-act="suppDel" data-i="${i}">Remove</button></td></tr>`).join('') : '<tr><td colspan="5" class="empty">No suppressed addresses.</td></tr>'}</tbody></table></div></div>
      <p class="hint">Removing a bounced address lets the next email try again. Only remove spam reports if the trader asks.</p>`;
  }
  function fullModal() {
    if (!S.full) return ''; const d = draftOf(cur());
    return `<div class="mdl-bg" data-act="closeFull"></div><div class="mdl" role="dialog" aria-label="Full size preview"><div class="mdl-h"><b>${esc(d.n)}</b><div class="seg">${[['desktop', 'Desktop'], ['phone', 'Phone']].map(([k, l]) => `<button class="${S.dev === k ? 'on' : ''}" data-act="dev" data-k="${k}">${l}</button>`).join('')}</div><button class="ic" data-act="closeFull" aria-label="Close">✕</button></div><div class="mdl-b">${inbox(d)}<div class="pvw ${S.dev} big">${emailHtml(d, S.dev)}</div></div></div>`;
  }

  // ---------- render ----------
  const toast = (t) => { S.toast = t; render(); clearTimeout(toast.t); toast.t = setTimeout(() => { S.toast = ''; render(); }, 2400); };
  function render() {
    const T = totals(); const m = root.querySelector('.main'); const st = m ? m.scrollTop : 0; const pb = root.querySelector('.ep-b'); const pst = pb ? pb.scrollTop : 0;
    const views = { flow: vFlow, logs: vLogs, domain: vDomain, rules: vRules, brand: vBrand, supp: vSupp };
    const isFlow = S.view === 'flow';
    root.innerHTML = `<div class="tb"><a class="pill bk" href="AdminHome.dc.html" aria-label="Back to Admin">←<span class="lg"> Back to Admin</span></a><span class="tb-t">Emails</span>
      <div class="tb-mid hm"><div class="tb-stats"><div><span>Sent Today</span><b>${num(T.today)}</b></div><div><span>7 Days</span><b>${num(T.week)}</b></div><div><span>30 Days</span><b>${num(T.sent)}</b></div><div><span>Opened</span><b>${T.open}%</b></div><div><span>Clicked</span><b>${T.click}%</b></div><div><span>Failed</span><b class="bad">${T.failed}</b></div></div></div>
      <div class="igs hm"><button class="ig" data-act="go" data-v="domain" title="[Email Provider]: connected" aria-label="Email provider"><span>EM</span><i style="background:var(--ok)"></i></button><button class="sendw" data-act="go" data-v="domain">Sending with [Email Provider]</button></div>
      ${S.rules.test ? '<span class="envchip">Test Mode</span>' : S.rules.pauseMk ? '<span class="envchip">Marketing Paused</span>' : ''}
      <button class="pill ${S.view === 'logs' ? 'act' : ''}" data-act="go" data-v="logs">Email Logs</button></div>
    <div class="body ${isFlow ? '' : 'wide'}"><div class="mnav"><select id="mnavsel" aria-label="Go to section">${mnavHtml()}</select></div><nav class="nav" aria-label="Email flows">${navHtml()}</nav><main class="main ${isFlow ? 'flowv' : ''}">${(views[S.view] || views[(S.view = 'flow')])()}${S.view === 'logs' ? logDrawer() : ''}</main>${isFlow ? `<div class="ep-bg ${S.panel ? 'open' : ''}" data-act="closePanel"></div><aside class="ep ${S.panel ? 'open' : ''}" aria-label="Email details">${panel()}</aside>` : ''}</div>
    ${fullModal()}${S.toast ? `<div class="toast" role="status">${esc(S.toast)}</div>` : ''}`;
    const m2 = root.querySelector('.main'); if (m2) m2.scrollTop = st; const pb2 = root.querySelector('.ep-b'); if (pb2) pb2.scrollTop = pst;
    if (S.focus) { const el = root.querySelector(`[data-key="${S.focus.k}"]`); if (el) { el.focus(); try { el.setSelectionRange(S.focus.s, S.focus.s); } catch (x) { /* not a text field */ } } S.focus = null; }
  }

  // ---------- events ----------
  const startEdit = (e) => { if (!S.edit || S.edit.id !== e.id) S.edit = { id: e.id, f: JSON.parse(JSON.stringify(e)) }; return S.edit.f; };
  root.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]'); if (!el || !root.contains(el)) return;
    if (el.tagName === 'INPUT' && el.type !== 'checkbox') return;
    const a = el.dataset.act, id = el.dataset.id, k = el.dataset.k, i = +el.dataset.i; const e = cur();
    switch (a) {
      case 'go': S.view = el.dataset.v; S.logs.row = null; S.panel = false; break;
      case 'flow': { S.panel = false; if (S.view === 'flow' && S.flow === id) S.open[id] = !S.open[id]; else { S.open = { [id]: true }; S.flow = id; S.view = 'flow'; const first = emailsIn(FLOWS.find((f) => f.id === id))[0]; if (first) { S.sel = first.id; S.who.row = -1; } } break; }
      case 'pick': { const f = flowOf(id); S.view = 'flow'; if (S.flow !== f.id) S.open = {}; S.flow = f.id; S.open[f.id] = true; S.sel = id; S.panel = true; S.who.row = -1; if (S.edit && S.edit.id !== id) S.edit = null; if (S.tab === 'edit' && !E[id].custom) S.tab = S.tab; break; }
      case 'closePanel': S.panel = false; break;
      case 'tab': S.tab = k; break;
      case 'emOn': { const x = E[id]; x.on = !x.on; if (x.draft && x.on) x.draft = false; toast(`${x.n} ${x.on ? 'turned on' : 'turned off'}`); return; }
      case 'flowOn': { const f = FLOWS.find((x) => x.id === id); f.paused = !f.paused; toast(f.paused ? `${f.name} paused. Always-on emails still send.` : `${f.name} is on`); return; }
      case 'dev': S.dev = k; break;
      case 'test': toast(`Test of "${e.n}" sent to ${S.rules.testTo}`); return;
      case 'full': S.full = true; break;
      case 'closeFull': S.full = false; break;
      case 'range': S.range = +k; break;
      case 'whoF': S.who.f = k; S.who.row = -1; break;
      case 'whoRow': S.who.row = S.who.row === i ? -1 : i; break;
      case 'efType': if (e.req) return; startEdit(e).mk = k === 'mk' ? 1 : 0; break;
      case 'copyMerge': try { navigator.clipboard.writeText(k); } catch (x) { /* clipboard blocked */ } toast(`Copied ${k}`); return;
      case 'saveEdit': { if (!S.edit) return; const f = S.edit.f; const keep = { id: e.id, sent: e.sent, open: e.open, click: e.click, bounce: e.bounce, unsub: e.unsub, on: e.on, hist: e.hist, custom: e.custom, draft: e.draft, req: e.req };
        Object.assign(e, f, keep); e.v += 1; e.hist.unshift({ v: e.v, who: ME, when: 'Just now', text: 'Edited wording' }); S.edit = null; toast(`Saved. Version ${e.v} sends from now on.`); return; }
      case 'discardEdit': S.edit = null; break;
      case 'delEmail': { const f = flowOf(e.id); f.lanes.forEach((l) => { const j = l.indexOf('E:' + e.id); if (j >= 0) l.splice(j, 1); }); delete E[e.id]; S.sel = (emailsIn(f)[0] || {}).id; S.edit = null; S.tab = 'preview'; toast('Email deleted'); return; }
      case 'addEmail': { const f = FLOWS.find((x) => x.id === id); const nid = uid('custom'); E[nid] = { id: nid, n: '[New Email]', w: 'Set when this sends', fr: 'hello', s: '[Subject]', p: '[Preview text]', e: '[Small Heading]', h: '[Headline]', a: '', b: ['[Body]'], cta: '', sent: 0, open: 0, click: 0, bounce: 0, unsub: 0, on: false, draft: true, custom: true, v: 1, hist: [] }; f.lanes[i].push('E:' + nid); S.sel = nid; S.tab = 'edit'; S.panel = true; startEdit(E[nid]); toast('New email added as a draft. It stays off until you turn it on.'); return; }
      case 'logF': S.logs.status = S.logs.status === k ? 'all' : k; break;
      case 'logRow': S.logs.row = id; break;
      case 'closeLog': S.logs.row = null; break;
      case 'resend': { const x = LOGS.find((l) => l.id === id); if (S.supp.some((s) => s.a === x.to && s.k !== 'Unsubscribed')) { toast(`${x.to} is on the Suppression List. Remove it first.`); return; } x.st = 'Delivered'; x.why = 'Sent again by ' + ME; toast('Sent again'); return; }
      case 'viewEmail': S.view = 'flow'; S.flow = flowOf(id).id; S.open = { [S.flow]: true }; S.sel = id; S.panel = true; S.tab = 'preview'; S.logs.row = null; break;
      case 'goIntg': toast('Opens Integrations in the Checkout Catalog'); return;
      case 'checkDns': toast('All 5 records verified'); return;
      case 'copy': try { navigator.clipboard.writeText(k); } catch (x) { /* clipboard blocked */ } toast('Copied'); return;
      case 'rule': S.rules[k] = !S.rules[k]; break;
      case 'suppDel': { const x = S.supp.splice(i, 1)[0]; toast(`${x.a} removed`); return; }
      case 'suppAdd': { const inp = root.querySelector('#suppadd'); const v = (inp.value || '').trim(); if (!/^\S+@\S+\.\S+$/.test(v)) { toast('Enter a full email address'); return; } S.supp.unshift({ a: v, k: 'Unsubscribed', why: 'Added by ' + ME, d: 'Nov 22' }); toast(`${v} added`); return; }
      default: return;
    }
    render();
  });
  root.addEventListener('input', (ev) => {
    const el = ev.target; const lv = el.dataset && el.dataset.live; if (!lv) return;
    const [o, k] = lv.split('.');
    if (o === 'ef') { const f = startEdit(cur()); f[k] = k === 'b' ? el.value.split(/\n\s*\n/) : el.value; }
    else if (o === 'who') { S.who.q = el.value; S.who.row = -1; }
    else if (o === 'logs') S.logs.q = el.value;
    else if (o === 'brand') S.brand[k] = el.value;
    S.focus = { k: el.dataset.key, s: el.selectionStart };
    render();
  });
  root.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.id === 'mnavsel') { const [t, v] = el.value.split(':'); if (t === 'f') { S.view = 'flow'; S.flow = v; S.open = { [v]: true }; const first = emailsIn(FLOWS.find((f) => f.id === v))[0]; if (first) S.sel = first.id; S.panel = false; } else S.view = v; render(); const m = root.querySelector('.main'); if (m) m.scrollTop = 0; return; }
    const b = el.dataset.bind; if (!b) return; const [o, k] = b.split('.');
    if (o === 'ef') startEdit(cur())[k] = el.value;
    else if (o === 'logs') S.logs[k] = el.value;
    else if (o === 'rules') S.rules[k] = el.type === 'checkbox' ? el.checked : el.value;
    render();
  });
  document.addEventListener('keydown', (ev) => { if (!root.isConnected) return; if (ev.key === 'Escape') { if (S.full) S.full = false; else if (S.logs.row) S.logs.row = null; else if (S.panel) S.panel = false; else return; render(); } });

  function ROUTE(hv, P) { if (hv) S.view = hv; if (P.flow) { S.flow = P.flow; S.open[P.flow] = true; } }
  // deep links: Board.dc.html#view?key=value
  const DEEP = () => { try { const raw = decodeURIComponent((location.hash || '').slice(1)); if (!raw) return; const [hv, hq] = raw.split('?'); const P = {}; (hq || '').split('&').forEach((kv) => { const [k, v] = kv.split('='); if (k) P[k] = v || ''; }); ROUTE(hv, P); } catch (e) { /* no deep link */ } };
  DEEP();
  window.addEventListener('hashchange', () => { if (!root.isConnected) return; if ('drawer' in S) S.drawer = null; DEEP(); render(); const mm = root.querySelector('.main'); if (mm) mm.scrollTop = 0; });
  render();
