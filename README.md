## RG Bowl – BTM

Fresh comfort bowls cooked when you order, for late-night cravings in BTM, Bangalore.

This is the main codebase for the RG Bowl MVP:

- Public user app: landing, menu, cart, checkout, success
- Admin dashboard: login, orders, revenue, analytics

Built with:

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM + MySQL
- NextAuth (Credentials)
- Razorpay
- ESLint + Prettier

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

### Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

- `DATABASE_URL` – MySQL connection string (e.g. PlanetScale, Railway, RDS, etc.)
- `NEXTAUTH_URL` – usually `http://localhost:3000` in development
- `NEXTAUTH_SECRET` – a random string for NextAuth (e.g. `openssl rand -base64 32`)
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` – Razorpay API credentials

Do not commit real secrets to git. Only `.env.example` should be tracked.

These variables are only read on the server (in API routes or auth config). Secrets such as
`RAZORPAY_KEY_SECRET` are never exposed to the client.

### Prisma (database)

Prisma is configured in `prisma/schema.prisma` with a `MySQL` datasource. The actual database
connection URL is provided via `DATABASE_URL` (see `prisma.config.ts`).

Common commands you will run locally:

```bash
# Generate Prisma Client after changing schema
npx prisma generate

# Create and apply a migration (updates the database)
npx prisma migrate dev --name init
```

These commands should be run from the project root and require a valid `DATABASE_URL` in `.env.local`.

For type-safe database access in API routes and server components, import the shared Prisma client:

```ts
import { prisma } from "@/lib/prisma";
```

This avoids creating multiple PrismaClient instances during local development.

### Admin authentication (NextAuth)

Admin authentication uses NextAuth with a Credentials provider:

- The `Admin` table in the database stores admin users (email + bcrypt-hashed password).
- The NextAuth config lives in `auth.ts` and the route handler in `app/api/auth/[...nextauth]/route.ts`.
- The helper `getCurrentAdmin` in `lib/auth-helpers.ts` is used to protect:
  - Admin pages under `/admin` (except `/admin/login`, which stays public).
  - Admin APIs such as `/api/orders`.

To create the first admin user securely:

1. Ensure your database is migrated (`npx prisma migrate dev`).
2. Generate a bcrypt hash of a strong password (e.g. using a secure local script or Node REPL).
3. Insert a row into the `Admin` table via `npx prisma studio` or a one-off script (do not commit the script).

### Security considerations

- All sensitive keys (database URL, NextAuth secret, Razorpay secret) are read from environment
  variables and never hard-coded in the codebase.
- Razorpay payment verification is performed server-side in `/api/payments/verify` using the
  recommended HMAC signature check:
  - Signature = `HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, RAZORPAY_KEY_SECRET)`.
  - If the signature does not match, the order is **not** created.
- All critical API inputs are validated with `zod`:
  - Payment order creation and verification payloads.
  - Admin order creation, status updates, and deletes.
  - Analytics endpoints.
- Admin-only APIs and pages are protected:
  - Admin routes (`/admin/**` except `/admin/login`) and analytics/order APIs check for an
    authenticated admin session via `getCurrentAdmin`.
- Basic rate limiting is applied to payment endpoints to reduce abuse:
  - `/api/payments/create-order` and `/api/payments/verify` use an in-memory limiter per IP
    (20 requests per minute). This is best-effort and should be complemented with edge or
    WAF-level rate limiting in production.

### Deployment (Vercel + MySQL)

This project is ready to deploy on Vercel:

- `package.json` includes the standard `build` and `start` scripts that Vercel expects.
- `next.config.mjs` uses the default Next.js settings with strict mode enabled.

#### 1. Provision MySQL

1. Create a new MySQL database on your preferred provider:
   - For example: PlanetScale, Railway, Render, AWS RDS, or any managed MySQL.
2. Copy the connection string and set it as `DATABASE_URL` in your Vercel project environment
   variables (Project Settings → Environment Variables).
3. Locally, set the same `DATABASE_URL` in `.env.local` for development.

#### 2. Run Prisma migrations against the hosted DB

With `DATABASE_URL` pointing to your hosted MySQL instance:

```bash
npx prisma migrate deploy
```

This applies all existing migrations to the production database without creating new ones.

#### 3. Configure NextAuth in production

On Vercel:

- Set `NEXTAUTH_URL` to your production URL, e.g. `https://rg-bowl-btm.vercel.app`.
- Set `NEXTAUTH_SECRET` to a strong, random string (generate via `openssl rand -base64 32` or the
  Vercel UI).

#### 4. Configure Razorpay (test vs live)

In development:

- Use Razorpay **test mode** keys in your `.env.local`:
  - `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` from the Razorpay dashboard (Test mode).

In production:

- Switch these to your **live mode** keys in Vercel environment variables.
- No code changes are required; the backend reads from `process.env` and the frontend receives only
  the public key ID.

After these steps, you can connect your GitHub repo to Vercel or push via the Vercel CLI; Vercel
will install dependencies, run `next build`, and serve the app using your configured environment
variables and database.


## Project Structure (MVP)

- `app/page.tsx` – public landing page (hero + entry point for menu/cart/checkout)
- `app/success/page.tsx` – order success/confirmation page
- `app/admin/login/page.tsx` – admin login
- `app/admin/orders/page.tsx` – orders management
- `app/admin/revenue/page.tsx` – revenue dashboard
- `app/admin/analytics/page.tsx` – analytics panel
- `components/menu/*` – menu-related UI (to be implemented)
- `components/cart/*` – cart-related UI (to be implemented)
- `components/checkout/*` – checkout-related UI (to be implemented)

Later phases will add:

- Real menu, cart and checkout flows
- Razorpay payment integration wired to real orders
- NextAuth-based admin authentication backed by Prisma
