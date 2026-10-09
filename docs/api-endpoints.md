# CakeHub — Backend Endpoints (Inertia pages + REST API)

Two kinds of backend endpoint in this app — don't conflate them (see [skills/rest-api-skill.md](skills/rest-api-skill.md) for the full convention):

1. **Inertia page routes** (`routes/web.php`) — full-page navigations, return `Inertia::render(...)`, prop shape drives the page components in [screens.md](screens.md).
2. **REST API routes** (`routes/api.php`, Sanctum SPA-authenticated) — AJAX interactions that don't reload the page (cart mutations, search-as-you-type, status toggles) and the foundation for any future mobile client.

Schema reference: [database-design.md](database-design.md). Testing: every endpoint below needs happy-path + failure-path coverage per [skills/backend-testing-skill.md](skills/backend-testing-skill.md).

---

## Inertia Page Routes (`web.php`)

| Method | Path | Role | Renders | Screen |
|---|---|---|---|---|
| GET | `/auth/google/redirect` | guest | — (redirect to Google) | C1 |
| GET | `/auth/google/callback` | guest | redirect to onboarding or dashboard. **Phase 11:** customers merge any guest cart and go to `url.intended` (e.g. `/checkout`), or to `/cart` on a cross-seller conflict. Sellers/admins discard the guest cart and ignore the intended URL. | C1/C2/S1 |
| GET | `/onboarding` | authed, no role finalized | `Onboarding` | C2/S1 |
| GET | `/` | guest/customer (seller/admin → own dashboard) | `Customer/Home` (guests too since Phase 11, `Welcome` retired) | C3 |
| GET | `/search` | any, incl. guest (Phase 11) | `Customer/SearchResults` | C4/C5 |
| GET | `/products` | any, incl. guest (Phase 11) | `Customer/Products` | C4b |
| GET | `/sellers/{seller:slug}` | any, incl. guest (Phase 11); 404 unless seller is `verified` | `Customer/Storefront` | C6 |
| GET | `/sellers/{seller:slug}/products/{product}` | any, incl. guest (Phase 11); 404 unless seller is `verified` | `Customer/ProductDetail` | C7 |
| GET | `/cart` | guest or customer (`guest.or.role:customer`, Phase 11) | `Customer/Cart` (guest: session cart; customer: DB cart + `pendingMerge` when a sign-in merge conflict is pending) | C8 |
| GET | `/checkout` | customer (guest → Google, then back here via `url.intended`; redirects to `/cart` while a sign-in cart choice is pending) | `Customer/Checkout` | C9 |
| GET | `/orders` | customer | `Customer/OrderHistory` | C11 |
| GET | `/orders/{order}` | customer, owner | `Customer/OrderDetail` | C11 |
| GET | `/account` | customer | `Customer/AccountSettings` | C13 |
| GET | `/seller/dashboard` | seller | `Seller/Dashboard` | S2 |
| GET | `/seller/listings` | seller | `Seller/Listings` | S3 |
| GET | `/seller/listings/create` | seller | `Seller/ListingForm` | S4 |
| GET | `/seller/listings/{product}/edit` | seller, owner | `Seller/ListingForm` | S4 |
| GET | `/seller/orders` | seller | `Seller/Orders` | S5/S6 |
| GET | `/seller/profile` | seller | `Seller/StoreProfile` | S7 |
| GET | `/seller/subscription` | seller | `Seller/Subscription` | S8 |
| GET | `/seller/reviews` | seller | `Seller/Reviews` | S9 |
| GET | `/seller/payouts` | seller | `Seller/Payouts` | S10 |
| GET | `/admin/dashboard` | admin | `Admin/Dashboard` | A1 |
| GET | `/admin/sellers/pending` | admin | `Admin/VerificationQueue` | A2 |
| GET | `/admin/sellers/{seller}` | admin | `Admin/SellerDetail` | A3 |
| GET | `/admin/categories` | admin | `Admin/Categories` | A4 |
| GET | `/admin/subscription-plans` | admin | `Admin/SubscriptionPlans` | A5 |
| GET | `/admin/orders` | admin | `Admin/Orders` | A6 — paginated (20), query params `search`, `status`, `payment_status`, `from`, `to`, `customer`, `seller` (Phase 12) |
| GET | `/admin/reviews` | admin | `Admin/ReviewModeration` | A7 |
| GET | `/admin/users` | admin | `Admin/Users` | A8 — paginated (20), `tab=customers\|sellers`, `search`, `status`, `verification` (sellers tab) (Phase 12) |
| GET | `/admin/bank-accounts` | admin | `Admin/BankAccounts` | A9 |
| GET | `/admin/payment-verifications` | admin | `Admin/PaymentVerifications` | A10 |
| GET | `/admin/seller-payouts` | admin | `Admin/SellerPayouts` | A11 |

