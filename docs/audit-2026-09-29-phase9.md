# Phase 9 — Cross-Cutting Testing & Hardening Pass — Audit Report

**Date:** 2026-09-29
**Branch:** `phase-9-testing-hardening` (uncommitted working-tree changes only — nothing committed, `main` untouched)
**Auditor:** Claude Code, following `docs/agents/chrome-ui-testing-agent.md` and `docs/agents/requirements-verification-agent.md`

## How to read this report — an important limitation up front

**No live browser tool (built-in browser or Chrome extension) was available in this session.** Only `WebFetch` (which explicitly cannot reach `localhost`) was present — no `mcp__Claude_Browser__*` or `mcp__claude-in-chrome__*` tools were loaded or enabled. This means the mandatory deliverable of `chrome-ui-testing-agent.md` — actual rendered screenshots at 375/768/1280px, live light/dark toggling, real keyboard-nav/focus checks, and browser console/network inspection — **could not be performed** in this run.

Per the "never fabricate a pass" rule in both `chrome-ui-testing-agent.md` and this task's own instructions, I did not invent screenshots or visual pass/fail claims. Instead I substituted the strongest available alternative:

- **Authenticated HTTP route sweeps** via `curl` (using the new dev-login route + cookie jars) against every golden-path route for every role, to catch server errors (500s, exceptions), redirect loops, and auth/authorization failures. This *is* real signal — it exercises the actual controllers, policies, and DB queries against the seeded data — but it is not a visual or interactive check.
- **Static code review** of the relevant React page components for the HCI checklist (loading states, error states, aria labels, focus handling) and of the relevant backend code for business-rule correctness (listing limits, payment gates, verification workflow).
- A live reproduction (via `curl`, not a browser) of the two production auth bugs reported mid-audit — see the dedicated section below, which **is** a genuine, reproduced-locally finding, not speculation.

**This is a real limitation, not a shortcut.** Recommend re-running `chrome-ui-testing-agent` in a session where `anthropic-skills:chrome-browser` or the built-in browser tool is actually enabled, using the seed data and dev-login route left in this branch, before Phase 9 is considered visually verified.

---

## Executive summary

- **Automated test suites: all green.** 295/295 Pest tests, 41/41 Vitest tests, `tsc --noEmit` clean — see details below. (Backend suite only passes once pointed at a *working* local Postgres/PostGIS instance — the checked-in `phpunit.xml` config was pointing at a dead/wrong local Postgres in this environment; see "Automated test suite results.")
- **Critical bugs found: 2**, both concerning the two production issues the user reported mid-audit (401s off the REST API layer, and OAuth/redirect scheme corruption behind the Caddy reverse proxy) — root-caused with a real local repro, not guessed. See "Production Auth & 401 Findings."
- **High-priority gaps found: 3** — three Admin screens documented in `docs/screens.md` (A6 Orders Oversight, A7 Review Moderation, A8 User Management) have no corresponding route or page at all; they were apparently never built.
- **No server errors** were observed across any of the ~35 golden-path routes swept for Customer/Seller/Admin against the seeded audit data (all returned 200, no exception traces in the response body).
- **HCI checklist:** static review surfaced real gaps — only 2 of 31 page components show any loading-state pattern (`Skeleton`/`isLoading`/spinner) and only 8 of 31 use any `aria-label` — flagged as Medium findings needing a live-browser confirmation pass.
- **Open questions requiring your decision** are listed at the end — most notably around `SellerSubscriptionStatus` not having a `grace_period` case (the brief asked me to seed one) and the two production bugs' fixes (config-only, but architecture-adjacent, so flagged rather than applied).

---

## Production Auth & 401 Findings (added mid-audit per your request)

### Bug A: REST API (`/api/*`) returns 401 even for a logged-in user — REPRODUCED LOCALLY

