# Dashboard and Stock Overview UI Audit

## Summary

The Dashboard and Stock Overview are functional and database-backed, but they are not ready at the requested enterprise-product standard yet. The current experience surfaces correct records, but it still reads more like raw operational output than a concise decision-support interface.

## Current Dashboard Issues

- Six equal KPI cards flatten urgency instead of directing the admin toward the next action.
- The priority queue lacks explicit urgency reasons, status context, and review affordances.
- Inventory risk rows are plain text with no visual hierarchy, status badges, demand signal, or direct action.
- Recent activity renders raw action names and actor/date fragments rather than a readable timeline.
- Quick actions are large generic buttons and are not role-aware.
- Empty-state interpretation is missing across the urgent sections.

## Current Stock Overview Issues

- KPI cards emphasize generic catalogue facts such as categories and warehouses instead of operational health.
- The page lacks a dedicated risk-first section above the full table.
- Search and filter controls are placeholders rather than working controls with visible state.
- The table does not expose pending demand, action affordances, status badges, or risk-first ordering.
- Selected-row, low-stock, and out-of-stock visual states are weak.

## Current Item Details Panel Issues

- The panel is a raw field list rather than an inventory inspector.
- It lacks stock-health interpretation, availability formula, demand summary, related requests, recent activity, and contextual footer actions.
- The panel does not provide the item-specific `data-testid` contract needed for precise QA.

## Database/Data Issues

- Core stock and request data already come from PostgreSQL through Drizzle.
- Dashboard queries currently omit related item risk per request, pending demand per stock item, and request/item links needed for richer inspector content.
- Item detail data is not hydrated server-side with related requests or item-specific audit activity.
- Seed data is strong enough in volume, but only request-focused audit history exists today; item-level audit traces are sparse and need derived request-linked activity for the inspector.

## Test Coverage Issues

- Existing Playwright checks prove shell behavior, but they do not cover the requested urgency-first dashboard, stock controls, item inspector content, or screenshot set.
- Unit coverage does not isolate stock-status calculation, KPI calculation, urgency sorting, filter logic, or health interpretation.
- Component coverage does not exercise the redesigned dashboard cards, risk lists, stock risk section, or item inspector.

## Fix Plan

### P0 — must fix

- Replace the Dashboard KPI strip with three action cards and enrich the priority queue, inventory risk, activity, and quick-action sections from database queries.
- Rebuild Stock Overview around operational KPIs, a risk-first section, real search/filter/sort controls, status-aware rows, and readable table behavior.
- Replace the stock item panel with a real inventory inspector backed by item demand, related requests, and recent item activity.
- Add Playwright coverage, focused unit/component tests, and screenshots for all required flows.

### P1 — strong polish

- Add role-aware dashboard shortcuts, human-readable audit copy, positive zero states, and stronger row/action affordances.
- Add documented decisions for urgency ordering, stock-health interpretation, and risk-first presentation.
- Improve seed/audit assumptions only where richer inspector behavior cannot be derived from existing persisted data.

### P2 — optional refinement

- Expand cross-browser visual coverage and richer item-specific activity taxonomy if the module grows beyond the current assessment scope.
- Add dedicated report/audit destinations for currently future-facing “view all” links.
