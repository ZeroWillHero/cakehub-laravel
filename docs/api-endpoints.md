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
| GET | `/auth/google/callback` | guest | redirect to onboarding or dashboard | C1/C2/S1 |
| GET | `/onboarding` | authed, no role finalized | `Onboarding` | C2/S1 |
| GET | `/` | guest/customer | `Customer/Home` | C3 |
| GET | `/search` | any | `Customer/SearchResults` | C4/C5 |
| GET | `/sellers/{seller:slug}` | any | `Customer/Storefront` | C6 |
| GET | `/sellers/{seller:slug}/products/{product}` | any | `Customer/ProductDetail` | C7 |
| GET | `/cart` | customer | `Customer/Cart` | C8 |
| GET | `/checkout` | customer | `Customer/Checkout` | C9 |
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
| GET | `/admin/orders` | admin | `Admin/Orders` | A6 |
| GET | `/admin/reviews` | admin | `Admin/ReviewModeration` | A7 |
| GET | `/admin/users` | admin | `Admin/UserManagement` | A8 |
| GET | `/admin/bank-accounts` | admin | `Admin/BankAccounts` | A9 |
| GET | `/admin/payment-verifications` | admin | `Admin/PaymentVerifications` | A10 |
| GET | `/admin/seller-payouts` | admin | `Admin/SellerPayouts` | A11 |

## REST API Routes (`api.php`, Sanctum SPA auth)

### Public / Customer-facing

| Method | Path | Controller | Notes |
|---|---|---|---|
| GET | `/api/categories` | `CategoryController@index` | active categories, tree-ordered |
| GET | `/api/sellers/nearby` | `SellerSearchController@nearby` | `?lat&lng&radius_km&category_id` — PostGIS `ST_DWithin` |
| GET | `/api/sellers/search` | `SellerSearchController@search` | text search + filters (rating, price, open now) |
| GET | `/api/sellers/{seller}/products` | `ProductController@bySeller` | for storefront grid AJAX refresh (category filter tabs) |
| POST | `/api/cart/items` | `CartController@store` | add to cart |
| PATCH | `/api/cart/items/{cartItem}` | `CartController@update` | change quantity |
| DELETE | `/api/cart/items/{cartItem}` | `CartController@destroy` | remove |
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
| GET | `/api/admin/orders` | `Admin\OrderController@index` | filterable |
| POST | `/api/admin/orders/{order}/refund` | `Admin\OrderController@refund` | |
| POST | `/api/admin/reviews/{review}/remove` | `Admin\ReviewModerationController@remove` | |
| PATCH | `/api/admin/users/{user}/suspend` | `Admin\UserController@suspend` | |
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
