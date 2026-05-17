# Business Rules

This document is the reviewer-facing source of truth for request and stock
behavior.

## Request Statuses

Requests can have one of four statuses:

- `pending`
- `approved`
- `rejected`
- `fulfilled`

## Lifecycle Rules

| Current status | Allowed next status | Stock effect                |
| -------------- | ------------------- | --------------------------- |
| none           | `pending`           | No stock deduction          |
| `pending`      | `approved`          | No stock deduction          |
| `pending`      | `rejected`          | No stock deduction          |
| `approved`     | `fulfilled`         | Deducts stock if sufficient |
| `rejected`     | none                | Terminal                    |
| `fulfilled`    | none                | Terminal                    |

## Fulfillment Rules

Fulfillment is allowed only when:

1. the request status is `approved`
2. every requested item line has enough available stock
3. the request has not already been fulfilled

Available stock is:

```text
quantityOnHand - quantityReserved
```

For multi-item requests, fulfillment succeeds only if all lines are fulfillable.
If any item line is short, the whole transaction fails and no stock is deducted.

## Transaction Safety

Fulfillment runs inside a database transaction.

For each request line, the update condition checks stock at mutation time:

```text
quantityOnHand - quantityReserved >= quantityToFulfill
```

This protects the system from stale UI data and concurrent stock changes.

## Audit And Request History

Every request creation and successful status change writes history.

Expected lifecycle timeline:

| Request status | Required history                                           |
| -------------- | ---------------------------------------------------------- |
| `pending`      | `request_created`                                          |
| `approved`     | `request_created`, `request_approved`                      |
| `fulfilled`    | `request_created`, `request_approved`, `request_fulfilled` |
| `rejected`     | `request_created`, `request_rejected`                      |

History entries include:

- actor name
- actor role
- action
- from status
- to status
- optional note
- timestamp

## Employee Visibility

Employees see their own demo-user requests. Admins see all requests.

This is demo authorization, not production authentication. Real auth is listed
as future hardening.

## Why Approval Does Not Deduct Stock

Approval represents operational acceptance. Fulfillment represents actual
issuing of inventory. Keeping those separate matches warehouse workflows and
avoids deducting stock before items are physically issued.

## Why Fulfilled Requests Cannot Be Fulfilled Again

Double fulfillment would duplicate stock deduction. The service guards against
this by requiring the database row to still be `approved` at the moment the
fulfillment update runs.
