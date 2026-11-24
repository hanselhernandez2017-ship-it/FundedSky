
  // ================= INTEGRATIONS =================
  const WH = 'https://api.fundedsky.com/webhooks/';
  S.integrations = [
    { id: 'card', group: 'Payments', name: 'TailoredPay', role: 'Card processor · primary', mono: 'TP', status: 'connected', env: 'sandbox', last: 'Today, 11:03 AM',
      fields: [['merchantId', 'Merchant ID', 'text', 'MID-[000000]'], ['publicKey', 'Public Key', 'text', 'pk_test_[••••]8F2A'], ['secretKey', 'Secret Key', 'secret', 'sk_test_51Hx••••••••Q9'], ['webhookSecret', 'Webhook Signing Secret', 'secret', 'whsec_••••••••3kP']],
      toggles: [['threeDS', '3-D Secure on every card payment', true], ['saveCards', 'Save card tokens for resets and renewals', true]], events: ['payment.succeeded', 'payment.failed', 'refund.created', 'dispute.opened'] },
    { id: 'crypto', group: 'Payments', name: 'Confirmo', role: 'Crypto payments and payouts', mono: 'CF', status: 'connected', env: 'sandbox', last: 'Yesterday, 6:40 PM',
      fields: [['apiKey', 'API Key', 'secret', 'cfm_••••••••••7Re'], ['callbackPassword', 'Callback Password', 'secret', '••••••••••'], ['settlement', 'Settle In', 'select:USDC,USDT,USD (bank)', 'USDC']],
      toggles: [['btc', 'Accept BTC', true], ['eth', 'Accept ETH', true], ['stable', 'Accept USDT and USDC', true]], events: ['invoice.paid', 'invoice.expired', 'payout.completed'] },
    { id: 'card2', group: 'Payments', name: '[Backup Card Processor]', role: 'Card processor · backup', mono: 'BP', status: 'off', env: 'sandbox', last: '',
      fields: [['merchantId', 'Merchant ID', 'text', ''], ['apiKey', 'API Key', 'secret', ''], ['webhookSecret', 'Webhook Signing Secret', 'secret', '']],
      toggles: [['failover', 'Take over automatically if the primary declines with a processor error', true]], events: ['payment.succeeded', 'payment.failed', 'refund.created', 'dispute.opened'] },
    { id: 'stripe', group: 'Payments', name: 'Stripe', role: 'Example only', mono: 'S', status: 'off', env: 'sandbox', last: '', note: 'Stripe\'s restricted businesses list prohibits funded prop trading, so it can\'t be used for Funded Sky. It\'s here only to show what setting up a processor looks like.',
      fields: [['publishableKey', 'Publishable Key', 'text', ''], ['secretKey', 'Secret Key', 'secret', ''], ['webhookSecret', 'Webhook Signing Secret', 'secret', '']],
      toggles: [['radar', 'Fraud screening', true]], events: ['checkout.session.completed', 'charge.refunded', 'charge.dispute.created'] },
    { id: 'rise', group: 'Payouts', name: 'Rise', role: 'Trader payouts', mono: 'R', status: 'connected', env: 'sandbox', last: 'Today, 9:15 AM',
      fields: [['apiKey', 'API Key', 'secret', 'rise_••••••••••2Lm'], ['companyId', 'Company ID', 'text', '[Company ID]'], ['reserveAlert', 'Alert When Payout Balance Falls Below ($)', 'text', '25000']],
      toggles: [['autoKyc', 'Require Rise identity check before the first payout', true]], events: ['payout.sent', 'payout.failed', 'payee.onboarded'] },
    { id: 'sumsub', group: 'Identity', name: 'Sumsub', role: 'KYC and sanctions checks', mono: 'SS', status: 'attention', env: 'sandbox', last: '3 days ago', warn: 'Webhook signature failed on the last 2 calls. Check the signing secret.',
      fields: [['appToken', 'App Token', 'secret', 'sbx:••••••••••Yk'], ['secretKey', 'Secret Key', 'secret', '••••••••••'], ['level', 'Verification Level', 'text', 'funded-trader-kyc'], ['webhookSecret', 'Webhook Signing Secret', 'secret', '••••••••']],
      toggles: [['liveness', 'Liveness selfie', true], ['aml', 'Sanctions, PEP and adverse media screening', true]], events: ['applicantReviewed', 'applicantPending', 'applicantOnHold'] },
    { id: 'posthog', group: 'Analytics', name: 'PostHog', role: 'Product analytics', mono: 'PH', status: 'connected', env: 'live', last: 'Just now',
      fields: [['projectKey', 'Project API Key', 'text', 'phc_[••••]'], ['host', 'Host', 'text', 'https://us.i.posthog.com']],
      toggles: [['replay', 'Session replays on checkout', true], ['server', 'Send purchases from the server', true]], events: [] },
    { id: 'email', group: 'Messages', name: '[Email Provider]', role: 'Receipts and account emails', mono: 'EM', status: 'off', env: 'sandbox', last: '',
      fields: [['apiKey', 'API Key', 'secret', ''], ['from', 'Send From', 'text', 'accounts@fundedsky.com']],
      toggles: [['receipts', 'Send receipts', true]], events: ['delivered', 'bounced', 'complained'] }
  ];
  const istat = { connected: ['Connected', 'live', 'var(--ok)'], attention: ['Needs Attention', 'draft', 'var(--wa)'], off: ['Not Set Up', 'ret', 'var(--fa)'] };
  const intgDot = (x) => `<button class="ig" data-act="editIntg" data-id="${x.id}" title="${esc(x.name)}: ${istat[x.status][0]}" aria-label="${esc(x.name)} settings, ${istat[x.status][0]}"><span>${esc(x.mono)}</span><i style="background:${istat[x.status][2]}"></i></button>`;

  function vIntegrations() {
    const groups = [...new Set(S.integrations.map((x) => x.group))];
    return `<div class="ph"><div><h1>Integrations</h1><p>The services the checkout and payouts run on. Set keys, switch between sandbox and live, and check that webhooks are arriving.</p></div></div>
    ${groups.map((g) => `<h5 style="margin:6px 0 10px;font-size:12.5px;color:var(--mu);font-weight:600">${g}</h5><div class="igrid">${S.integrations.filter((x) => x.group === g).map((x) => { const [st, cls] = istat[x.status]; return `<button class="icard" data-act="editIntg" data-id="${x.id}"><span class="imono">${esc(x.mono)}</span><span style="flex:1;min-width:0;text-align:left"><b>${esc(x.name)}</b><small>${esc(x.role)}</small></span><span style="display:flex;flex-direction:column;align-items:flex-end;gap:6px"><span class="b ${cls}">${st}</span><small class="nw" style="color:var(--fa)">${x.status === 'off' ? '' : (x.env === 'live' ? 'Live' : 'Sandbox')}</small></span></button>`; }).join('')}</div>`).join('')}
    <p class="hint">Keys are stored encrypted in the secrets manager and are never shown again in full after saving. Every key change is written to the audit log without the key itself.</p>`;
  }

  function intgDrawer(f) {
    const [st, cls] = istat[f.status];
    const field = ([k, label, type, ph]) => {
      if (type.startsWith('select:')) return `<div class="fl"><label>${label}</label><select data-dfv="${k}">${type.slice(7).split(',').map((o) => `<option ${f.vals[k] === o ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
      const secret = type === 'secret'; const shown = f.show[k];
      return `<div class="fl"><label>${label}</label><div class="rowx" style="grid-template-columns:1fr auto"><input type="${secret && !shown ? 'password' : 'text'}" value="${esc(f.vals[k] || '')}" placeholder="${secret ? 'Paste the key' : 'Enter value'}" data-dfv="${k}" autocomplete="off" spellcheck="false" class="mono-in">${secret ? `<button class="pill sm" data-act="intgShow" data-k="${k}">${shown ? 'Hide' : 'Show'}</button>` : ''}</div></div>`;
    };
    return { title: f.name, body: `
      <div style="display:flex;align-items:center;gap:12px"><span class="imono" style="width:44px;height:44px">${esc(f.mono)}</span><div style="flex:1"><b style="font-size:15px">${esc(f.name)}</b><div class="hint">${esc(f.role)}</div></div><span class="b ${cls}">${st}</span></div>
      ${f.note ? `<div class="sec" style="border-color:rgba(242,119,127,.45)"><div style="font-size:13px;color:var(--t2);line-height:1.5"><b style="color:var(--no)">Not for Funded Sky.</b> ${esc(f.note)}</div></div>` : ''}
      ${f.warn ? `<div class="sec" style="border-color:rgba(242,196,109,.45)"><div style="font-size:13px;color:var(--t2);line-height:1.5"><b style="color:var(--wa)">Needs attention.</b> ${esc(f.warn)}</div></div>` : ''}
      <div class="fl"><label>Environment</label><div class="seg">${[['sandbox', 'Sandbox'], ['live', 'Live']].map(([k, l]) => `<button class="${f.env === k ? 'on' : ''}" data-act="intgEnv" data-k="${k}">${l}</button>`).join('')}</div><span class="hint">${f.env === 'live' ? 'Real money. Switching to live needs a second approval.' : 'Test mode: no real money moves.'}</span></div>
      <div class="sec"><h4>Keys</h4><div class="fg">${f.fields.map(field).join('')}</div></div>
      ${f.events.length ? `<div class="sec"><h4>Webhook</h4><div class="fg"><div class="fl"><label>Paste This URL in ${esc(f.name)}'s Dashboard</label><div class="rowx" style="grid-template-columns:1fr auto"><input value="${WH + f.id}" readonly class="mono-in"><button class="pill sm" data-act="intgCopy">Copy</button></div></div>
        <div class="fl"><label>Events We Listen For</label><div style="display:flex;flex-wrap:wrap;gap:6px">${f.events.map((e) => `<span class="b plain mono" style="font-size:11.5px">${e}</span>`).join('')}</div></div>
        <div class="hint">${f.last ? 'Last event received ' + esc(f.last) + '.' : 'No events received yet.'} Every event is checked against the signing secret before we act on it.</div></div></div>` : ''}
      ${f.toggles.length ? `<div class="sec"><h4>Settings</h4><div class="fg">${f.toggles.map(([k, l]) => `<label class="chk"><input type="checkbox" ${f.tg[k] ? 'checked' : ''} data-dft2="${k}"> ${esc(l)}</label>`).join('')}</div></div>` : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="pill" data-act="intgTest">Test Connection</button>${f.status !== 'off' ? '<button class="pill dng" data-act="intgOff">Disconnect</button>' : ''}</div>`, foot: f.status === 'off' ? 'Connect' : 'Save' };
  }
