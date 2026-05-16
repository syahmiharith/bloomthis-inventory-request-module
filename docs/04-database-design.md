# Database Design

Tables:

- `users`
- `inventory_items`
- `inventory_requests`
- `inventory_request_items`
- `request_history`
- `audit_logs`

Important constraints:

- unique item SKU
- non-negative item quantity and low-stock threshold
- positive request quantity
- indexed category, request status, request item, request history, and audit request references
