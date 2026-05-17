# BloomThis Internal Tool - Inventory Request Module

Full-stack internal inventory request module built with Next.js, TypeScript,
Drizzle ORM, and Supabase PostgreSQL.

The application models a practical operations workflow: employees request
inventory, admins review and approve requests, and approved requests are
fulfilled only when stock is available. The implementation emphasizes
server-side correctness, transaction-safe stock mutation, clear role separation,
and reviewer-verifiable workflows.

## Executive Summary

This project demonstrates an end-to-end inventory request system with:

- role-based demo flows for employees and admins
- multi-item request creation
- request approval, rejection, fulfillment, and history tracking
- transaction-safe stock deduction during fulfillment
- paginated inventory and request workspaces
- master/detail side-panel navigation
- seeded demo data for repeatable review
- unit, component, integration, and E2E test coverage

The scope is intentionally focused. Production authentication, procurement,
notifications, and supplier workflows are documented as future hardening areas
rather than simulated as incomplete features.

## Baseline Scope

This project is an internal inventory request system for a technical review or
demo environment.

It intentionally keeps these boundaries:

- Authentication is simulated through seeded demo users.
- Demo roles are limited to `employee` and `admin`.
- Supabase is used as hosted PostgreSQL.
- Drizzle ORM remains the application data access layer.
- Stock is mutated only during fulfillment.
- Migrations and seeding are manual operational steps, not automatic Vercel
  build steps.

These constraints keep the implementation focused on correctness,
database-backed workflows, and clear reviewability.

## Core Workflows

### Employee Workflow

Employees can:

1. browse available inventory
2. create inventory requests
3. request one or more item lines
4. track request status
5. view request details and history

### Admin Workflow

Admins can:

1. create inventory items
2. review employee requests
3. approve pending requests
4. reject pending requests
5. fulfill approved requests when stock is sufficient
6. view inventory and request history

## Business Rules

The request lifecycle is enforced server-side.

| Rule                | Behavior                                                   |
| ------------------- | ---------------------------------------------------------- |
| Request creation    | New requests start as `pending`                            |
| Approval            | Approval does not deduct or reserve stock                  |
| Rejection           | Rejection does not deduct stock                            |
| Fulfillment         | Only `approved` requests can be fulfilled                  |
| Stock mutation      | Stock is deducted only during fulfillment                  |
| Insufficient stock  | Fulfillment fails and leaves request/inventory unchanged   |
| Terminal statuses   | `fulfilled` and `rejected` requests are terminal           |
| History             | Request creation and status changes append request history |
| Multi-item requests | A request can contain one or more item lines               |
| Stock safety        | Stock is validated inside the server-side transaction      |

## Implemented Routes

| Route             | Description                           |
| ----------------- | ------------------------------------- |
| `/`               | Dashboard                             |
| `/inventory`      | Inventory list and filters            |
| `/inventory/new`  | Create inventory item modal route     |
| `/inventory/[id]` | Inventory item detail side panel      |
| `/requests`       | Request list and filters              |
| `/requests/new`   | Create inventory request modal route  |
| `/requests/[id]`  | Request detail side panel and history |

## Tech Stack

| Layer         | Technology                              |
| ------------- | --------------------------------------- |
| Framework     | Next.js App Router                      |
| Language      | TypeScript                              |
| UI            | React, plain CSS, Lucide React          |
| Database      | Supabase PostgreSQL                     |
| ORM           | Drizzle ORM                             |
| Validation    | Zod                                     |
| Testing       | Vitest, Testing Library, Playwright     |
| Deployment    | Vercel                                  |
| Observability | Vercel Analytics, Vercel Speed Insights |

## Architecture Highlights

### Server-Side Business Logic

Business rules are enforced in server-side services and actions, not only in
the UI. This protects status transitions and stock deduction from client-side
inconsistencies.

### Transaction-Safe Fulfillment

Fulfillment validates stock inside the database transaction before deducting
inventory. If stock is insufficient, the request and inventory records remain
unchanged.

### Clear Data Access Layer

Database access is isolated through service modules and Drizzle ORM. Client
components do not import the database client.

### Reviewer-Friendly Demo Data

The seed script creates demo users, inventory items, request records, request
item lines, multiple request statuses, low-stock items, out-of-stock items, and
multi-item requests.

### Manual Migration Discipline

Database migrations are intentionally run manually against the target
environment. They are not run automatically during Vercel builds.

## Project Structure

