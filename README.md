# Padamshree Garments shop ordering MVP

A mobile-first, bilingual (English/Kannada) system for Diwali crowds. Customers scan a QR code, select clothes and exact variants, receive a private tracking link plus a pickup token, and pay only at collection. Staff can enter the same order for customers without smartphones.

Supabase PostgreSQL is the production source of truth. The labeled demo mode stores sample orders only in the current browser; it never presents local data as cloud persistence.

## Customer and staff workflow

1. The QR URL opens 9 large category tiles—no product feed.
2. A category shows only its products. Exact zero-stock variants are omitted; a product disappears only when every active variant is unavailable.
3. The customer chooses size, colour and quantity, reviews a picture-led cart, enters a short name and optionally a phone, then places the order.
4. `place_order` performs one transaction: idempotency lookup, canonical variant/price validation, ordered row locks, stock validation, reservation, daily token allocation and order/item inserts.
5. The customer sees an `A001`-style token plus a separate random UUID tracking key. The token is not authorization.
6. Owner Realtime is only a notification. Every initial load, notification, reconnect and manual reload fetches the database again. Staff accepts, prepares, marks ready, prints/reprints, collects payment and marks collected.

WhatsApp may be added as a backup notification **after** database insertion succeeds. It is not an ordering channel.

## State and inventory rules

| State | Stock effect | Next states |
|---|---|---|
| Placed | Reserved | Accepted, Cancelled, Expired |
| Accepted | Reserved | Preparing, Cancelled, Expired |
| Preparing | Reserved | Ready, Cancelled |
| Ready | Reserved | Collected, Cancelled |
| Collected | Reservation removed; on-hand reduced; sold increased | Terminal |
| Cancelled / Expired | Reservation returned | Terminal |

`stock_on_hand` is physical unsold stock. `reserved_quantity` is held by active orders. Availability is `stock_on_hand - reserved_quantity`. A constraint prevents reservations above on-hand stock. Collection decrements reservation and on-hand and increments sold; cancellation/expiry only releases reservation.

Expiry is an explicit owner action in the MVP. Only Placed and Accepted may expire; Preparing and Ready are never silently released. The RPC is cron-ready, but no schedule is enabled without a business-hours decision.

Daily tokens use a transaction advisory lock and per-day sequence. The day uses `shop_settings.timezone` (default `Asia/Kolkata`).

## Architecture and security

- Next.js 16.3.2 App Router, React 19, TypeScript, and Next.js 16 `src/proxy.ts` for Supabase session refresh plus an optimistic owner-route gate.
- Supabase Auth, PostgreSQL/RPC, Storage bucket `catalog`, and owner-only Realtime.
- Public catalog is server-rendered with 60-second revalidation. Customer tracking polls every 15 seconds plus manual refresh; visitors do not hold Realtime connections.
- RLS is enabled on every exposed `public` table. Broad Data API privileges are revoked and minimum explicit `GRANT`s restored for the 2026 opt-in exposure model.
- Owner membership is `public.owner_users(user_id)` linked to `auth.users`; authorization never trusts user-editable metadata.
- Orders/items have no anonymous direct-read policy. `get_order_status` returns a small projection only for the high-entropy tracking key.
- Privileged functions set an empty `search_path`, validate arguments, and revoke default `PUBLIC` execution.
- Storage writes require an authenticated owner; public reads are limited to catalog assets.
- No service-role/secret key is used or exposed. Browser price, total, stock and token values are never trusted.

Main schema: [`supabase/migrations/20260822075036_initial_shop_schema.sql`](supabase/migrations/20260822075036_initial_shop_schema.sql). Demo seed: [`supabase/migrations/20260822075227_seed_demo_catalog.sql`](supabase/migrations/20260822075227_seed_demo_catalog.sql).

## Local demo

Requires Node.js 20.9+.

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Keep `NEXT_PUBLIC_DEMO_MODE=true`. Browse `http://localhost:3000`; `/owner/login` accepts any valid email/password shape in demo mode. Demo orders are browser-local.

## Connect Supabase (the remaining external decision)

Choose/create the Supabase project that will own production data, then:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Create the owner email/password user in Supabase Auth, copy its UUID, and run once:

```sql
insert into public.owner_users(user_id, display_name)
values ('AUTH_USER_UUID', 'Shop owner');
```

Copy `.env.example` to `.env.local`, fill the project URL and **publishable** key, and set `NEXT_PUBLIC_DEMO_MODE=false`. Never place a secret/service-role key in `NEXT_PUBLIC_*`.

Confirm `orders` is in the `supabase_realtime` publication (the migration adds it idempotently). Keep `public` exposed in Data API settings; the migration’s grants and RLS define access. Run migrations first in a non-production Supabase branch/project and run database/security advisors before promotion.

## Owner operations

- `/owner/login`: secure Supabase email/password login.
- `/owner`: queue, alert, summary, low-stock list and state actions.
- `/owner/manual-order`: same reservation/token RPC as customers.
- `/owner/catalog`: bilingual category/product controls, archive/reorder, uploads, variant stock and thresholds.
- `/owner/receipt/[id]`: 80 mm browser/thermal layout. Orders are saved before printing, so printer/network failures cannot lose them; reprint is always available.

Phone is optional: pickup uses the private link/token, and a mandatory phone would add friction and collect unnecessary data.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Focused tests cover final-unit contention/insufficient stock, cancellation restock, collection-to-sold conversion, sold-out visibility, idempotency and token uniqueness. A live DB concurrency test awaits the selected Supabase project; run two simultaneous `place_order` calls against a one-unit variant and verify one succeeds.

## Load test (200 visitors)

The k6 profile is read-only and ramps to 200 virtual customers; it intentionally does not place orders:

```bash
k6 run -e BASE_URL=http://localhost:3000 tests/load/catalog-browse.js
```

Run only against local/preview or an explicitly approved target. Never point it at production without authorization.

## Deployment

Deploy to a Node-compatible Next.js host, configure the three public environment values, and use the deployment root as the QR target. The database preserves orders if owner Realtime, printing, or the dashboard connection is interrupted.
