# Testing Strategy

The test strategy focuses on assignment-critical correctness first, then UI and
deployment confidence.

## Test Priorities

1. Stock and request status business rules.
2. Integration coverage for request creation and fulfillment.
3. Component coverage for critical UI behavior.
4. E2E smoke coverage for user workflows.
5. Production build and deployment readiness.

## Commands

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Focused suites:

```bash
npm run test:unit
npm run test:component
npm run test:integration
npm run test:e2e
```

## Business Rule Coverage

The important behaviors to protect are:

- new requests start as `pending`
- creating a request does not deduct stock
- approving does not deduct stock
- rejecting does not deduct stock
- fulfilling deducts stock
- fulfillment fails when any requested item is short
- failed fulfillment does not partially deduct stock
- fulfilled requests cannot be fulfilled again
- stock never becomes negative
- request history is written for creation and status changes

## Integration Coverage

Integration tests should exercise:

- creating inventory items
- creating single-item and multi-item requests
- approving requests
- rejecting requests
- fulfilling requests with enough stock
- blocking fulfillment with insufficient stock
- request history creation

## E2E Coverage

Playwright coverage should stay small and stable:

- core route smoke load
- employee creates a request
- admin approves and fulfills a request
- insufficient stock blocks fulfillment
- employee cannot see admin mutation actions

When running E2E tests against a deployed app, use a disposable demo or staging
deployment because the tests mutate seeded data.

## Production Build Check

`npm run build` is the local equivalent of the Vercel build command. It proves
that the App Router routes, server components, TypeScript types, and production
bundle can compile together.

## Known Testing Boundaries

- Demo role switching is tested, but real authentication is intentionally out
  of scope.
- Load testing is not included.
- Supabase RLS is not enabled, so RLS policy behavior is not tested.
- Manual production smoke testing is still useful after deployment because
  Vercel environment variables and Supabase connection settings are external to
  the repository.
