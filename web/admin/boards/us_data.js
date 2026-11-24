  const ME = '[Your Name]';
  const RV2 = '[Second Reviewer]';
  const PROV = 'Sumsub';
  const rng = (seed) => { let h = 2166136261; for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; };
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const FULL = ['Jane Dalton', 'Marcus Torres', 'Priya Shah', 'Diego Romero', 'Amara Okafor', 'Kenji Mori', 'Sofia Lopez', 'Liam Keller', 'Noah Brooks', 'Elena Volkova', 'Omar Haddad', 'Chen Wang', 'Lucas Pereira', 'Hana Kim', 'Ivan Petrov', 'Zoe Adler', 'Mateo Garcia', 'Aisha Nwosu', 'Felix Bauer', 'Grace Taylor', 'Arjun Rao', 'Nina Schulz', 'Theo Martin', 'Yara Farah', 'Jonas Eriksson', 'Maya Cruz',
    'Ethan Cole', 'Lina Haddou', 'Ravi Menon', 'Clara Novak', 'Tomas Silva', 'Mei Tanaka', 'Samuel Osei', 'Freya Lund', 'Pablo Ortiz', 'Ines Duarte', 'Kofi Mensah', 'Anya Ivanova'];
  const CTRY = ['United States', 'United Kingdom', 'India', 'Mexico', 'Nigeria', 'Japan', 'Spain', 'Canada', 'Australia', 'Germany', 'UAE', 'Singapore', 'Brazil', 'South Korea', 'Poland', 'Poland', 'Argentina', 'Kenya', 'Netherlands', 'Philippines', 'India', 'Italy', 'Ireland', 'Turkey', 'Sweden', 'Chile',
    'United States', 'France', 'India', 'Czechia', 'Portugal', 'Japan', 'Ghana', 'Norway', 'Colombia', 'Portugal', 'Ghana', 'Cyprus'];
  const CITY = { 'United States': 'Austin', 'United Kingdom': 'Manchester', India: 'Pune', Mexico: 'Guadalajara', Nigeria: 'Lagos', Japan: 'Osaka', Spain: 'Valencia', Canada: 'Toronto', Australia: 'Brisbane', Germany: 'Hamburg', UAE: 'Dubai', Singapore: 'Singapore', Brazil: 'São Paulo', 'South Korea': 'Busan', Poland: 'Kraków', Argentina: 'Córdoba', Kenya: 'Nairobi', Netherlands: 'Utrecht', Philippines: 'Cebu', Italy: 'Turin', Ireland: 'Cork', Turkey: 'Izmir', Sweden: 'Gothenburg', Chile: 'Santiago', France: 'Lyon', Czechia: 'Brno', Portugal: 'Porto', Ghana: 'Accra', Norway: 'Bergen', Colombia: 'Medellín', Cyprus: 'Limassol' };
  const TZ = { 'United States': 'Central Time', 'United Kingdom': 'London', India: 'India Time', Mexico: 'Central Time', Japan: 'Tokyo', Australia: 'Brisbane', Canada: 'Eastern Time', UAE: 'Dubai', Singapore: 'Singapore', Brazil: 'São Paulo', 'South Korea': 'Seoul', Argentina: 'Buenos Aires', Philippines: 'Manila', Chile: 'Santiago', Colombia: 'Bogotá' };
  const PLANS = [['[Plan A Name]', [25000, 50000]], ['[Plan B Name]', [50000, 100000, 150000]], ['[Plan C Name]', [25000, 50000, 100000]]];
  const PRICE = { 25000: 99, 50000: 149, 100000: 249, 150000: 349 };
  const PLATS = ['Tradovate', 'NinjaTrader', 'TradingView', 'Rithmic'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dnum = (w) => { if (!w || /Today|Just now/.test(w)) return 9e12; const p = w.replace(',', '').split(' '); return new Date(/\d{4}$/.test(w) ? +w.slice(-4) : 2026, MON.indexOf(p[0]), +p[1]).getTime(); };
  const day = (ago) => { const d = new Date(2026, 10, 22 - ago); return `${MON[d.getMonth()]} ${d.getDate()}${d.getFullYear() !== 2026 ? ', ' + d.getFullYear() : ''}`; };

  // KYC stories: uid index -> details
  const KYC_STORY = {
    14: { st: 'pending', why: 'Face Match Below Threshold', sev: 'md', wait: 3, fail: ['face'], face: 71 },
    15: { st: 'pending', why: 'Name on Document Differs', sev: 'md', wait: 5, warn: ['name'], docName: 'Zoë Adler-Brandt' },
    10: { st: 'pending', why: 'Possible Sanctions Match', sev: 'hi', wait: 1, fail: ['sanctions'] },
    16: { st: 'pending', why: 'Document Used on Another Account', sev: 'hi', wait: 2, fail: ['dup'], dupOf: 'U-10431' },
    12: { st: 'pending', why: 'Document Expires in 9 Days', sev: 'lo', wait: 7, warn: ['expiry'] },
    13: { st: 'pending', why: 'Review Asked For by Risk', sev: 'md', wait: 11, warn: ['manual'] },
    27: { st: 'pending', why: 'Address Could Not Be Matched', sev: 'lo', wait: 14, warn: ['address'] },
    19: { st: 'resubmit', why: 'Proof of Address Older Than 90 Days', sev: 'lo', wait: 26, fail: ['address'] },
    31: { st: 'resubmit', why: 'Photo of ID Too Blurry', sev: 'lo', wait: 30, fail: ['doc'] },
    37: { st: 'rejected', why: 'Document Looks Edited', sev: 'hi', wait: 0, fail: ['doc', 'face'] },
    33: { st: 'none' }, 34: { st: 'none' }, 35: { st: 'started' }, 30: { st: 'none' }
  };

  const USERS = FULL.map((name, i) => {
    const r = rng('u' + i); const ctry = CTRY[i]; const [f, l] = name.split(' ');
    const ks = KYC_STORY[i] || { st: 'verified' };
    const joined = Math.floor(20 + r() * 380); const nAcc = ks.st === 'none' ? (r() < 0.5 ? 0 : 1) : 1 + Math.floor(r() * 4);
    const funded = ks.st === 'verified' ? Math.min(nAcc, Math.floor(r() * 3)) : 0;
    const spent = nAcc * 149 + Math.floor(r() * 6) * 79; const paid = funded ? Math.round((800 + r() * 9000) / 10) * 10 : 0;
    return {
      id: 'U-' + (10400 + i * 3 + (i > 9 ? 1 : 0)), i, name, short: `${f} ${l[0]}.`, email: `${f.toLowerCase()}.${l.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
      phone: '+' + ({ 'United States': 1, Canada: 1, 'United Kingdom': 44, India: 91, Mexico: 52, Nigeria: 234, Japan: 81, Spain: 34, Australia: 61, Germany: 49, UAE: 971, Singapore: 65, Brazil: 55, 'South Korea': 82, Poland: 48, Argentina: 54, Kenya: 254, Netherlands: 31, Philippines: 63, Italy: 39, Ireland: 353, Turkey: 90, Sweden: 46, Chile: 56, France: 33, Czechia: 420, Portugal: 351, Ghana: 233, Norway: 47, Colombia: 57, Cyprus: 357 }[ctry] || 1) + ' ••• ••• ' + String(1000 + Math.floor(r() * 8999)),
      dob: `${MON[Math.floor(r() * 12)]} ${1 + Math.floor(r() * 27)}, ${1972 + Math.floor(r() * 30)}`,
      ctry, city: CITY[ctry] || '—', tz: TZ[ctry] || ctry, joinedAgo: joined, joined: day(joined), lastAgo: i === 37 ? 34 : Math.floor(r() * (i % 5 === 0 ? 20 : 3)),
      st: i === 37 ? 'Banned' : i === 22 ? 'Locked' : i === 29 ? 'Closed' : 'Active',
      kyc: ks.st, ks, spent, paid, nAcc, funded, risk: Math.round(8 + r() * 50 + (ks.sev === 'hi' ? 35 : 0)),
      via: pick(r, ['Email', 'Email', 'Google', 'Apple']), aff: r() < 0.35 ? pick(r, ['TRADEWITHSAM', 'FUTURESDAILY', 'NQKING', 'SKYHIGH']) : '', twofa: r() < 0.62, mkt: r() < 0.55,
      lang: pick(r, ['English', 'English', 'English', 'Spanish', 'Portuguese']),
      tags: i === 0 ? ['VIP'] : i === 7 ? ['Watchlist'] : i === 37 ? ['Fraud'] : i === 11 ? ['Copy Trading Alert'] : i === 4 ? ['Affiliate'] : [],
      notes: i === 7 ? [['[Risk Reviewer]', 'Nov 20', 'Hedging alert RK-1182 open. Hold payouts until it is closed.']] : i === 0 ? [['[Support Agent]', 'Nov 3', 'Long-time customer. Has bought 9 evaluations. Be generous with resets.']] : [],
      locked: i === 22 ? { why: 'Too many failed sign-ins', when: 'Nov 22, 9:14 AM' } : null
    };
  });
  // linked dup account
  const DUPID = 'U-10431';

  const uById = (id) => USERS.find((u) => u.id === id);

  // lazily built detail
  function detail(u) {
    if (u.d) return u.d; const r = rng('d' + u.id); const d = {};
    const j = u.joinedAgo; const T = { fe: Math.max(0, j - 3) }; T.pass = Math.round(T.fe * 0.55); T.kyc = Math.max(0, T.pass - 2); T.fund = Math.max(0, T.kyc - 1); T.pay = Math.max(0, T.fund - 9); d.T = T;
    d.accts = Array.from({ length: u.nAcc }, (_, k) => { const [pn, sz] = pick(r, PLANS); const size = pick(r, sz); const isF = k < u.funded; const st = isF ? 'Funded' : pick(r, ['Active', 'Active', 'Passed', 'Breached', 'Expired']);
      return { id: `FS-${isF ? 'F-' : ''}${size / 1000}K-${10300 + Math.floor(r() * 140)}`, plan: pn, size, plat: pick(r, PLATS), st, bal: size + Math.round((r() - 0.4) * size * 0.05), started: day(isF ? T.fund : Math.round(T.fe * (1 - k / Math.max(1, u.nAcc)))), bought: day(Math.round(T.fe * (1 - k / Math.max(1, u.nAcc)))) }; });
    let ago = u.joinedAgo;
    d.orders = d.accts.map((a, k) => ({ id: 'ORD-' + (58200 + Math.floor(r() * 900)), when: a.bought, item: `${a.plan} ${a.size / 1000}K Evaluation`, amt: PRICE[a.size], method: k % 3 === 2 ? 'PayPal' : `${pick(r, ['Visa', 'Mastercard', 'Amex'])} •• ${4000 + Math.floor(r() * 5999)}`, st: 'Paid' }));
    if (u.spent > d.orders.reduce((s, o) => s + o.amt, 0)) d.orders.push({ id: 'ORD-' + (58200 + Math.floor(r() * 900)), when: day(Math.round(T.fe * 0.4)), item: 'Reset After Breach', amt: 79, method: d.orders[0] ? d.orders[0].method : 'Visa •• 4242', st: 'Paid' });
    if (u.i === 11) d.orders.push({ id: 'ORD-58911', when: day(9), item: '[Plan B Name] 100K Evaluation', amt: 249, method: 'Visa •• 8841', st: 'Chargeback' });
    if (u.i === 3) { const o = d.orders[0]; if (o) o.st = 'Refunded'; }
    d.orders.sort((a, b) => dnum(b.when) - dnum(a.when));
    d.methods = [...new Set(d.orders.map((o) => o.method))];
    d.payouts = u.funded ? Array.from({ length: Math.max(1, Math.min(4, Math.floor(T.pay / 14) + 1)) }, (_, k) => ({ id: 'PO-' + (3200 + Math.floor(r() * 120)), when: day(Math.max(0, T.pay - (Math.max(1, Math.min(4, Math.floor(T.pay / 14) + 1)) - 1 - k) * 14)), amt: Math.round((300 + r() * 2600) / 10) * 10, st: k === 0 && u.i === 7 ? 'On Hold' : 'Paid', to: u.i % 2 ? 'USDC Wallet 0x7a…c41e' : 'Bank •• 6620' })) : [];
    d.payoutMethod = u.funded ? (u.i % 2 ? 'USDC Wallet 0x7a…c41e' : 'Bank •• 6620') : '';
    d.tax = u.funded ? (u.ctry === 'United States' ? 'W-9 on File' : 'W-8BEN on File') : 'Not Needed Yet';
    const cities = [u.city, u.city, u.city, u.i === 7 ? 'Amsterdam (VPN)' : u.city];
    d.sessions = Array.from({ length: 6 }, (_, k) => ({ when: k === 0 ? (u.lastAgo ? day(u.lastAgo) + ', 8:12 PM' : 'Today, ' + (9 + k) + ':' + String(10 + k * 7).padStart(2, '0') + ' AM') : day(u.lastAgo + k * 2) + ', ' + (1 + Math.floor(r() * 11)) + ':' + String(Math.floor(r() * 59)).padStart(2, '0') + ' PM',
      ip: `${Math.floor(20 + r() * 180)}.${Math.floor(r() * 255)}.${Math.floor(r() * 255)}.${Math.floor(r() * 255)}`, loc: `${cities[k % 4]}, ${u.ctry}`, dev: pick(r, ['Chrome on Windows', 'Safari on iPhone', 'Chrome on Mac', 'Edge on Windows', 'App on Android']), vpn: u.i === 7 && k % 4 === 3, ok: !(u.i === 22 && k < 3), live: k < (u.st === 'Active' ? 2 : 0) }));
    d.devices = [...new Set(d.sessions.map((s) => s.dev))].map((dv, k) => ({ dev: dv, fp: 'DV-' + (u.id.slice(2) * 7 + k).toString(16).toUpperCase(), first: day(u.joinedAgo - k * 9), shared: (u.i === 11 && k === 0) ? ['Omar Haddad', 'Marcus Torres'] : (u.i === 16 && k === 0) ? ['Unknown Account ' + DUPID] : [] }));
    d.agree = [['Terms of Service', 'Version 3.2', day(Math.min(u.joinedAgo, 40)), true], ['Privacy Policy', 'Version 2.4', day(Math.min(u.joinedAgo, 40)), true], ['Risk Disclosure', 'Version 1.6', day(u.joinedAgo), true], ['Refund Policy', 'Version 1.3', day(u.joinedAgo), true], ['Funded Trader Agreement', 'Version 2.1', u.funded ? day(T.fund) : '', !!u.funded], ['Marketing Emails', u.mkt ? 'Opted In' : 'Opted Out', day(u.joinedAgo), u.mkt]];
    d.tickets = Array.from({ length: Math.floor(r() * 4) }, (_, k) => ({ id: 'T-' + (4800 + Math.floor(r() * 400)), subj: pick(r, ['Where Is My Login for Tradovate', 'Reset After Breach Question', 'Payout Timing', 'Change My Email', 'Daily Loss Limit Question', 'Refund Request', 'KYC Document Rejected']), when: day(2 + k * 11), st: k === 0 && r() < 0.5 ? 'Open' : 'Solved' }));
    d.emails = [['Welcome to Funded Sky', day(u.joinedAgo), 'Opened'], ['Your Evaluation Is Ready', day(T.fe), 'Opened'], ...(u.funded ? [['You Passed', day(T.pass), 'Opened'], ['Payout Sent', day(3), 'Delivered']] : []), ...(u.kyc === 'resubmit' ? [['We Need New Documents', day(u.ks.wait), 'Opened']] : []), ['Weekly Recap', day(1), 'Delivered']];
    // activity
    const ev = [];
    ev.push(['acct', day(u.joinedAgo), `Signed up with ${u.via}`, u.aff ? `Affiliate code ${u.aff}` : 'No affiliate']);
    d.orders.forEach((o) => ev.push(['money', o.when, `${o.st === 'Paid' ? 'Bought' : o.st} ${o.item}`, `${'$' + o.amt} · ${o.method}`]));
    d.accts.forEach((a) => { ev.push(['trade', a.started, `Started ${a.id}`, `${a.plan} · ${a.plat}`]); if (a.st === 'Breached') ev.push(['trade', day(Math.max(0, Math.round(T.fe * 0.5))), `${a.id} Breached`, 'Daily loss limit']); if ((a.st === 'Passed' || a.st === 'Funded') && !ev.some((e) => / Passed$/.test(e[2]))) ev.push(['trade', day(T.pass), `Evaluation Passed`, 'Profit target reached in ' + (5 + Math.floor(r() * 12)) + ' days']); });
    d.payouts.forEach((p) => ev.push(['money', p.when, `Payout ${p.st === 'Paid' ? 'Paid' : p.st}`, `$${p.amt.toLocaleString('en-US')} to ${p.to}`]));
    if (u.kyc !== 'none') ev.push(['security', day(u.kyc === 'verified' ? T.kyc : Math.floor((u.ks.wait || 0) / 24)), 'Sent KYC Documents', `Passport and selfie through ${PROV}`]);
    if (u.kyc === 'verified') ev.push(['security', day(T.kyc), 'KYC Verified', 'All checks passed automatically']);
    if (u.twofa) ev.push(['security', day(Math.max(0, u.joinedAgo - 2)), 'Turned On Two-Factor Sign-In', 'Authenticator app']);
    d.tickets.forEach((t) => ev.push(['support', t.when, `Opened Ticket ${t.id}`, t.subj]));
    if (u.locked) ev.push(['security', 'Today', 'Account Locked', '5 failed sign-ins in 10 minutes']);
    u.notes.forEach((n) => ev.push(['staff', n[1], 'Note Added by ' + n[0], n[2]]));
    ev.push(['security', u.lastAgo ? day(u.lastAgo) : 'Today', 'Signed In', d.sessions[0].dev + ' · ' + d.sessions[0].loc]);
    const ord = (w) => (w === 'Today' ? -Date.UTC(2026, 10, 23) : (() => { const [m, dd] = w.replace(',', '').split(' '); const y = /\d{4}$/.test(w) ? +w.slice(-4) : 2026; return -(new Date(y, MON.indexOf(m), +dd).getTime()); })());
    d.act = ev.sort((a, b) => ord(a[1]) - ord(b[1]));
    d.staffLog = [[day(1), '[Support Agent]', 'Opened Profile', 'From ticket'], [day(u.lastAgo + 4), '[Risk Reviewer]', 'Opened Profile', 'From alert'], ...(u.kyc === 'verified' ? [[day(T.kyc), PROV, 'KYC Approved Automatically', 'All checks passed']] : [])];
    // KYC
    const ks = u.ks; const fl = (k) => (ks.fail || []).includes(k) ? 'f' : (ks.warn || []).includes(k) ? 'w' : '';
    d.kyc = u.kyc === 'none' ? null : {
      ref: 'KYC-' + (88000 + u.i * 37), level: u.funded || u.kyc !== 'verified' ? 'Full: ID, Selfie and Address' : 'Full: ID, Selfie and Address', when: day(ks.st === 'verified' ? T.kyc : Math.floor((ks.wait || 0) / 24)), docType: pick(r, ['Passport', 'Passport', 'Driver License', 'National ID']),
      docNo: '•••• ' + (1000 + Math.floor(r() * 8999)), expiry: u.i === 12 ? 'Dec 1, 2026' : `${MON[Math.floor(r() * 12)]} ${1 + Math.floor(r() * 27)}, ${2028 + Math.floor(r() * 6)}`, face: ks.face || 92 + Math.floor(r() * 7), docName: ks.docName || u.name,
      checks: [
        ['doc', 'Document Is Real', fl('doc') === 'f' ? (u.i === 37 ? 'Fonts and edges show signs of editing' : 'Too blurry to read the security features') : 'Security features found, no signs of editing'],
        ['expiry', 'Document Not Expired', fl('expiry') ? 'Expires Dec 1, 2026, in 9 days' : 'Valid for more than 6 months'],
        ['face', 'Face Matches Document', fl('face') ? `Match score ${ks.face || 58}%, needs 85%` : `Match score ${ks.face || 95}%`],
        ['live', 'Live Person', 'Head-turn check passed'],
        ['name', 'Name Matches Account', fl('name') ? `Document says ${ks.docName}` : 'Exact match'],
        ['age', 'Over 18', 'Born ' + u.dob],
        ['address', 'Address Verified', fl('address') === 'f' ? 'Bank statement dated 4 months ago' : fl('address') ? 'Utility bill name matches, street not found' : 'Bank statement from the last 90 days'],
        ['sanctions', 'Sanctions and Politically Exposed Lists', fl('sanctions') ? 'Name is 88% similar to one entry. Date of birth differs.' : 'No matches'],
        ['media', 'Negative News', 'Nothing found'],
        ['country', 'Country Allowed', u.ctry + ' is allowed'],
        ['dup', 'Same Identity on Another Account', fl('dup') ? `Passport number also used on ${ks.dupOf}` : 'No other account']
      ].map(([k, n, s]) => ({ k, n, s, r: fl(k) || (k === 'manual' ? 'w' : '') })),
      history: [[day(ks.st === 'verified' ? T.kyc : Math.floor((ks.wait || 0) / 24)), ks.st === 'verified' ? 'Approved Automatically' : ks.st === 'resubmit' ? 'New Documents Asked For' : ks.st === 'rejected' ? 'Rejected' : 'Sent to Manual Review', ks.why || 'All checks passed'], ...(u.i === 19 ? [[day(40), 'First Attempt', 'Approved ID, address failed']] : []), [day(ks.st === 'verified' ? T.kyc : Math.floor((ks.wait || 0) / 24)), 'Documents Sent', 'Through ' + PROV]]
    };
    u.d = d; return d;
  }

  const CHANGES = [
    { id: 'CR-301', uid: USERS[6].id, type: 'Email Change', from: 'sofia.lopez@example.com', to: 'sofia.l.trading@example.com', when: 'Today, 10:42 AM', needs: 'Confirmed on both addresses', st: 'open' },
    { id: 'CR-300', uid: USERS[15].id, type: 'Name Change', from: 'Zoe Adler', to: 'Zoë Adler-Brandt', when: 'Today, 9:05 AM', needs: 'Matches new KYC document', st: 'open' },
    { id: 'CR-299', uid: USERS[1].id, type: 'Payout Method Change', from: 'Bank •• 2210', to: 'USDC Wallet 0x19…ab03', when: 'Yesterday', needs: 'Second approver, 48-hour hold', st: 'open', two: true },
    { id: 'CR-298', uid: USERS[8].id, type: 'Two-Factor Reset', from: 'Authenticator app', to: 'None', when: 'Yesterday', needs: 'Selfie check passed', st: 'open' },
    { id: 'CR-297', uid: USERS[20].id, type: 'Country Change', from: 'India', to: 'United Arab Emirates', when: 'Nov 20', needs: 'New proof of address', st: 'open' },
    { id: 'CR-296', uid: USERS[24].id, type: 'Address Change', from: 'Gothenburg', to: 'Stockholm', when: 'Nov 19', needs: 'None', st: 'approved' },
    { id: 'CR-295', uid: USERS[2].id, type: 'Phone Change', from: '+91 ••• ••• 4410', to: '+91 ••• ••• 9032', when: 'Nov 18', needs: 'Text code confirmed', st: 'approved' },
    { id: 'CR-294', uid: USERS[17].id, type: 'Name Change', from: 'Aisha Nwosu', to: 'Aisha Bello', when: 'Nov 15', needs: 'Matches new KYC document', st: 'denied' }
  ];
  const DATAREQ = [
    { id: 'DR-41', uid: USERS[29].id, type: 'Delete My Account', when: 'Nov 12', due: 'Dec 12', st: 'open', note: 'Closed account. Trading and payment records are kept 5 years for anti-money-laundering law.' },
    { id: 'DR-40', uid: USERS[23].id, type: 'Copy of My Data', when: 'Nov 19', due: 'Dec 19', st: 'open', note: '' },
    { id: 'DR-39', uid: USERS[9].id, type: 'Copy of My Data', when: 'Nov 2', due: 'Dec 2', st: 'done', note: 'Sent as a download link, expires in 7 days.' },
    { id: 'DR-38', uid: USERS[26].id, type: 'Stop Marketing Emails', when: 'Oct 28', due: 'Nov 27', st: 'done', note: '' }
  ];
  const AUDIT = [
    ['Today, 11:02 AM', '[KYC Reviewer]', 'Viewed Documents', `${USERS[19].name} · reason: KYC review`],
    ['Today, 10:31 AM', '[Support Agent]', 'Reset Password Link Sent', USERS[5].name],
    ['Today, 9:14 AM', 'System', 'Account Locked', `${USERS[22].name} · 5 failed sign-ins`],
    ['Yesterday', '[Risk Reviewer]', 'Logged In As User', `${USERS[7].name} · view only · reason: hedging alert RK-1182`],
    ['Yesterday', '[KYC Reviewer] and ' + RV2, 'KYC Rejected', `${USERS[37].name} · document looks edited`],
    ['Nov 20', '[Admin]', 'User Banned', `${USERS[37].name} · two approvals`],
    ['Nov 20', '[Support Agent]', 'Email Changed', `${USERS[24].name}`],
    ['Nov 19', '[Admin]', 'Role Changed', '[Support Agent] can now see documents'],
    ['Nov 18', '[Finance]', 'Exported Users', '1,204 rows · reason: monthly report']
  ];
  const ROLES = [
    ['Owner', [1, 1, 1, 1, 1, 1, 1, 1]], ['Admin', [1, 1, 1, 1, 1, 1, 0, 1]], ['KYC Reviewer', [1, 0, 1, 1, 0, 0, 0, 0]],
    ['Risk', [1, 0, 1, 0, 1, 1, 0, 0]], ['Support', [1, 1, 0, 0, 1, 1, 0, 0]], ['Finance', [1, 0, 0, 0, 0, 0, 0, 1]]
  ];
  const PERMS = ['See Users', 'Edit Details', 'See Documents', 'Approve KYC', 'Log In As User', 'Lock Accounts', 'Ban Users', 'Export Data'];
  const TEAM = [['[Your Name]', 'Owner', true, 'Today'], ['[Admin]', 'Admin', true, 'Today'], ['[KYC Reviewer]', 'KYC Reviewer', true, 'Today'], ['[Risk Reviewer]', 'Risk', true, 'Yesterday'], ['[Support Agent]', 'Support', true, 'Today'], ['[Support Agent 2]', 'Support', false, 'Nov 18'], ['[Finance]', 'Finance', true, 'Nov 18']];
  const COUNTRIES_BLOCKED = ['Cuba', 'Iran', 'North Korea', 'Syria', 'Russia', 'Belarus', 'Crimea Region'];
  const DOCS = [['Passport', true, 'All countries'], ['Driver License', true, 'Most countries'], ['National ID Card', true, 'Most countries'], ['Residence Permit', true, 'With passport'], ['Bank Statement', true, 'Proof of address, last 90 days'], ['Utility Bill', true, 'Proof of address, last 90 days'], ['Tax Letter', false, 'Proof of address'], ['Phone Bill', false, 'Proof of address']];
  USERS.forEach((u) => { const d = detail(u); u.spent = d.orders.filter((o) => o.st === 'Paid').reduce((a, o) => a + o.amt, 0); u.paid = d.payouts.filter((p) => p.st === 'Paid').reduce((a, p) => a + p.amt, 0); });
