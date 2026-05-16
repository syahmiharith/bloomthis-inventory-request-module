# ADR 0003: Use Transactional Fulfillment

## Decision

Fulfillment uses a transaction plus a conditional stock decrement.

## Reason

This prevents inventory from going negative during concurrent updates.

## Consequences

The flow is slightly more complex, but it protects the most important business invariant.