## REST API Routes (`api.php`, Sanctum SPA auth)

### Public / Customer-facing

| Method | Path | Controller | Notes |
|---|---|---|---|
| GET | `/api/categories` | `CategoryController@index` | active categories, tree-ordered |
| GET | `/api/sellers/nearby` | `SellerSearchController@nearby` | `?lat&lng&radius_km&category_id` — PostGIS `ST_DWithin`; `verified` sellers only (Phase 11) |
| GET | `/api/sellers/search` | `SellerSearchController@search` | text search + filters (rating, price, open now); `verified` sellers only (Phase 11) |
| GET | `/api/sellers/{seller}/products` | `ProductController@bySeller` | for storefront grid AJAX refresh (category filter tabs); 404 for non-`verified` sellers (Phase 11) |
| GET | `/api/products/search` | `ProductSearchController@search` | global product browse/search (C4b) — `?q` (product title or seller business name), `category_id`, `in_stock`, `lat&lng&radius_km` (filters to sellers within radius, adds `distance_km`); `verified` sellers' products only (Phase 11) |
| GET | `/api/cart` | `Customer\CartController@index` | customer's DB cart |
| POST | `/api/cart` | `Customer\CartController@store` | add to cart; 409 `seller_conflict` unless `replace_cart` |
| PUT | `/api/cart/{cartItem}` | `Customer\CartController@update` | change quantity |
| DELETE | `/api/cart/{cartItem}` | `Customer\CartController@destroy` | remove |
| POST | `/api/cart/merge` | `Api\CartMergeController` | **Phase 11.** Customer only. Resolves a pending sign-in merge conflict: `{ keep: 'saved' \| 'incoming' }` → `{ redirect_to: string \| null }` (the stored intended URL, normally `/checkout`). 409 if no merge is pending. |
| GET | `/api/guest-cart` | `Api\GuestCartController@index` | **Phase 11.** Guest only (authenticated → 403, use `/api/cart`). Session-stored cart, same `CartItemResource` shape. |
| POST | `/api/guest-cart` | `Api\GuestCartController@store` | **Phase 11.** Same body and 409 `seller_conflict` / `replace_cart` contract as `POST /api/cart`; rejects non-`verified` sellers' products; `throttle:60,1` |
| PUT | `/api/guest-cart/{id}` | `Api\GuestCartController@update` | **Phase 11.** Change quantity (`id` is a session-local integer) |
| DELETE | `/api/guest-cart/{id}` | `Api\GuestCartController@destroy` | **Phase 11.** Remove a line |
| POST | `/api/checkout` | `CheckoutController@store` | creates the order with `payment_status = pending` — no charge yet; the customer then submits a slip via `POST /api/payments` (Phase 8) |
| POST | `/api/orders/{order}/reviews` | `ReviewController@store` | requires completed + owned order |
| GET | `/api/admin-bank-accounts` | `Api\AdminBankAccountController@index` | public: active bank accounts to pay into (Phase 8) |
| POST | `/api/payments` | `Api\PaymentController@store` | customer or seller submits a bank-transfer slip for an order or subscription; body: `payable_type` (`order`\|`subscription`), `payable_id`, `amount`, `admin_bank_account_id`, `reference` (optional), `slip` (file) — sets the payable to `awaiting_verification`/`pending` (Phase 8) |
| GET | `/api/payments/{payment}` | `Api\PaymentController@show` | streams the slip; submitter or admin only, or the seller/customer who owns the payable (Phase 8) |

### Seller-facing (auth: seller role, `seller.owns` scoping)

| Method | Path | Controller | Notes |
|---|---|---|---|
| POST | `/api/seller/documents` | `SellerDocumentController@store` | upload verification doc |
| GET | `/seller-documents/{document}` | `SellerDocumentController@show` | streams the file; owner seller or admin only (web route, not `/api` — a plain authenticated link/download) |
| GET/POST/PUT/DELETE | `/api/seller/products[/{product}]` | `SellerProductController` | full CRUD, enforces listing-limit check on create |
| PATCH | `/api/seller/orders/{order}/status` | `SellerOrderController@updateStatus` | status transition, validated against allowed next-states; **Phase 8:** rejected while the order's `payment_status !== paid` |
| PUT | `/api/seller/profile` | `SellerProfileController@update` | store profile fields, location pin |
| PATCH | `/api/seller/store-status` | `SellerProfileController@toggleStatus` | open/closed/vacation |
| POST | `/api/seller/subscription/checkout` | `SellerSubscriptionController@checkout` | creates the subscription with `status = pending` — no charge yet; the seller then submits a slip via `POST /api/payments` (Phase 8, supersedes the Phase 0 stub) |
| POST | `/api/seller/reviews/{review}/response` | `SellerReviewController@respond` | one response per review |
| GET | `/api/seller/payouts` | `Api\SellerPayoutController@index` | the seller's own payouts (Phase 8) |
| GET | `/api/seller/payouts/{payout}` | `Api\SellerPayoutController@show` | streams the admin-uploaded payout slip; owning seller or admin only (Phase 8) |
| POST | `/api/seller/payouts/{payout}/confirm` | `Api\SellerPayoutController@confirm` | seller confirms receipt; requires the payout to already be `paid` (Phase 8) |

