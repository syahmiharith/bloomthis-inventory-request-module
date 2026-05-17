# BloomThis Documentation

This folder explains the system design, product behavior, engineering
decisions, and validation strategy for the BloomThis Internal Tool.

The documentation is written for technical reviewers who want to understand
how the project is structured, why specific tradeoffs were made, and where the
core correctness guarantees live.

## Recommended Review Path

1. [Reviewer Guide](./reviewer-guide.md)
2. [System Design](./system-design.md)
3. [Product Features And Workflows](./features-and-workflows.md)
4. [Business Rules](./business-rules.md)
5. [Engineering Decisions](./engineering-decisions.md)
6. [Testing Strategy](./testing-strategy.md)
7. [Operations And Deployment](./operations-and-deployment.md)

## What This Project Demonstrates

- A focused internal operations product built with Next.js App Router,
  TypeScript, Drizzle ORM, Supabase Postgres, and Vercel.
- Server-side enforcement of request status transitions and inventory stock
  mutation rules.
- A practical demo-role model that avoids overbuilding authentication while
  still showing admin and employee workflows.
- Database-backed list, detail, filtering, sorting, pagination, audit history,
  and fulfillment behavior.
- Production-minded handling for Supabase transaction pooling, Vercel runtime
  constraints, persistent read caching, and manual migration discipline.

## Source Of Truth

- Business rules: [Business Rules](./business-rules.md)
- Schema: [`db/schema.ts`](../db/schema.ts)
- Inventory service: [`features/inventory/services/inventory.service.ts`](../features/inventory/services/inventory.service.ts)
- Request service: [`features/requests/services/request.service.ts`](../features/requests/services/request.service.ts)
- Dashboard service: [`features/dashboard/services/dashboard.service.ts`](../features/dashboard/services/dashboard.service.ts)
- Audit service: [`services/audit.service.ts`](../services/audit.service.ts)