```text
app/
  (app)/
    inventory/
    requests/
  globals.css

components/
  layout/
  ui/
    badges/
    button/
    forms/
    modal/
    skeleton/
    table/

features/
  dashboard/
    components/
    services/
  inventory/
    actions/
    components/
    services/
  requests/
    actions/
    components/
    services/

db/
  index.ts
  schema.ts
  seed.ts
  migrations/

lib/
  auth.ts
  cache-tags.ts
  constants.ts
  errors.ts
  inventory.ts
  server-cache.ts
  validations.ts

services/
  audit.service.ts
  dashboard.service.ts
  item.service.ts
  request.service.ts

styles/
  badges.css
  dashboard.css
  inventory.css
  layout.css
  requests.css
  responsive.css
  side-panel.css
  tables.css
  tokens.css

tests/
  component/
  e2e/
  integration/
  unit/
```

`app/` remains the route layer. Domain UI and data services live under
`features/`, while `services/` keeps compatibility exports and cross-domain
services.

## Getting Started

### Prerequisites

- Node.js
- npm
- PostgreSQL or a Supabase project
- Docker, optional for local PostgreSQL

### Install Dependencies

```bash
npm install
```

### Configure Environment

```bash
cp .env.example .env.local
```

Set at least one runtime database connection variable:

```bash
DATABASE_URL=postgresql://...
```

or:

```bash
POSTGRES_URL=postgresql://...
```

### Start Local PostgreSQL with Docker

```bash
docker compose up -d
```

### Run Migrations

```bash
npm run db:migrate
```

### Seed Demo Data

```bash
npm run db:seed
```

### Verify Database Contents

```bash
npm run db:verify
```

### Run the App Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

### Required

| Variable                         | Description                          |
| -------------------------------- | ------------------------------------ |
| `DATABASE_URL` or `POSTGRES_URL` | Runtime PostgreSQL connection string |

### Optional

| Variable                   | Description                                                  |
| -------------------------- | ------------------------------------------------------------ |
| `MIGRATE_DATABASE_URL`     | Database URL used by Drizzle migrations                      |
| `POSTGRES_URL_NON_POOLING` | Supabase direct/non-pooling database URL                     |
| `TEST_DATABASE_URL`        | PostgreSQL URL used by integration tests                     |
| `DEMO_USER_EMAIL`          | Initial demo user email. Defaults to `admin@inventory.local` |

Database credentials are read server-side only. Do not expose database URLs
with `NEXT_PUBLIC_` environment variables.

Run a safe environment status check:

```bash
npm run env:check
```

This reports whether a database URL is missing, local, or hosted. It does not
print secrets.

Example `.env.local` shape without secrets:

```bash
DATABASE_URL=postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres
POSTGRES_URL=postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres
MIGRATE_DATABASE_URL=postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:5432/postgres
POSTGRES_URL_NON_POOLING=postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/inventory_request_module_test
DEMO_USER_EMAIL=admin@inventory.local
```

## Supabase Setup

1. Create a Supabase project.
2. Open **Project Settings -> Database -> Connection string**.
3. Use the Supabase transaction pooler connection string for `DATABASE_URL` or
   `POSTGRES_URL` at runtime.
4. Optionally configure `MIGRATE_DATABASE_URL` for migration execution.
5. Run migrations manually against the target database.
6. Seed demo data only for local, demo, or review environments.

Supabase is used as hosted PostgreSQL. The app does not require `supabase-js`
unless Supabase Auth, Storage, or other Supabase platform features are added
later.

Because the app uses `postgres.js` with Supabase transaction pooling, prepared
statements are disabled with `prepare: false`. The runtime client also uses a
small connection pool and fail-fast timeout settings for Vercel compatibility.

## Database Workflow

Generate a migration after schema changes:

```bash
npm run db:generate
```

Apply migrations:

```bash
npm run db:migrate
```

Seed demo data:

```bash
npm run db:seed
```

Verify database counts:

```bash
npm run db:verify
```

The verification script prints aggregate counts only. It does not expose
database credentials or secrets.

Drizzle uses `MIGRATE_DATABASE_URL` when present and otherwise falls back to
`DATABASE_URL`, `POSTGRES_URL_NON_POOLING`, then `POSTGRES_URL`. Do not run
destructive migrations automatically during a Vercel build. Run migrations
manually against the target Supabase database before or during a controlled
release step.

## Available Scripts

| Command                    | Purpose                                  |
| -------------------------- | ---------------------------------------- |
| `npm run dev`              | Start the development server             |
| `npm run build`            | Build for production                     |
| `npm run start`            | Start the production server              |
| `npm run lint`             | Run Next.js linting                      |
| `npm run typecheck`        | Run TypeScript checks                    |
| `npm run format`           | Format files with Prettier               |
| `npm run format:check`     | Check formatting                         |
| `npm run test`             | Run all Vitest suites                    |
| `npm run test:unit`        | Run unit tests                           |
| `npm run test:component`   | Run component tests                      |
| `npm run test:integration` | Run integration tests                    |
| `npm run test:e2e`         | Run Playwright E2E tests                 |
| `npm run test:watch`       | Run Vitest in watch mode                 |
| `npm run env:check`        | Check database environment status safely |
| `npm run db:generate`      | Generate Drizzle migrations              |
| `npm run db:migrate`       | Apply Drizzle migrations                 |
| `npm run db:push`          | Push schema changes with Drizzle         |
| `npm run db:verify`        | Print safe aggregate database counts     |
| `npm run db:seed`          | Seed demo data                           |

