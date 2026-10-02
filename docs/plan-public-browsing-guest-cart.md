# CakeHub — Public Browsing & Guest Cart Plan

Companion to [plan.md](plan.md) (listed there as **Phase 11**). Requested 2026-10-03. Signed-out visitors can browse, search, view stores and products, contact sellers on WhatsApp, and build a cart without an account. Google sign-in is only required at checkout, and afterwards the visitor goes straight back to checkout with the cart they built.

**Status (2026-10-03):** implemented on branch `phase-11-public-browsing-guest-cart`, awaiting review. Notes from implementation:
- Middleware alias is `guest.or.role` (used as `guest.or.role:customer`).
- One-off notices (dropped guest lines, cleared cart for sellers/admins) use Inertia's built-in `Inertia::flash('notice', …)`, shown by the existing app-wide Toaster via `router.on('flash')` in `app.tsx`. No new shared prop.
- Sellers/admins can now reach the customer header, so the avatar links to `/` for them (which redirects to their dashboard) instead of `/account` (which would 403). The guest account icon in `FloatingNav` is now a full-page link to Google sign-in.
- While a cart choice is pending, `GET /checkout` redirects to `/cart`, so the customer can't skip the choice (D3).
- After sign-in, a customer whose stored intended URL is a `/seller` or `/admin` page goes to `/` instead (it would only 403).
- The guest cart also rejects deactivated products. The existing customer `/api/cart` is unchanged in that respect.
- Guest cart endpoints need the Sanctum stateful session. A request without one (e.g. curl with no Referer) gets a 400.

---

## 1. Confirmed decisions (2026-10-03)

| # | Question | Decision |
|---|---|---|
| D1 | What does a signed-out visitor see at `/`? | The same **Customer Home** customers see (categories, featured sellers, ads, plans). The sign-in-only `Welcome` page is retired. "Continue with Google" stays in the header. |
| D2 | When is a guest asked to sign in? | **At checkout.** Guests get a real cart stored in their **session** (no new table). At sign-in it merges into their account's cart, and they land on `/checkout`. |
| D3 | After sign-in, the account already has a cart from a different seller (orders are single-seller only). | **Ask them.** Neither cart is replaced automatically. The visitor lands on `/cart` with a "which cart do you want to keep?" dialog. |
| D4 | Should unverified or suspended sellers be publicly visible? | **Verified sellers only.** Storefront and product pages return 404 unless `verification_status = verified`, for guests and signed-in users alike. Public search and listing APIs apply the same filter so search never links to a page that 404s. |

"Chat" in the original request means the existing **WhatsApp deep link** ([requirements.md](requirements.md) §3.7). It already works on the storefront and product pages because it's a plain link, so the only change is that those pages become public. In-app chat stays out of scope.

## 2. Follow-up decisions (confirmed 2026-10-03: recommendations in bold approved)

1. **Server-side guard on the existing customer cart/checkout.** Should `POST /api/cart` and `POST /api/checkout` also reject products from non-verified sellers? With D4 a customer can't reach those products through the UI, so this only closes the gap for crafted API calls. **Recommend yes.** It's a 422 on a path no real UI flow takes.
2. **Guest cart size cap.** The session is stored in the `sessions` DB table, so an unbounded cart bloats a row. **Recommend a maximum of 20 lines** (quantity per line is already capped at 99).
3. **Guest cart lifetime.** Uses the session lifetime as-is (`SESSION_LIFETIME=120` minutes idle). **Recommend no change**: a guest who leaves for over 2 hours starts a new cart. A longer-lived cart needs a cookie-keyed table, which is new scope.
4. **Inactive products on the public product page.** Today `/sellers/{slug}/products/{id}` loads any product by ID, including ones the seller deactivated (`is_active = false`). The storefront grid already hides them. Once the page is public, should a deactivated product's direct URL return 404? **Recommend yes.**

