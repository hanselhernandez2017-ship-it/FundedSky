// Funded Sky certificate: one template, drawn from data. THE single source of the certificate design.
// The server draws the public /cert page with it (require), the trader app and the Back Office load this same file from /static,
// and scripts/gen-cert-dc.js writes the design-canvas component from it. Plain JS, no dependencies.
// Safety: every value that comes from data goes through esc(); colours and sizes only ever come from the tables in this file.
(function (root) {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // accent pairs: [light, deep, glow]
  const TONE = { sky: ['#9BD3FF', '#2B7FD9', 'rgba(76,155,232,.45)', 'linear-gradient(150deg,#BFE3FF 0%,#4C9BE8 26%,#1C5FA8 58%,#0A2748 100%)'], green: ['#9CF0CC', '#1FA574', 'rgba(63,203,147,.42)', 'linear-gradient(150deg,#B8F5DA 0%,#3FCB93 26%,#15805C 58%,#05281D 100%)'], gold: ['#FFE7A6', '#D9A12B', 'rgba(245,192,78,.45)', 'linear-gradient(150deg,#FFF1C4 0%,#F5C04E 24%,#C98A1B 55%,#3E2604 100%)'], bronze: ['#F6CFAE', '#B8703A', 'rgba(205,127,70,.42)', 'linear-gradient(150deg,#FFE0C4 0%,#E09A62 26%,#A8602E 56%,#3A1C08 100%)'], silver: ['#F1F4F8', '#9AA7B8', 'rgba(200,210,224,.38)', 'linear-gradient(150deg,#FFFFFF 0%,#DCE3EC 22%,#9AA7B8 48%,#56606F 72%,#1B2029 100%)'], plat: ['#D9FBFF', '#62B8C9', 'rgba(120,214,232,.42)', 'linear-gradient(150deg,#F2FEFF 0%,#8FDDEA 26%,#3C97AA 58%,#0A2F38 100%)'], violet: ['#DCD0FF', '#7C5CE6', 'rgba(142,108,240,.45)', 'linear-gradient(150deg,#DCD0FF 0%,#8E6CF0 26%,#4E2DB8 58%,#140A38 100%)'] };
  const HOLO = { plat: 1, silver: 1 };
  const KIND = {
    passed: { tone: 'sky', over: 'Certificate of Achievement', title: 'Evaluation Passed', line: (d) => `passed the ${d.what} by reaching the profit target inside every trading rule.`, icon: 'check' },
    funded: { tone: 'green', over: 'Certificate of Funding', title: 'Funded Trader', line: (d) => `earned a ${d.what} and now trades it for a share of the profits.`, icon: 'wing' },
    payout: { tone: 'gold', over: 'Payout Certificate', title: 'Paid Out', line: (d) => `was paid ${d.amount} from a ${d.what}.`, icon: 'coin' },
    lifetime: { tone: 'gold', over: 'Lifetime Payouts', title: (d) => `${d.amount} Club`, line: (d) => `has been paid more than ${d.amount} in total across funded accounts.`, icon: 'star' },
    comp: { tone: 'gold', over: 'Competition Result', title: (d) => `${d.place} Place`, line: (d) => `finished ${String(d.place || '').toLowerCase()} of ${d.of} ${String(d.of) === '1' ? 'trader' : 'traders'} in ${d.what}.`, icon: 'cup' }
  };
  const ICON = {
    check: '<path d="M-13 1l8 9 18-20" fill="none" stroke="#0B0D12" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>',
    wing: '<path d="M-18 8c10 0 22-4 34-20-2 14-8 24-20 28l-4-6-10-2z" fill="#0B0D12"/><path d="M-18 8l12 3" stroke="#0B0D12" stroke-width="3" stroke-linecap="round"/>',
    coin: '<circle r="15" fill="none" stroke="#0B0D12" stroke-width="4"/><path d="M0-9v18M5-5c-1-2-3-3-5-3-3 0-5 2-5 4 0 6 10 2 10 8 0 2-2 4-5 4-2 0-4-1-5-3" fill="none" stroke="#0B0D12" stroke-width="3" stroke-linecap="round"/>',
    star: '<path d="M0-18l5.3 11.2 12.2 1.5-9 8.4 2.4 12.1L0 9.3l-10.9 5.9 2.4-12.1-9-8.4 12.2-1.5z" fill="#0B0D12"/>',
    cup: '<path d="M-11-15h22v8c0 8-5 13-11 13s-11-5-11-13z" fill="#0B0D12"/><path d="M-11-11h-6c0 7 3 10 7 11M11-11h6c0 7-3 10-7 11" fill="none" stroke="#0B0D12" stroke-width="3"/><path d="M0 6v7M-8 16h16" stroke="#0B0D12" stroke-width="4" stroke-linecap="round"/>'
  };
  // Big emblem on the foil side, drawn like the pack covers: a glow, rays, and white-to-accent shapes
  function art(k, d, u) {
    const W = `url(#${u}w)`; let rays = ''; for (let i = 0; i < 24; i++) rays += `<rect x="-1.2" y="-92" width="2.4" height="${[10, 18, 26, 14][i % 4]}" rx="1.2" fill="#fff" fill-opacity="${[0.3, 0.6, 0.45, 0.35][i % 4]}" transform="rotate(${i * 15})"/>`;
    const leaf = (side) => { let o = ''; for (let i = 0; i < 9; i++) { const a = (200 + i * 17) * Math.PI / 180; const r = 74; const x = Math.cos(a) * r * side; const y = -Math.sin(a) * r * -1; const rot = (side > 0 ? 1 : -1) * (i * 17 - 50); o += `<path d="M0 0c7-9 7-19 0-27-7 8-7 18 0 27z" fill="${W}" fill-opacity="${0.55 + i * 0.05}" transform="translate(${x.toFixed(1)} ${(-y).toFixed(1)}) rotate(${rot})"/>`; } return o; };
    const spark = (x, y, z, o) => `<path d="M${x} ${y - z}l${z * 0.3} ${z * 0.7} ${z * 0.7} ${z * 0.3}-${z * 0.7} ${z * 0.3}-${z * 0.3} ${z * 0.7}-${z * 0.3}-${z * 0.7}-${z * 0.7}-${z * 0.3} ${z * 0.7}-${z * 0.3}z" fill="#fff" fill-opacity="${o}"/>`;
    const defs = `<defs><radialGradient id="${u}g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".5" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><linearGradient id="${u}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="${d.a1}"/></linearGradient><linearGradient id="${u}d" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${d.a2}"/><stop offset="1" stop-color="#0B0D12"/></linearGradient></defs>`;
    const base = `<circle r="98" fill="url(#${u}g)"/>${rays}<circle r="62" fill="none" stroke="#fff" stroke-opacity=".35"/><circle r="52" fill="#fff" fill-opacity=".08"/>`;
    const A = {
      check: `<path d="M-46 30V8M-28 30V-6M-10 30V-18" stroke="#fff" stroke-opacity=".5" stroke-width="7" stroke-linecap="round"/><path d="M0-52l38 13v25c0 26-16 44-38 54-22-10-38-28-38-54v-25z" fill="${W}"/><path d="M0-52l38 13v25c0 26-16 44-38 54z" fill="#fff" fill-opacity=".35"/><path d="M-17 -4l12 13 23-27" fill="none" stroke="url(#${u}d)" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>`,
      wing: `<path d="M-80 46h30M-70 30h26M-58 14h20" stroke="#fff" stroke-opacity=".55" stroke-width="3.4" stroke-linecap="round"/><path d="M-78 62L60-58" stroke="#fff" stroke-opacity=".3" stroke-width="2" stroke-dasharray="3 6"/><path d="M62-60L-30-22 0 0 12 34z" fill="${W}"/><path d="M62-60L0 0 12 34z" fill="#fff" fill-opacity=".4"/><path d="M0 0l-6 22 14-10" fill="url(#${u}d)" fill-opacity=".7"/>`,
      coin: `<ellipse cx="-4" cy="44" rx="42" ry="11" fill="#fff" fill-opacity=".25"/><ellipse cx="-4" cy="34" rx="42" ry="11" fill="${W}" fill-opacity=".55"/><ellipse cx="-4" cy="24" rx="42" ry="11" fill="${W}" fill-opacity=".75"/><circle cx="6" cy="-14" r="40" fill="${W}"/><circle cx="6" cy="-14" r="40" fill="none" stroke="#fff" stroke-width="2"/><circle cx="6" cy="-14" r="31" fill="none" stroke="url(#${u}d)" stroke-opacity=".5" stroke-width="1.6"/><path d="M6-36v44M17-27c-2-4-6-6-11-6-7 0-11 4-11 9 0 13 23 6 23 19 0 5-5 9-12 9-5 0-9-2-12-6" fill="none" stroke="url(#${u}d)" stroke-width="6" stroke-linecap="round"/>`,
      star: `${leaf(1)}${leaf(-1)}<path d="M0-50l14.7 31 33.9 4.2-25 23.3 6.6 33.6L0 25.7l-30.2 16.4 6.6-33.6-25-23.3 33.9-4.2z" fill="${W}"/><path d="M0-50l14.7 31 33.9 4.2-25 23.3 6.6 33.6L0 25.7z" fill="#fff" fill-opacity=".4"/>`,
      cup: `${leaf(1)}${leaf(-1)}<path d="M-30-46h60v20c0 22-13 36-30 36s-30-14-30-36z" fill="${W}"/><path d="M0-46h30v20c0 22-13 36-30 36z" fill="#fff" fill-opacity=".38"/><path d="M-30-36h-15c0 20 8 28 19 31M30-36h15c0 20-8 28-19 31" fill="none" stroke="${W}" stroke-width="6"/><path d="M-6 10h12v16H-6z" fill="${W}"/><path d="M-24 26h48l5 14h-58z" fill="${W}"/><text x="0" y="-12" text-anchor="middle" font-family="'Mona Sans',system-ui,sans-serif" font-size="30" font-weight="800" fill="url(#${u}d)">${esc(d.rank || '')}</text>`
    };
    return `<svg viewBox="-100 -100 200 200" aria-hidden="true">${defs}${base}${A[k]}${spark(70, -62, 9, 1)}${spark(-74, -40, 6, 0.8)}${spark(64, 58, 5, 0.7)}</svg>`;
  }
  const CSS = `.fsc{position:relative;width:100%;aspect-ratio:1000/707;container-type:inline-size;font-family:'Mona Sans',system-ui,-apple-system,'Segoe UI',sans-serif;color:#F4F2F1;-webkit-font-smoothing:antialiased;isolation:isolate;font-size:16px;font-weight:400;font-style:normal;line-height:normal;letter-spacing:normal;text-transform:none;text-align:left;text-indent:0;white-space:normal;word-spacing:normal;text-shadow:none}
.fsc *{box-sizing:border-box}.fsc .fsc-pg{position:absolute;inset:0;border-radius:1.6cqw;overflow:hidden;background:var(--foil);box-shadow:0 2cqw 5cqw rgba(0,0,0,.5),0 1.4cqw 4cqw var(--g)}
.fsc .fsc-shade{position:absolute;inset:0;background:linear-gradient(100deg,rgba(9,10,14,.96) 0%,rgba(9,10,14,.9) 34%,rgba(9,10,14,.55) 55%,rgba(9,10,14,.12) 72%,rgba(9,10,14,0) 86%),linear-gradient(0deg,rgba(9,10,14,.55),rgba(9,10,14,0) 34%)}
.fsc .fsc-grain{position:absolute;inset:0;opacity:.2;background:repeating-linear-gradient(0deg,rgba(255,255,255,.08) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(0,0,0,.08) 0 1px,transparent 1px 4px)}
.fsc .fsc-holo{position:absolute;inset:0;mix-blend-mode:overlay;opacity:.75;background:linear-gradient(120deg,rgba(255,140,210,.55),rgba(140,210,255,.55) 30%,rgba(150,255,200,.5) 55%,rgba(255,235,140,.55) 80%,rgba(255,140,210,.55));background-size:300% 300%;animation:fscholo 8s linear infinite;-webkit-mask:linear-gradient(100deg,#0000 40%,#000 70%);mask:linear-gradient(100deg,#0000 40%,#000 70%)}
.fsc .fsc-glint{position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,.3) 48%,transparent 56%);background-size:260% 260%;animation:fscglint 5s ease-in-out infinite}
.fsc .fsc-edge{position:absolute;inset:0;border-radius:1.6cqw;box-shadow:inset 0 0 0 1px rgba(255,255,255,.28),inset 0 .2cqw .5cqw rgba(255,255,255,.25),inset 0 -1cqw 3cqw rgba(0,0,0,.35);pointer-events:none}
@keyframes fscholo{0%{background-position:0% 50%}100%{background-position:300% 50%}}@keyframes fscglint{0%,45%{background-position:130% 0}85%,100%{background-position:-90% 0}}
@media (prefers-reduced-motion: reduce){.fsc .fsc-glint,.fsc .fsc-holo{animation:none}}
.fsc .fsc-art{position:absolute;right:4.6cqw;top:8.5cqw;width:33cqw;height:33cqw}.fsc .fsc-art svg{width:100%;height:100%;display:block;filter:drop-shadow(0 1cqw 2cqw rgba(0,0,0,.35))}
.fsc .fsc-bg{position:absolute;inset:0;width:100%;height:100%;opacity:.55;mix-blend-mode:screen}
.fsc .fsc-fr{position:absolute;inset:2.2cqw;border:1px solid rgba(255,255,255,.3);border-radius:.9cqw}.fsc .fsc-fr:after{content:'';position:absolute;inset:.7cqw;border:1px solid var(--a1);opacity:.4;border-radius:.5cqw}
.fsc .fsc-cn{position:absolute;width:3.4cqw;height:3.4cqw;border:.22cqw solid var(--a1)}.fsc .fsc-cn.fsc-a{left:1.5cqw;top:1.5cqw;border-right:0;border-bottom:0;border-radius:.9cqw 0 0 0}.fsc .fsc-cn.fsc-b{right:1.5cqw;top:1.5cqw;border-left:0;border-bottom:0;border-radius:0 .9cqw 0 0}.fsc .fsc-cn.fsc-c{left:1.5cqw;bottom:1.5cqw;border-right:0;border-top:0;border-radius:0 0 0 .9cqw}.fsc .fsc-cn.fsc-d{right:1.5cqw;bottom:1.5cqw;border-left:0;border-top:0;border-radius:0 0 .9cqw 0}
.fsc .fsc-in{position:absolute;inset:6.2cqw 7cqw 8cqw;display:flex;flex-direction:column}
.fsc .fsc-top{display:flex;justify-content:space-between;align-items:center}.fsc .fsc-lg{font-weight:700;font-size:2.5cqw;letter-spacing:-.04em}.fsc .fsc-fut{font-style:normal;font-size:1.5cqw;font-weight:600;letter-spacing:0;background:var(--a2);color:#fff;border-radius:.4cqw;padding:.15cqw .6cqw;margin-left:.6cqw;vertical-align:.15cqw}
.fsc .fsc-ov{font-size:1.35cqw;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--a1)}
.fsc .fsc-mid{margin-top:5.4cqw;max-width:58%}.fsc .fsc-aw{font-size:1.45cqw;letter-spacing:.2em;text-transform:uppercase;color:rgba(244,242,241,.55);font-weight:600}
/* the page's own defaults for these, so the parts are plain blocks whatever page they sit in */
.fsc .fsc-nm,.fsc .fsc-tt,.fsc .fsc-ln{display:block}.fsc .fsc-sub{display:block}.fsc .fsc-fut,.fsc .fsc-cn{font-style:normal}
.fsc .fsc-nm{font-family:'Instrument Serif','Iowan Old Style','Palatino Linotype',Georgia,serif;font-style:italic;font-weight:400;font-size:var(--ns,7.4cqw);line-height:1.02;letter-spacing:-.01em;margin:.9cqw 0 0;overflow-wrap:anywhere;background:linear-gradient(180deg,#fff 30%,var(--a1));-webkit-background-clip:text;background-clip:text;color:transparent;padding-bottom:.6cqw}
.fsc .fsc-rule{width:9cqw;height:.28cqw;border-radius:1cqw;background:linear-gradient(90deg,var(--a1),var(--a2));margin:2cqw 0 1.8cqw}
.fsc .fsc-tt{font-size:4.1cqw;font-weight:720;letter-spacing:-.025em;line-height:1.05;margin:0}.fsc .fsc-ln{font-size:1.75cqw;line-height:1.5;color:rgba(244,242,241,.72);margin:1.1cqw 0 0;max-width:52cqw}
.fsc .fsc-ft{margin-top:auto;display:flex;gap:4.6cqw;align-items:flex-end}.fsc .fsc-f{display:flex;flex-direction:column;gap:.45cqw}.fsc .fsc-k{font-size:1.1cqw;letter-spacing:.18em;text-transform:uppercase;color:rgba(244,242,241,.48);font-weight:600}.fsc .fsc-v{font-size:1.6cqw;font-weight:600}.fsc .fsc-v.fsc-m{font-family:'Geist Mono',ui-monospace,Menlo,monospace;font-weight:500;letter-spacing:.02em;font-size:var(--ms,1.6cqw);white-space:nowrap}
.fsc .fsc-dis{position:absolute;left:7cqw;right:7cqw;bottom:4.3cqw;font-size:.95cqw;color:rgba(244,242,241,.36);text-align:center;letter-spacing:.02em}
.fsc .fsc-seal{position:absolute;right:5.4cqw;bottom:8.2cqw;width:11.5cqw;height:11.5cqw}.fsc .fsc-seal svg{width:100%;height:100%;display:block;filter:drop-shadow(0 1cqw 2.4cqw var(--g))}
.fsc .fsc-big{position:absolute;right:4.6cqw;width:33cqw;top:41.5cqw;text-align:center;font-size:4.4cqw;font-weight:760;letter-spacing:-.03em;line-height:1;color:#fff;text-shadow:0 .3cqw 1.6cqw rgba(0,0,0,.45)}.fsc .fsc-sub{display:block;font-size:1.15cqw;margin-top:.7cqw;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.8);font-weight:650}`;
  function seal(k, tone, id) {
    const [a1, a2] = TONE[tone]; const u = 'fsc' + id; let teeth = '';
    for (let i = 0; i < 36; i++) teeth += `<path d="M0-96L4.6-86-4.6-86z" transform="rotate(${i * 10})"/>`;
    let ticks = ''; for (let i = 0; i < 72; i++) ticks += `<path d="M0-71V-${i % 6 ? 67 : 64}" transform="rotate(${i * 5})"/>`;
    return `<svg viewBox="-110 -110 220 220" aria-hidden="true"><defs><linearGradient id="${u}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a1}"/><stop offset="1" stop-color="${a2}"/></linearGradient><radialGradient id="${u}b" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".45" stop-color="${a1}"/><stop offset="1" stop-color="${a2}"/></radialGradient><path id="${u}p" d="M0 56a56 56 0 1 1 .01 0z"/></defs>
<path d="M-34 60l-18 46 22-8 12 20 14-52zM34 60l18 46-22-8-12 20-14-52z" fill="url(#${u}a)" opacity=".85"/><g fill="url(#${u}a)">${teeth}</g><circle r="87" fill="url(#${u}a)"/><circle r="80" fill="#0B0D12"/><circle r="76" fill="none" stroke="url(#${u}a)" stroke-width="1.2"/><g stroke="${a1}" stroke-opacity=".55" stroke-width="1">${ticks}</g>
<text font-family="'Mona Sans',system-ui,sans-serif" font-size="7.6" font-weight="700" fill="${a1}"><textPath href="#${u}p" startOffset="0" textLength="350" lengthAdjust="spacing">FUNDED SKY ✦ VERIFIED RESULT ✦ SIMULATED TRADING ✦</textPath></text>
<circle r="44" fill="url(#${u}b)"/><circle r="44" fill="none" stroke="#fff" stroke-opacity=".5"/><g transform="scale(1.35)">${ICON[k]}</g></svg>`;
  }
  let n = 0;
  // Which of the looks a certificate gets when its tone follows a number: lifetime payouts by amount, competitions by place
  const lifeTone = (amount) => { const v = Number(amount) || 0; return v >= 100000 ? 'plat' : v >= 50000 ? 'gold' : v >= 25000 ? 'silver' : 'bronze'; };
  const placeTone = (pos) => ({ 1: 'gold', 2: 'silver', 3: 'bronze' }[Number(pos)] || 'violet');
  const ordinal = (k) => { k = Number(k) || 0; const s = ['th', 'st', 'nd', 'rd']; const v = k % 100; return k + (s[(v - 20) % 10] || s[v] || s[0]); };
  // SVG gradient ids must differ for every certificate on a page. Without a key each call takes the next number; with a key
  // (the dashboard passes the certificate ID plus where it is shown) the ids are the same on every redraw. Only letters and digits get through.
  const safeKey = (k) => 'k' + String(k).replace(/[^A-Za-z0-9]/g, (c) => '_' + c.charCodeAt(0).toString(16));
  // d: { kind, tone, name, first, what, amount, size, place, rank, of, date, id, host }; key: optional, see above
  function render(d, key) {
    d = d || {}; const K = KIND[d.kind] || KIND.passed; const tone = TONE[d.tone] ? d.tone : K.tone; const [a1, a2, g, foil] = TONE[tone]; const id = key != null && key !== '' ? safeKey(key) : ++n;
    const title = typeof K.title === 'function' ? K.title(d) : K.title; const nm = String(d.name || ''); const ns = nm.length > 30 ? 4.2 : nm.length > 22 ? 5.2 : nm.length > 16 ? 6.2 : 7.4;
    const first = String(d.first || nm.split(' ')[0]); const verify = (d.host || 'fundedsky.com') + '/cert/' + (d.id || ''); const ml = String(d.id || '').length + verify.length; const ms = ml > 46 ? Math.max(0.9, 1.6 * 46 / ml).toFixed(2) : '';
    const big = d.kind === 'payout' || d.kind === 'lifetime' ? [d.amount, d.kind === 'payout' ? 'Paid' : 'Lifetime'] : d.kind === 'comp' ? ['#' + d.rank, 'of ' + d.of] : [d.size || '', d.kind === 'funded' ? 'Funded' : 'Evaluation'];
    return frame({ style: `--a1:${a1};--a2:${a2};--g:${g};--foil:${foil};--ns:${ns}cqw${ms ? `;--ms:${ms}cqw` : ''}`, label: esc(`Funded Sky certificate: ${title}, awarded to ${nm}`), a1, holo: HOLO[tone] ? HOLO_EL : '',
      over: esc(K.over), name: esc(nm), title: esc(title), line: `${esc(first)} ${esc(K.line(d))}`, date: esc(d.date), id: esc(d.id), verify: esc(verify),
      art: art(K.icon, { a1, a2, rank: d.rank }, 'fsa' + id), seal: seal(K.icon, tone, id), big: esc(big[0]), bigSub: esc(big[1]) });
  }
  const HOLO_EL = '<span class="fsc-holo"></span>';
  // The frame: where every part sits. v holds strings that are ready to insert: render() above escapes everything it passes, and the
  // design-canvas generator (scripts/gen-cert-dc.js) passes its own placeholders, so the canvas and the live certificate share this markup.
  // Parts are plain div and span elements with fsc- class names, so the styles of a page that hosts a certificate cannot reach them.
  function frame(v) {
    let rings = ''; for (let i = 1; i <= 16; i++) rings += `<circle cx="790" cy="250" r="${i * 34}" fill="none" stroke="#fff" stroke-opacity="${(0.07 - i * 0.003).toFixed(3)}"/>`;
    let waves = ''; for (let i = 0; i < 9; i++) waves += `<path d="M-20 ${560 + i * 16}C200 ${500 + i * 16} 380 ${640 + i * 14} 620 ${580 + i * 15}S900 ${520 + i * 16} 1020 ${600 + i * 14}" fill="none" stroke="${v.a1}" stroke-opacity="${(0.10 - i * 0.008).toFixed(3)}"/>`;
    return `<div class="fsc" style="${v.style}" role="img" aria-label="${v.label}">${v.pre || ''}<div class="fsc-pg"><span class="fsc-grain"></span>${v.holo || ''}<span class="fsc-shade"></span>
<svg class="fsc-bg" viewBox="0 0 1000 707" preserveAspectRatio="none" aria-hidden="true">${rings}${waves}</svg><span class="fsc-fr"></span><span class="fsc-cn fsc-a"></span><span class="fsc-cn fsc-b"></span><span class="fsc-cn fsc-c"></span><span class="fsc-cn fsc-d"></span>
<div class="fsc-in"><div class="fsc-top"><span class="fsc-lg">fundedsky<span class="fsc-fut">futures</span></span><span class="fsc-ov">${v.over}</span></div>
<div class="fsc-mid"><div class="fsc-aw">Awarded to</div><div class="fsc-nm">${v.name}</div><div class="fsc-rule"></div><div class="fsc-tt">${v.title}</div><div class="fsc-ln">${v.line}</div></div>
<div class="fsc-ft"><div class="fsc-f"><span class="fsc-k">Date</span><span class="fsc-v">${v.date}</span></div><div class="fsc-f"><span class="fsc-k">Certificate ID</span><span class="fsc-v fsc-m">${v.id}</span></div><div class="fsc-f"><span class="fsc-k">Verify</span><span class="fsc-v fsc-m">${v.verify}</span></div></div></div>
<div class="fsc-art">${v.art}</div><div class="fsc-seal">${v.seal}</div><div class="fsc-big">${v.big}<span class="fsc-sub">${v.bigSub}</span></div>
<span class="fsc-glint"></span><span class="fsc-edge"></span><div class="fsc-dis">Results are from simulated trading accounts. Funded Sky pays performance rewards based on simulated results. Past results do not guarantee future results.</div></div></div>`;
  }
  // What the dashboard shows before a trader has earned one
  const SAMPLE = { kind: 'passed', name: 'Alex R.', first: 'Alex', what: '$50K Evaluation', size: '$50K', date: 'November 26, 2026', id: 'CF-SAMPLE' };
  const KINDS = [['passed', 'Passed'], ['funded', 'Funded'], ['payout', 'Payouts'], ['lifetime', 'Lifetime'], ['comp', 'Competitions']];
  const api = { render, frame, CSS, TONE, KIND, KINDS, SAMPLE, art, seal, ICON, HOLO, HOLO_EL, lifeTone, placeTone, ordinal, esc };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.FSCERT = api; // in a browser the design's CSS is added to the page once
    if (root.document && !root.document.getElementById('fsc-css')) { const st = root.document.createElement('style'); st.id = 'fsc-css'; st.textContent = CSS; root.document.head.appendChild(st); } }
})(typeof window !== 'undefined' ? window : globalThis);
