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
- [x] Payment gateway for order checkout — **deferred** (confirmed 2026-09-02). Phase 4 built the cart/checkout/order-status flow with the payment step **stubbed** (order marked `paid` without a real charge). Phase 8 (confirmed 2026-09-06) replaces that stub — and Phase 7's subscription stub — with a manual bank-transfer + slip-upload + admin-verification flow; still no real gateway. Swapping in a real gateway later stays open via `Payment.method`.
- [x] Cart model — **single-seller-per-order**, confirmed 2026-09-02. Adding a product from a different seller starts a new cart (see Phase 4 for the exact UX).
- [x] Delivery logistics ownership — **seller's own responsibility**, confirmed 2026-09-02. Platform captures address/time slot only; no rider dispatch system.
- [x] Payment/fund flow — **sellers collect payment directly**, confirmed 2026-09-02 (no escrow/marketplace holding). This rules out a per-order commission model — see below.
- [x] Commission model — **subscription-only**, confirmed 2026-09-02 (follows directly from "sellers collect directly" — the platform never touches order payments, so it can only monetize via the seller subscription tiers already in requirements.md §3.9).
- [ ] Target region/currency — still open; not blocking while payment is stubbed (USD `$` used as a placeholder in the UI). Revisit when a real gateway is wired up.
- [x] App timezone — **`Asia/Colombo`**, confirmed 2026-09-07. `config/app.php`'s `timezone` was hardcoded to `UTC` (Laravel's default), which lagged the server's actual local time (Sri Lanka, `+5:30`) by hours — surfaced as a bug where a newly created ad's `starts_at = today` (per the admin's local browser date) wasn't yet "today" by the app's UTC-based `now()`. Fixed by setting `'timezone' => 'Asia/Colombo'` directly (no `APP_TIMEZONE` env var existed to override); affects every date-based feature app-wide (ad eligibility windows, subscription renewal dates, order timestamps), not just Ads.

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

**Phase 0 decision confirmed 2026-09-02:** payment gateway deferred again — same stub-now-swap-later pattern as Phase 4's checkout. Subscribing originally marked a `seller_subscriptions` row `active` immediately with no real charge; **Phase 8 (confirmed 2026-09-06) replaces that** with a manual bank-transfer + slip-upload + admin-verification flow — a subscription now starts `pending` and only becomes `active` once its payment is verified. `external_subscription_id` stays null pending a real gateway. Target region/currency stays open, not blocking (USD placeholder).

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

## Phase 7.6 — Admin/Seller Sidebar Redesign & Customer Portal Restyle

**Goal:** close a second batch of gaps found ahead of Phase 8's merge (same pattern as Phase 7.5) — Admin/Seller navigation shell, several requirements.md-specced-but-never-built account/catalog features, and a full Customer-portal visual restyle. Runs before Phase 8's hardening pass so that pass covers these screens too. Branch: `phase-7.6-customer-ui-restyle`.

**Built (2026-09-03 to 2026-09-05), in order:**
- **Sidebar shell + chart redesign** (commits `cf48813`, `10b4025`): replaced Admin/Seller's per-page header-link navigation with shadcn's persistent sidebar pattern (`ui.shadcn.com/blocks/sidebar`); restyled Phase 7.5's dashboard charts to match shadcn's `ChartAreaInteractive` block, adding a 7d/30d/90d range toggle to `OrderStats` (supersedes 7.5's fixed-30-day window). Nav: Admin — Dashboard/Verification Queue/Categories/Subscription Plans; Seller — Dashboard/Listings/Orders/Reviews/Store Profile/Subscription. Simple "Surface / Page" breadcrumbs. Customer portal explicitly out of scope for the sidebar — kept its own header layout.
- **Settings, profile images, product reviews, categories, filters, loading states** (commits `5ae467c`, `b97260f`, `de4fff6`, `f1d6e77`): Admin/Seller account settings pages (per-notification-type preference toggles, seller payout/bank detail fields — functionally inert pending a real payment gateway, account deactivation via a new `EnsureAccountIsActive` middleware); Google-sourced profile avatars surfaced across dashboards/reviews; seller logo/cover photo uploads; product-level reviews added alongside the existing seller-level reviews (supplement, not replace); seller-submitted categories (live immediately, no approval queue, admin list shows a "Seller-added" badge and search); price-range/rating-minimum filters on customer seller search, status/date filters on seller orders, category/availability filters on seller listings, submitted-date filter on the admin verification queue, active/inactive filter on admin subscription plans; a consistent spinner/skeleton loading-state system on high-traffic pages.
- **Customer portal restyle** (commits `2ee791f`, `7d9669b`, `3580f91`): **replaced the Customer-only warm-bakery `.customer-theme` (sage/cream/peach + Playfair Display) with one shared palette across all three surfaces** — a pink/rose primary (`#EF88AD`) on shadcn's default neutral base, plus a **light/dark mode toggle** (`ThemeToggle`, `.dark` class, `localStorage`-persisted, applied pre-paint in `app.blade.php` to avoid a flash) available site-wide, not Customer-only. Added `FloatingNav` (a bottom pill nav that swaps in for the top header on scroll, Customer-only — Home/Search/Cart/Orders/Profile), reworked `SiteHeader`/`PageHero` (gradient hero, scroll-aware header), real photography (Pexels images) replacing `ImagePlaceholder` on the Customer home/gallery, and centralized every `ui/*.tsx` component's `cn` import to `@/lib/utils` (`cn` npm package + Vite alias, replacing a bare `from "cn"` import). Backend: full-text product search (`ProductSearchController`, `GET /api/products/search`) and category image uploads/catalog seeding to support it.

**Supersedes:** the customer-theme/typography guidance in [frontend-design-skill](skills/frontend-design-skill.md) (updated 2026-09-06 to match) — that doc's Customer/Seller/Admin "distinct-but-consistent" three-palette design is no longer accurate; there is now one shared palette with a light/dark toggle, distinguished per-surface only by layout (Customer: header/hero/FloatingNav vs. Admin/Seller: sidebar shell).

**Not yet verified:** unlike Phase 7.5, this batch was built ad hoc across several user requests without a corresponding [requirements-verification-agent](agents/requirements-verification-agent.md) pass or a full [chrome-ui-testing-agent](agents/chrome-ui-testing-agent.md) run — that verification is rolled into Phase 8 below rather than done per-commit.

---

## Phase 8 — Manual Bank-Transfer Payments (Slip Upload + Admin Verification)

**Goal:** replace both Phase 4's order-checkout payment stub and Phase 7's subscription-checkout payment stub with a real (manual) payment process, without a payment gateway: customers/sellers pay by bank transfer and upload a slip; an admin verifies it before the order/subscription is treated as paid. Built so a real gateway can be added later via `Payment.method` without a data-model change — confirmed 2026-09-06.

**Builds on:** Phase 4's order checkout, Phase 7's subscription checkout, and Phase 7.6's `payout_bank_name`/`payout_account_name`/`payout_account_number` fields on `sellers` (already exist, currently unused).

**Confirmed decisions (2026-09-06):**
- Admin maintains a dynamic list of bank accounts (`admin_bank_accounts`) that customers/sellers pay into — not hard-coded.
- One polymorphic `payments` table (`payable_type`/`payable_id` → `Order` or `SellerSubscription`) covers both order payments and subscription payments; `method` is `bank_transfer` for now but the column is designed to accept a future `gateway` value.
- An order is only placed once checkout details **and** the slip are submitted — payment starts `pending`/`awaiting_verification`, never fake-`paid`. Same for a subscription: it starts `pending` until its slip is verified.
- While payment is unverified, the seller sees the order but **cannot** change its status (ready/completed/etc.) — enforced server-side (not just hidden in the UI), so a seller can't bypass verification by calling the API directly.
- Once admin verifies the payment, the seller can begin working the order/subscription normally.
- Money-out is a separate, later step: when a seller marks an order `Completed`, a `seller_payouts` row is created automatically (one per completed order). Admin uploads a payout slip and marks it `paid`; the seller then confirms receipt (`confirmed`) — this is how the seller's payout bank details (already captured in Phase 7.6) get used for the first time.
- This whole flow is scoped as an explicit stand-in for a payment gateway, per the user's "scalable, swap in a gateway later" requirement — don't build gateway-specific code now, just keep the schema/enum gateway-agnostic.

**What gets built:**
- `admin_bank_accounts` table + Admin CRUD UI (add/edit/enable-disable bank accounts shown to customers/sellers at payment time).
- Polymorphic `payments` table (`payable_type`, `payable_id`, `method`, amount, slip upload, verification status) + `POST /api/payments` (customer/seller submits a slip against an order or subscription).
- `PaymentStatus` enum (on `Order`) gains `AwaitingVerification`; a separate `PaymentVerificationStatus` enum (`pending_verification`/`verified`/`rejected`) tracks the `Payment` row itself — intentionally two enums, not one, since an order's payment status and a specific slip's review status aren't the same thing (a rejected slip can be re-submitted without the order's own status regressing). `SellerSubscriptionStatus` gains `Pending`.
- `Customer\CheckoutController` and `Seller\SubscriptionController` stop faking `paid`/`active` — order/subscription created `pending`, becomes real once `Admin\PaymentVerificationController@verify` approves the linked `Payment`. Verification is also where the previous-active-subscription-cancel and Phase 7's excess-listing-hiding logic move to (out of the checkout step, since that logic now only makes sense once payment is confirmed real).
- Server-side enforcement in `Seller\UpdateOrderStatusRequest`: reject any status-transition request while `payment_status != paid`.
- `seller_payouts` table (auto-created on order `Completed`) + Admin UI to upload a payout slip and mark `paid` + Seller UI (Payouts page) to view and confirm receipt.
- Admin Bank Accounts, Payment Verifications, and Seller Payouts pages (Admin); a payment/slip-upload step in Customer checkout and Seller subscription purchase; a Seller Payouts page.

**Agents/skills:** [backend-agent](agents/backend-agent.md) (schema, enums, policies, verification/payout endpoints) → [frontend-agent](agents/frontend-agent.md) (Customer checkout + Seller subscription payment step, Seller Payouts page, Admin Bank Accounts/Payment Verifications/Seller Payouts pages, per [frontend-design-skill](skills/frontend-design-skill.md)'s status-badge convention) → [backend-integration-testing-agent](agents/backend-integration-testing-agent.md) (happy path + the "seller blocked from progressing an unpaid order" failure path specifically).

**Exit criteria:** a customer can place an order, pay by bank transfer, get verified by an admin, and the seller can then progress the order to Completed, at which point a payout appears for the admin to pay out and the seller to confirm — all without a payment gateway. Same slip-upload-then-verify flow works for a seller subscription purchase.

---

## Phase 8.1 — Recurring Subscription Renewal (Monthly Slip Cycle, Grace Period, Cancel-at-Period-End)

**Goal:** turn Phase 8's one-time subscription slip-upload into a recurring monthly cycle: sellers re-submit a slip each period to stay on a paid plan, get a 7-day advance reminder and a 2-day grace period if they miss it, can cancel anytime without losing access until the period they already paid for ends, and get their pre-downgrade listings back (not just "not deleted") when they resubscribe. Confirmed 2026-09-07.

**Builds on:** Phase 8's `payments`/`Payment` verification flow (reused as-is for each month's renewal slip) and Phase 7's `app:expire-seller-subscriptions` daily command and `Seller::hideExcessListings()`.

**Confirmed decisions (2026-09-07):**
- **Renewal, not recurring billing:** no Cashier/auto-charge — the seller submits a new payment slip each period (same `POST /api/payments` against the `SellerSubscription`, same admin verification step) roughly monthly, tracked by `seller_subscriptions.ends_at` (existing column, repurposed as "current period end" / renewal due date) rather than a fixed one-time expiry.
- **7-day advance reminder:** starting 7 days before `ends_at`, the Seller Dashboard shows a "Renew in N days" banner/countdown prompting a new slip upload. Purely informational — no restriction yet.
- **2-day grace period, fully active:** once `ends_at` passes with no new verified payment, the subscription enters a `grace_period` status for 2 days. During grace, the plan/listing-limit/features are **unchanged** — only a persistent warning banner ("Renew within 2 days or your plan will be cancelled") is added; nothing is hidden or blocked.
- **Auto-cancel after grace:** if still unverified after the 2-day grace window, `app:expire-seller-subscriptions` (already runs daily) cancels the subscription and downgrades to Free, reusing the existing `hideExcessListings()` hide-not-delete behavior.
- **Cancel-anytime, active-until-period-end:** a seller can cancel at any point; the subscription immediately gets a new `cancelling` status but keeps its current plan/limit/features until `ends_at` (the date already paid through) — e.g. bought Jan 1, cancels Jan 15, still fully on that plan until Feb 1, then auto-downgrades to Free exactly like a missed renewal. `cancelling` skips the 7-day-reminder/grace-period states (the seller already told the system not to renew).
- **Listing restore on resubscribe:** currently `hideExcessListings()` sets `is_active = false` on excess listings with no way to distinguish "hidden by the system for exceeding a lower limit" from "the seller manually deactivated this listing" — both look identical today. Add a `hidden_for_subscription` boolean (or equivalent marker) on `products`, set only when the system hides a listing for exceeding a limit and cleared either when the seller manually re-activates it or when the seller's limit rises enough (resubscribing, upgrading) to fit it again. On resubscribe/upgrade, re-activate `hidden_for_subscription` listings — oldest-hidden-first — up to the new limit, before the seller needs to touch anything. Listings the seller deactivated themselves are never touched by this.

**What gets built:**
- `seller_subscriptions` gains a `SellerSubscriptionStatus` value or two to express the new states (`grace_period`, `cancelling` — exact naming TBD at implementation time) alongside the existing `active`/`pending`/`expired`.
- `POST /seller/subscription/cancel` (or similar) — sets `cancelling`, does not touch `ends_at` or current features.
- `app:expire-seller-subscriptions` extended: on `ends_at` passing for an `active` subscription, move to `grace_period` (not straight to expired); after grace period's 2 days, expire it (covers both a missed renewal and a `cancelling` subscription reaching its `ends_at`).
- `products.hidden_for_subscription` (or equivalent) + updated `hideExcessListings()` to set it, plus a new `restoreListingsUpToLimit()` (name TBD) called on successful upgrade/renewal verification.
- Seller Dashboard: 7-day countdown banner, grace-period warning banner, "Cancel subscription" action with the "active until [date]" confirmation copy.
- Reuses Phase 8's existing `PaymentSlipForm`/verification UI for each month's renewal — no new slip-upload UI needed, just triggering it again when a renewal is due.

**Agents/skills:** [backend-agent](agents/backend-agent.md) (subscription state machine, scheduled command changes, listing restore logic) → [frontend-agent](agents/frontend-agent.md) (Seller Dashboard renewal/grace/cancel UI, per [frontend-design-skill](skills/frontend-design-skill.md)'s status-color convention) → [backend-integration-testing-agent](agents/backend-integration-testing-agent.md) (renewal-due, grace-period, auto-cancel-after-grace, cancel-then-still-active-until-period-end, and restore-on-resubscribe as distinct test cases).

**Exit criteria:** a seller sees the 7-day reminder, misses it into a 2-day grace period with no restriction, then gets auto-downgraded to Free with excess listings hidden (not deleted) if still unpaid; a seller who cancels mid-period keeps full access until their paid-through date, then downgrades the same way; a seller who resubscribes/upgrades gets their system-hidden listings back automatically, while listings they deactivated themselves stay untouched either way.

---

## Phase 8.2 — Ads Module + Payment-Slip Viewing Fix

**Goal:** let admin run paid, curated image ads on the Customer homepage as an auto-rotating carousel (monetization beyond seller subscriptions), and fix payment/payout slip viewing across Admin/Seller — currently a `target="_blank"` new-tab link — into an in-context modal, with Verify/Decline moved onto that same surface for Payment Verifications. Confirmed 2026-09-07.

**Confirmed decisions (2026-09-07):**
- Admin-only ad entry — no public ad-submission form; outside requests for ad placement are handled off-platform and the admin types the ad in.
- Ad visibility = `status = active` AND today within `[starts_at, ends_at]`, checked live via a query scope — no persisted "expired" flag, no daily scheduled command (unlike `app:expire-seller-subscriptions`), since nothing else needs historical ad-expiry state.
- `ad_settings` is a dedicated single-row table (just `rotation_seconds`) rather than a general-purpose key-value settings system — no such system exists anywhere in the project yet and only one global value is needed.
- Real drag-and-drop for ad priority (`@dnd-kit/core` + `@dnd-kit/sortable`, new dependency) — upgrading from the up/down-arrow pattern Categories/Subscription Plans use, per explicit request.
- `embla-carousel-autoplay` (new dependency, official plugin for the already-installed `embla-carousel-react`) drives the homepage carousel's automatic right-to-left, one-at-a-time, infinite rotation.
- Ads are delivered as `Customer\HomeController` Inertia props (`ads`, `adRotationSeconds`), not a separate REST endpoint — matches how Featured Cakes/Bakers are already loaded on that page.
- For the slip-viewing fix: Verify/Reject move entirely into the new `SlipPreviewDialog` modal for Payment Verifications (row-level buttons removed). Seller Payouts / Seller's own Payouts page get the same modal for viewing only — "mark paid"/"confirm received" stay as-is, since those aren't a verify/reject decision. Customer-side slip viewing (customers currently have none at all) stays out of scope for this fix.

**What gets built:**
- `ads` table (name, description, image_path, link_url, paid_amount, status, starts_at, ends_at, sort_order, created_by) and `ad_settings` (rotation_seconds); `Ad` model with `scopeEligible()`; `Admin\AdController` (CRUD/reorder/uploadImage/updateSetting, mirroring `Admin\CategoryController` exactly) gated by `role:admin` middleware only (no new policy, matching Category's precedent); `AdResource`. `link_url` (nullable, validated as a URL) makes a carousel ad clickable — clicking it opens that URL in a new tab; ads with no URL just aren't clickable.
- `Admin/Ads.tsx` (list/create/edit/delete, image upload, date-range inputs, dnd-kit drag-and-drop priority, an embedded rotation-seconds settings control) + an "Ads" entry in `AdminSidebar`.
- `AdsCarousel` component wrapping the existing shadcn `Carousel` (`resources/js/components/ui/carousel.tsx`) with the Autoplay plugin, placed on `Customer/Home.tsx` immediately after `PageHero`, in the exact slot the photo marquee occupies — mutually exclusive with it (any ads present hides the marquee and shows the carousel instead; no ads shows the marquee). Slightly narrower than the page's other sections (`max-w-4xl`, vs. `Section`'s `max-w-6xl`) and taller (`h-96` at desktop), so it reads as a distinct banner — adjusted twice on 2026-09-07 (first from an initial full-bleed version, then narrower/taller again per explicit request). Preferred ad image size (1200×550px, ~2.2:1) shown as a hint on the Admin Ads page. **Superseded 2026-10-03** — see the "Ads as homepage hero" note below.
- `SlipPreviewDialog` shared component (image render with an iframe fallback for PDF slips) replacing the `target="_blank"` link in `Admin/PaymentVerifications.tsx`, `Admin/SellerPayouts.tsx`, and `Seller/Payouts.tsx`; Verify/Reject relocated into it for Payment Verifications only.


**Ads as homepage hero (2026-10-03, branch `home-hero-ads`).** The separate `AdsCarousel` banner is removed; live ads now *are* the homepage hero (`HeroAdsCarousel`). Each ad is a full-width hero slide: its image is the background (edge to edge, pulled behind the transparent header like `PageHero`, with the default hero photo layered underneath as a fallback for missing/broken images), its name is the centered title and its description the centered subtitle, white copy over a dark scrim. Rotation behaviour is unchanged (infinite, right-to-left, one at a time, `adRotationSeconds` interval) — but the old `direction: 'rtl'` Embla option was dropped: on this LTR page it scrolled the track the wrong way and left the carousel blank after the first rotation with 2+ ads; Embla's default direction is what produces the right-to-left motion. Shop now / Become a seller / Near me stay fixed over the hero while ads slide underneath. `link_url` now shows as a per-slide "Learn more" link (new tab) instead of the whole banner being clickable. With no live ads, the default `PageHero` shows. The cake-photo marquee is no longer mutually exclusive with ads — it always shows below the hero. Admin image-size hint changed to 1920×800px (~2.4:1). No backend/schema changes.
**Agents/skills:** [backend-agent](agents/backend-agent.md) (schema, CRUD, eligibility scope) → [frontend-agent](agents/frontend-agent.md) (Admin Ads page, AdsCarousel, SlipPreviewDialog, per [frontend-design-skill](skills/frontend-design-skill.md)) → [backend-integration-testing-agent](agents/backend-integration-testing-agent.md) + [frontend-unit-testing-agent](agents/frontend-unit-testing-agent.md) (Pest + Vitest coverage, including the ad-eligibility date-boundary cases).

**Exit criteria:** admin creates an ad, drag-reorders its priority, and it appears/disappears on the Customer homepage carousel exactly within its date range and only while `active`; the carousel auto-rotates at the admin-set interval; opening "View slip" anywhere in the system shows a modal (not a new tab), and for Payment Verifications that modal's Approve/Decline actually verifies/rejects the payment.

---

## Phase 9 — Cross-Cutting Testing & Hardening Pass

**Goal:** close test-coverage gaps and do a full HCI/design-checklist pass across all three surfaces before considering the MVP complete.

**What gets done:**
- Full pass of [frontend-design-skill](skills/frontend-design-skill.md)'s HCI checklist on every screen built in Phases 1–8.2 — including the Phase 7.6 sidebar/chart redesign, settings/profile/review/category/filter pages, the Customer restyle (theme toggle, FloatingNav, real imagery), Phase 8's payment/verification/payout screens, and Phase 8.2's Ads admin page/homepage carousel/slip modal, none of which had a dedicated verification pass when built.
- [chrome-ui-testing-agent](agents/chrome-ui-testing-agent.md) run across Customer/Seller/Admin on mobile + desktop breakpoints, **in both light and dark mode** now that the theme toggle is site-wide (not just one Customer palette).
- Gap-fill for [frontend-unit-testing-agent](agents/frontend-unit-testing-agent.md) / [frontend-integration-testing-agent](agents/frontend-integration-testing-agent.md) coverage, including the Phase 7.6 product-search endpoint, product-level reviews, and Phase 8's payment/payout flows.
- Accessibility spot-check (keyboard nav, contrast, screen-reader labels) per the checklist — re-check contrast specifically, since the pink `#EF88AD` primary is new and wasn't checked against WCAG AA in either light or dark mode when introduced.

**Exit criteria:** every screen passes the HCI checklist; test suites green; no known critical bugs from the Chrome UI pass.

---

## Phase 10 — Deployment

**Goal:** ship to a real environment.

**Decided (2026-09-16):** single AWS EC2 instance, Dockerized (`Dockerfile` + `docker-compose.yml` at repo root — app container, queue-worker container, Caddy reverse proxy for automatic HTTPS), database on Supabase (managed Postgres with the `postgis` extension enabled via the Supabase dashboard — Supabase Postgres/PostGIS only, no other Supabase products). Deploys are automated via GitHub Actions (`.github/workflows/deploy.yml`): build & push image to GHCR, then SSH into EC2 to `docker compose pull/up` and run migrations. All production env vars are shipped as a single base64-encoded `.env` GitHub Actions secret (`ENV_FILE_B64`), decoded on the instance during deploy. See [docs/deployment.md](deployment.md) for the full manual setup walkthrough.

**What gets built:**
- Production environment config, Postgres/PostGIS on Supabase, queue worker container (database-driven queue, no Redis), HTTPS via Caddy + Let's Encrypt, GitHub Actions CI/CD.

**Exit criteria:** production deployment reachable, passes a smoke test of the Phase 9 golden paths (Phases 1–8.2's full screen set, verified in Phase 9).

---

## Phase 11 — Public Browsing & Guest Cart

**Status:** implemented on `phase-11-public-browsing-guest-cart` (2026-10-03), awaiting review.

**Goal:** let signed-out visitors browse, search, view stores/products, contact sellers on WhatsApp and build a cart. Google sign-in is only required at checkout, and afterwards they go straight back to checkout with that cart. Requested 2026-10-03. Full plan: [plan-public-browsing-guest-cart.md](plan-public-browsing-guest-cart.md).

**Confirmed decisions (2026-10-03):** guests see Customer Home at `/` (Welcome page retired). Guest cart lives in the session and merges into the account cart at sign-in. On a cross-seller conflict the customer chooses which cart to keep. Only `verified` sellers are publicly visible (storefront, product pages, public search APIs).

**Also confirmed 2026-10-03 (plan file §2):** non-verified sellers' products are rejected on the existing `/api/cart` + `/api/checkout` too. Guest cart is capped at 20 lines. Session lifetime stays at 120 min. Deactivated products' direct URLs return 404.

**What gets built:** `Seller::publiclyVisible()` scope applied to storefront/product pages and public search APIs. Browse routes moved out of `auth`/`role:customer` (same paths and names). `guest.or.role:customer` middleware for `/cart`. Session-backed `GuestCart` + `/api/guest-cart` (same contract as `/api/cart`). `CartMerger` run from the Google callback and the onboarding customer branch. `POST /api/cart/merge`. Customers honor `url.intended` after sign-in. `auth.user.role` shared prop. Header/nav gating, sign-in-to-checkout dialog, cart-merge dialog. No new tables, packages or env vars.

**Agents/skills:** [backend-agent](agents/backend-agent.md) → [frontend-agent](agents/frontend-agent.md) → [backend-integration-testing-agent](agents/backend-integration-testing-agent.md) + [frontend-unit-testing-agent](agents/frontend-unit-testing-agent.md) → [chrome-ui-testing-agent](agents/chrome-ui-testing-agent.md) → [requirements-verification-agent](agents/requirements-verification-agent.md).

**Exit criteria:** guest → browse → cart → checkout → Google → back on `/checkout` with the same cart works end to end. Every pre-existing test passes, with only the fixture updates the visibility decision requires (plan file §7).

---

## Phase 12 — Admin Orders & User Management

**Status:** implemented on `phase-12-admin-orders-users` (branched from `home-hero-ads`, since `main` doesn't have Phase 11 yet) on 2026-10-08, awaiting review.

**Goal:** the admin dashboard's stat cards were plain numbers, and there was no admin page to browse orders or user accounts. Build screens.md A6 (Orders Oversight) and A8 (User Management), and make each stat card link to its list. Requested 2026-10-08.

**Builds on:** requirements.md §3.10 ("User management: view/search/suspend", "Order oversight: view all orders"), §3.8 (suspend sellers).

**Confirmed decisions (2026-10-08):**
- Scope is view plus suspend/reactivate of customer and seller accounts. Order refunds and disputes stay out (the `POST /api/admin/orders/{order}/refund` row in api-endpoints.md is still unbuilt).
- UX: dedicated pages with a searchable, filterable, paginated table; clicking a row opens a side Sheet. Filters live in the URL.
- Users: one `/admin/users` page with Customers / Sellers tabs.
- Suspending a seller's **account** also hides their store: `Seller::publiclyVisible()` now also requires the owning user not to be `suspended`. This is separate from the existing verification-level "Suspend seller" on A3.
- Suspend only goes active → suspended, and reactivate only suspended → active. A user's own `deactivated` status can't be changed by an admin. Admin accounts are never listed.

**What gets built:**
- `Admin\OrderController@index` and `Admin\UserController@index|suspend|reactivate`.
- `AdminUserResource` and `App\Support\PaginationMeta`.
- `Admin/Orders` and `Admin/Users` pages on a shared `AdminDataTable` (shadcn `table` + `pagination`) and a `useListFilters` hook.
- Linked dashboard stat cards; "Orders" and "Users" sidebar entries. Sidebar highlighting now ignores the query string.
- `HomeController`'s featured sellers now use `publiclyVisible()`. No new tables, packages or env vars.

**Exit criteria:** every stat card leads to its list; admins can search, filter and page orders and users and open their details. Suspending a customer locks them out on their next request; suspending a seller also hides their store. Every pre-existing test still passes.

---

## How to use this plan

- Work top-to-bottom; later phases assume earlier ones are exit-criteria-complete, but flag if you want a different order (e.g. Admin verification before Search, if seller onboarding needs to be gated from day one).
- Do not start a phase whose "blocked on" decisions are still open — surface the question instead of assuming an answer (root CLAUDE.md Rule 2).
- Update this file when a phase's scope changes or a decision is made — keep it in sync with reality, not just the plan-time intent.