## 3. Current state (what blocks guests today)

- `routes/web.php`: `/search`, `/products`, `/sellers/{seller:slug}`, `/sellers/{seller:slug}/products/{product}`, `/cart`, `/checkout` all sit inside `auth` + `account.active` + `role:customer`. A guest is bounced to Google (`Authenticate::redirectUsing` in `AppServiceProvider`). Sellers and admins get a 403.
- `Customer\HomeController@index` renders `Welcome` (sign-in only) for guests.
- Read-only REST APIs are **already public**: `/api/categories`, `/api/sellers/nearby`, `/api/sellers/search`, `/api/sellers/{slug}/products`, `/api/products/search`. None of them filter by verification status.
- Cart is DB-only (`cart_items.user_id`). `/api/cart*` requires `auth:sanctum` + `role:customer`.
- `GoogleAuthController@callback` always sends customers to `home` and ignores any intended URL.
- Docs already say `/search` and the storefront/product pages are open to "any" role ([api-endpoints.md](api-endpoints.md)). This phase brings the code in line with that.
- Frontend: `SiteHeader`/`FloatingNav` show Orders/Cart/Account to everyone. `NotificationBell` always calls `/api/notifications`, which returns 401 for guests. `Cart.tsx`'s "Proceed to checkout" is an Inertia `<Link>`; for a guest that request would follow a redirect to accounts.google.com and fail.

## 4. Target behavior

### 4.1 Route access matrix

| Path | Guest | Customer | Seller / Admin | Role not yet chosen |
|---|---|---|---|---|
| `/` | Customer Home | Customer Home | redirect to own dashboard (unchanged) | redirect to onboarding (unchanged) |
| `/search`, `/products` | ✅ | ✅ | ✅ read-only (was 403) | ✅ |
| `/sellers/{slug}`, `/sellers/{slug}/products/{id}` | ✅ verified sellers only | ✅ verified only | ✅ verified only | ✅ verified only |
| `/cart` | ✅ session cart | ✅ DB cart (unchanged) | 403 (unchanged) | redirect to onboarding |
| `/checkout`, `/orders*`, `/account` | redirect to Google (unchanged) | ✅ (unchanged) | 403 (unchanged) | redirect to onboarding (unchanged) |

Every public route still runs `account.active`, which lets guests through, so a deactivated user with a leftover session is still logged out.

### 4.2 Guest → checkout flow

1. A guest browses, then clicks **Add to cart** on a product page. The item is stored in the session through `POST /api/guest-cart`. The single-seller rule and the "Start a new cart?" dialog work exactly as they do for customers.
2. On `/cart`, a guest who clicks **Proceed to checkout** sees a sign-in dialog. It says the cart will be kept and repeats the "we only receive name, email and photo from Google" text that is moving over from `Welcome`. Its button is a **full-page** `<a href="/checkout">` (not an Inertia `<Link>`).
3. `GET /checkout` → `auth` middleware → `redirect()->guest(...)` stores `url.intended = /checkout` in the session → Google.
4. `GoogleAuthController@callback` logs the user in. `Auth::login` migrates the session ID but keeps its data, so `guest_cart` and `url.intended` survive.
   - **New user (no role)** → `/onboarding` as today. Picking **Customer** runs step 5. Picking **Seller** discards the guest cart and the intended URL, then goes to the seller dashboard as today.
   - **Existing customer** → step 5.
   - **Existing seller/admin** → discard the guest cart and the intended URL. Redirect to their dashboard as today, with a one-time flash: "Seller/admin accounts can't place orders — your guest cart was cleared."
5. **Merge** (`CartMerger`, run once at login):
   - Re-validate each guest line: product still active, seller still verified, variant still belongs to the product. Drop invalid lines and flash "N item(s) were no longer available."
   - Account cart empty, or from the **same** seller → add the guest lines as new `cart_items` rows (same behavior as `CartController@store`), clear the guest cart, then `redirect()->intended(route('home'))`, which lands on **`/checkout`** in this flow.
   - Account cart from a **different** seller → **conflict (D3)**. Keep `guest_cart` in the session, set `cart_merge_pending`, keep `url.intended`, and redirect to `/cart`.
