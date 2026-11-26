// Default catalog: Essential / Prime / Instant (the "MID" structure from the profit model).
// Stored in the catalog table on first boot; the back office edits the stored copy.
const SIZES = [25000, 50000, 100000, 150000];

const DEFAULT_CATALOG = {
  version: 1,
  plans: [
    {
      id: 'essential', name: 'Essential Plan', short: 'Essential', kind: 'evaluation', badge: '',
      desc: 'Lowest price to start. One-time activation fee when you pass.',
      sizes: [
        { size: 25000, price: 79, activation: 129 },
        { size: 50000, price: 119, activation: 149 },
        { size: 100000, price: 199, activation: 179 },
        { size: 150000, price: 269, activation: 199 }
      ],
      platforms: ['Tradovate', 'NinjaTrader', 'TradingView', 'Rithmic'],
      addons: ['reset', 'daily'], active: true
    },
    {
      id: 'prime', name: 'Prime Plan', short: 'Prime', kind: 'evaluation', badge: 'Most Popular',
      desc: 'Pass and get funded. No activation fee.',
      sizes: [
        { size: 25000, price: 159, activation: 0 },
        { size: 50000, price: 229, activation: 0 },
        { size: 100000, price: 349, activation: 0 },
        { size: 150000, price: 449, activation: 0 }
      ],
      platforms: ['Tradovate', 'NinjaTrader', 'TradingView', 'Rithmic'],
      addons: ['reset', 'daily'], active: true
    },
    {
      id: 'instant', name: 'Instant Plan', short: 'Instant', kind: 'funded', badge: '',
      desc: 'Skip the evaluation. Trade a funded account today.',
      sizes: [
        { size: 25000, price: 349, activation: 0 },
        { size: 50000, price: 499, activation: 0 },
        { size: 100000, price: 749, activation: 0 }
      ],
      platforms: ['Tradovate', 'NinjaTrader', 'TradingView'],
      addons: ['daily'], active: true
    }
  ],
  // Evaluation rules (Essential and Prime)
  evalRules: {
    25000: { target: 1500, maxLoss: 1000, dll: 500, contracts: 3 },
    50000: { target: 3000, maxLoss: 2000, dll: 1000, contracts: 5 },
    100000: { target: 6000, maxLoss: 3000, dll: 2000, contracts: 10 },
    150000: { target: 9000, maxLoss: 4500, dll: 3000, contracts: 15 }
  },
  evalCommon: { minDays: 2, consistency: 50, drawdown: 'End of day trailing', news: 'No trades 2 minutes before and after high-impact news' },
  // Funded rules (accounts from Essential and Prime)
  fundedCommon: {
    lockAbove: 100, winDays: 5, winDayMin: 100, consistency: 40, payoutMin: 250, split: 90,
    reviewAfter: 6, halfContractsUntilFirstPayout: true, cushion: 100
  },
  fundedCaps: {
    25000: { first: 500, later: 1000, lifetime: 4500 },
    50000: { first: 1000, later: 2000, lifetime: 9000 },
    100000: { first: 1500, later: 2500, lifetime: 12000 },
    150000: { first: 2000, later: 3000, lifetime: 15000 }
  },
  // Instant plan rules
  instantRules: {
    25000: { goal: 1500, maxLoss: 1000, dll: 500, contracts: 2 },
    50000: { goal: 3000, maxLoss: 1750, dll: 875, contracts: 4 },
    100000: { goal: 4500, maxLoss: 2500, dll: 1250, contracts: 8 }
  },
  instantCommon: { consistency: 20, splitFirst: 90, splitLater: 90, splitFirstCount: 3, winDays: 5, winDayMin: 100, payoutMin: 250, reviewAfter: 6, cushion: 100 },
  instantCaps: {
    25000: { first: 500, later: 750, lifetime: 3750 },
    50000: { first: 1000, later: 1500, lifetime: 7500 },
    100000: { first: 1500, later: 2000, lifetime: 10500 }
  },
  addons: {
    reset: { name: 'Free Reset', desc: 'Breach a rule? Restart once at no cost.', pct: 15 },
    daily: { name: 'Daily Payouts', desc: 'Once funded, request payouts daily instead of every 5 winning days.', pct: 25 }
  },
  resetPct: 55,
  promos: [
    { code: 'BLACKFRIDAY', name: 'Black Friday', pct: 30, plans: ['essential', 'prime'], starts: '2026-11-24', ends: '2026-11-30', once: true, active: true, desc: '30% off Essential and Prime evaluations' }
  ],
  bundles: [
    { id: 'duo', buy: 'Buy 2 Accounts', get: 'Save 10% on Both', min: 2, pct: 10 },
    { id: 'trio', buy: 'Buy 3 Accounts', get: 'Save 15% on All', min: 3, pct: 15 }
  ],
  maxPromoPct: 30
};

const fmtK = (s) => s / 1000 + 'K';
module.exports = { DEFAULT_CATALOG, SIZES, fmtK };
