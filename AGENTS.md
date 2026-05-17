# AGENTS.md

## Project

Build a simple Inventory Request Module for an internship technical assignment.

Stack:
- Next.js App Router
- TypeScript
- Supabase Postgres as the hosted backend database
- Drizzle ORM for schema, migrations, and type-safe database access
- Vercel deployment

## Architecture

Use this architecture:

Next.js Server Actions / Route Handlers
-> Drizzle ORM
-> Supabase Postgres

Supabase is the hosted PostgreSQL backend.
Drizzle remains the ORM because the assignment requires Drizzle.

Do not replace Drizzle data access with supabase-js queries unless explicitly instructed.

Use supabase-js only if Supabase Auth, Storage, or other Supabase platform features are added later.

## Core business rules

- New requests start as Pending.
- Creating a request does not deduct stock.
- Approving a request does not deduct stock.
- Rejecting a request does not deduct stock.
- Fulfilling a request deducts stock only when:
  - request status is Approved
  - available stock >= requested quantity
- Fulfillment must re-check stock server-side at action time.
- A fulfilled request cannot be fulfilled again.
- Stock must never become negative.
- Every request creation and status change creates a request history record.

## Supabase + Drizzle rules

- Runtime database access uses DATABASE_URL or Vercel's Supabase POSTGRES_URL.
- DATABASE_URL or POSTGRES_URL should be the Supabase runtime connection string.
- Do not commit secrets.
- Do not print DATABASE_URL.
- Do not expose DATABASE_URL to browser code.
- Do not use NEXT_PUBLIC_DATABASE_URL.
- If using postgres.js with Drizzle, configure prepare: false.
- drizzle.config.ts should use MIGRATE_DATABASE_URL if present; otherwise DATABASE_URL, POSTGRES_URL_NON_POOLING, or POSTGRES_URL.
- Do not run destructive migrations automatically during Vercel build.
- Migrations should be documented and run manually.

## Roles

Use a simple Admin / Employee demo role switcher.
Do not implement full Supabase Auth unless explicitly requested after the baseline is complete.

## Pages

Required routes:
- /
- /inventory
- /inventory/new
- /requests
- /requests/new
- /requests/[id]

## Testing priority

Prioritize:
- unit tests for stock/status rules
- integration tests for request creation and fulfillment
- Playwright smoke tests for key routes and critical flows
- production build
- Vercel deployment smoke check

## Audit format

After each task, output compact audit only:

- Status
- Files changed
- Checks run
- Issues fixed
- Remaining risks

Keep changes focused. Do not refactor unrelated code.
