  // ===== Insights (live) =====
  function facts() { const m = metrics(); const out = []; const r7 = L.rev(7); const p7 = L.paid().filter((o) => L.within(o.paid, 14) && !L.within(o.paid, 7)).reduce((s, o) => s + o.total, 0);
    out.push(['Sales', p7 ? `Sales over the last 7 days are ${money(r7)}, ${r7 >= p7 ? 'up' : 'down'} ${pct(Math.abs(r7 - p7) / p7 * 100, 0)} on the week before.` : `Sales over the last 7 days are ${money(r7)}.`, 'analytics']);
    out.push(['Payout cover', m.revAll ? `Payouts sent and owed are ${pct((m.paidOut + m.owed) / m.revAll * 100, 0)} of all sales so far.` : 'No sales yet.', 'finance']);
    out.push(['Pass rate', `${pct(m.passRate)} of finished evaluations passed (${m.passed} of ${m.decided}).`, 'analytics#pass']);
    out.push(['Exposure', `Live funded accounts could ask for up to ${money(m.liability)} today.`, 'risk#exposure']);
    const q = L.payouts.filter((p) => p.status === 'requested').length; if (q) out.push(['Payout reviews', `${q} payout request${q === 1 ? ' is' : 's are'} waiting for review.`, 'risk#payouts']);
    const t = L.tickets.filter((x) => x.status === 'open').length; if (t) out.push(['Support', `${t} ticket${t === 1 ? ' is' : 's are'} open.`, 'support']);
    if (BO.payments === 'test') out.push(['Payments', 'Card payments are in test mode. Connect TailoredPay or Stripe in Settings to take real money.', 'settings#int']);
    return out; }
  function vOverview() { return `${ph('Insights', 'What stands out right now, worked out from live data.')}<div class="card m0">${facts().map(([h2, t, l]) => `<div class="srow pad"><span><b>${h2}</b><small class="hint" style="display:block;margin-top:2px">${esc(t)}</small></span><a class="pill sm" href="/admin/${l}">Open</a></div>`).join('')}</div>`; }
  const APP = { title: 'Insights', stats: () => [], areas: [{ h: 'Insights' }, { id: 'ov', n: 'Insights', tabs: [['overview', 'Insights']] }], views: { overview: vOverview }, route: () => {}, click: () => 0, drawer: () => null };