**Repro (exact commands, run against this repo's own dev server):**
```bash
# Log in as a seeded customer, get a session cookie
curl -s -o /dev/null -c jar.txt -L "http://127.0.0.1:8080/dev-login/customer"

# Inertia/web page loads fine with that cookie — confirms the session is valid
curl -s -o /dev/null -w "%{http_code}\n" -b jar.txt "http://127.0.0.1:8080/orders"
# -> 200

# But the REST API 401s using the exact same cookie, no Origin/Referer sent
curl -s -o /dev/null -w "%{http_code}\n" -b jar.txt -H "Accept: application/json" \
  "http://127.0.0.1:8080/api/notifications"
# -> 401 {"message":"Unauthenticated."}

# Adding an Origin/Referer that matches a *stateful* domain fixes it:
curl -s -o /dev/null -w "%{http_code}\n" -b jar.txt --resolve localhost:8080:127.0.0.1 \
  -H "Origin: http://localhost:8080" -H "Referer: http://localhost:8080/" \
  "http://localhost:8080/api/notifications"
# -> 200
```

**Root cause:** Sanctum's SPA ("stateful") mode (`Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful`, wired in via `$middleware->statefulApi()` in `bootstrap/app.php`) only treats a request as "from the frontend" (i.e., eligible for cookie/session auth) when the request's **Origin/Referer host exactly matches** an entry in `config/sanctum.php`'s `stateful` list (`SANCTUM_STATEFUL_DOMAINS` env, defaulting to `localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1` plus whatever `Sanctum::currentApplicationUrlWithPort()` derives from `APP_URL`). If the host the browser is actually using doesn't match one of those entries **exactly** (scheme-independent, but host+port must match), Sanctum silently falls back to token-guard auth, finds no Bearer token, and returns 401 — while the same request would succeed as a normal Inertia page load, because Inertia/web routes go through the plain `web` session guard, not through Sanctum's stateful check at all.

This exactly matches the reported symptom: full-page navigation appears to work (user "looks logged in"), but AJAX-only interactions — cart mutations, search-as-you-type, notifications, subscription checkout, the exact endpoints `docs/skills/rest-api-skill.md` routes through `routes/api.php` — 401 "somewhere on the site."

**In production, the likely mismatch is one of:**
1. `SANCTUM_STATEFUL_DOMAINS` in the production `.env` (shipped via the `ENV_FILE_B64` GitHub secret) doesn't exactly list every hostname real users hit the site through (e.g., missing a `www.` variant, or listing the wrong domain/port).
2. Bug B below (Laravel not trusting Caddy's forwarded headers) causing `APP_URL`-derived scheme/host detection to disagree with what the browser's Origin header actually says, which can cascade into stateful-domain mismatches even when `SANCTUM_STATEFUL_DOMAINS` itself is nominally correct.

**Recommended fix (flagging for your confirmation, not applied — this touches production env config):**
- Confirm the exact value of `SANCTUM_STATEFUL_DOMAINS` in the production `.env` (decode `ENV_FILE_B64` and check) and confirm it lists the *exact* host:port combination(s) the app is actually served on (apex domain, and `www.` if that resolves too). `docs/deployment.md` says it should be `your-domain.com` — verify the real deployed value matches the real domain byte-for-byte, no trailing slash, no scheme.
- Fix Bug B first (see below) since it's a plausible contributing cause.

### Bug B: Google OAuth doesn't redirect back to the correct URL in production (Caddy reverse proxy)

**Static finding (config review, not live-reproducible without a real Caddy+EC2 deployment, but very concrete):**

`bootstrap/app.php` registers `$middleware->statefulApi()` and a couple of aliases, but **never calls `$middleware->trustProxies(...)`** — Laravel's `TrustProxies` middleware is not configured at all. Meanwhile:
- `Caddyfile`: `cakehub.lk { reverse_proxy app:80 }` — Caddy terminates TLS on `:443` and forwards **plain HTTP** to the `app` container on the internal Docker network (`docker-compose.yml` only `expose`s port 80 on `app`, doesn't publish it — so Caddy is the only thing that can reach it). Caddy's `reverse_proxy` directive sets `X-Forwarded-Proto: https`, `X-Forwarded-Host`, and `X-Forwarded-For` by default.
- Because Laravel isn't told to trust any proxy, it **ignores those headers** and treats every request as arriving over plain HTTP (since that's literally true for the hop it can see). `Illuminate\Http\Request::isSecure()` returns `false`.
- Nothing in `AppServiceProvider::boot()` calls `URL::forceScheme('https')` either — so absolute URLs generated by `route()`/`redirect()->route(...)` (used throughout `GoogleAuthController::callback()`, `EnsureUserHasRole` redirects to onboarding, etc.) fall back to `$request->getScheme()`, which — per the previous paragraph — resolves to `http://`, not `https://`.

**Concrete failure chain:**
1. Browser completes Google's OAuth handshake over `https://cakehub.lk/auth/google/callback`.
2. `GoogleAuthController::callback()` calls `Auth::login()` then `redirect()->route('home')` / `route('seller.dashboard')` / `route('admin.dashboard')` / `route('onboarding.show')`.
3. Because of the trust-proxy gap, that `Location` header is generated as `http://cakehub.lk/...` instead of `https://cakehub.lk/...`.
4. The browser follows the `http://` redirect. Caddy's automatic-HTTPS listener on port 80 will typically redirect `http`→`https` again (extra round trip, possible loss of context) — or, if any client/proxy in the path doesn't upgrade, the user lands on a plain-HTTP response.
5. Whether or not step 4 recovers, the session cookie is almost certainly configured with `SESSION_SECURE_COOKIE=true` in production (the standard/expected setting for an HTTPS site) — such a cookie **will not be attached by the browser to a plain `http://` request**. So even if the redirect "succeeds," the very next request (loading the destination page, or any subsequent `/api/*` call) may arrive with no session cookie at all, looking logged out — which would also manifest as spurious 401s, tying this directly to Bug A.

**Recommended fix (flagging for your confirmation — this is an architecture-adjacent config change, not applied):**
```php
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustProxies(at: '*'); // safe here: app container is not
        // published to the host, only reachable via Caddy on the same
        // docker-compose network — Caddy is the only possible proxy hop.
    ...
})
```
This is the standard Laravel fix for "app behind a TLS-terminating reverse proxy" and is low-risk given the app container's network topology (not internet-reachable except through Caddy), but I'm flagging rather than applying it per Rule 2, since:
- It's a security-relevant middleware change (trusting `*` is broad, even though safe here).
- An alternative, narrower fix (trusting only the Caddy container's IP/CIDR) is also reasonable and you may prefer it.
- It should be verified against a real Caddy+EC2 deployment (or at minimum a local Docker Compose run of `docker-compose.yml`) before shipping, which I could not do in this sandboxed session (no access to the EC2 host, and running the full `docker-compose.yml` stack locally was out of scope for this pass).

**Both bugs share one root cause category (missing trusted-proxy config) with one compounding factor (stateful-domain list correctness) — fixing Bug B's trust-proxy gap should be done first, then re-verify Bug A's `SANCTUM_STATEFUL_DOMAINS` value against the live domain.**

---

## Per-role findings

### Customer

**Golden-path route sweep (authenticated via `/dev-login/customer`, `/dev-login/customer-cart`, `/dev-login/customer-fresh`):**

| Route | Result |
|---|---|
| `/` | 200 |
| `/account` | 200 |
| `/search` | 200 |
| `/products` | 200 |
| `/cart` | 200 |
| `/checkout` | 200 |
| `/orders` | 200 |
| `/sellers/active-subscription-sweets` (storefront) | 200 |
| `/admin/dashboard/export` (as admin) | 200, correct `Content-Type: text/csv` + `Content-Disposition` |

No exceptions/stack traces in any response body. All customer-facing pages render for a customer with order history, one with an active cart, and one fresh account.

**Code-level checks:**
- WhatsApp deep link (`resources/js/Pages/Customer/Storefront.tsx:19-23,67-73`) builds a proper `https://wa.me/<digits>?text=...` URL with `target="_blank" rel="noopener noreferrer"` — correct and safe.
- Category browse (C3/C4), "near me" (C5, merged into `SearchResults.tsx` as a list/map toggle backed by `SellerMap`), All-Products shop (C4b), storefront, cart, checkout, order tracking, and review submission (merged into `OrderDetail.tsx`, not a separate page — reasonable) all have corresponding page components and routes.
- Checkout payment-step stub (bank transfer + slip upload) exists in `Customer/Checkout.tsx` per Phase 8 scope.

**Not verified (needs live browser):** actual rendering correctness, responsive layout at 375/768/1280px, light/dark mode visuals, keyboard nav, and real console/network errors during interaction (e.g., add-to-cart XHR, search-as-you-type) — the last of these is exactly where Bug A (401s) would surface in the browser console, so this is the most important gap to close with a real browser pass.

### Seller

**Golden-path route sweep (via `/dev-login/seller`, `/dev-login/seller-pending`, `/dev-login/seller-free`, `/dev-login/seller-expired`, `/dev-login/seller-rejected`):**

| Route | Result |
|---|---|
| `/seller/dashboard` | 200 (all seller states, including pending-verification and rejected) |
| `/seller/profile` | 200 |
| `/seller/listings` | 200 |
| `/seller/listings/create` | 200 |
| `/seller/orders` | 200 |
| `/seller/reviews` | 200 |
| `/seller/subscription` | 200 |
| `/seller/settings` | 200 |
| `/seller/payouts` | 200 |

**Code-level verification of the order-status payment gate** (explicitly called out in the brief): `app/Http/Requests/Seller/UpdateOrderStatusRequest.php` correctly blocks progression —
```php
if ($order->payment_status !== \App\Enums\PaymentStatus::Paid) {
    $validator->errors()->add('status', 'This order cannot progress until its payment has been verified.');
}
```
This runs *in addition to* the `OrderStatus::allowedNextStatuses()` state-machine check, so an unpaid order truly cannot be advanced from the backend regardless of what the UI sends — confirmed by reading the code, not by clicking through it live. Also confirmed: completing an order auto-creates a `SellerPayout` (`SellerOrderController::updateStatus`, `Pending` status) — matches S10/A11 scope.

Listing-limit enforcement (`Seller::listingLimit()`/`hideExcessListings()`) reads from the seeded `subscription_plans` table, not hardcoded — matches the "fully dynamic" requirement.

**Not verified (needs live browser):** actually hitting the listing limit in the UI and seeing the disabled+explained "Add product" state (S3's specific HCI requirement), subscription purchase + slip upload flow end-to-end, and all responsive/dark-mode/console checks.

### Admin

**Golden-path route sweep (via `/dev-login/admin`):**

| Route | Result |
|---|---|
| `/admin/dashboard` | 200 |
| `/admin/dashboard/export` | 200, valid CSV |
| `/admin/sellers/pending` | 200 |
| `/admin/categories` | 200 |
| `/admin/subscription-plans` | 200 |
| `/admin/settings` | 200 |
| `/admin/bank-accounts` | 200 |
| `/admin/payment-verifications` | 200 (queue has real pending items from the seed data — 2 `pending_verification` payments: one order, one subscription) |
| `/admin/seller-payouts` | 200 (1 `pending`, 1 `confirmed` payout seeded) |
| `/admin/ads` | 200 |

All render without server errors against the seeded verification/payment/payout queues.

**Not verified (needs live browser):** approve/reject interactions, category/plan CRUD forms, bank account CRUD, ads carousel appearing correctly on the homepage, and all responsive/dark-mode/console checks.

---

## Requirements cross-check (`docs/screens.md` vs. actual routes/pages)

Comparing every screen ID in `docs/screens.md` against `routes/web.php` and `resources/js/Pages/`:

**Present and traceable:** C1–C13, S1–S10 all have a matching route + page component (C5's map view is merged into `SearchResults.tsx`'s list/map toggle rather than a separate route — reasonable, not a gap; C10/C12 are merged into `OrderDetail.tsx` rather than separate pages — also reasonable). A1, A2 (`VerificationQueue.tsx`), A3 (`SellerDetail.tsx`), A4, A5, A9, A10, A11 all present.

**Missing — documented in screens.md but no route or page exists at all:**
- **A6 — Orders Oversight** (filterable all-orders list, dispute/refund action). No `/admin/orders*` route in `routes/web.php`'s admin group, no `Admin/Orders.tsx` page.
- **A7 — Review Moderation** (flagged review queue, remove/restore). No route, no page. `Review.is_flagged` exists in the schema and is set on the model, but nothing in the admin surface reads or acts on it.
- **A8 — User Management** (searchable customer/seller list, suspend/reactivate). No route, no page. `UserStatus::Suspended` exists in the enum and `EnsureAccountIsActive` middleware enforces it, but there is no admin UI to actually set a user to `suspended` — the enum case appears to be unreachable from any UI.

These are exit-criteria items for earlier phases (Phase 6, per the Admin Panel scope) that Phase 9's brief didn't ask me to build — flagging per the requirements-verification-agent's spirit rather than building them, since building three new admin screens is well beyond "testing and hardening" scope (Rule 1).

**Built but not in screens.md:** the Ads module (`Admin/Ads.tsx`, `AdSetting`, homepage carousel) — this is fine, it's documented in `docs/plan.md`'s Phase 8.2 entry, just not back-filled into `screens.md`'s table. Minor doc-sync gap, not scope creep.

---

## Automated test suite results

| Suite | Result | Notes |
|---|---|---|
| Pest (`php artisan test`) | **295/295 passing**, 953 assertions | See environment note below — required pointing the test DB at a *working* Postgres/PostGIS instance. |
| Vitest (`npm run test`) | **41/41 passing** (8 test files) | Clean run, no changes needed. |
| `tsc --noEmit` | **Clean**, zero errors | |

**Environment note (not a code bug, but worth recording):** in this sandbox, `phpunit.xml`'s hardcoded test-DB target (`127.0.0.1:5432`, `cakehub_test`) pointed at a completely unrelated local Postgres container (`pcs-postgres-1`, belonging to a different project on this machine, per `docs/plan.md`'s port-collision note about port 8000) that doesn't support the SSL mode being requested, so every Pest test failed at the DB-connection step. This is an artifact of running in a fresh sandbox without the project's own documented `cakehub-postgres` local container (Phase 0 decision) actually running — not a regression in the app. I stood up a temporary `postgis/postgis:15-3.4` Docker container on port 5434 for this session, ran the suite against it, confirmed 295/295 green, then **reverted `phpunit.xml` back to its original committed state** (`git checkout -- phpunit.xml` — verified clean, no diff left). No repo files were changed by this troubleshooting step. If your normal dev machine already runs the documented `cakehub-postgres` container on port 5432, you won't see this locally at all.

---

## HCI checklist — static findings (needs live-browser confirmation)

Per `docs/skills/frontend-design-skill.md`'s checklist, a code-level scan (not a rendered check) of all 31 files under `resources/js/Pages/` found:

- **Loading states:** only 2 of 31 page components reference any loading-state pattern (`Skeleton`, `isLoading`, `Loader2`, `animate-spin`). `screens.md` explicitly calls for a loading skeleton on C4b (All Products) and a geolocating/fetching indicator on C5 — worth a live check on those two specifically, and likely worth adding to more pages (checkout submit, admin CRUD saves) if a live pass confirms the gap.
- **Accessibility labels:** only 8 of 31 page components use any `aria-label`. Given the brief's specific call-out to re-check the new pink `#EF88AD` primary's contrast in both themes and general keyboard/screen-reader coverage, this ratio suggests the accessibility pass in Phase 9's brief has not actually been done yet and should be a live-browser + axe-style check, not skipped.
- Onboarding's role toggle does use `aria-pressed` correctly (`resources/js/Pages/Onboarding.tsx:45,56`) — so the pattern exists in the codebase, just isn't applied everywhere.

I did **not** attempt to judge color contrast, focus-ring visibility, or dark-mode correctness from source alone — those need to be seen rendered, and guessing would violate the "never fabricate a pass" rule just as much as guessing a pass would.

---

## Prioritized bug list

### Critical
1. **Sanctum SPA 401s on `/api/*` routes** — reproduced locally; root cause is stateful-domain host matching (see "Production Auth & 401 Findings" → Bug A). Repro steps included above. Blocks cart mutations, search-as-you-type, notifications, subscription checkout — every REST-layer interaction — for any user whose actual host doesn't exactly match `SANCTUM_STATEFUL_DOMAINS`.
2. **OAuth callback redirects generate `http://` URLs behind Caddy in production** — root cause is the missing `trustProxies` configuration in `bootstrap/app.php` (see Bug B). Directly explains "fails to redirect back to the correct site URL" and plausibly compounds Bug A via dropped Secure cookies.

### High
3. **Three Admin screens from `docs/screens.md` were never built:** A6 Orders Oversight, A7 Review Moderation, A8 User Management. `UserStatus::Suspended` and `Review.is_flagged` exist in the schema with no UI to act on either.

### Medium
4. **Loading-state coverage is thin:** only 2/31 page components show any loading-state pattern; `screens.md` explicitly specs a loading skeleton (C4b) and a geolocating indicator (C5) that should be live-checked.
5. **Accessibility (`aria-label`) coverage is thin:** only 8/31 page components use `aria-label` at all; Phase 9's brief specifically calls for a re-check here (new primary color contrast, keyboard/screen-reader coverage) that hasn't happened yet.
6. **`docs/screens.md` doesn't document the Ads module** (`Admin/Ads.tsx`, `AdSetting`, homepage carousel) even though it's built and covered in `plan.md` — a doc-sync gap per CLAUDE.md §5 ("keep requirements doc in sync with decisions").

### Low
7. **This sandbox's `phpunit.xml` test-DB target collided with an unrelated local project's Postgres** (see Automated test suite results) — not a code bug, but worth confirming your own dev machine's `cakehub-postgres` container is what's actually running when `php artisan test` is used day-to-day, since a silent wrong-DB connection failure could otherwise look like "the whole suite is broken."

### Not yet verified at all (blocked on live browser tool)
8. Every responsiveness (375/768/1280px), light/dark mode, keyboard-nav, focus-state, and browser-console/network check called for in the brief — see the limitation note at the top of this report.

---

## Open questions for you (per CLAUDE.md Rule 2 — not silently resolved)

1. **`SellerSubscriptionStatus` has no `grace_period` case** (`app/Enums/SellerSubscriptionStatus.php` only has `Pending`/`Active`/`Cancelled`/`Expired`). Your brief asked me to seed a seller "with subscription in grace_period/expired if those states exist in code." Since `grace_period` doesn't exist, I seeded the `Expired` state only (`audit.seller.expired@cakehub.test`) and did not invent a new enum case — adding one would be a schema/business-logic change beyond this audit's scope. Let me know if a grace-period state was actually intended to exist and got dropped somewhere, or if `Expired` is the correct/only lapsed state.
2. **Fix for Bug B (`trustProxies`)** — I've flagged `$middleware->trustProxies(at: '*')` as the standard fix given the app container isn't host-exposed (only reachable via Caddy), but this is a security-relevant middleware change; please confirm you want `at: '*'` (simplest, safe given the network topology) vs. pinning to Caddy's specific container IP/CIDR before I (or you) apply it.
3. **Fix for Bug A (`SANCTUM_STATEFUL_DOMAINS`)** — I don't have access to the production `.env` (it only exists as the `ENV_FILE_B64` GitHub secret) to check its current value. Please decode and confirm it lists the exact production host(s) byte-for-byte; I can't verify this further from within this sandbox.
4. **The three missing Admin screens (A6/A7/A8)** — these are `screens.md`-documented but unbuilt. Are they intentionally deferred to a later phase (and `screens.md`/`plan.md` should say so explicitly), or were they meant to have shipped already and got missed? I did not build them — that would be new scope for a "testing and hardening" pass.
5. **Live browser verification is still outstanding** — recommend re-running this audit (or specifically `chrome-ui-testing-agent`) in a session with `anthropic-skills:chrome-browser` or the built-in browser tool actually enabled. The dev-login route, seed data, and running dev servers (`php artisan serve --port=8080` + `npm run dev`) from this session can be reused directly.

---

## What's left in the working tree (uncommitted, for your review)

- `database/seeders/AuditTestDataSeeder.php` — new, not wired into `DatabaseSeeder`. Run via `php artisan db:seed --class=AuditTestDataSeeder`.
- `app/Http/Controllers/Auth/DevLoginController.php` — new, temporary, hard-guarded to `app()->environment('local')`.
- `routes/web.php` — added the `/dev-login/{slug}` route, itself wrapped in an `if (app()->environment('local'))` guard.
- This report: `docs/audit-2026-09-29-phase9.md`.
- No other files were modified. `phpunit.xml` was temporarily edited for local test-DB troubleshooting and reverted (`git status` shows it clean). Nothing was committed; `main` was not touched.