### Admin-facing (auth: admin role)

| Method | Path | Controller | Notes |
|---|---|---|---|
| POST | `/api/admin/sellers/{seller}/verify` | `Admin\SellerVerificationController@verify` | |
| POST | `/api/admin/sellers/{seller}/reject` | `Admin\SellerVerificationController@reject` | requires `reason` |
| POST | `/api/admin/sellers/{seller}/suspend` | `Admin\SellerVerificationController@suspend` | |
| POST | `/api/admin/sellers/{seller}/request-info` | `Admin\SellerVerificationController@requestInfo` | no status change — just notifies the seller |
| GET/POST/PUT/DELETE | `/api/admin/categories[/{category}]` | `Admin\CategoryController` | |
| PATCH | `/api/admin/categories/reorder` | `Admin\CategoryController@reorder` | bulk sort_order update from `order: number[]` |
| POST/PUT/DELETE | `/api/admin/subscription-plans[/{plan}]` | `Admin\SubscriptionPlanController` | delete requires `migrate_to` if a plan has active subscribers (no separate GET — index is Inertia-delivered, like the other admin list pages) |
| PATCH | `/api/admin/subscription-plans/{plan}/toggle` | `Admin\SubscriptionPlanController@toggleActive` | |
| PATCH | `/api/admin/subscription-plans/reorder` | `Admin\SubscriptionPlanController@reorder` | bulk sort_order update from `order: number[]` |
| POST | `/api/admin/orders/{order}/refund` | `Admin\OrderController@refund` | **not built** — refunds/disputes were left out of Phase 12's scope |
| POST | `/api/admin/reviews/{review}/remove` | `Admin\ReviewModerationController@remove` | |
| PATCH | `/api/admin/users/{user}/suspend` | `Admin\UserController@suspend` | active → suspended; 422 for admins or a non-active account (Phase 12) |
| PATCH | `/api/admin/users/{user}/reactivate` | `Admin\UserController@reactivate` | suspended → active; 422 otherwise, so a user's own `deactivated` status isn't overridden (Phase 12) |
| GET/POST/PUT/DELETE | `/api/admin/bank-accounts[/{bankAccount}]` | `Admin\AdminBankAccountController` | full CRUD (Phase 8); no separate GET — index is Inertia-delivered like the other admin list pages |
| PATCH | `/api/admin/bank-accounts/{bankAccount}/toggle` | `Admin\AdminBankAccountController@toggleActive` | (Phase 8) |
| GET | `/api/admin/payments/pending` | `Admin\PaymentVerificationController@index` | pending-verification payments, payable eager-loaded (Phase 8) |
| POST | `/api/admin/payments/{payment}/verify` | `Admin\PaymentVerificationController@verify` | flips the payable to `paid`/`active` (subscription also gets `starts_at`/`ends_at` per its plan's billing cycle, cancels any other active subscription, and re-applies listing limits) (Phase 8) |
| POST | `/api/admin/payments/{payment}/reject` | `Admin\PaymentVerificationController@reject` | requires `rejection_reason`; leaves the payable's status as-is so the customer/seller can resubmit (Phase 8) |
| GET | `/api/admin/seller-payouts` | `Admin\SellerPayoutController@index` | all payouts, with seller + order eager-loaded (Phase 8) |
| POST | `/api/admin/seller-payouts/{payout}/mark-paid` | `Admin\SellerPayoutController@markPaid` | uploads a slip and marks the payout `paid` (Phase 8) |

## Standard response shape

All REST API responses (success and error) use one envelope — see [skills/rest-api-skill.md](skills/rest-api-skill.md) for the full contract and typed frontend mirrors.

## Open items

- Payment gateway choice (Phase 0) is still deferred — as of Phase 8 (2026-09-06), `POST /api/checkout` and `POST /api/seller/subscription/checkout` no longer fake `paid`/`active`; instead they create the order/subscription `pending` and `POST /api/payments` + `Admin\PaymentVerificationController` handle a manual bank-transfer + slip-upload + admin-verification flow. A real gateway can still be wired in later without a data-model change (`Payment.method` gains a `gateway` value).
- `SellerSearchController@nearby` depends on the maps-provider decision only for the frontend map UI, not the query itself (PostGIS handles that server-side regardless of provider).
