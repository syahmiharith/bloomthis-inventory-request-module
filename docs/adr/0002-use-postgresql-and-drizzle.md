# ADR 0002: Use PostgreSQL and Drizzle

## Decision

Use PostgreSQL with Drizzle ORM.

## Reason

The assessment requires both, and PostgreSQL provides the transactional behavior needed for safe fulfillment.

## Consequences

Local development needs a database service, but SQL behavior stays explicit and reviewable.
