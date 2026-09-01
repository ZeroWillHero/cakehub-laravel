# CakeHub — Phased Delivery Plan

Source of truth for scope: [docs/requirements.md](requirements.md). Source of truth for how to work: [../CLAUDE.md](../CLAUDE.md). This plan sequences that scope into buildable phases — it does not add or remove requirements.

Each phase lists: goal, what gets built, which [agents](agents/)/[skills](skills/) are involved, exit criteria, and open decisions that block it (per CLAUDE.md Rule 2 — these are flagged, not decided, here).

---

## Phase 0 — Foundational Decisions & Environment

**Goal:** resolve the blocking decisions identified so far so later phases aren't built on assumptions.

**Open decisions to resolve before/at start of this phase** (see prior conversation — none of these are decided yet):
- [ ] Postgres hosting (local Herd Postgres vs. hosted — Neon/Supabase/RDS/other).
- [ ] Admin panel approach, now that frontend is Inertia+React not Blade (Filament is Blade/Livewire-based — decide: run Filament as a separate admin sub-app, or build the Admin panel as React/Inertia pages like everything else, for one consistent stack).
- [ ] Maps/geolocation provider (Google Maps/Places vs. alternative) — cost/API-key implications.
- [ ] Payment gateway (Stripe vs. regional alternative) — used for both order checkout and seller subscription billing.
- [ ] Cart model: single-seller-per-order vs. multi-seller cart.
- [ ] Delivery logistics ownership: platform-arranged riders vs. seller's own responsibility.
- [ ] Payment/fund flow: marketplace/escrow (platform holds & pays out sellers) vs. sellers collect directly.
- [ ] Commission model: subscription-only, per-order commission, or both.
- [ ] Target region/currency (affects gateway choice, tax handling, and the draft pricing table in requirements.md §3.9.1).

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

**Builds on:** requirements.md §3.5. **Blocked on Phase 0 decisions**: cart model, delivery logistics, payment/fund flow, payment gateway.

**What gets built:**
- Cart (per the chosen single/multi-seller model), checkout flow (delivery date/time slot, address, customization notes), payment gateway integration.
- Order model + status lifecycle (Placed → Confirmed → Preparing → Ready/Out for delivery → Delivered/Completed → Cancelled).
- Order history (customer + seller sides); seller real-time new-order notification.
- Cancellation/refund workflow (basic version — policy details per requirements.md §3.5).

**Agents/skills:** [backend-agent](agents/backend-agent.md) (orders, payment integration) → [frontend-agent](agents/frontend-agent.md) (checkout UX, order tracking UI) → full test trio, particular attention to payment-path integration tests.

**Exit criteria:** end-to-end order placed, paid, and tracked through all statuses in a test environment; seller sees and can act on new orders.

---

## Phase 5 — Reviews & Notifications

**Goal:** post-order feedback loop and baseline notifications work.

**Builds on:** requirements.md §3.6, §3.7 (excluding in-app chat, which stays out of scope per prior WhatsApp-instead decision unless requested later).

**What gets built:**
- Verified-purchase reviews/ratings on sellers/products; seller responses; average rating surfaced on storefront and search results.
- Order-status notifications (in-app at minimum; email/SMS/push if a provider is confirmed — flag as open decision if not yet chosen).

**Agents/skills:** [backend-agent](agents/backend-agent.md) → [frontend-agent](agents/frontend-agent.md) → full test trio.

**Exit criteria:** a completed order can be reviewed once (not duplicated), rating reflects on seller profile, and the customer/seller both receive an order-status notification.

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

---

## Phase 7 — Subscriptions & Dynamic Plan Management

**Goal:** sellers can purchase subscription tiers to raise their listing limit; admin fully controls plan definitions.

**Builds on:** requirements.md §3.9 (including §3.9.1's dynamic-plan requirement). **Blocked on** Phase 0's payment-gateway decision.

**What gets built:**
- Dynamic, DB-driven subscription plan model (no hard-coded tiers) — admin CRUD: add/edit/delete/enable-disable/reorder plans, mark a plan free.
- Seller subscription purchase flow (recurring billing via chosen gateway/Cashier), status/renewal display, usage-vs-limit indicator (built earlier in Phase 2, now live against real subscription state).
- Auto-downgrade behavior on lapse (excess listings hidden, not deleted) — Free tier as fallback.
- Seed the draft tiers from requirements.md §3.9.1 as **initial admin-editable data**, not hard-coded values.

**Agents/skills:** [backend-agent](agents/backend-agent.md) (Cashier, dynamic plan schema) → [frontend-agent](agents/frontend-agent.md) (Admin plan management UI, Seller subscription purchase UI) → full test trio, including a test that changing a plan's price/limit in the admin UI takes effect without a deploy.

**Exit criteria:** admin creates a new test plan entirely through the UI, a seller subscribes to it, and their listing limit updates accordingly — with zero code changes.

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
