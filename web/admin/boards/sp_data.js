  const ME = '[Your Name]';
  const AGENTS = [
    { id: 'me', name: ME, role: 'Lead', st: 'online', limit: 500, open: 0, solved: 64, frt: 14, csat: 96 },
    { id: 'a2', name: 'Maya Reyes', role: 'Agent', st: 'online', limit: 150, open: 0, solved: 81, frt: 11, csat: 94 },
    { id: 'a3', name: 'Theo Kim', role: 'Agent', st: 'away', limit: 150, open: 0, solved: 58, frt: 19, csat: 92 },
    { id: 'a4', name: 'Omar Haddad', role: 'Risk', st: 'online', limit: 0, open: 0, solved: 22, frt: 42, csat: 88 },
    { id: 'a5', name: 'Lena Park', role: 'Agent', st: 'offline', limit: 150, open: 0, solved: 47, frt: 16, csat: 95 }
  ];
  const CATS = { payouts: 'Payouts', breach: 'Breach Dispute', billing: 'Billing and Refunds', kyc: 'Identity Check', platform: 'Platform and Login', rules: 'Rules Question', account: 'Account Changes', affiliates: 'Affiliates', risk: 'Risk Flag' };
  const CH = { email: 'Email', chat: 'Live Chat', discord: 'Discord' };
  const PRI = { urgent: ['Urgent', 'var(--no)'], high: ['High', 'var(--wa)'], normal: ['Normal', 'var(--mu)'], low: ['Low', 'var(--fa)'] };
  const STS = { open: 'Open', pending: 'Waiting on Trader', hold: 'On Hold', solved: 'Solved' };

  const TRADERS = {
    t1043: { id: '1043', name: 'Jane D.', email: 'j***@gmail.com', country: 'United States', tz: 'ET', joined: 'Mar 2026', spend: 1248, orders: 6, kyc: 'Verified', payouts: [2, 3120], csat: 5, accts: [['FS-F-50K-2207', 'Funded · $50K', 'Active', '$51,840', '+$1,840'], ['FS-50K-10432', '[Plan B Name] $50K', 'Active', '$51,240', '+$1,240'], ['FS-25K-09811', '[Plan A Name] $25K', 'Closed', '$23,410', 'Drawdown']], flags: [] },
    t1031: { id: '1031', name: 'Marcus T.', email: 'm***@outlook.com', country: 'United Kingdom', tz: 'GMT', joined: 'Aug 2026', spend: 612, orders: 3, kyc: 'Not Started', payouts: [0, 0], accts: [['FS-100K-10388', '[Plan B Name] $100K', 'Closed', '$96,912', 'Drawdown'], ['FS-50K-10201', '[Plan B Name] $50K', 'Active', '$50,420', '+$420']], flags: [] },
    t1027: { id: '1027', name: 'Priya S.', email: 'p***@proton.me', country: 'India', tz: 'IST', joined: 'Oct 2026', spend: 169, orders: 1, kyc: 'Not Started', payouts: [0, 0], accts: [['FS-50K-10399', '[Plan B Name] $50K', 'Active', '$50,000', '$0']], flags: [] },
    t1019: { id: '1019', name: 'Diego R.', email: 'd***@yahoo.com', country: 'Mexico', tz: 'CT', joined: 'Sep 2026', spend: 508, orders: 4, kyc: 'Verified', payouts: [0, 0], accts: [['FS-25K-10310', '[Plan A Name] $25K', 'Active', '$25,610', '+$610']], flags: [] },
    t1012: { id: '1012', name: 'Amara O.', email: 'a***@gmail.com', country: 'Nigeria', tz: 'WAT', joined: 'Jun 2026', spend: 438, orders: 3, kyc: 'Rejected', payouts: [0, 0], accts: [['FS-50K-09870', '[Plan B Name] $50K', 'Passed', '$53,100', '+$3,100']], flags: [] },
    t1008: { id: '1008', name: 'Kenji M.', email: 'k***@icloud.com', country: 'Japan', tz: 'JST', joined: 'Nov 2026', spend: 79, orders: 1, kyc: 'Not Started', payouts: [0, 0], accts: [['FS-25K-10421', '[Plan C Name] $25K', 'Active', '$25,000', '$0']], flags: [] },
    t0996: { id: '0996', name: 'Sofia L.', email: 's***@gmail.com', country: 'Spain', tz: 'CET', joined: 'Feb 2026', spend: 2310, orders: 11, kyc: 'Verified', payouts: [4, 7480], accts: [['FS-F-100K-1984', 'Funded · $100K', 'Active', '$104,200', '+$4,200'], ['FS-100K-10011', '[Plan B Name] $100K', 'Passed', '$106,050', '+$6,050']], flags: [] },
    t0988: { id: '0988', name: 'Liam K.', email: 'l***@hotmail.com', country: 'Canada', tz: 'ET', joined: 'Jul 2026', spend: 1184, orders: 7, kyc: 'Verified', payouts: [1, 960], accts: [['FS-50K-10290', '[Plan B Name] $50K', 'Active', '$50,880', '+$880'], ['FS-50K-10291', '[Plan B Name] $50K', 'Active', '$49,120', '−$880']], flags: ['Opposite trades on two accounts'] },
    t0975: { id: '0975', name: 'Noah B.', email: 'n***@gmail.com', country: 'Australia', tz: 'AEST', joined: 'May 2026', spend: 357, orders: 2, kyc: 'Verified', payouts: [0, 0], accts: [['FS-50K-10414', '[Plan B Name] $50K', 'Active', '$50,000', 'Reset today']], flags: [] },
    t0960: { id: '0960', name: '[Affiliate Name 2]', email: 'c***@gmail.com', country: 'United States', tz: 'PT', joined: 'Jan 2026', spend: 0, orders: 0, kyc: 'Verified', payouts: [0, 0], accts: [], flags: [], affiliate: 'TRADEWITHX' },
    t0951: { id: '0951', name: 'Elena V.', email: 'e***@outlook.com', country: 'Germany', tz: 'CET', joined: 'Apr 2026', spend: 248, orders: 2, kyc: 'Not Started', payouts: [0, 0], accts: [['FS-25K-10102', '[Plan C Name] $25K', 'Cancelled', '$25,300', '+$300']], flags: [] },
    t0942: { id: '0942', name: 'Omar H.', email: 'o***@yahoo.com', country: 'United Arab Emirates', tz: 'GST', joined: 'Sep 2026', spend: 259, orders: 1, kyc: 'Not Started', payouts: [0, 0], accts: [['FS-100K-10405', '[Plan B Name] $100K', 'Active', '$100,640', '+$640']], flags: [] }
  };

  // f: t trader · a agent · n internal note · s system
  const TICKETS = [
    { id: 4815, subj: "My account was closed but I never hit the drawdown", cat: 'breach', pri: 'urgent', st: 'open', ch: 'email', tr: 't1031', ag: 'me', sla: -12, age: '2h', review: 'BR-212', msgs: [
      { f: 't', t: 'Today, 10:41 AM', b: "Hi, my $100K account FS-100K-10388 was closed this morning for max drawdown. My balance never went below $97,000 on my side. I think there's a mistake. Can someone check?" },
      { f: 's', t: 'Today, 10:42 AM', b: 'Linked to breach review BR-212 automatically.' },
      { f: 'n', who: ME, t: 'Today, 11:05 AM', b: 'Open position on NQ at 10:02 dipped to $96,912 before he closed it. Floor counts open P&L. Sending to the risk reviewer to confirm before we reply.' }
    ] },
    { id: 4830, subj: 'Reset paid but my balance is still the old one', cat: 'billing', pri: 'urgent', st: 'open', ch: 'chat', tr: 't0975', ag: null, sla: 6, age: '24m', msgs: [
      { f: 't', t: 'Today, 12:18 PM', b: 'I paid $46.50 for the reset 20 minutes ago and Tradovate still shows the closed account. Market is open, I need to trade.' },
      { f: 's', t: 'Today, 12:18 PM', b: 'Order FS-ORD-2302 paid. Reset job finished on our side at 12:01 PM. Platform sync shows Pending.' }
    ] },
    { id: 4816, subj: "Can't log in to Tradovate with the details you sent", cat: 'platform', pri: 'high', st: 'open', ch: 'email', tr: 't1027', ag: 'a2', sla: 18, age: '41m', msgs: [
      { f: 't', t: 'Today, 12:01 PM', b: 'It says invalid credentials. I copied the username FS10399 exactly. Do I need a different server?' }
    ] },
    { id: 4817, subj: 'I was charged twice for one evaluation', cat: 'billing', pri: 'high', st: 'open', ch: 'email', tr: 't1019', ag: null, sla: 44, age: '1h', msgs: [
      { f: 't', t: 'Today, 11:30 AM', b: 'My bank shows two charges of $99 on Nov 21 but I only have one account. Please refund one.' },
      { f: 's', t: 'Today, 11:30 AM', b: 'Two payments found: FS-ORD-2287 (paid, account created) and FS-ORD-2288 (paid, no account: checkout was submitted twice).' }
    ] },
    { id: 4827, subj: "Rise payout hasn't arrived after 3 days", cat: 'payouts', pri: 'high', st: 'open', ch: 'email', tr: 't0996', ag: 'me', sla: 70, age: '3h', msgs: [
      { f: 't', t: 'Today, 9:52 AM', b: 'My $2,140 payout was marked Sent on Nov 19 but nothing in Rise yet. Reference RISE-88102.' },
      { f: 'a', who: ME, t: 'Today, 10:20 AM', b: "Hi Sofia, thanks for the reference. I've asked Rise to trace it and will update you today." },
      { f: 'n', who: ME, t: 'Today, 10:21 AM', b: 'Opened a trace with Rise, case #R-5521.' }
    ] },
    { id: 4818, subj: 'Identity check rejected, my passport is valid', cat: 'kyc', pri: 'normal', st: 'open', ch: 'email', tr: 't1012', ag: null, sla: 132, age: '2h', msgs: [
      { f: 't', t: 'Today, 10:40 AM', b: "I passed the evaluation and the identity check said my document didn't match. My passport is valid until 2031. My account name is my nickname, maybe that's why?" }
    ] },
    { id: 4819, subj: 'Is trading allowed during CPI tomorrow?', cat: 'rules', pri: 'normal', st: 'open', ch: 'chat', tr: 't1008', ag: null, sla: 9, age: '6m', msgs: [
      { f: 't', t: 'Today, 12:36 PM', b: 'Can I hold a position through the CPI release tomorrow, or do I have to close it?' }
    ] },
    { id: 4821, subj: 'Consistency rule: why is my payout blocked?', cat: 'rules', pri: 'normal', st: 'pending', ch: 'email', tr: 't1043', ag: 'me', sla: null, age: '1d', msgs: [
      { f: 't', t: 'Yesterday, 4:12 PM', b: 'I requested a payout and it says consistency rule not met. What does that mean?' },
      { f: 'a', who: ME, t: 'Yesterday, 4:40 PM', b: 'Hi Jane, on funded accounts no single day can be more than 40% of total profit when you request a payout. Your best day is 52% right now. A couple more profitable days will bring it under 40%. Want me to show you the numbers?' }
    ] },
    { id: 4822, subj: 'Please move my account to NinjaTrader', cat: 'account', pri: 'normal', st: 'open', ch: 'discord', tr: 't0942', ag: null, sla: 210, age: '3h', msgs: [
      { f: 't', t: 'Today, 9:40 AM', b: "Hey, I picked Tradovate by mistake. Can you switch FS-100K-10405 to NinjaTrader? I haven't traded much." }
    ] },
    { id: 4823, subj: 'Missing commission for 3 referrals', cat: 'affiliates', pri: 'low', st: 'open', ch: 'email', tr: 't0960', ag: null, sla: 600, age: '5h', msgs: [
      { f: 't', t: 'Today, 7:50 AM', b: "Three of my followers bought with TRADEWITHX on Nov 18 but my dashboard only shows 18 uses, not 21." }
    ] },
    { id: 4825, subj: 'BLACKFRIDAY code says expired', cat: 'billing', pri: 'normal', st: 'open', ch: 'chat', tr: 't0951', ag: 'a2', sla: 22, age: '12m', msgs: [
      { f: 't', t: 'Today, 12:30 PM', b: 'I tried BLACKFRIDAY at checkout and it says the code is not active.' }
    ] },
    { id: 4829, subj: 'Why are my two accounts flagged?', cat: 'risk', pri: 'high', st: 'hold', ch: 'email', tr: 't0988', ag: 'a4', sla: null, age: '1d', msgs: [
      { f: 't', t: 'Yesterday, 2:05 PM', b: 'I got a warning email about my trades. I trade two accounts with different strategies, is that not allowed?' },
      { f: 'n', who: 'Omar Haddad', t: 'Yesterday, 3:30 PM', b: 'Opposite positions on 10290 and 10291 within 2 seconds, 6 times on Nov 20. Matches hedging across accounts. Holding until the review is done.' }
    ] },
    { id: 4820, subj: "Refund please, I haven't placed any trade", cat: 'billing', pri: 'normal', st: 'open', ch: 'email', tr: 't0951', ag: null, sla: 300, age: '4h', msgs: [
      { f: 't', t: 'Today, 8:55 AM', b: "I bought a $25K account yesterday but changed my mind. I haven't traded at all. Can I get a refund?" }
    ] },
    { id: 4824, subj: 'What time does the daily loss reset?', cat: 'rules', pri: 'low', st: 'solved', ch: 'discord', tr: 't1027', ag: 'a3', sla: null, age: '1d', csat: 5, msgs: [
      { f: 't', t: 'Yesterday, 9:10 AM', b: 'When does the daily loss limit reset?' },
      { f: 'a', who: 'Theo Kim', t: 'Yesterday, 9:14 AM', b: 'It resets at 5:00 PM ET every trading day.' }
    ] },
    { id: 4812, subj: 'When will my payout be approved?', cat: 'payouts', pri: 'normal', st: 'solved', ch: 'email', tr: 't1043', ag: 'me', sla: null, age: '2d', csat: 5, msgs: [
      { f: 't', t: 'Nov 20, 9:02 AM', b: 'I requested my first payout yesterday. How long does approval take?' },
      { f: 'a', who: ME, t: 'Nov 20, 9:30 AM', b: 'Hi Jane, your payout was approved this morning and goes out through Rise today.' }
    ] },
    { id: 4808, subj: 'How do I get my funded certificate?', cat: 'account', pri: 'low', st: 'solved', ch: 'chat', tr: 't0996', ag: 'a2', sla: null, age: '3d', csat: 4, msgs: [
      { f: 't', t: 'Nov 19, 6:10 PM', b: 'Where can I download my certificate?' },
      { f: 'a', who: 'Maya Reyes', t: 'Nov 19, 6:12 PM', b: 'It is on your dashboard under Achievements, and we also emailed it to you.' }
    ] }
  ];

  const MACROS = [
    { id: 'm1', name: 'Breach Explained: Drawdown Counts Open Trades', cat: 'breach', uses: 41, body: "Hi {first_name}, thanks for reaching out. The max drawdown counts open positions too, not only closed trades. On {account}, an open position took the balance below the floor at the time shown in your dashboard, which ended the evaluation. I've attached the trade timeline. If you'd like to try again, you can reset this account from your dashboard." },
    { id: 'm2', name: 'Payout Timeline', cat: 'payouts', uses: 63, body: "Hi {first_name}, payouts are reviewed within 1 to 2 business days. Once approved, Rise usually shows the money within a few hours. We'll email you at each step." },
    { id: 'm3', name: 'Platform Login Steps', cat: 'platform', uses: 88, body: "Hi {first_name}, please log in at the platform's own login page with the username from your Your Evaluation Is Ready email, and choose the password on first login. If you still can't get in, reply with a screenshot of the error and we'll fix it right away." },
    { id: 'm4', name: 'Duplicate Charge Refunded', cat: 'billing', uses: 17, body: "Hi {first_name}, you're right, checkout was submitted twice. I've refunded the second charge. Banks usually show it within 5 to 10 business days." },
    { id: 'm5', name: 'Refund Policy: No Trades Placed', cat: 'billing', uses: 22, body: "Hi {first_name}, since no trades were placed on {account} and it's within 14 days, we can refund it. The account will be closed. I've started the refund now." },
    { id: 'm6', name: 'Identity Check: Name Mismatch', cat: 'kyc', uses: 12, body: "Hi {first_name}, the identity check needs the name on your account to match your ID. I've updated your account name to match your passport. Please start the check again from your dashboard." },
    { id: 'm7', name: 'News Rule', cat: 'rules', uses: 54, body: "Hi {first_name}, you can hold positions through high-impact news. The rule is that no new trades can be opened or closed in the 2 minutes before and after the release. The economic calendar on your dashboard shows each one." },
    { id: 'm8', name: 'Consistency Rule', cat: 'rules', uses: 39, body: "Hi {first_name}, on funded accounts no single day can be more than 40% of total profit when you request a payout. Spreading profit across more days fixes it, and your dashboard shows your current share." },
    { id: 'm9', name: 'Platform Switch Done', cat: 'account', uses: 15, body: "Hi {first_name}, {account} now runs on the new platform. Your new login is in the email we just sent. Your balance and trading days carried over." },
    { id: 'm10', name: 'Promo Code Not Active Yet', cat: 'billing', uses: 9, body: "Hi {first_name}, that code starts on Nov 24 at midnight ET. If you buy before then, reply with your order number and we'll apply the difference once the sale starts." }
  ];

  const REVIEWS = [
    { id: 'BR-212', tk: 4815, tr: 't1031', acct: 'FS-100K-10388', rule: 'Max Drawdown', limit: 'Floor $97,000', when: 'Nov 22, 10:02 AM ET', claim: 'Says the balance never went below $97,000.', st: 'open', first: null, trades: [['10:00:12', 'NQ', 'Buy', 2, '21,104.25', '—', '$97,840', '$97,000'], ['10:02:41', 'NQ', 'Open P&L', 2, '21,072.00', '−$928', '$96,912', '$97,000'], ['10:03:05', 'NQ', 'Sell', 2, '21,079.50', '−$990', '$96,850', 'Closed']] },
    { id: 'BR-209', tk: 4801, tr: 't1043', acct: 'FS-25K-09811', rule: 'Max Drawdown', limit: 'Floor $23,500', when: 'Nov 18, 2:44 PM ET', claim: 'Asked for a second look at slippage on a stop order.', st: 'upheld', first: 'Omar Haddad', second: ME, trades: [['14:44:02', 'ES', 'Sell Stop', 1, '5,980.25', '−$412', '$23,410', '$23,500']] },
    { id: 'BR-205', tk: 4790, tr: 't0996', acct: 'FS-100K-10011', rule: 'Daily Loss Limit', limit: '$2,200', when: 'Nov 15, 9:31 AM ET', claim: 'Platform froze during the open and the stop never filled.', st: 'reinstated', first: 'Omar Haddad', second: ME, trades: [['09:30:58', 'NQ', 'Buy', 3, '20,880.00', '—', '$104,100', '—'], ['09:31:40', 'NQ', 'Open P&L', 3, '20,842.50', '−$2,250', '$101,850', 'Limit hit']] }
  ];

  const ARTICLES = [
    { id: 'h1', cat: 'Rules', t: 'How the Max Drawdown Works', views: 4820, help: 91, st: 'Published', up: 'Nov 12', body: 'The max drawdown is the lowest your balance can go, counting open trades. It follows your highest end-of-day balance and never moves down.' },
    { id: 'h2', cat: 'Rules', t: 'The Daily Loss Limit', views: 3911, help: 88, st: 'Published', up: 'Nov 12', body: 'The daily loss limit is the most you can lose in one trading day, open and closed trades together. It resets at 5:00 PM ET.' },
    { id: 'h3', cat: 'Rules', t: 'Trading Around High-Impact News', views: 2240, help: 84, st: 'Published', up: 'Nov 3', body: 'No new trades in the 2 minutes before and after high-impact releases. You can hold positions through them.' },
    { id: 'h4', cat: 'Rules', t: 'The Consistency Rule for Payouts', views: 1890, help: 72, st: 'Published', up: 'Oct 28', body: 'When you request a payout, no single day can be more than 40% of total profit.' },
    { id: 'h5', cat: 'Payouts', t: 'How and When You Get Paid', views: 3102, help: 93, st: 'Published', up: 'Nov 10', body: 'Payouts are reviewed in 1 to 2 business days and sent through Rise.' },
    { id: 'h6', cat: 'Payouts', t: 'Setting Up Rise', views: 1450, help: 89, st: 'Published', up: 'Oct 30', body: 'Create your Rise account with the same email you use for Funded Sky.' },
    { id: 'h7', cat: 'Platforms', t: 'Logging In to Tradovate', views: 2780, help: 81, st: 'Published', up: 'Nov 8', body: 'Use the username from your Your Evaluation Is Ready email and choose a password on first login.' },
    { id: 'h8', cat: 'Platforms', t: 'Switching Platforms', views: 610, help: 86, st: 'Published', up: 'Oct 20', body: 'You can switch platform once per account before your first trade.' },
    { id: 'h9', cat: 'Billing', t: 'Refund Policy', views: 1980, help: 77, st: 'Published', up: 'Nov 1', body: 'Accounts with no trades can be refunded within 14 days of purchase.' },
    { id: 'h10', cat: 'Billing', t: 'Resets: What Happens to Your Account', views: 1320, help: 90, st: 'Published', up: 'Nov 5', body: 'A reset brings the account back to its starting balance with the same rules. Trading days start from zero.' },
    { id: 'h11', cat: 'Getting Funded', t: 'Identity Check: What You Need', views: 990, help: 83, st: 'Published', up: 'Nov 2', body: 'A passport, ID card or driver’s license with the same name as your account, and a phone camera.' },
    { id: 'h12', cat: 'Getting Funded', t: 'Activation Fee Explained', views: 540, help: 79, st: 'Draft', up: 'Nov 21', body: 'Some plans have a one-time activation fee when your funded account opens.' }
  ];
