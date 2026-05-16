# Testing Strategy

Vitest covers validation, status transitions, authorization rules, and PostgreSQL-backed fulfillment behavior.

The highest-value tests focus on:

- stock never becoming negative
- duplicate fulfillment being blocked
- rejected requests remaining terminal
- audit logs being written
- concurrent fulfillment attempts producing only one successful decrement when stock is limited
