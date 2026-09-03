# CakeHub — Phased Delivery Plan

Source of truth for scope: [docs/requirements.md](requirements.md). Source of truth for how to work: [../CLAUDE.md](../CLAUDE.md). This plan sequences that scope into buildable phases — it does not add or remove requirements.

Each phase lists: goal, what gets built, which [agents](agents/)/[skills](skills/) are involved, exit criteria, and open decisions that block it (per CLAUDE.md Rule 2 — these are flagged, not decided, here).

---

## Phase 0 — Foundational Decisions & Environment

**Goal:** resolve the blocking decisions identified so far so later phases aren't built on assumptions.

**Open decisions to resolve before/at start of this phase** (see prior conversation — none of these are decided yet):
- [x] Postgres hosting — local via Docker (`cakehub-postgres` container, `postgres:15.17-trixie` + manually-installed `postgresql-15-postgis-3`).
- [x] Admin panel approach — **React/Inertia pages**, confirmed 2026-09-02. Same stack as Customer/Seller (one consistent codebase, reuses existing auth/routing/testing patterns); Filament was ruled out since it's Blade/Livewire-based and would introduce a second UI stack.
- [x] Maps/geolocation provider — **OpenStreetMap** (Leaflet + Nominatim), confirmed 2026-09-02. Free, no API key needed.
- [x] Payment gateway for order checkout — **deferred** (confirmed 2026-09-02). Phase 4 builds the full cart/checkout/order-status flow with the payment step **stubbed** (order marked `paid` without a real charge). A real gateway is wired up later as its own task. Subscription billing (Phase 7) is a separate decision, still open.
- [x] Cart model — **single-seller-per-order**, confirmed 2026-09-02. Adding a product from a different seller starts a new cart (see Phase 4 for the exact UX).
- [x] Delivery logistics ownership — **seller's own responsibility**, confirmed 2026-09-02. Platform captures address/time slot only; no rider dispatch system.
- [x] Payment/fund flow — **sellers collect payment directly**, confirmed 2026-09-02 (no escrow/marketplace holding). This rules out a per-order commission model — see below.
- [x] Commission model — **subscription-only**, confirmed 2026-09-02 (follows directly from "sellers collect directly" — the platform never touches order payments, so it can only monetize via the seller subscription tiers already in requirements.md §3.9).
- [ ] Target region/currency — still open; not blocking while payment is stubbed (USD `$` used as a placeholder in the UI). Revisit when a real gateway is wired up.

**What gets built once decided:**
- `.env` configured for the chosen Postgres instance; PostGIS extension enabled and verified.
- Base Laravel config for the chosen payment gateway and maps provider (API keys wired via `.env`, not committed).
- Confirm/update `docs/agents/backend-agent.md` and `docs/agents/frontend-agent.md` if the admin-panel decision changes their scope.

**Exit criteria:** all decisions above answered by user and recorded in [../CLAUDE.md](../CLAUDE.md) §2 (Tech Stack); local `php artisan migrate` runs cleanly against Postgres with PostGIS enabled.

---

## Phase 1 — Auth, Roles & Account Foundations

**Goal:** a user can sign in with Google and land in the correct role-specific area; base account management works for all three roles.

**Builds on:** requirements.md §3.1, §3.11.

**What gets built:**
- Google OAuth via Socialite; first-login role selection/assignment (Customer vs. Seller signup path); Admin accounts provisioned separately (not self-service signup).
- `users` table + role/profile schema (Customer profile, Seller business profile fields, Admin).
- RBAC middleware/policies gating routes by role.
- Basic account management pages (profile, addresses for customers; business profile for sellers) per surface.

**Agents/skills:** [backend-agent](agents/backend-agent.md) (schema, Socialite, policies) → [frontend-agent](agents/frontend-agent.md) (login/onboarding/profile pages, per [frontend-design-skill](skills/frontend-design-skill.md)) → [frontend-integration-testing-agent](agents/frontend-integration-testing-agent.md) (role-gated route tests) → [chrome-ui-testing-agent](agents/chrome-ui-testing-agent.md) (login flow, all three roles).

**Exit criteria:** all three roles can sign in via Google, reach their correct landing area, and edit their own profile; unauthorized cross-role access is blocked and tested.

---

## Phase 2 — Categories & Catalog (Seller side)

**Goal:** sellers can list cake products under categories, subject to a listing limit.

**Builds on:** requirements.md §3.2, seller side of §3.4.

