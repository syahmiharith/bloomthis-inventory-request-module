# Inventory Request Module

Simple internal inventory request system for an internship technical assignment. Employees browse inventory and submit requests. Admins create inventory items, review requests, approve or reject them, and fulfill approved requests when stock is sufficient.

The project intentionally avoids production authentication and extra workflows. It focuses on clear UX, server-side business rules, PostgreSQL persistence, and reviewer-friendly code.

## Tech Stack

- Next.js App Router
- TypeScript
- PostgreSQL
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

Start PostgreSQL:

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

- `DATABASE_URL`: PostgreSQL connection string used by the app and Drizzle.

Optional:

- `TEST_DATABASE_URL`: PostgreSQL connection string for integration tests.
- `DEMO_USER_EMAIL`: initial seeded demo user email. Defaults to `admin@inventory.local`.

`DATABASE_URL` is read server-side from `process.env` in `db/index.ts`. No database environment variables are exposed with `NEXT_PUBLIC_`.

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

Do not run destructive migrations automatically during a Vercel build. Run migrations manually against the target database before or during a controlled release step.

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

The integration suite covers:

- new request starts as `pending`
- approve does not deduct stock
- reject does not deduct stock
- fulfill deducts stock
- fulfill fails when stock is insufficient
- fulfilled request cannot be fulfilled again
- request history is written for creation and status changes

## Production Build

```bash
npm run build
```

This is the expected Vercel build command.

## Vercel Deployment

Manual deployment steps:

1. Push the repository to GitHub.
2. Create or select a PostgreSQL database.
3. Add the required Vercel environment variable:
   - `DATABASE_URL`
4. Import the project into Vercel.
5. Keep the build command as `npm run build`.
6. Run database migrations against production:

```bash
npm run db:migrate
```

7. Seed demo data if this is a review/demo deployment:

```bash
npm run db:seed
```

8. Deploy from Vercel.
9. Verify:
   - `/`
   - `/inventory`
   - `/inventory/new`
   - `/requests`
   - `/requests/new`
   - `/requests/[id]`

No Docker setup is required for Vercel. Secrets must be configured in Vercel Project Settings and not committed.

## Vercel Readiness Notes

- Server-side database access is isolated to server modules, route handlers, and server actions.
- Client components do not import the database client.
- Route handlers and server actions use the App Router deployment model.
- `DATABASE_URL` is documented and read from environment variables.
- `.env` and `.env.local` are ignored by Git.
- `.env.example` contains only local placeholder values.

## Assumptions

- Demo role switching is acceptable for the assignment.
- The requester is the current demo user; the requester field on the request form is read-only to match server-side scoping.
- Inventory requests support the current line-item model, but the UI keeps creation simple with one selected item.
- Approval quantity equals requested quantity.
- Email notifications, real authentication, analytics, and multi-level approvals are intentionally out of scope.

## Known Limitations

- Authentication is simulated with seeded demo users and a cookie.
- There is no payment, procurement, or supplier workflow in the assignment-facing UI.
- Request creation currently submits one item at a time.
- Production use would need real identity, audit retention policy, and operational monitoring.

## AI Usage

AI tools used:

- ChatGPT
- Codex

AI was used for planning, implementation assistance, test coverage, and documentation drafting. The database schema, request status logic, stock mutation rules, validation, tests, and final documentation were reviewed and adjusted manually during implementation.
