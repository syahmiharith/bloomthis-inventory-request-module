# Testing Guide

## Strategy

The test suite is layered so the fastest checks catch local regressions first and PostgreSQL-backed flows verify the route-based product shell and the rules that matter most operationally.

## Test Layers

- `npm run typecheck` validates strict TypeScript contracts.
- `npm run lint` checks code quality rules.
- `npm run test:unit` covers validation, role helpers, and request transition rules.
- `npm run test:component` covers rendered workspace behavior, right-panel behavior, and the global header/profile dropdown with React Testing Library.
- `npm run test:integration` covers dashboard summaries, reservation, fulfillment, rejection validation, and audit-history behavior against PostgreSQL.
- `npm run test:e2e` runs Playwright browser checks against the route-specific shell, dashboard/stock-overview product flows, and writes screenshots to `test-results/screenshots/`.

## Database Tests

- Use `TEST_DATABASE_URL` for integration tests.
- Never point destructive test runs at a production database.
- The Vitest setup redirects `DATABASE_URL` to the test URL during tests.

## Playwright

- Playwright starts the local Next.js dev server automatically.
- Current browser checks cover route separation, urgency-first dashboard layout, dashboard action cards, stock-overview filters, item-inspector content, avatar dropdown, request-panel open/close, contextual inspectors on non-request routes, sticky footer actions, admin approval, sidebar persistence, mobile drawer behavior, responsive smoke, and visual states.

## Debugging Failures

- Confirm PostgreSQL is running before integration tests.
- Re-run migrations and seed data when the schema changes.
- Use Playwright traces, screenshots, and the HTML report after browser failures.
- If browser tests fail unexpectedly, verify the active demo role and seeded request codes first.
- On Windows, the repo wrapper `node tests/e2e/run-e2e.mjs` is the stable way to coordinate the built Next.js server and Playwright run.
