---
name: backend-testing-skill
description: Shared testing conventions for the Laravel backend — unit, integration, and controller/endpoint tests — using Pest, covering both happy paths and failure paths.
---

# Backend Testing Skill

Used by [backend-agent](../agents/backend-agent.md), [backend-unit-testing-agent](../agents/backend-unit-testing-agent.md), and [backend-integration-testing-agent](../agents/backend-integration-testing-agent.md). Test framework: **Pest** (confirmed 2026-09-01).

## Test layers (don't conflate them)

1. **Unit** — isolated PHP logic with no DB/HTTP: services, value objects, PHP enums, price/distance calculation helpers, policy logic in isolation. Owned by [backend-unit-testing-agent](../agents/backend-unit-testing-agent.md).
2. **Integration (feature)** — Eloquent models + real (test) database, no HTTP layer: relationships, scopes, model events (e.g. `average_rating` recalculation on new review), migrations. Owned by [backend-unit-testing-agent](../agents/backend-unit-testing-agent.md) (grouped with unit — both are "no HTTP" tests in Pest's `tests/Unit` + relevant `tests/Feature` model specs).
3. **Controller / endpoint (HTTP feature)** — full request→response cycle against real routes (`routes/web.php` Inertia routes and `routes/api.php` REST routes from [../api-endpoints.md](../api-endpoints.md)), real (test) database, real middleware/policies. Owned by [backend-integration-testing-agent](../agents/backend-integration-testing-agent.md).

## Test database

Use a dedicated Postgres test database (with PostGIS enabled) via `RefreshDatabase` — not SQLite, since PostGIS-specific geography queries must be exercised for real (SQLite would silently pass/fail differently). Factories (`database/factories/*Factory.php`) for every model, with realistic defaults so tests read declaratively (`Seller::factory()->verified()->create()`).

## Mandatory coverage per endpoint (controller/endpoint layer)

Every endpoint in [../api-endpoints.md](../api-endpoints.md) needs, at minimum:

**Happy path**
- [ ] Valid request as the correct role/owner returns the expected status code and response shape (assert against the same typed contract from [rest-api-skill.md](rest-api-skill.md), not just "200 OK").
- [ ] Side effects actually happened (record created/updated in DB, not just a response asserted).

**Worst / failure paths** — do not skip these even when "the happy path is what matters":
- [ ] **Unauthenticated** request → 401, no data leaked.
- [ ] **Wrong role** (e.g. customer hitting a seller-only endpoint) → 403.
- [ ] **Not the owner** (e.g. seller A editing seller B's product) → 403, not 404 (avoid leaking existence via status code, unless the resource should be genuinely hidden).
- [ ] **Invalid/missing payload** → 422 with field-specific error keys matching the Form Request's rules.
- [ ] **Resource not found** (bad ID) → 404.
- [ ] **Business-rule violation** — e.g. seller exceeding their subscription's listing limit, order status transition to an invalid next-state, reviewing an order twice, deleting a subscription plan with active subscribers — each has its own explicit test, not just generic validation.
- [ ] **Boundary conditions** where relevant — e.g. exactly at the listing limit (should succeed) vs. one over (should fail), empty search results (should return empty array + 200, not error).

## Working rules

- One `it(...)`/`test(...)` per scenario, named for the scenario ("it returns 403 when a seller edits another seller's product"), not generic ("test product update").
- New endpoint from [backend-agent](../agents/backend-agent.md) ships with its full happy+failure matrix in the same change, per [../plan.md](../plan.md)'s per-phase exit criteria.
- Don't re-test framework/package behavior (Sanctum's own auth guarantees, Eloquent's own relationship mechanics) — test CakeHub's usage and business rules on top of them.
- Geospatial tests ("nearby" search) must seed sellers at known coordinates and assert exact expected result sets at specific radii — not just "returns something."
