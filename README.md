# Funded Sky

Futures prop firm platform: checkout, trader dashboard, back office and API, in one Node.js app on Postgres.

## What runs
- **Checkout** (`/checkout`): Essential, Prime and Instant plans, add-ons, promo codes, bundles. Stripe Checkout when `STRIPE_SECRET_KEY` is set, otherwise a built-in test mode.
- **Trader app** (`/app`): accounts, journal, payouts, billing, education, affiliates, resources, rewards, competitions, support, settings. Light and dark, desktop and mobile.
- **Reset checkout** (`/reset?acct=ID`) and **activation fee** checkout for passed Essential accounts.
- **Back office** (`/admin`): traders and identity review, accounts, payout review and sending, orders and refunds, support tickets, catalog (prices, rules, caps, promos), site content, email outbox, team and audit log.
- **Rule engine** (`server/rules.js`): end-of-day trailing max loss, daily loss limit (soft pause), profit targets, minimum days, consistency, payout eligibility, per-payout and lifetime caps, Instant profit goal.
- **Simulated feed** (`server/sim.js`): places trades on live accounts during market hours and closes each day at 5 PM ET. Replace `ingestTrade()` calls with a platform connector (Tradovate, Rithmic, ProjectX) once you have a firm agreement.

## Run locally
```
npm install
DATABASE_URL=postgres://... ADMIN_EMAILS=you@example.com npm run build && npm start
```
The schema is created on boot. Sign up with an email in `ADMIN_EMAILS` to get the admin role.

## Deploy
Railway: connect this repo, add a Postgres database, set `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `PUBLIC_URL` and `ADMIN_EMAILS`. `railway.json` sets the build, start and health check.

## Source layout
- `server/` API, rules, payments, simulated feed, schema
- `web/src/` trader app and back office sources (design system kit)
- `web/pages/` checkout and sign-in templates
- `web/runtime/` the small runtime that renders the templates
- `scripts/build-web.js` builds `web/dist`
