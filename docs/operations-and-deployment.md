# Operations And Deployment

## Deployment Target

The app is designed for Vercel with Supabase Postgres as the hosted database.

Runtime stack:

```text
Vercel
-> Next.js App Router
-> Drizzle ORM
-> Supabase Postgres
```

## Required Environment Variables

Runtime database access requires at least one of:

- `DATABASE_URL`
- `POSTGRES_URL`

Recommended for migrations:

- `MIGRATE_DATABASE_URL`

Optional:

- `POSTGRES_URL_NON_POOLING`
- `TEST_DATABASE_URL`
- `DEMO_USER_EMAIL`

Do not expose database credentials using `NEXT_PUBLIC_` variables.

## Supabase Connection Guidance

Use the Supabase transaction pooler connection string for Vercel runtime.

The app supports Vercel/Supabase-provided `POSTGRES_URL` and standard
`DATABASE_URL`.

For Drizzle migrations, use a migration-safe URL through `MIGRATE_DATABASE_URL`
when possible.

## Database Client Settings

The runtime database client uses:

- `prepare: false`
- small connection pool
- connect timeout
- idle timeout
- server-side statement timeout

These settings are designed to avoid serverless hangs and Supabase transaction
pooler prepared-statement issues.

## Migration Discipline

Migrations are manual. Do not run destructive migrations automatically during
Vercel builds.

Typical release flow:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run db:migrate
```

Run `npm run db:migrate` only against the intended target database.

## Seeding

Seed scripts are for local, demo, or review environments.

```bash
npm run db:seed
```

Production-like demo data can be verified with:

```bash
npm run db:verify
```

The verification script prints aggregate counts only and does not expose
connection strings.

## Cache Revalidation

Mutations revalidate read caches using tags:

- inventory creation refreshes inventory, requestable items, and dashboard
- request creation refreshes request lists and dashboard
- approve/reject refreshes request lists, detail, and dashboard
- fulfill refreshes inventory, requests, requestable items, detail, and
  dashboard

## Production Smoke Check

After deployment, verify:

- `/`
- `/inventory`
- `/inventory/new`
- `/inventory/[id]`
- `/requests`
- `/requests/new`
- `/requests/[id]`
- `/favicon.ico`
- `/favicon.png`
- a non-existent route

Expected behavior:

- pages load without server-side timeout
- favicon routes return quickly
- not-found route is static and DB-free
- dashboard shows real data or safe fallback
- request and inventory lists paginate correctly

## Production Hardening Backlog

Before real production use, add:

- real authentication
- role-based authorization tied to identity
- Supabase RLS policies if browser-side Supabase access is introduced
- operational monitoring and alerting
- audit retention policy
- backup and restore process
- migration approval process
- mutation rate limiting
