# CakeHub — Settings, Profile Images, Product Reviews, Categories, Filters & Loading States Plan

Companion to [plan.md](plan.md), scoped separately per the user's requests (2026-09-03, two messages). Covers: dedicated Settings pages for Admin/Seller, user/seller profile images, product-level reviews, seller-submitted categories with search, cross-surface filters, and a consistent spinner/skeleton loading-state system. This file is a plan only — nothing here is built yet.

---

## 1. Current state

### Settings
- No dedicated "Settings" page/nav item exists on any surface. `Seller/StoreProfile` and `Customer/AccountSettings` cover *business*/*address* data, not account-level settings.
- requirements.md §3.11 (Account Management, all roles) specifies **notification preferences**, **payout/bank details (sellers)**, and **delete/deactivate account** — none of these are built. Three notification types exist today (`OrderStatusUpdated`, `SellerVerificationUpdated`, `SubscriptionStatusUpdated`), always sent via both database + mail with no per-user opt-out.
- Admin has no equivalent "Settings" area at all — requirements.md's admin section (§3.10) doesn't specify one beyond "Admin roles/permissions (super admin vs. support admin) — optional."

### Profile images
- `users.avatar_url` already exists and is **already populated automatically from Google on every sign-in** (`GoogleAuthController`) — but it is never displayed anywhere in the UI (not in the sidebar header, not on reviews, not in admin's seller/user lists).
- `sellers.logo_path` / `sellers.cover_path` already exist in the schema and `SellerResource`, but — like the location picker found in the last plan — **no upload UI was ever built** for either. `Storefront.tsx` doesn't render them either.
- No customer-facing avatar upload exists or is requested by requirements.md (it says avatar comes from Google, not a custom upload) — flagged as an open question below.

### Product-level reviews
- requirements.md §3.6 says "rate and review sellers/products" — but Phase 5's actual build (recorded in plan.md/database-design.md) deliberately scoped `reviews` to one row per **order**, targeting the **seller** only (`order_id` unique, `seller_id`, no `product_id`). `products` has no `average_rating` column.
- An order can contain multiple products (`order_items`), each already snapshotting `product_id` (nullable) — so a review naturally needs to attach to one order **item**, not the whole order, if it's going to be product-specific.
- `Customer/ProductDetail` (C7) currently shows no reviews at all; `Seller/Reviews` (S9) and `Storefront` show only the seller-level list/average.

---

## 2. Proposed scope

### 2.1 Settings pages
- New "Settings" nav item added to both `AdminSidebar` and `SellerSidebar` (bottom of the list, below the existing items), routing to `/seller/settings` and `/admin/settings`.
- **Seller Settings:** notification preferences (per-type email on/off — in-app stays always-on since it's the primary channel), payout/bank details (stored fields only — labeled clearly as "for when a real payment gateway is wired up," since the platform never touches order payments per the Phase 0 decision), delete/deactivate account.
- **Admin Settings:** the admin's own notification preferences, and nothing platform-wide beyond that unless you want more — see open question below, since requirements.md doesn't specify admin-level settings beyond the optional roles/permissions line.
- Notification preferences model: a `notification_preferences` jsonb column on `users` (e.g. `{"order_status": {"email": true}, "seller_verification": {"email": true}, "subscription_status": {"email": true}}`), checked by each `Notification` class's `via()` method before including `'mail'`.

### 2.2 Profile images
- **User avatar display:** surface the existing `avatar_url` in `AdminLayout`/`SellerLayout`'s sidebar footer (a small avatar + name block, the standard shadcn sidebar pattern) and anywhere a customer/seller name is shown next to their review (Seller Reviews page, Order Detail).
- **Seller logo/cover upload:** add to `Seller/StoreProfile` — file upload following the exact pattern already used for product images (`SellerProductImageController`) and verification documents, storing to the `public` disk (logos/covers are meant to be publicly visible, unlike verification documents). Display the logo on `Storefront.tsx` and search result cards (replacing the current `ImagePlaceholder`), and the cover photo on the storefront header.
- **Customer avatar:** stays Google-sourced only, displayed read-only on `Customer/AccountSettings` — no custom upload, since requirements.md doesn't ask for one and Google already provides it. Confirm below if you want upload capability anyway.

### 2.3 Product-level reviews
- Add `product_id` (nullable FK to `products`) and `order_item_id` (nullable FK to `order_items`) to `reviews`, alongside the existing `order_id`/`seller_id`. A review becomes: always tied to an order (verified purchase) and a seller (who it's about), optionally also tied to one specific product/order-item within that order.
- Uniqueness changes from "one review per order" to "one review per order **item**" — so a customer who orders two different products in one order can leave two separate product reviews (or still just one seller-level review with no product attached, if that's preferred — see open question).
- `products.average_rating` (decimal, denormalized like `sellers.average_rating`) added and recalculated the same way (`recalculateAverageRating()` pattern already established).
- `Customer/ProductDetail` (C7) gets a reviews section (list + average, same `RatingStars` component); `Customer/OrderDetail`'s "Leave a review" flow needs to let the customer pick which line item they're reviewing (or review the whole order at the seller level, if both stay available).
- Search results / storefront continue showing the **seller's** average rating (already correct per requirements.md — "Average rating displayed on seller profile and search results" says seller, not product); product cards can additionally show the product's own average once it exists.

### 2.4 Seller-submitted categories + category search
- Currently only Admin can create categories (`Admin\CategoryController`); sellers pick from the existing admin-managed list on `Listing — Create/Edit` (S4) with no way to add one.
- Add a `POST /api/seller/categories` endpoint sellers can call from the listing form ("Can't find your category? Add one") — the new category becomes visible platform-wide (used by all sellers, shown in Customer search) once created, same `categories` table, no separate seller-only tier.
- `categories.created_by` (nullable FK to `users`) added so Admin's Category Management page can see who submitted what, in case moderation is wanted later — but **not** gated behind approval by default (see open question below on live-immediately vs. admin-approval).
- Category **search**: added to `Admin/Categories` (client-side filter over the existing small list — categories are a low-cardinality list, no need for server-side search) and to `Customer/SearchResults` (the category chips row gets a search/filter-as-you-type input once the list is seller-extensible and potentially large).

### 2.5 Cross-surface filters
Filtering existing list views that currently show everything with no way to narrow down:
- **Customer:** `SearchResults` already has category/distance/open-now — add price-range and rating-minimum filters (both already have the underlying data: `products.base_price`, `sellers.average_rating`).
- **Seller:** `Orders` (S5/S6) filter by status and date range; `Listings` (S3) filter by category and availability status.
- **Admin:** `VerificationQueue` filter by submitted-date; a filterable version of the orders-oversight/user-management views if/when those are built (they're not yet — see plan.md Phase 6/A6/A8 status). For now, scope to filtering what already exists: `Categories` (search, above) and `SubscriptionPlans` (filter by active/inactive).
- Implementation pattern: query-string-driven filters (like `SearchResults`' `category_id`) so filters are shareable/bookmarkable URLs, validated server-side, applied via Eloquent `when()` clauses — no new frontend state-management library needed.

### 2.6 Loading states: spinners + skeletons
- requirements.md's HCI checklist already mandates this ("Every async action has a visible loading state (skeletons/spinners from shadcn, not blank screens)") but it's inconsistently done today — most async actions just show button text changes ("Saving…", "Uploading…") with no visual spinner, and full-page Inertia navigations show nothing at all mid-flight.
- Add a small `<Spinner>` wrapper (shadcn doesn't ship one directly — build a small `lucide-react` `Loader2` + spin animation component, consistent across all three surfaces) and use it inside buttons during in-flight async actions (replacing/augmenting the current text-only pattern) — this pairs with, not replaces, the existing disabled-while-pending logic.
- Add page-level loading feedback for full Inertia navigations: a slim top progress bar (Inertia ships `@inertiajs/progress`-style behavior via NProgress by default already — confirm it's actually enabled, since the earlier DOM inspection this session found `#nprogress` CSS already present in the page but its visibility wasn't verified) or a route-level skeleton.
- Skeleton loaders (`Skeleton` component, already installed via the sidebar redesign's shadcn add) for the heavier list/table views' initial load: `Seller/Listings`, `Seller/Orders`, `Admin/VerificationQueue`, `Customer/SearchResults` — shown while the Inertia page is loading, not after.

---

## 3. Decisions

**Confirmed 2026-09-03:**
1. Product review cardinality: **supplement**, not replace — a review always still targets the seller (for the seller's average rating) and optionally also names one order-item/product.
2. Customer avatar: **Google-sourced only**, read-only display, no custom upload.
3. Payout/bank details: **build now** — fields stored, functionally inert until a real payment gateway is chosen.
4. Notification preferences: **per-type toggles** (order status / seller verification / subscription status).

5. Admin Settings scope: **minimal** — own account/notification preferences only.
6. Seller-submitted categories: **live immediately**, `created_by` tracked, no approval queue.
7. Filter set: **confirmed as proposed** in §2.5 (Customer: price range + rating minimum; Seller: Orders by status+date, Listings by category+availability; Admin: Categories search, Subscription Plans by active/inactive, Verification Queue by submitted-date).
8. Loading states: **retrofit high-traffic pages now** (checkout, cart, listing form, order status updates, both dashboards) rather than a full sweep of every page.

## 4. Sequencing

This is a large combined scope (six feature areas) — building in this order to keep each step independently testable/mergeable-in-spirit even though it lands as one branch's work:
1. Loading-state primitives first (`<Spinner>`, skeleton patterns) — small, no schema changes, immediately reusable by everything else built after it.
2. Profile images (avatar display, seller logo/cover upload) — no schema changes needed for avatars (column exists), one migration for nothing new here actually (logo_path/cover_path already exist too) — purely a frontend + one small upload-endpoint gap-fill, same shape as the Phase 7.5 location-picker gap.
3. Settings pages (notification preferences, payout fields, account deactivate) — new `notification_preferences` jsonb + payout columns on `users`/`sellers`, new Settings pages wired into both sidebars.
4. Seller-submitted categories + category search + cross-surface filters — grouped together since categories touch both the listing form and search/filter UI.
5. Product-level reviews — last, since it's the largest schema change (new nullable columns on `reviews`, new `products.average_rating`) and benefits from the rest being stable first.

**Exit criteria:** every button-triggered async action shows a spinner; every user's avatar (Google-sourced) and every seller's logo/cover show up wherever their name/storefront appears; Seller and Admin each have a working Settings page matching the confirmed scope; a seller can add a new category from the listing form and it's immediately usable/searchable platform-wide; the confirmed filter set works on each listed surface; a customer can review an individual product from a completed order in addition to (not instead of) reviewing the seller, and the product's average rating shows on its detail page.

## 5. Not in scope here (explicitly)

- Payment/payout **processing** — only the data fields, not a real bank-transfer integration (ties to the still-undecided payment gateway).
- Account deletion's actual data-retention/legal-compliance handling beyond a basic "deactivate" status flip — full GDPR-style export/erasure isn't requested and would need its own scoping pass.
- Review moderation (flagging/removal) — that's already Phase 6 (Admin)'s explicitly deferred `is_flagged` follow-up, unrelated to adding product-level reviews.
