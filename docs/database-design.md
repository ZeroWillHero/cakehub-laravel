# CakeHub — Database Design

PostgreSQL + PostGIS (per [../CLAUDE.md](../CLAUDE.md) §2). This is the planned schema for [plan.md](plan.md) Phases 1–7 — build it incrementally per phase, not all at once. Types referenced here (enums, geography) should back both Eloquent models and the typed API contracts in [skills/rest-api-skill.md](skills/rest-api-skill.md).

## Entity Overview

```
users ──┬── customer_profiles ── addresses (1:N)
         └── sellers ──┬── seller_documents (1:N)
                        ├── products ──┬── product_categories ── categories (N:M)
                        │               ├── product_images (1:N)
                        │               └── product_variants (1:N)
                        ├── seller_subscriptions ── subscription_plans (N:1)
                        └── reviews (1:N, as reviewee)

orders ── order_items ── product_variants (N:1)
orders ── addresses (N:1, delivery address)
orders ── users (N:1, customer)
orders ── sellers (N:1)
reviews ── orders (1:1)
cart_items ── users (N:1) + products/variants (N:1)
```

## Tables

### `users`
Core identity for all three roles (Google OAuth only — see [../CLAUDE.md](../CLAUDE.md) §2).

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| google_id | string, unique | from Socialite |
| name | string | |
| email | string, unique | |
| avatar_url | string, nullable | |
| role | enum('customer','seller','admin') | set at first login (customer/seller) or provisioned directly (admin) |
| status | enum('active','suspended') | admin-enforced |
| created_at / updated_at | timestamp | |

### `customer_profiles`
1:1 with `users` where role = customer.

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| user_id | FK → users, unique | |
| phone | string, nullable | |
| default_address_id | FK → addresses, nullable | |

### `addresses`
Reused for customer saved addresses and order delivery addresses.

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| user_id | FK → users | owner |
| label | string, nullable | "Home", "Work" |
| line1 / line2 | string | |
| city / postal_code | string | |
| location | geography(Point,4326) | GiST-indexed, for distance calc if needed on delivery |
| is_default | boolean | |

### `sellers`
1:1 with `users` where role = seller. The business entity.

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| user_id | FK → users, unique | |
| business_name | string | |
| slug | string, unique | for storefront URL |
| description | text, nullable | |
| logo_path / cover_path | string, nullable | |
| whatsapp_number | string | E.164 format, required for the WhatsApp deep link (requirements.md §2/§3.7) |
| location | geography(Point,4326), GiST-indexed | store location, powers "nearby" search |
| address_line | string | display address text |
| operating_hours | jsonb | per-day open/close |
| store_status | enum('open','closed','vacation') | |
| verification_status | enum('pending','verified','rejected','suspended') | default 'pending' |
| verified_at | timestamp, nullable | |
| verified_by | FK → users (admin), nullable | |
| average_rating | decimal(3,2), default 0 | denormalized, recalculated on new review |

### `seller_documents`
Verification evidence (requirements.md §3.8).

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| seller_id | FK → sellers | |
| type | string | e.g. business_registration, food_safety_cert, address_proof |
| file_path | string | |
| status | enum('pending','approved','rejected') | |
| reviewed_by | FK → users (admin), nullable | |
| reviewed_at | timestamp, nullable | |
| rejection_reason | text, nullable | required when status = rejected |

### `categories`
Admin-managed taxonomy (requirements.md §3.2).

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| name | string | |
| slug | string, unique | |
| parent_id | FK → categories, nullable | optional sub-categories |
| sort_order | integer | admin-controlled display order |
| is_active | boolean | hide without deleting |

### `products`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| seller_id | FK → sellers | |
| name | string | |
| description | text | |
| base_price | decimal(10,2) | |
| preparation_time_hours | integer, nullable | lead time for made-to-order |
| availability_status | enum('in_stock','made_to_order','unavailable') | |
| is_active | boolean | soft "unpublish" without deleting |

### `product_categories` (pivot)
`product_id` FK, `category_id` FK — a product can belong to multiple categories (requirements.md §3.2: "assign one or more categories").

### `product_images`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| product_id | FK → products | |
| path | string | |
| sort_order | integer | |

### `product_variants`
Size/flavor options with price modifiers.

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| product_id | FK → products | |
| name | string | e.g. "1kg — Chocolate" |
| price_modifier | decimal(10,2), default 0 | added to base_price |
| is_default | boolean | |

### `subscription_plans`
Fully dynamic, admin-managed (requirements.md §3.9.1 — **no hard-coded tiers**).

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| name | string | |
| price | decimal(10,2) | 0 = free tier |
| billing_cycle | enum('monthly','annual') | |
| listing_limit | integer, nullable | null = unlimited |
| features | jsonb | perk flags (featured_placement, analytics, etc.) |
| is_active | boolean | hide from new sign-ups without breaking existing subscribers |
| sort_order | integer | |

### `seller_subscriptions`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| seller_id | FK → sellers | |
| subscription_plan_id | FK → subscription_plans | |
| status | enum('pending','active','cancelled','expired') | **Phase 8:** starts `pending` at checkout; flips to `active` (with `starts_at`/`ends_at` set) once its linked `payments` row is verified |
| starts_at / ends_at | timestamp, nullable | null while `pending` |
| external_subscription_id | string, nullable | payment-gateway reference (Cashier) |

