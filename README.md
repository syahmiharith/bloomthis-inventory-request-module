# Inventory Request Module

Simple internal inventory request system for an internship technical assignment. Employees browse inventory and submit requests. Admins create inventory items, review requests, approve or reject them, and fulfill approved requests when stock is sufficient.

The project intentionally avoids production authentication and extra workflows. It focuses on clear UX, server-side business rules, PostgreSQL persistence, and reviewer-friendly code.

## Tech Stack

- Next.js App Router
- TypeScript
- Supabase Postgres
- Drizzle ORM
- Zod
- Vitest
- Plain CSS

## Implemented Routes

- `/` dashboard
- `/inventory` inventory list
- `/inventory/new` create inventory item
- `/requests` request list
- `/requests/new` create request
- `/requests/[id]` request detail and history

## Core Business Rules

- New requests start as `pending`.
- Approving a request does not deduct or reserve stock.
- Rejecting a request does not deduct stock.
- Fulfilling a request deducts stock only when the request is `approved`.
- Fulfillment checks stock inside the server-side transaction.
- Insufficient stock leaves the request and inventory unchanged.
- Fulfilled and rejected requests are terminal.
- Request creation and status changes append request history.
- Demo roles are intentionally simple: `admin` and `employee`.

## Setup

Install dependencies:

```bash
npm install
```

Copy environment variables:

```bash
cp .env.example .env.local
```

For local Docker Postgres, set `DATABASE_URL` to the Docker connection string from
`docker-compose.yml`, then start PostgreSQL:

```bash
docker compose up -d
```

Run migrations:

```bash
npm run db:migrate
```

Seed demo data:

```bash
npm run db:seed
```

Run locally:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Required for local development and production:

- `DATABASE_URL` or `POSTGRES_URL`: Supabase Postgres connection string used by the app at runtime. Vercel's Supabase integration commonly provides `POSTGRES_URL`.

Optional:

- `MIGRATE_DATABASE_URL`: direct or session-pooler database URL for Drizzle migrations. Falls back to `DATABASE_URL`, `POSTGRES_URL_NON_POOLING`, then `POSTGRES_URL` when omitted.
- `POSTGRES_URL_NON_POOLING`: Supabase direct/non-pooling URL commonly provided by the Vercel integration.
- `TEST_DATABASE_URL`: PostgreSQL connection string for integration tests.
- `DEMO_USER_EMAIL`: initial seeded demo user email. Defaults to `admin@inventory.local`.

Database connection strings are read server-side from `process.env` in `db/index.ts`. No database environment variables are exposed with `NEXT_PUBLIC_`, and the app does not use `NEXT_PUBLIC_DATABASE_URL`.

Safe local env status check:

```bash
npm run env:check
```

The command checks `DATABASE_URL` first, then `POSTGRES_URL`. It prints only `DATABASE_URL_STATUS=missing`, `DATABASE_URL_STATUS=localhost`, or `DATABASE_URL_STATUS=hosted`. It never prints the actual connection string.

Example `.env.local` shape without secrets:

```bash
DATABASE_URL=postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres
POSTGRES_URL=postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres
MIGRATE_DATABASE_URL=postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:5432/postgres
POSTGRES_URL_NON_POOLING=postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/inventory_request_module_test
DEMO_USER_EMAIL=admin@inventory.local
```

## Supabase Backend Setup

1. Create a Supabase project.
2. Open Project Settings -> Database -> Connection string.
3. Use the Supabase/Vercel runtime connection string as `DATABASE_URL` or `POSTGRES_URL`.
4. Use `MIGRATE_DATABASE_URL` for migrations when you want a separate migration connection.
5. Set the same production values in Vercel Project Settings.

This app keeps Drizzle as the data access layer. Supabase is used as hosted PostgreSQL only; `supabase-js` is not needed unless Auth, Storage, or other Supabase platform features are added later.

Because this app uses `postgres.js` with Supabase transaction pooling, the database client sets `prepare: false`.

## Database Migration And Seed

Generate a migration after schema changes:

```bash
npm run db:generate
```

Apply migrations:

```bash
npm run db:migrate
```

Seed demo users, inventory, and requests:

