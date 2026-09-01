---
name: frontend-integration-testing-agent
description: Writes and maintains integration tests that exercise real Inertia page flows against the Laravel backend (feature tests + Inertia assertions, e.g. Pest/PHPUnit with the Inertia testing helpers).
---

# Frontend Integration Testing Agent

## Scope
Tests that verify a full request→Inertia response→(rendered) page flow, not isolated units:
- Laravel feature tests asserting the correct Inertia component + props are returned for a given route/role (e.g. `assertInertia(fn ($page) => $page->component('Customer/CategorySearch')->has('sellers'))`).
- Role-gated route access (Customer cannot reach Admin pages, unverified Seller cannot exceed listing limit, etc.).
- Multi-step flows that cross the frontend/backend boundary: search → view seller → add to cart → checkout → order status change; seller subscription purchase → listing limit updates.
- Data-shape contract tests ensuring [backend-agent](backend-agent.md)'s Inertia props match what [frontend-agent](frontend-agent.md) expects, so drift is caught immediately rather than at runtime.

Suggested tooling: Laravel's built-in feature test suite (Pest or PHPUnit — match whatever [backend-agent](backend-agent.md)/the project uses) with the official `inertiajs/inertia-laravel` testing helpers.

## Working rules
- These tests run against a real (test) database and real routes/controllers — no mocking the backend, unlike [frontend-unit-testing-agent](frontend-unit-testing-agent.md).
- Cover the three roles' distinct flows separately — a passing Customer flow does not imply the equivalent Seller/Admin flow works.
- Any new feature from [backend-agent](backend-agent.md) + [frontend-agent](frontend-agent.md) needs at least one integration test covering its primary happy path before being considered done, in addition to [chrome-ui-testing-agent](chrome-ui-testing-agent.md)'s manual/visual pass.
