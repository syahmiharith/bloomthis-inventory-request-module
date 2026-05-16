# ADR 0005: Keep Auth Simple for Assessment

## Decision

Use seeded demo users and a role switcher instead of full authentication.

## Reason

The assessment scope favors core inventory reliability over auth infrastructure.

## Consequences

The system is not production-ready for identity, but authorization logic already lives server-side and can be upgraded later.