**What gets built:**
- Admin-managed cake category taxonomy (schema + seed data — actual admin CRUD UI comes in Phase 6, but the schema/model is needed now).
- Seller product CRUD (name, description, images, category tags, price, size/flavor options, availability).
- Listing-limit enforcement tied to seller's current subscription tier (tier data model only for now — full subscription purchase flow is Phase 7; a seller starts on the Free tier default).
- Seller dashboard shell: manage products, listing-usage indicator.

**Agents/skills:** [backend-agent](agents/backend-agent.md) → [frontend-agent](agents/frontend-agent.md) (Seller panel surface per [frontend-design-skill](skills/frontend-design-skill.md)) → unit + integration tests → [chrome-ui-testing-agent](agents/chrome-ui-testing-agent.md).

**Exit criteria:** a verified-or-not seller can create/edit/delete listings up to their tier's limit; exceeding the limit is blocked with a clear message (HCI: error prevention).

---

## Phase 3 — Search & Discovery (Customer side)

**Goal:** customers can find sellers by category and by location.

**Builds on:** requirements.md §3.3, customer side of §3.4.

**What gets built:**
- Category browse pages listing sellers offering that category.
- Location-based "near me" search using PostGIS distance queries (radius filter, sort by distance) — depends on Phase 0's maps-provider decision for the front-end geolocation/map UI.
- Search/filter UI (rating, price range, distance, category, open now).
- Public seller storefront page (profile, categories offered, gallery, ratings placeholder, WhatsApp contact button).

**Agents/skills:** [backend-agent](agents/backend-agent.md) (PostGIS queries) → [frontend-agent](agents/frontend-agent.md) (Customer portal, mobile-first per [frontend-design-skill](skills/frontend-design-skill.md)) → full test trio.

**Exit criteria:** searching a category returns correct sellers; "near me" returns sellers within the selected radius sorted by distance; WhatsApp deep link opens correctly with seller's number.

---

## Phase 4 — Ordering & Checkout

**Goal:** a customer can order a cake from a seller through the platform.

**Builds on:** requirements.md §3.5. **Decisions confirmed 2026-09-02** (see Phase 0): single-seller cart, seller-arranged delivery, seller collects payment directly (no escrow), payment step **stubbed** (no real gateway yet).

