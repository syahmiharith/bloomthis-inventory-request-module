# Product Features And Workflows

## Product Goal

BloomThis Internal Tool is designed as a compact internal operations dashboard.
It lets employees request inventory and lets admins manage request review and
fulfillment while protecting stock correctness.

The UI is intentionally operational:

- dashboard action queue
- dense but readable tables
- master/detail side panels
- role-aware actions
- request timeline
- inventory stock health indicators

## Roles

### Employee

Employees can:

- browse inventory
- search and filter inventory
- submit multi-item inventory requests
- view their own requests
- track request status and timeline

Employees do not see admin mutation actions.

### Admin

Admins can:

- view all inventory and requests
- create inventory items
- approve pending requests
- reject pending requests
- fulfill approved requests when stock is sufficient
- inspect request history and inventory impact

## Dashboard

The dashboard is an action-oriented entry point.

It includes:

- 4 KPI cards
- today's action queue
- SLA and aging signals
- stock risk signals
- restock recommendations
- recent activity
- quick actions

Dashboard lists are intentionally bounded to a small number of rows so the
page stays fast and reviewable.

## Inventory Workspace

The inventory workspace supports:

- search by item name or SKU
- category filtering
- stock status filtering
- server-side sorting
- pagination
- resizable columns
- clickable rows
- detail side panel
- modal create flow

The main table avoids exposing raw reorder point as a primary user-facing
column. Instead, it shows availability and stock health.

## Inventory Detail Side Panel

The inventory detail panel shows:

- item identity
- SKU
- category
- warehouse
- current stock status
- stock health ring
- available stock
- on-hand quantity
- reserved quantity
- active demand
- pending and approved request counts
- related requests
- recent fulfillment activity
- safe action links

The panel scrolls independently from the main table.

## Request Workspace

The request workspace supports:

- request search
- status filtering
- category filtering
- server-side sorting
- pagination
- clickable rows
- selected row state
- detail side panel
- modal create flow

Request rows are designed to answer the most important operational questions:

- What request is this?
- Who requested it?
- Which items are included?
- What is the total quantity?
- What is the lifecycle status?
- Is stock ready for fulfillment?

## Request Creation

The create request flow supports multiple item lines.

Each line includes:

- searchable item picker
- requested quantity
- available stock display
- line-level stock warning

Duplicate item lines are prevented or handled by validation. Creating a request
does not deduct stock.

## Request Detail Side Panel

The request detail panel shows:

- request code
- requester
- department
- status
- stock readiness
- requested items
- quantity requested
- current stock
- stock after fulfillment preview
- reason
- admin comment
- timeline/history
- admin actions when allowed

Admin actions live in the side-panel footer so the table remains focused on
scanning and selection.

## Modal Behavior

Create flows are modal-first:

- `/inventory/new`
- `/requests/new`

Normal UI buttons open same-page modals. Direct route visits still work as
fallback modal routes.

Dirty forms ask for discard confirmation before closing.
