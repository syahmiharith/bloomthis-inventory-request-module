# Tradeoffs and Decisions

## Next.js App Router instead of separate frontend/backend

- Decision: Use one Next.js application.
- Reason: Faster delivery and fewer moving parts for an assessment-sized internal tool.
- Tradeoff: Frontend and backend scale together instead of independently.

## PostgreSQL instead of SQLite

- Decision: Use PostgreSQL.
- Reason: It supports the required concurrency-safe fulfillment behavior and matches the assessment stack.
- Tradeoff: Local setup is heavier than SQLite.

## Drizzle ORM

- Decision: Use Drizzle.
- Reason: It is required and keeps SQL-oriented behavior visible.
- Tradeoff: Some database-specific logic still needs direct SQL expressions.

## Transactional fulfillment

- Decision: Fulfillment runs inside a transaction with conditional decrement.
- Reason: Prevents negative inventory and duplicate stock reduction.
- Tradeoff: Slightly more code than a simple update.

## Service layer

- Decision: Keep business logic outside routes and UI.
- Reason: Improves reuse and testability.
- Tradeoff: Adds a small extra abstraction layer.

## Simple role simulation

- Decision: Seed demo users and switch them with a cookie.
- Reason: Keeps the assessment focused while preserving server-side authorization.
- Tradeoff: Not production authentication.

## Audit logs

- Decision: Record important request and inventory events.
- Reason: Operational systems need traceability and debugging history.
- Tradeoff: More writes and extra schema surface.

## CI/CD for a small assessment

- Decision: Add GitHub Actions validation.
- Reason: Reviewers can see repeatable engineering discipline.
- Tradeoff: Slightly more setup time.
