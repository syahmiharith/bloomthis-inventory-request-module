# Engineering Decisions

This document explains important implementation choices and tradeoffs.

## Keep Authentication Simple

Decision:
Use seeded demo users and an Admin / Employee role switcher.

Reason:
The assignment is about inventory request workflows, stock correctness, and
reviewable implementation. Full authentication would add scope without proving
the core system better.

Future production work:

- add Supabase Auth or another identity provider
- bind roles to authenticated users
- add session-aware authorization checks

## Use Supabase As Hosted Postgres, Not As The ORM

Decision:
Use Supabase for hosted PostgreSQL and Drizzle ORM for schema, migrations, and
type-safe data access.

Reason:
The assignment requires Drizzle ORM. Supabase is used as the database hosting
provider, not as a replacement query layer.

Implementation:

- runtime database access reads `DATABASE_URL` or `POSTGRES_URL`
- migrations use `MIGRATE_DATABASE_URL` when present
- `supabase-js` is not used for database queries

## Disable Prepared Statements With Transaction Pooling

Decision:
Use `prepare: false` in the `postgres.js` client.

Reason:
Supabase transaction pooler connections are not compatible with session-level
prepared statement assumptions in the same way as a long-lived direct
connection.

## Manual Migrations

Decision:
Do not run migrations automatically during Vercel build.

Reason:
Builds should be repeatable and safe. Database migration is an operational
release step and should be run intentionally against the target database.

## Feature-Based Organization

Decision:
Keep `app/` as the route layer and move domain logic into `features/`.

Reason:
Inventory, requests, and dashboard logic grew beyond simple route files.
Feature folders make it easier to review domain behavior and avoid mixing
unrelated concerns.

## Server-Side Sorting And Pagination

Decision:
Filter, sort, and paginate in the database service layer.

Reason:
Sorting after pagination gives incorrect results. Loading all rows and slicing
in memory caused production performance issues. Server-side filtering and
pagination keep page load bounded.

## Lazy Requestable Item Lookup

Decision:
Do not preload every inventory item on `/requests`.

Reason:
The request create modal is not always open. Loading requestable items during
initial page render made the request list slower and created avoidable database
work. Items are now fetched only when the modal needs them.

## Request History Lives In Request Detail

Decision:
Do not create a separate audit-log page.

Reason:
Reviewers and users need the timeline in context. The request detail panel
answers what happened, who acted, and why the request is in its current state.

## Stock Health Instead Of Exposed Reorder Point

Decision:
Show stock health as an operator-friendly percentage instead of showing the
raw reorder point in the main inventory table.

Reason:
Reorder point is an internal calculation detail. The table should answer
whether an item needs attention, not expose every internal threshold.

## Bounded Dashboard Queries

Decision:
Dashboard sections query only limited, actionable rows.

Reason:
The dashboard should be fast and action-oriented. It should not hydrate every
request or inventory item just to show top-level summaries.

## Cache Reads, Never Mutation Validation

Decision:
Use persistent cache for read-heavy dashboard/list/detail data, but always
perform fulfillment validation against the live database.

Reason:
Cached reads improve perceived performance. Mutation validation must be live
to protect stock correctness.
