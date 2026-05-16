# Engineering Decisions

## Why Next.js App Router

The assessment benefits from one deployable application, server components for read-heavy screens, and colocated route handlers for simple APIs.

## Why Drizzle

Drizzle keeps the schema and SQL behavior visible while still giving the project typed database access.

## Why PostgreSQL

PostgreSQL supports the transaction and conditional-update patterns needed to keep stock consistent during approval and fulfillment.

## Role Handling

The app uses seeded demo users plus a cookie-backed role switcher so reviewers can exercise both personas quickly. This is deliberately simpler than production authentication, but server-side authorization remains enforced.

## Route-Specific Pages

The sidebar now maps to real workspaces instead of aliases of one dashboard page. This keeps the dashboard concise and lets each workflow answer a distinct operator question.

## Urgency-First Dashboard

The dashboard is intentionally not the all-requests table. It prioritizes pending approvals, high-priority work, stock risk, overdue work, recent activity, and quick actions using database-backed queries.

Priority queue rows are ordered to surface overdue work first, then high-priority pending work, then the nearest required-by dates. The visible risk label uses the strongest available signal in this order: overdue, out of stock, low stock, high priority, due soon, pending.

## Status Transitions

Requests move through `pending -> approved|rejected` and `approved -> fulfilled|rejected`. `fulfilled` and `rejected` are terminal.

## Audit History

Important request events are appended to `request_history` for the assignment-facing status timeline. The existing `audit_logs` table is retained for broader operational activity feeds.

## Inventory Validation

Approval and rejection do not deduct or reserve stock. Fulfillment consumes on-hand stock transactionally only after the request is approved and sufficient stock exists, preventing negative inventory or duplicate depletion.

## Stock Health

Stock health is derived consistently from persisted inventory quantities:

- `available = quantity_on_hand - quantity_reserved`
- `available <= 0` means `Out of Stock`
- `available <= reorder_point` means `Low Stock`
- otherwise the item is `In Stock`

Stock Overview sorts risky inventory first and derives pending demand plus related request context from request line items instead of hardcoding inspector content.

## Warehouses

Warehouses are modeled as reference data so the request form can use seeded, database-backed options without over-normalizing departments for the Phase 1 scope.

## Dashboard Metrics

KPI cards and status tabs use dedicated database summary queries. Employees see only their own request metrics, while admins see organization-wide metrics.

## Resizable Layout

The sidebar and request-details panel are independent flex regions with desktop resize handles. Sidebar width and collapsed state persist in `localStorage`; the request inspector persists width but closes fully when dismissed.

## Contextual Inspector and Sticky Footer

The request inspector sits below the global header, scrolls its body independently, and keeps approve/reject/fulfill actions in a sticky footer so long audit histories never hide the next action. Other operational routes reuse the same contextual inspector pattern for item, warehouse, supplier, purchase-order, and user detail views.

The stock item inspector keeps its actions contextual to inventory work: request creation and related-request review are shown, while approval/rejection controls stay exclusive to request inspectors.

## Assessment Simplifications

- Demo auth replaces production identity.
- Partial approvals, notifications, and real user management remain intentionally light.
- The current browser suite is focused on the highest-value demo flows rather than exhaustive cross-browser coverage.
