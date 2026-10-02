# CLAUDE.md — CakeHub Project Instructions

This file governs how Claude Code should work on the CakeHub codebase. Follow it exactly.

## 0. Ground Rules (highest priority — always apply)

1. **Do not add requirements that were not explicitly requested.** Do not invent features, pages, roles, integrations, or scope beyond what is documented in [docs/requirements.md](docs/requirements.md) or explicitly asked for in the current conversation. If something seems "obviously missing" or "nice to have," do not silently add it — surface it as a question or a suggestion instead (see rule 2).
2. **Never assume — confirm.** Before doing any non-trivial piece of work (new feature, schema change, new dependency, architectural choice, deviation from this file, or anything not explicitly and unambiguously specified by the user), stop and ask the user "is this correct?" / "should I proceed with X or Y?" rather than guessing and proceeding. Do not chain assumptions on top of assumptions. This overrides any general instinct to "just proceed with sensible defaults."
   - Trivial, obviously-correct execution details (variable names, file organization within an already-agreed structure, formatting) do not need confirmation.
   - Anything that changes what the product does, how data is modeled, what a user can do, or what a plan/limit/price is — always confirm first.
3. When in doubt between rule 1/2 and "just being helpful," ask. A clarifying question costs little; unrequested scope costs a lot.

## 1. Project Summary

CakeHub is a two-sided marketplace connecting cake-buying **Customers** with cake-selling **Sellers** (bakeries/home bakers), with an **Admin** role for platform oversight. Full requirements live in [docs/requirements.md](docs/requirements.md) — treat that file as the source of truth for scope. Do not build against memory of this conversation if it conflicts with that document; the document should be updated first if scope changes.

The phased build order lives in [docs/plan.md](docs/plan.md) — work through phases in order, and don't start a phase whose listed blocking decisions are still open (ask, per Rule 2). Screen-by-screen UI inventory: [docs/screens.md](docs/screens.md). Database design: [docs/database-design.md](docs/database-design.md). Backend endpoint list (Inertia + REST): [docs/api-endpoints.md](docs/api-endpoints.md).

Core mechanics:
- Customers search cakes by **category** and by **location** ("near me").
- Browsing is **public**: guests can browse/search, view verified sellers' stores and products, use WhatsApp, and build a session cart. Google sign-in is required only at checkout, which then resumes with that cart (confirmed 2026-10-03, see [docs/plan-public-browsing-guest-cart.md](docs/plan-public-browsing-guest-cart.md)).
- Customers order directly through the platform (checkout) OR contact sellers directly via a **WhatsApp deep link** — both are first-class, neither replaces the other.
- Sellers manage their own storefront/catalog, subject to a **listing limit** tied to their subscription tier.
- Admin verifies sellers, manages cake categories, and manages subscription plans (fully dynamic — add/edit/delete/enable-disable, including free plans) — no code deploys required to change pricing/tiers.

## 2. Tech Stack (decided)