### `cart_items`
Single-seller cart (confirmed 2026-09-02, [plan.md](plan.md) Phase 0): a customer has at most one active cart, and every row in it belongs to the same seller. `seller_id` is denormalized here (not derived via the variant→product join) so the "does this new item belong to a different seller?" check is a cheap direct comparison, and so the cart can be queried without joining through products.

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| user_id | FK → users (customer) | |
| seller_id | FK → sellers | denormalized; enforced equal to `product_variant.product.seller_id` at write time |
| product_variant_id | FK → product_variants | |
| quantity | integer | |
| customization_notes | text, nullable | |

Adding a product from a different seller than what's already in the cart **replaces** the cart (with a confirmation prompt in the UI) rather than merging — see [screens.md](screens.md) C8.

### `orders`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| customer_id | FK → users | |
| seller_id | FK → sellers | |
| status | enum('placed','confirmed','preparing','ready','delivered','completed','cancelled') | |
| delivery_type | enum('delivery','pickup') | |
| delivery_address_id | FK → addresses, nullable | null when pickup |
| scheduled_at | timestamp | requested delivery/pickup slot |
| subtotal / delivery_fee / tax / total | decimal(10,2) | |
| payment_status | enum('pending','awaiting_verification','paid','failed','refunded') | **Phase 8:** starts `pending` at checkout; `awaiting_verification` once a slip is submitted (`payments` row created); `paid` once an admin verifies it |
| payment_reference | string, nullable | customer-supplied bank reference (Phase 8) or a future gateway transaction id |
| cancelled_reason | text, nullable | |

### `admin_bank_accounts` (Phase 8)
Admin-managed list of bank accounts customers/sellers pay into. Multiple rows allowed; only `is_active` ones are shown at checkout/subscription time.

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| bank_name | string | |
| account_name | string | |
| account_number | string | |
| branch | string, nullable | |
| is_active | boolean, default true | |
| sort_order | integer, default 0 | |

### `payments` (Phase 8)
Polymorphic "money in" record — reusable for a future payment gateway without a schema change (`method` just gains a `gateway` value).

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| payable_type / payable_id | morphs | `Order` or `SellerSubscription` today |
| method | enum('bank_transfer') | future-proofed for a `gateway` value |
| amount | decimal(10,2) | |
| admin_bank_account_id | FK → admin_bank_accounts, nullable | which account it was paid into |
| slip_path | string | private disk (`local`), gated download — same pattern as `seller_documents.file_path` |
| status | enum('pending_verification','verified','rejected') | the `Payment`'s own status — distinct from `orders.payment_status` |
| submitted_by | FK → users | the customer or seller who submitted it |
| verified_by | FK → users, nullable | admin who verified/rejected it |
| verified_at | timestamp, nullable | |
| rejection_reason | text, nullable | |

### `seller_payouts` (Phase 8)
Money out — one row per completed order, auto-created (status `pending`, no slip) when an order transitions to `Completed`.

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| order_id | FK → orders, unique | one payout per order |
| seller_id | FK → sellers | |
| amount | decimal(10,2) | |
| slip_path | string, nullable | admin-uploaded proof of the bank transfer to the seller |
| status | enum('pending','paid','confirmed') | `confirmed` once the seller acknowledges receipt |
| paid_by | FK → users, nullable | admin who marked it paid |
| paid_at / confirmed_at | timestamp, nullable | |

### `order_items`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| order_id | FK → orders | |
| product_variant_id | FK → product_variants | |
| quantity | integer | |
| unit_price | decimal(10,2) | price at time of order (snapshot, not live product price) |
| customization_notes | text, nullable | |

### `reviews`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| order_id | FK → orders, unique | one review per order (verified-purchase only) |
| customer_id | FK → users | |
| seller_id | FK → sellers | |
| rating | smallint (1–5) | |
| comment | text, nullable | |
| seller_response | text, nullable | |
| is_flagged | boolean, default false | admin moderation |

## Relationships summary

- `users` 1:1 `customer_profiles` (role=customer) / 1:1 `sellers` (role=seller).
- `sellers` 1:N `products`, `seller_documents`, `seller_subscriptions`, `reviews` (as reviewee).
- `products` N:M `categories` via `product_categories`; 1:N `product_images`, `product_variants`.
- `orders` N:1 `users` (customer), N:1 `sellers`, N:1 `addresses`; 1:N `order_items`; 1:1 `reviews`; 1:N `payments` (polymorphic); 1:1 `seller_payouts`.
- `subscription_plans` 1:N `seller_subscriptions`.
- `seller_subscriptions` 1:N `payments` (polymorphic).
- `admin_bank_accounts` 1:N `payments`.
- `sellers` 1:N `seller_payouts`.

## Indexes to plan for

- `sellers.location` — GiST index (PostGIS) for nearby-search performance.
- `addresses.location` — GiST index.
- `products.seller_id`, `product_categories.category_id` — for category browse queries.
- `orders.customer_id`, `orders.seller_id`, `orders.status` — for dashboards/history.
- `sellers.verification_status`, `sellers.store_status` — for search filtering.

## Open items

- Exact `payment_reference`/`external_subscription_id` shape depends on the chosen payment gateway — still open for **subscription billing** (Phase 7). Order checkout payment is confirmed **stubbed** for Phase 4 (no real gateway).
