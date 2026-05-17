# Reviewer Guide

This guide gives a fast path for reviewing the project as an internship
technical assignment and as a small internal operations product.

## One-Minute Summary

BloomThis Internal Tool is an inventory request module. Employees can browse
inventory and submit one or more requested item lines. Admins can review
requests, approve or reject pending requests, and fulfill approved requests
only when every requested item has sufficient stock.

The core implementation focus is correctness:

- stock is deducted only during fulfillment
- approval and rejection do not deduct stock
- insufficient stock leaves inventory unchanged
- fulfilled requests cannot be fulfilled again
- request creation and every status change writes history

## What To Inspect First

| Area                        | File                                                                                                      |
| --------------------------- | --------------------------------------------------------------------------------------------------------- |
| Database schema             | [`db/schema.ts`](../db/schema.ts)                                                                         |
| Request lifecycle logic     | [`features/requests/services/request.service.ts`](../features/requests/services/request.service.ts)       |
| Inventory list/detail logic | [`features/inventory/services/inventory.service.ts`](../features/inventory/services/inventory.service.ts) |
| Audit/history writes        | [`services/audit.service.ts`](../services/audit.service.ts)                                               |
| Dashboard bounded queries   | [`features/dashboard/services/dashboard.service.ts`](../features/dashboard/services/dashboard.service.ts) |
| Validation schemas          | [`lib/validations.ts`](../lib/validations.ts)                                                             |
| Cache tags and revalidation | [`lib/cache-tags.ts`](../lib/cache-tags.ts)                                                               |

## Review Checklist

- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run test`.
- Run `npm run build`.
- Confirm the required routes exist:
  - `/`
  - `/inventory`
  - `/inventory/new`
  - `/inventory/[id]`
  - `/requests`
  - `/requests/new`
  - `/requests/[id]`
- Confirm the app uses Drizzle ORM for database access.
- Confirm database credentials are server-side only.
- Confirm fulfillment is transaction-safe.
- Confirm request history exists on request detail.

## Reviewer Demo Flow

1. Open the dashboard.
2. Switch between Admin and Employee demo users.
3. As Employee:
   - browse inventory
   - create a multi-item request
   - view request status and timeline
4. As Admin:
   - review pending requests
   - approve a request
   - fulfill an approved request with enough stock
   - try a blocked request and confirm stock is unchanged
5. Open inventory details and confirm stock health, demand, related requests,
   and safe action links.

## What Was Intentionally Not Built

This assignment intentionally does not include:

- real Supabase Auth
- email notifications
- supplier procurement workflow
- multi-level approvals
- payment or billing logic
- automatic production migrations during Vercel build

Those are documented as production hardening areas rather than partially
implemented placeholders.