6. **Conflict on `/cart`.** The page receives a `pendingMerge` prop and opens a dialog: "You already had a cart from **{Seller A}**. Keep that one, or use the **{Seller B}** cart you just built?" The choice goes to `POST /api/cart/merge` `{ keep: 'saved' | 'incoming' }`. The server replaces or keeps the cart, clears the pending state, and returns `{ redirect_to }` (the pulled intended URL, or `null`). The client then visits it, which normally means `/checkout`.

Signing in from the header button (no intended URL) runs the same merge and lands on `/`. The cart is carried over either way.

### 4.3 Customer post-login redirect

Customers now honor `url.intended` (`redirect()->intended(route('home'))`) instead of always landing on `/`. A customer whose session expired while on `/orders/12` now returns to `/orders/12` after sign-in. Sellers and admins **ignore** the intended URL and keep their current dashboard redirect, so a stale customer URL can never send them to a 403.

## 5. What gets built

### 5.1 Backend

- **`Seller::scopePubliclyVisible()`**: `verification_status = verified` (suspended is a `VerificationStatus`, so it's excluded too). Also add `Seller::isPubliclyVisible()` for single-model checks.
- **Routes (`web.php`)**: move `/search`, `/products`, `/sellers/{seller:slug}` and `/sellers/{seller:slug}/products/{product}` into a new `Route::middleware('account.active')` group with no `auth`/`role`. Move `/cart` into a group using a new **`guest.or.role:customer`** middleware alias. Paths and route names stay the same.
- **`EnsureGuestOrRole` middleware** (alias `guest.or.role:customer`): guests pass, users without a role go to onboarding, other roles get 403. Mirrors `EnsureUserHasRole` but doesn't 401 guests.
- **`Customer\HomeController`**: render `Customer/Home` for guests with the same props as customers (extract a private `homeProps()`). Delete `resources/js/pages/Welcome.tsx`.
- **`StorefrontController`**: `abort_unless($seller->isPubliclyVisible(), 404)` in `show` and `product`.
- **Public APIs**: add `->publiclyVisible()` to `SellerSearchController@nearby/search`, `ProductSearchController@search` (both the nearby-seller subquery and a `whereHas('seller', …)` on products), and a 404 guard in `ProductController@bySeller`. `HomeController`'s featured sellers already filter `verified`.
- **`App\Services\GuestCart`** (session key `guest_cart`): `items()`, `add()`, `update()`, `remove()`, `clear()`, plus `hydrate()`, which builds **unsaved** `CartItem` models with `product`/`variant`/`seller` relations set. Guest lines go through the existing **`CartItemResource` unchanged**, so the JSON matches the DB cart. Line IDs are a session-local incrementing integer, so the frontend `CartItem.id: number` type doesn't change.
- **`Api\GuestCartController`** (new endpoints, §6): same validation as `AddCartItemRequest`/`UpdateCartItemRequest` (new `AddGuestCartItemRequest` whose `authorize()` allows guests), same `seller_conflict` 409 + `replace_cart` contract, publicly-visible-seller check. Authenticated callers get **403** and must use `/api/cart`. Rate-limit with `throttle:60,1`.
- **`App\Services\CartMerger`**: `merge(User): MergeResult` (`Merged` / `Conflict` / `Nothing`, plus dropped-line count) and `resolve(User, 'saved'|'incoming')`. Called from `GoogleAuthController@callback` (customers) and `OnboardingController@store` (customer branch).
- **`Api\CartMergeController`**: `POST /api/cart/merge` (customer only). Returns 409 if no merge is pending.
- **`CartPageController`**: for guests, render `Customer/Cart` with `GuestCart::hydrate()` items. For customers with `cart_merge_pending`, also pass `pendingMerge: { saved: CartItem[], incoming: CartItem[] }`.
- **`HandleInertiaRequests`**: add `role` to `auth.user` (additive) so the frontend can hide customer-only UI from sellers and admins.

### 5.2 Frontend

- **`SiteHeader` / `FloatingNav`**: Orders and Account show only for `role === 'customer'`. Cart shows for guests and customers. `NotificationBell` renders only when signed in, which also fixes the guest 401.
- **Cart helper** (`resources/js/lib/cart.ts`): `addToCart(payload)` posts to `/api/guest-cart` or `/api/cart` depending on `auth.user`. Same for update and remove. `ProductDetail.tsx` and `Cart.tsx` switch to it. The "Start a new cart?" dialog works unchanged for both endpoints.
- **`ProductDetail.tsx`**: signed in as a seller or admin → the Add to cart button is disabled and reads "Sign in with a customer account to order". WhatsApp stays enabled for everyone.
- **`Cart.tsx`**: for guests, "Proceed to checkout" opens a **`SignInToCheckoutDialog`** (new shared component) whose button is a plain `<a href="/checkout">`. Customers keep the existing `<Link>`. A **`CartMergeDialog`** opens when `pendingMerge` is present.
- **`Customer/Home.tsx`**: works for guests as-is. Check that nothing assumes `auth.user` is set.
- Delete `Pages/Welcome.tsx` and move its copy into `SignInToCheckoutDialog`.

### 5.3 Not changing

- `/checkout`, `/orders*`, `/account`, `/api/checkout`, `/api/cart*` (existing behavior and contract), every seller/admin route, Google-only auth, the onboarding role choice, the single-seller cart rule, `cart_items` schema. No new tables, packages or env vars.

## 6. Endpoint changes

| Method | Path | Change |
|---|---|---|
| GET | `/`, `/search`, `/products`, `/sellers/{slug}`, `/sellers/{slug}/products/{product}` | now public (storefront/product: verified sellers only) |
| GET | `/cart` | now guest-or-customer |
| GET | `/api/guest-cart` | **new**: guest's session cart (`CartItemResource[]`) |
| POST | `/api/guest-cart` | **new**: same body and 409 `seller_conflict` contract as `POST /api/cart` |
| PUT | `/api/guest-cart/{id}` | **new**: change quantity |
| DELETE | `/api/guest-cart/{id}` | **new**: remove a line |
| POST | `/api/cart/merge` | **new**: customer resolves a pending merge conflict, `{ keep: 'saved' \| 'incoming' }` → `{ redirect_to: string \| null }` |
| GET | `/api/sellers/nearby`, `/api/sellers/search`, `/api/products/search`, `/api/sellers/{slug}/products` | now exclude non-verified sellers (same response shape) |

## 7. Breaking-change analysis

| Area | Effect | Breaking? |
|---|---|---|
| Route paths & names | unchanged | No |
| Existing REST contracts (`/api/cart*`, `/api/checkout`, search APIs) | same request and response shapes. New endpoints are additive. | No |
| Inertia shared props | `auth.user.role` added | No (additive) |
| Seller/admin flows | untouched. Browse pages go from 403 to 200 for them (looser, not tighter). | No |
| Guest at `/` | sees Home instead of Welcome | Intended (D1) |
| Customer post-login landing | honors intended URL instead of always `/` | Intended (§4.3) |
| Unverified sellers in storefront/search | now hidden | Intended (D4). Existing tests need fixture updates (below). |
| `RoleAccessTest` "guest → Google on protected route" | still true (`/seller/dashboard`, `/checkout`, `/orders`) | No |

**Test fixtures updated (because of D4 and §2 #1, not regressions):** `SellerFactory` defaults to `VerificationStatus::Pending`, so eight existing test files switched `Seller::factory()` to `Seller::factory()->verified()` wherever a seller must be visible or orderable: `Customer/StorefrontTest`, `Customer/CartApiTest`, `Customer/CheckoutApiTest`, `Customer/ProductReviewApiTest`, `SellerSearchApiTest`, `ProductSearchApiTest`, `NotificationApiTest`, `SettingsApiTest`. No assertion was removed or weakened. Leave the factory default unchanged: other tests (verification queue) depend on `Pending`.

**Rollout safety:** before deploying, check that production sellers who are live today are `verified`. Any seller still `pending` disappears from public pages on deploy, which is intended per D4 but worth checking once:
`select verification_status, count(*) from sellers group by 1;`

## 8. Tests (Pest + Vitest)

Backend (per [skills/backend-testing-skill.md](skills/backend-testing-skill.md), happy + failure paths):
- Guest gets 200 + correct component on `/`, `/search`, `/products`, a verified storefront and its product page, and `/cart`.
- Unverified, rejected and suspended sellers: storefront and product page 404 for guest **and** customer. Excluded from all four public search/listing APIs.
- Seller/admin get 200 on browse pages and 403 on `/cart` (unchanged).
- `/api/guest-cart`: add, list, update, remove. `seller_conflict` 409 and `replace_cart`. Invalid product/variant rejected. Unverified seller's product rejected. Authenticated caller gets 403. Throttle applies.
- Callback merge: empty account cart → merged → redirect `/checkout` when intended. Same seller → appended. Different seller → redirect `/cart` with `pendingMerge` and nothing replaced. Stale lines dropped with a flash. No guest cart → unchanged behavior.
- `POST /api/cart/merge`: `keep=saved` and `keep=incoming` both clear the pending state and return the intended URL. 409 when nothing is pending. Guest gets 401.
- New user: callback → onboarding → **customer** → merged + intended redirect. → **seller** → guest cart and intended URL discarded.
- Seller/admin sign-in with a guest cart → cart cleared, dashboard redirect, intended ignored.
- Existing tests pass with only the `->verified()` fixture swaps listed in §7 (`RoleAccessTest` and the Auth tests are untouched). This is the regression guard for "no breaking changes".

Frontend (Vitest + RTL):
- `SiteHeader`/`FloatingNav` link sets for guest, customer and seller. `NotificationBell` not rendered for guests.
- `ProductDetail` add-to-cart calls the guest endpoint for guests and the customer endpoint for customers. Disabled for a seller.
- `Cart` guest checkout opens `SignInToCheckoutDialog` with a plain anchor to `/checkout`. `CartMergeDialog` posts the choice and follows `redirect_to`.

Then run [chrome-ui-testing-agent](agents/chrome-ui-testing-agent.md) on the end-to-end guest → Google → checkout path (mobile + desktop), and [requirements-verification-agent](agents/requirements-verification-agent.md) against this file.

## 9. Build order

1. Backend visibility (`publiclyVisible` scope, storefront/search filters) + fixture updates. Ship-safe on its own.
2. Route regrouping + `guest.or.role:customer` middleware + guest Home + shared `auth.user.role`.
3. `GuestCart` service + `/api/guest-cart` + guest `/cart` page.
4. `CartMerger` + callback/onboarding changes + intended redirect + `/api/cart/merge`.
5. Frontend: nav and header gating, cart helper, sign-in and merge dialogs, retire `Welcome`.
6. Tests, Chrome UI pass, requirements verification.

Branch: `phase-11-public-browsing-guest-cart` from `main` (root CLAUDE.md §4).

**Exit criteria:** a signed-out visitor can browse, search, open a verified store and product, tap WhatsApp, and build a cart. Clicking checkout sends them through Google and back to `/checkout` with that cart (or to the merge dialog if their account already had a different seller's cart). Every pre-existing Pest and Vitest test passes, with only the D4 fixture updates listed in §7.
