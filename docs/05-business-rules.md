# Business Rules

- New requests start as `pending`.
- Allowed transitions: `pending -> approved|rejected|fulfilled`, `approved -> rejected|fulfilled`.
- `rejected` and `fulfilled` are terminal.
- Only admins can create items or update request status.
- Fulfillment uses a transaction and conditional stock decrement.
- Inventory quantity must never become negative.
