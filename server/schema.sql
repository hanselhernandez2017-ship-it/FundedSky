-- Funded Sky schema. Idempotent: safe to run on every boot.
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  tid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  pass_hash TEXT NOT NULL,
  first TEXT NOT NULL DEFAULT '',
  last TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'trader',          -- trader | admin | support | risk | finance
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active',         -- active | suspended | banned
  kyc_status TEXT NOT NULL DEFAULT 'none',       -- none | submitted | verified | rejected
  kyc JSONB NOT NULL DEFAULT '{}',
  points INTEGER NOT NULL DEFAULT 0,
  ref_code TEXT UNIQUE,
  referred_by INTEGER REFERENCES users(id),
  settings JSONB NOT NULL DEFAULT '{}',
  agreements JSONB NOT NULL DEFAULT '{}',
  stripe_customer TEXT,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ua TEXT NOT NULL DEFAULT '',
  ip TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS tokens (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,                            -- verify | reset
  used BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog (
  id INTEGER PRIMARY KEY,
  data JSONB NOT NULL,
  updated_by INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL,                            -- evaluation | reset | activation | instant
  lines JSONB NOT NULL DEFAULT '[]',
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  promo TEXT,
  status TEXT NOT NULL DEFAULT 'pending',        -- pending | paid | refunded | failed | canceled
  pay_method TEXT NOT NULL DEFAULT '',
  provider TEXT NOT NULL DEFAULT '',             -- stripe | test | points
  provider_ref TEXT,
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  order_id INTEGER REFERENCES orders(id),
  parent_id TEXT,
  plan TEXT NOT NULL,                            -- essential | prime | instant
  size INTEGER NOT NULL,
  platform TEXT NOT NULL DEFAULT 'Tradovate',
  kind TEXT NOT NULL,                            -- evaluation | funded
  phase TEXT NOT NULL,                           -- active | passed | breached | closed | review
  start_bal NUMERIC(14,2) NOT NULL,
  balance NUMERIC(14,2) NOT NULL,
  peak_eod NUMERIC(14,2) NOT NULL,
  floor NUMERIC(14,2) NOT NULL,
  today_pnl NUMERIC(14,2) NOT NULL DEFAULT 0,
  today_date DATE,
  halted_today BOOLEAN NOT NULL DEFAULT FALSE,
  days_traded INTEGER NOT NULL DEFAULT 0,
  best_day NUMERIC(14,2) NOT NULL DEFAULT 0,
  cycle_profit_start NUMERIC(14,2),
  cycle_best NUMERIC(14,2) NOT NULL DEFAULT 0,
  cycle_win_days INTEGER NOT NULL DEFAULT 0,
  payout_count INTEGER NOT NULL DEFAULT 0,
  paid_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  free_resets INTEGER NOT NULL DEFAULT 0,
  reset_count INTEGER NOT NULL DEFAULT 0,
  addons JSONB NOT NULL DEFAULT '[]',
  steps JSONB NOT NULL DEFAULT '{}',
  sim JSONB NOT NULL DEFAULT '{}',
  breach_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  passed_at TIMESTAMPTZ,
  funded_at TIMESTAMPTZ,
  breached_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS accounts_user ON accounts(user_id);

CREATE TABLE IF NOT EXISTS trades (
  id BIGSERIAL PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL,
  day DATE NOT NULL,
  instrument TEXT NOT NULL,
  side TEXT NOT NULL,
  qty INTEGER NOT NULL,
  pnl NUMERIC(12,2) NOT NULL,
  hold_min INTEGER NOT NULL DEFAULT 0,
  tag TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS trades_acct_day ON trades(account_id, day);

CREATE TABLE IF NOT EXISTS days (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  pnl NUMERIC(12,2) NOT NULL DEFAULT 0,
  n_trades INTEGER NOT NULL DEFAULT 0,
  eod_balance NUMERIC(14,2) NOT NULL,
  floor NUMERIC(14,2) NOT NULL,
  closed BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (account_id, day)
);

CREATE TABLE IF NOT EXISTS payouts (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  number INTEGER NOT NULL,
  gross NUMERIC(12,2) NOT NULL,
  split INTEGER NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  method TEXT NOT NULL DEFAULT '',
  rail TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'requested',      -- requested | approved | paid | denied
  batch TEXT,
  note TEXT NOT NULL DEFAULT '',
  reviewed_by INTEGER,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  denied_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS payout_methods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rail TEXT NOT NULL,                            -- Rise | USDC | Bank
  label TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  unlock_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  channel TEXT NOT NULL DEFAULT 'Web',
  status TEXT NOT NULL DEFAULT 'open',           -- open | pending | solved
  priority TEXT NOT NULL DEFAULT 'normal',
  assignee INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ticket_msgs (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id INTEGER REFERENCES users(id),
  staff BOOLEAN NOT NULL DEFAULT FALSE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  go TEXT NOT NULL DEFAULT 'accounts',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS points_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  delta INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  label TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'discount',         -- discount | free_reset | free_eval
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outbox (
  id SERIAL PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  template TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'queued',         -- queued | sent | logged | failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit (
  id BIGSERIAL PRIMARY KEY,
  actor_id INTEGER,
  action TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kv (
  k TEXT PRIMARY KEY,
  v JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS seq_order START 2301;
CREATE SEQUENCE IF NOT EXISTS seq_payout START 3401;
CREATE SEQUENCE IF NOT EXISTS seq_tid START 10401;
CREATE SEQUENCE IF NOT EXISTS seq_ticket START 4901;

CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  config JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'off',
  last_check TIMESTAMPTZ,
  last_error TEXT NOT NULL DEFAULT '',
  updated_by INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS webhook_log (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  event TEXT NOT NULL DEFAULT '',
  ok BOOLEAN NOT NULL DEFAULT TRUE,
  detail TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_ref TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_ref TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rise_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS provider_ref TEXT;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS tx_hash TEXT;
ALTER TABLE ticket_msgs ADD COLUMN IF NOT EXISTS internal BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE IF NOT EXISTS error_log (id BIGSERIAL PRIMARY KEY, path TEXT NOT NULL DEFAULT '', msg TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS jobs_log (id BIGSERIAL PRIMARY KEY, job TEXT NOT NULL, ok BOOLEAN NOT NULL DEFAULT TRUE, detail TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE outbox ADD COLUMN IF NOT EXISTS ext_id TEXT;
ALTER TABLE outbox ADD COLUMN IF NOT EXISTS events JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE outbox ADD COLUMN IF NOT EXISTS user_id INT;
CREATE INDEX IF NOT EXISTS outbox_ext ON outbox(ext_id);
CREATE INDEX IF NOT EXISTS outbox_tpl ON outbox(template, created_at);
CREATE TABLE IF NOT EXISTS visits (day DATE NOT NULL, src TEXT NOT NULL DEFAULT 'direct', camp TEXT NOT NULL DEFAULT '', country TEXT NOT NULL DEFAULT '', dev TEXT NOT NULL DEFAULT 'desktop', n INT NOT NULL DEFAULT 0, PRIMARY KEY (day, src, camp, country, dev));
CREATE TABLE IF NOT EXISTS pageviews (day DATE NOT NULL, path TEXT NOT NULL, n INT NOT NULL DEFAULT 0, PRIMARY KEY (day, path));
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS rs JSONB;
CREATE TABLE IF NOT EXISTS auto_sent (key TEXT PRIMARY KEY, at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS review BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS rating TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS rated_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_on BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_backup JSONB;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS mfa BOOLEAN NOT NULL DEFAULT FALSE;
