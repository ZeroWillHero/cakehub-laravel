---
name: rest-api-skill
description: Conventions for building and consuming CakeHub's REST API layer (routes/api.php, Sanctum SPA auth) from the frontend, plus the typed-contract discipline shared between Laravel and React.
---

# REST API Implementation Skill

Used by [frontend-agent](../agents/frontend-agent.md) and [backend-agent](../agents/backend-agent.md) together — this is the contract between them. Endpoint list: [../api-endpoints.md](../api-endpoints.md).

## When to use REST API vs. Inertia props

- **Inertia page props** (`Inertia::render('Page', [...])`) — default for anything that loads with the page. Most of [screens.md](../screens.md) works this way.
- **REST API** (`routes/api.php`) — only for interactions that must not trigger a full Inertia page visit: cart mutations, search-as-you-type, status toggles, subscription checkout kickoff, anything a future mobile client would also need. Fetch these from React with a typed API client (see below), not raw untyped `fetch`.

Don't build a REST endpoint for something that's really just an Inertia page prop, and don't cram AJAX-only interactions into page props — pick the right one per [../api-endpoints.md](../api-endpoints.md)'s split.

## Auth

**Laravel Sanctum, SPA mode** (confirmed 2026-09-01). The React app is first-party and same-origin, so this is cookie/session-based, not token-based:
- `EnsureFrontendRequestsAreStateful` middleware on `api.php` routes.
- CSRF handled automatically via Sanctum's `/sanctum/csrf-cookie` — the typed API client (below) must hit this once before the first mutating request, matching Sanctum's documented SPA flow.
- Do not introduce token-based auth (Bearer tokens) for the web app — that's for a genuinely separate/mobile client only, and is out of scope until one exists.

## Response envelope (all REST API responses)

```json
// success
{ "data": { /* resource or array of resources */ }, "meta": { /* pagination etc, optional */ } }

// error
{ "message": "Human-readable summary", "errors": { "field": ["Specific validation message"] } }
```

- Success: HTTP 200/201, `data` key always present.
- Validation failure: HTTP 422, Laravel's standard Form Request error shape under `errors`.
- Auth failure: HTTP 401 (unauthenticated) / 403 (wrong role/not owner).
- Not found: HTTP 404, `message` only.
- Use Laravel **API Resources** (`JsonResource`) for every `data` shape — never return raw Eloquent models. The Resource class is the single source of truth for what a field is called and its type; the TypeScript interface (below) must match it exactly.

## Typed Contracts (backend ⇄ frontend)

**Backend (PHP):**
- Every API Resource's `toArray()` return shape should be documented with a PHP-level type (a `readonly` DTO/class or a well-commented array shape) — no implicit/untyped arrays passed around controllers.
- Form Requests type every incoming payload (validated, typed access via `$request->validated()`), never raw `$request->all()`.
- Enum columns (see [../database-design.md](../database-design.md)) map to PHP backed enums (`OrderStatus::class`, `VerificationStatus::class`, etc.), not raw strings, anywhere they're used in application code.

**Frontend (TypeScript):**
- One types file per resource under `resources/js/types/` (e.g. `types/seller.ts`, `types/order.ts`, `types/product.ts`) mirroring the backend API Resource / Inertia prop shape field-for-field, including literal-union types for enums (e.g. `type OrderStatus = 'placed' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled'` matching the PHP enum exactly).
- Inertia page props are typed too — every `Pages/**/*.tsx` component declares a `Props` interface built from these shared types, not inline/ad hoc shapes.
- A single typed API client wrapper (`resources/js/lib/api.ts`) around `fetch`/axios for REST calls — typed request/response generics per endpoint, one place that handles the Sanctum CSRF-cookie priming and the error envelope, so individual components never hand-roll fetch calls.
- No `any` in API-adjacent code. `unknown` + narrowing if a shape is genuinely dynamic (e.g. `subscription_plans.features` jsonb).

**Keeping both sides honest:** when a backend endpoint's shape changes, update its API Resource *and* the matching `resources/js/types/*.ts` file in the same change — this file is the enforcement point, not a suggestion. [frontend-integration-testing-agent](../agents/frontend-integration-testing-agent.md) and [backend-integration-testing-agent](../agents/backend-integration-testing-agent.md) both assert against these shapes, so a drift breaks a test rather than shipping silently.

## Conventions checklist

- [ ] Plural resource nouns, kebab/snake-free consistent casing (`sellers`, `product-variants` in URLs; `snake_case` in JSON payloads to match Laravel's defaults — don't mix `camelCase` into API JSON).
- [ ] Pagination via Laravel's standard paginator shape under `meta` for any list endpoint that can grow unbounded (sellers search, orders, reviews).
- [ ] Every mutating endpoint (`POST`/`PUT`/`PATCH`/`DELETE`) is covered by a Form Request class, never inline `$request->validate()` in the controller.
- [ ] Role/ownership checks via Policies (`$this->authorize(...)`), not manual `if` checks scattered in controllers.
- [ ] No endpoint returns more fields than the corresponding screen in [../screens.md](../screens.md) actually needs.