## Testing

Run all Vitest suites:

```bash
npm run test
```

Run focused suites:

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

Test an already-running local app:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
```

To test a deployed app, use a disposable demo or staging deployment because the
E2E suite mutates seeded demo data:

```bash
PLAYWRIGHT_BASE_URL=https://your-project.vercel.app npm run test:e2e
```

### Test Coverage Focus

The test suite covers the primary correctness and workflow requirements:

- inventory item creation
- request creation
- pending status on new requests
- approval without stock deduction
- rejection without stock deduction
- fulfillment with stock deduction
- fulfillment blocked by insufficient stock
- terminal request statuses
- stock never becoming negative
- request history writes
- employee/admin role behavior
- core route smoke coverage

### Testing Notes

- E2E tests use seeded demo data.
- E2E tests are intentionally serial because they mutate shared demo records.
- Load testing is not included because the project scope focuses on workflow
  correctness and reviewer-verifiable behavior.

## Production Build

```bash
npm run build
```

Recommended local release check:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

## Vercel Deployment

1. Push the repository to GitHub.
2. Create or select a Supabase PostgreSQL database.
3. Configure Vercel environment variables:
   - `DATABASE_URL` or `POSTGRES_URL`
   - optional `MIGRATE_DATABASE_URL`
4. Import the project into Vercel.
5. Keep the build command as:

```bash
npm run build
```

6. Run migrations manually against production:

```bash
npm run db:migrate
```

7. Seed demo data only for review/demo deployments:

```bash
npm run db:seed
```

8. Deploy from Vercel.
9. Verify the main routes:
   - `/`
   - `/inventory`
   - `/inventory/new`
   - `/inventory/[id]`
   - `/requests`
   - `/requests/new`
   - `/requests/[id]`

No Docker setup is required for Vercel. Secrets should be configured in Vercel
Project Settings and never committed.

## Operational Notes

- Runtime database access is server-side only.
- Client components do not import the database client.
- Server actions and route handlers follow the App Router model.
- Migrations are manual release steps.
- `.env` and `.env.local` should remain ignored by Git.
- `.env.example` should contain placeholders only.
- Demo data should be seeded intentionally, not automatically during production
  builds.

## Security and Production Hardening

The current implementation uses a demo role switcher and is not a production
authentication system.

For production use, add:

- real authentication and session management
- role-based authorization tied to authenticated identity
- Supabase Row Level Security policies, if using Supabase client access
- audit retention policy
- operational monitoring and alerting
- error tracking
- mutation rate limiting
- deployment migration controls
- backup and restore procedures

Do not enable Supabase Row Level Security without policies. Enabling RLS
without policies can block expected data access.

## Design Decisions

### Why approval does not deduct stock

Approval represents administrative acceptance of the request. Stock is deducted
only when the request is fulfilled, which better matches warehouse or
operations workflows where approval and physical issuance are separate steps.

### Why fulfillment is transactional

Fulfillment is the only workflow step that mutates inventory. The transaction
ensures that stock checks and stock deduction happen atomically, preventing
partial updates and negative stock.

### Why authentication is simulated

The project focuses on inventory request correctness, database workflows, and
reviewer-verifiable behavior. Production identity, authorization, and
access-control hardening are documented as future work rather than partially
implemented.

### Why Supabase is used as PostgreSQL

Supabase provides hosted PostgreSQL suitable for deployment and review while
still allowing the app to use Drizzle ORM as the primary data access and
migration layer.

## Assumptions

- Demo role switching is acceptable for the current review scope.
- The requester is the current demo user.
- The request form requester field is read-only to match server-side scoping.
- Inventory requests support one or more item lines.
- Approval quantity equals requested quantity.
- Email notifications, real authentication, procurement, supplier workflows,
  and multi-level approvals are out of scope.

## Known Limitations

- Authentication is simulated with seeded demo users and a cookie.
- Supabase Auth is not implemented.
- Notification workflows are not implemented.
- Procurement and supplier workflows are not part of the assignment-facing UI.
- Load testing is not included.
- Production use requires additional identity, authorization, monitoring, and
  operational controls.

## AI Usage

AI tools used during development:

- ChatGPT
- Codex

AI assisted with planning, implementation support, test coverage, and
documentation drafting. Business rules, database logic, validation, request
status transitions, tests, and final documentation were reviewed and adjusted
manually.