**What gets built:**
- Single-seller cart (adding a product from a different seller replaces the current cart, with a confirmation prompt), checkout flow (delivery-vs-pickup, date/time slot, address, customization notes), **stubbed payment step** (order created as `paid` immediately — no real charge, no gateway call).
- Order model + status lifecycle (Placed → Confirmed → Preparing → Ready/Out for delivery → Delivered/Completed → Cancelled).
- Order history (customer + seller sides); seller sees new orders on their dashboard (polling/refresh, not full real-time push — that's beyond a stubbed-payment MVP).
- Cancellation workflow (customer-initiated within a window, seller-initiated) — refunds are moot while payment is stubbed; revisit with the real gateway.

**Agents/skills:** [backend-agent](agents/backend-agent.md) (orders, payment integration) → [frontend-agent](agents/frontend-agent.md) (checkout UX, order tracking UI) → full test trio, particular attention to payment-path integration tests.

**Exit criteria:** end-to-end order placed, paid, and tracked through all statuses in a test environment; seller sees and can act on new orders.

---

## Phase 5 — Reviews & Notifications

**Goal:** post-order feedback loop and baseline notifications work.

**Builds on:** requirements.md §3.6, §3.7 (excluding in-app chat, which stays out of scope per prior WhatsApp-instead decision unless requested later).

**What gets built:**
- Verified-purchase reviews/ratings on sellers/products; seller responses; average rating surfaced on storefront and search results.
- Order-status notifications (in-app at minimum; email/SMS/push if a provider is confirmed — flag as open decision if not yet chosen).

**Phase 0 decisions confirmed 2026-09-02:**
- Notification channels: in-app (Laravel database notifications) + email. Email uses Laravel's `log` mail driver for now (renders/logs instead of real sending) — same stub-now-swap-later pattern as Phase 4's payment stub; swapping to a real provider later is an `.env` change only.
- In-app surface: a notification bell/dropdown in the Customer and Seller header layouts, showing recent notifications + unread count, backed by Laravel's built-in `notifications` table.
- Review scope stays as designed in [database-design.md](database-design.md): one review per order, targeting the seller (not per-product), with a seller response and a denormalized `average_rating` on `sellers`. Report/flag on a review (`is_flagged`) is stored but the moderation queue itself is Phase 6 (Admin) — no customer-facing "report" action is built this phase.

**Dev environment note (2026-09-02):** local dev now runs on port **8080**, not 8000 — port 8000 collides with an unrelated Spring Boot project (`pcs-main-backend`) also run locally by the developer. `APP_URL`, `SANCTUM_STATEFUL_DOMAINS`, and `.claude/launch.json` were updated accordingly; the Google OAuth client's authorized redirect URIs must include `http://localhost:8080/auth/google/callback`.

**Agents/skills:** [backend-agent](agents/backend-agent.md) → [frontend-agent](agents/frontend-agent.md) → full test trio.

**Exit criteria:** a completed order can be reviewed once (not duplicated), rating reflects on seller profile, and the customer/seller both receive an order-status notification (in-app + email/log).

---

## Phase 6 — Admin Panel: Verification & Category Management

**Goal:** admin can verify sellers and manage the category taxonomy.

**Builds on:** requirements.md §3.8, §3.10 (partial). **Depends on** Phase 0's admin-panel architecture decision.

**What gets built:**
- Seller verification queue (submit documents → admin approve/reject/request-info → verified badge).
- Category CRUD (add/edit/remove/reorder) reflected live in Phase 3's browse pages.
- Admin ability to suspend/ban a seller.
- Basic admin dashboard metrics.

**Agents/skills:** [backend-agent](agents/backend-agent.md) → [frontend-agent](agents/frontend-agent.md) (Admin panel surface, dense/table-heavy per [frontend-design-skill](skills/frontend-design-skill.md)) → full test trio.

**Exit criteria:** admin can verify/reject a seller and the badge/status reflects immediately on the storefront; category changes propagate to customer-facing search without a deploy.

**Note (2026-09-02):** the seller-side document upload flow (`POST /api/seller/documents`, Store Profile screen) had never actually been built in earlier phases despite being documented — built as part of this phase since the verification queue has nothing to review without it. Documents are stored on the `local` (private) disk, not `public`, and served through a policy-gated `GET /seller-documents/{document}` route (owner seller or admin only) rather than a public URL, since verification documents (business registration, ID, etc.) are sensitive.

---

## Phase 7 — Subscriptions & Dynamic Plan Management

**Goal:** sellers can purchase subscription tiers to raise their listing limit; admin fully controls plan definitions.

**Builds on:** requirements.md §3.9 (including §3.9.1's dynamic-plan requirement). **Blocked on** Phase 0's payment-gateway decision.

**Phase 0 decision confirmed 2026-09-02:** payment gateway deferred again — same stub-now-swap-later pattern as Phase 4's checkout. Subscribing marks a `seller_subscriptions` row `active` immediately with no real charge (`external_subscription_id` stays null); Cashier/a real gateway is wired up later as its own task. Target region/currency stays open, not blocking (USD placeholder).

**What gets built:**
- Dynamic, DB-driven subscription plan model (no hard-coded tiers) — admin CRUD: add/edit/delete/enable-disable/reorder plans, mark a plan free.
- Seller subscription purchase flow (recurring billing via chosen gateway/Cashier), status/renewal display, usage-vs-limit indicator (built earlier in Phase 2, now live against real subscription state).
- Auto-downgrade behavior on lapse (excess listings hidden, not deleted) — Free tier as fallback.
- Seed the draft tiers from requirements.md §3.9.1 as **initial admin-editable data**, not hard-coded values.

**Agents/skills:** [backend-agent](agents/backend-agent.md) (Cashier, dynamic plan schema) → [frontend-agent](agents/frontend-agent.md) (Admin plan management UI, Seller subscription purchase UI) → full test trio, including a test that changing a plan's price/limit in the admin UI takes effect without a deploy.

**Exit criteria:** admin creates a new test plan entirely through the UI, a seller subscribes to it, and their listing limit updates accordingly — with zero code changes.

**Note (2026-09-02):** "auto-downgrade on lapse" is implemented as a scheduled command (`app:expire-seller-subscriptions`, daily via `routes/console.php`) that expires subscriptions past `ends_at` and hides each affected seller's most-recently-created listings down to their new (lower) limit — never deletes them. The same hiding runs immediately when a seller manually switches to a lower-limit plan, or when an admin lowers a plan's `listing_limit` while sellers are actively subscribed to it.

---

## Phase 7.5 — Seller/Admin Analytics & Location Picker

**Goal:** close two gaps found ahead of Phase 8's merge — see [plan-analytics-and-location.md](plan-analytics-and-location.md) for the full plan (current-state audit, proposed scope, confirmed decisions). Runs before Phase 8's hardening pass so that pass covers these screens too.

**Summary:** stat graphs (Recharts) on the Seller Dashboard (tier-gated per subscription plan) and Admin Dashboard (with CSV export), plus a real `<AddressMapPicker>` (OpenStreetMap/Leaflet + Nominatim) for the Seller Store Profile and Customer addresses — both specced in screens.md since early phases but never built.

**Built (2026-09-03):** `Seller::hasAnalyticsAccess()` (reads `subscription_plans.features.basic_analytics`/`advanced_analytics`, admin-editable, seeded so Pro/Premium get it and Free/Basic don't); a shared `OrderStats` helper (30-day daily counts + status breakdown, reused by both dashboards); Seller Dashboard gets recent orders + gated charts, Admin Dashboard gets orders/new-sellers/status charts plus a `GET /admin/dashboard/export` CSV download; `<AddressMapPicker>` (search-with-debounce + click/drag pin) wired into Seller Store Profile and Customer Account Settings — both already accepted `latitude`/`longitude` server-side but had no frontend UI to send them.

**Verified:** 165 Pest tests passing, `tsc` clean. Live-verified on port 8080: Admin dashboard charts render and scale correctly against seeded order data (an initial "flat" read was Recharts' entrance animation, not a bug); Seller dashboard shows gated analytics correctly for a Pro-plan seller; the address picker's Nominatim search returned and applied a real result (Eiffel Tower) with the map recentering and the address field auto-filling; click-to-place-pin on the Customer address form persisted real coordinates. One real bug fixed: the default Recharts line/bar color (`--chart-1`) is a very light, near-invisible gray in this project's neutral palette — shifted the default to `--chart-3` for actual contrast.

**Note:** superseded visually by the sidebar/chart redesign below (see "Admin/Seller Sidebar Layout & shadcn Chart Redesign") — the dashboards built here get restyled into the new `ChartAreaInteractive`-style components and sidebar shell, but the underlying data/endpoints (`OrderStats`, the analytics-access gate, the CSV export) stay as built.

---

## Phase 8 — Cross-Cutting Testing & Hardening Pass

**Goal:** close test-coverage gaps and do a full HCI/design-checklist pass across all three surfaces before considering the MVP complete.

**What gets done:**
- Full pass of [frontend-design-skill](skills/frontend-design-skill.md)'s HCI checklist on every screen built in Phases 1–7.
- [chrome-ui-testing-agent](agents/chrome-ui-testing-agent.md) run across Customer/Seller/Admin on mobile + desktop breakpoints.
- Gap-fill for [frontend-unit-testing-agent](agents/frontend-unit-testing-agent.md) / [frontend-integration-testing-agent](agents/frontend-integration-testing-agent.md) coverage.
- Accessibility spot-check (keyboard nav, contrast, screen-reader labels) per the checklist.

**Exit criteria:** every screen passes the HCI checklist; test suites green; no known critical bugs from the Chrome UI pass.

---

## Phase 9 — Deployment

**Goal:** ship to a real environment.

**Open decision:** hosting target has not been discussed at all yet (Vercel is available via this session's plugin, but Laravel is a full PHP app — Vercel is not a natural fit for a standard Laravel deployment; typical choices are Laravel Forge, a VPS, Railway, Render, or similar PHP-friendly hosts). **Do not assume Vercel just because tooling for it is present in this session** — ask before picking a host.

**What gets built (once host is chosen):**
- Production environment config, Postgres/PostGIS in production, queue/scheduler setup if needed, HTTPS/domain, backups.
- CI pipeline (test suite gating deploys).

**Exit criteria:** production deployment reachable, passes a smoke test of the Phase 8 golden paths.

---

## How to use this plan

- Work top-to-bottom; later phases assume earlier ones are exit-criteria-complete, but flag if you want a different order (e.g. Admin verification before Search, if seller onboarding needs to be gated from day one).
- Do not start a phase whose "blocked on" decisions are still open — surface the question instead of assuming an answer (root CLAUDE.md Rule 2).
- Update this file when a phase's scope changes or a decision is made — keep it in sync with reality, not just the plan-time intent.