- **Backend framework:** Laravel (latest stable).
- **Database:** PostgreSQL with the **PostGIS** extension, for geospatial "nearby seller" search (store locations stored as `geography(Point, 4326)`, GiST-indexed, queried via distance functions). Use a Laravel spatial package (e.g. `matanyadaev/laravel-eloquent-spatial`) rather than hand-rolled raw SQL where possible.
- **Auth:** **Google OAuth only** (via Laravel Socialite). No email/password auth, no OTP, no password reset flow — do not add these back even as a "fallback," per requirements.
- **Admin panel:** React/Inertia pages, same stack as the Customer/Seller surfaces (confirmed 2026-09-02, supersedes the original Filament plan — Filament is Blade/Livewire-based and doesn't fit now that the frontend moved to Inertia+React).
- **Subscriptions/billing:** Laravel Cashier (or equivalent) for recurring billing; plan data (tiers, prices, limits, perks) must be **fully dynamic/DB-driven**, editable via the admin panel — never hard-code tier definitions in application code.
- **Frontend:** Laravel + **Inertia.js + React** + **shadcn/ui** (superseded the earlier Livewire/Blade decision — changed on 2026-09-01 specifically so real shadcn/ui components could be used; do not revert without re-confirming). Styling via Tailwind CSS (shadcn's default). The Blade layer is reduced to Inertia's root template (`resources/views/app.blade.php`) only — page-level UI lives in React components, not `.blade.php` views.
- **UI component library:** shadcn/ui (React) for all three surfaces — Admin panel, Seller panel, Customer portal. Each surface should look modern and visually distinct (not three copies of the same theme) while sharing the same underlying design tokens/component primitives.
- **REST API layer:** `routes/api.php`, authenticated via **Laravel Sanctum (SPA mode)** — for AJAX-only interactions that shouldn't trigger a full Inertia page visit (cart mutations, search-as-you-type, subscription checkout, status toggles). Confirmed 2026-09-01. See [docs/skills/rest-api-skill.md](docs/skills/rest-api-skill.md) for the Inertia-vs-REST split and the typed-contract discipline between Laravel and React.
- **Backend test framework:** **Pest**. Confirmed 2026-09-01. See [docs/skills/backend-testing-skill.md](docs/skills/backend-testing-skill.md).
- **Maps/geolocation:** **OpenStreetMap** — Leaflet for map display, Nominatim for address geocoding/search. Free, no API key or billing account needed. Confirmed 2026-09-02.
- **Hosting/deployment:** single **AWS EC2** instance running the app via **Docker** (`Dockerfile` + `docker-compose.yml` at repo root — app container, queue-worker container, Caddy reverse proxy for automatic HTTPS). Database is **Supabase** (managed Postgres with the `postgis` extension enabled) — Postgres/PostGIS only, no other Supabase product (Auth/Storage/Realtime) is in use. Deploys are automated via **GitHub Actions** (`.github/workflows/deploy.yml`): build & push to GHCR, SSH into EC2, `docker compose pull/up`, run migrations. Production env vars ship as one base64-encoded GitHub Actions secret (`ENV_FILE_B64`). Confirmed 2026-09-16. See [docs/deployment.md](docs/deployment.md) for the full setup walkthrough.

If any of the above needs to change (e.g. swapping Postgres for something else, swapping the admin package), that is a scope/architecture decision — confirm with the user first per Rule 2.

**Explicitly out of scope (decided, not just unmentioned):**
- **Redis** — considered and declined (2026-09-01). Not in requirements.md, no current need. Use Laravel's default database-backed cache/queue drivers. Do not add Redis speculatively — ask again if a real need for queueing/caching at scale emerges.
- **MCP servers for Laravel/React documentation** — no verified official MCP servers exist for these; do not fabricate MCP config entries or URLs. Use WebSearch/WebFetch against official docs (laravel.com, react.dev) instead.

## 3. Roles (do not confuse or rename)

- **Customer** — the cake buyer. Browses, searches, orders, reviews, manages their own account.
- **Seller** — the cake-selling business/person. Manages storefront, catalog, listing limits, subscription, verification documents.
- **Admin** — platform operator. Verifies sellers, manages categories, manages subscription plans, moderates content, oversees orders/disputes.

## 4. Git Workflow

- `main` holds only reviewed, complete work — **never commit phase implementation work directly to `main`.**
- Each phase from [docs/plan.md](docs/plan.md) is built on its own branch (e.g. `phase-1-auth-roles-accounts`), branched from `main`.
- Do not merge a phase branch into `main` without the user's explicit go-ahead — implementation work stays on its branch until the user reviews and approves it.

## 5. Working Process

- Before starting a feature, check [docs/requirements.md](docs/requirements.md) to confirm it's in scope. If it isn't clearly covered, ask before building it.
- Keep the requirements doc and this file in sync with decisions made in conversation — if the user confirms a new decision (schema, package, flow), update the relevant doc rather than letting it live only in chat history.
- Prefer Laravel/ecosystem-native solutions (official packages, well-maintained community packages) over custom-built infrastructure for solved problems (auth, admin CRUD, billing, spatial queries) — but confirm package choice when there are multiple reasonable options.
- No feature flags, backwards-compatibility shims, or speculative abstractions for hypothetical future requirements — build what's asked, nothing more (ties back to Rule 1).

## 6. Agents & Skills — where to find them

Project-specific agent and skill definitions live under `docs/`, one file per agent/skill (not bundled into a single file). Consult the relevant one(s) before doing related work.

**Agents** — `docs/agents/`:
- [docs/agents/frontend-agent.md](docs/agents/frontend-agent.md) — implements Customer/Seller/Admin UI (React + Inertia + shadcn/ui), enforces HCI principles, typed props/API calls.
- [docs/agents/backend-agent.md](docs/agents/backend-agent.md) — implements Laravel routes/controllers/models, Inertia responses, and the REST API layer.
- [docs/agents/chrome-ui-testing-agent.md](docs/agents/chrome-ui-testing-agent.md) — live browser (Chrome) visual/interaction verification after frontend changes.
- [docs/agents/frontend-unit-testing-agent.md](docs/agents/frontend-unit-testing-agent.md) — React/component unit tests (Vitest + React Testing Library).
- [docs/agents/frontend-integration-testing-agent.md](docs/agents/frontend-integration-testing-agent.md) — full request→Inertia→backend integration tests.
- [docs/agents/backend-unit-testing-agent.md](docs/agents/backend-unit-testing-agent.md) — isolated PHP + model/relationship tests (Pest).
- [docs/agents/backend-integration-testing-agent.md](docs/agents/backend-integration-testing-agent.md) — controller/endpoint (HTTP) tests, happy + worst paths, for both Inertia and REST routes.
- [docs/agents/requirements-verification-agent.md](docs/agents/requirements-verification-agent.md) — independent, non-implementing sub-agent that checks a completed phase against requirements.md/plan.md/screens.md/api-endpoints.md before it's considered verified. Run this after each phase's implementation, before moving to the next.

**Skills** — `docs/skills/`:
- [docs/skills/frontend-design-skill.md](docs/skills/frontend-design-skill.md) — shared design system, per-surface visual direction, and the HCI checklist every screen must pass.
- [docs/skills/rest-api-skill.md](docs/skills/rest-api-skill.md) — REST API conventions (Sanctum SPA auth, response envelope) and the typed-contract discipline between Laravel and React.
- [docs/skills/backend-testing-skill.md](docs/skills/backend-testing-skill.md) — unit/integration/endpoint testing conventions (Pest), mandatory happy-path + failure-path coverage per endpoint.

When adding a new agent or skill, create it as its own file in the matching folder (kebab-case, e.g. `payments-agent.md`) and add a pointer to it here — do not append multiple agents/skills into one file.

## 7. Note on this scaffold

This project was scaffolded via `composer create-project laravel/laravel`. Laravel's own installer generated an `AGENTS.md` suggesting installation of `laravel/boost` (a dev tool that would regenerate this file with framework-specific guidelines). **Boost has not been installed** — installing it is a new dependency/tooling decision and requires user confirmation first, per Rule 2 above. `AGENTS.md` is left as-is from the scaffold; this `CLAUDE.md` is the authoritative instructions file and should not be overwritten by future scaffold/install steps without checking its content is preserved.