```bash
npm run db:seed
```

Drizzle uses `MIGRATE_DATABASE_URL` when present and otherwise falls back to `DATABASE_URL`, `POSTGRES_URL_NON_POOLING`, then `POSTGRES_URL`. Do not run destructive migrations automatically during a Vercel build. Run migrations manually against the target Supabase database before or during a controlled release step.

## Tests

Run all Vitest suites:

```bash
npm run test
```

Focused suites:

```bash
npm run test:unit
npm run test:component
npm run test:integration
```

Run Playwright E2E tests:

```bash
npx playwright install chromium
npm run test:e2e
```

The Playwright config seeds the database and starts the Next.js dev server when
`PLAYWRIGHT_BASE_URL` is not provided. To test an already-running local or
deployed app:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
```

The integration suite covers:

- creating inventory items
- new request starts as `pending`
- creating requests
- approve does not deduct stock
- reject does not deduct stock
- fulfill deducts stock
- fulfill fails when stock is insufficient
- fulfilled request cannot be fulfilled again
- stock never becomes negative
- request history is written for creation and status changes

The Playwright suite covers:

- smoke loading core assignment routes
- employee request creation
- admin approve and fulfill flow
- insufficient stock blocking fulfillment
- employee role hiding admin actions

Known testing limitations:

- E2E tests use seeded demo data and the simple demo role switcher.
- E2E tests are intentionally serial because they mutate shared demo data.
- Load testing is not included; the assignment focuses on correctness and
  reviewer-verifiable flows.

## Production Build

```bash
npm run build
```

This is the expected Vercel build command.

For local deployment readiness, run:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

## Vercel Deployment

Manual deployment steps:

1. Push the repository to GitHub.
2. Create or select a Supabase Postgres database.
3. Ensure Vercel has a runtime database environment variable:
   - `DATABASE_URL` or `POSTGRES_URL`
4. Add optional migration environment variable if used:
   - `MIGRATE_DATABASE_URL`
5. Import the project into Vercel.
6. Keep the build command as `npm run build`.
7. Run database migrations against production:

```bash
npm run db:migrate
```

8. Seed demo data if this is a review/demo deployment:

```bash
npm run db:seed
```

9. Deploy from Vercel.
10. Verify:

- `/`
- `/inventory`
- `/inventory/new`
- `/requests`
- `/requests/new`
- `/requests/[id]`

To verify a Vercel deployment with Playwright after deployment:

```bash
PLAYWRIGHT_BASE_URL=https://your-project.vercel.app npm run test:e2e
```

No Docker setup is required for Vercel. Secrets must be configured in Vercel Project Settings and not committed.

## Vercel Readiness Notes

- Server-side database access is isolated to server modules, route handlers, and server actions.
- Client components do not import the database client.
- Route handlers and server actions use the App Router deployment model.
- `DATABASE_URL` and Vercel/Supabase `POSTGRES_URL` are documented and read from environment variables.
- Runtime database access uses Supabase Transaction Pooler with `prepare: false`.
- Migrations are manual and are not run during Vercel build.
- `.env` and `.env.local` are ignored by Git.
- `.env.example` contains only local placeholder values.

## Assumptions

- Demo role switching is acceptable for the assignment.
- Supabase is the hosted PostgreSQL backend; Drizzle remains the ORM.
- The requester is the current demo user; the requester field on the request form is read-only to match server-side scoping.
- Inventory requests support the current line-item model, but the UI keeps creation simple with one selected item.
- Approval quantity equals requested quantity.
- Email notifications, real authentication, analytics, and multi-level approvals are intentionally out of scope.

## Known Limitations

- Authentication is simulated with seeded demo users and a cookie.
- Supabase Auth is not implemented; the app intentionally uses a demo role switcher.
- There is no payment, procurement, or supplier workflow in the assignment-facing UI.
- Request creation currently submits one item at a time.
- Production use would need real identity, audit retention policy, and operational monitoring.

## AI Usage

AI tools used:

- ChatGPT
- Codex

AI was used for planning, implementation assistance, test coverage, and documentation drafting. The database schema, request status logic, stock mutation rules, validation, tests, and final documentation were reviewed and adjusted manually during implementation.
