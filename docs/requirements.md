# CakeHub — Requirements Document

## 1. Overview

CakeHub is a two-sided e-commerce marketplace that connects **cake buyers (customers)** directly with **cake sellers (bakeries/home bakers)**. Customers discover sellers by cake category and location, then either order online for delivery/pickup or visit the store in person. Sellers manage their own storefront and catalog, subject to admin verification and a subscription-based listing limit. An admin panel oversees seller verification, subscription plans, and platform moderation.

**User roles:** Customer, Seller, Admin (Super Admin / Admin optional).

---

## 2. User-Provided Requirements (source of truth)

1. Customers can search for cake categories and see sellers who sell that category.
2. Customers can search nearby stores by location (location-based search).
3. Customers can log in and order cakes from sellers online, or order in-person at the store.
4. Direct customer–seller interaction (e-commerce marketplace model) — including a direct WhatsApp contact option so customers can chat with sellers outside the platform (for custom requests, negotiation, etc.), in addition to buying items directly through the platform's own checkout.
5. Admin panel to verify sellers.
6. Sellers can purchase a subscription to increase the item/listing limit.
7. Admin can edit subscription plans, or make a plan fully free.
8. Admin can add, remove, and edit subscription packages.
9. Customers, sellers, and admins can each manage their own accounts.

---

## 3. Derived & Supporting Requirements

### 3.1 Authentication & Account Management
- **Google OAuth only** for all roles (Customer, Seller, Admin) — no self-managed email/password auth, no OTP flows. Sign-in delegated entirely to Google; the platform never stores or handles passwords.
- First-time Google sign-in creates the base account; role (customer vs. seller) is selected/assigned at that point, since Google OAuth only supplies identity, not role.
- Separate onboarding flows post-login: Customer (simple — done after Google sign-in), Seller (additional business info + documents required for verification after Google sign-in).
- No forgot-password/reset-password flow needed — account recovery is handled by Google.
- Role-based access control (RBAC) — customer, seller, admin permissions enforced on every route.
- Profile management: name, avatar, contact info, addresses (customers); business name, logo, description, address, operating hours (sellers).
- Account deactivation / deletion (self-service + admin-enforced suspension).
- Session management (JWT/refresh tokens), logout from all devices.

### 3.2 Cake Categories & Catalog
- Admin-managed master list of cake categories (e.g., Birthday, Wedding, Custom, Cupcakes, Vegan, Eggless, Photo Cakes) with optional sub-categories.
- Sellers assign one or more categories/tags to each product.
- Product listing: name, description, images (multiple), category, price, size/weight options, flavor options, customization notes, preparation time, availability status (in stock / made-to-order).
- Listing limit enforced per seller based on active subscription tier.
- Category browsing page showing all sellers offering that category, with filters (rating, price range, distance, delivery availability).

### 3.3 Search & Discovery
- Text search across cake names, categories, and seller names.
- Category-first browse (tap a category → list of sellers/products).
- Location-based search: geolocation (browser/device) or manual address/pincode entry; "near me" radius filter (e.g., 1km/5km/10km/custom).
- Map view of nearby sellers (pins) alongside list view.
- Sort/filter: distance, rating, price, delivery time, open now, category, dietary (eggless/vegan).
- Autocomplete/search suggestions.

### 3.4 Seller Storefront
- Public seller profile page: cover photo, logo, description, categories offered, address/map, ratings & reviews, gallery, delivery/pickup options, operating hours, contact.
- Seller dashboard: manage products (CRUD), manage orders, view sales stats, manage subscription, manage store profile, respond to reviews.
- Inventory/listing limit indicator (e.g., "8/10 listings used — upgrade to add more").
- Store status toggle (open/closed/on vacation).

### 3.5 Ordering & Checkout
- Add to cart, cart persistence, multi-seller cart handling (or single-seller-per-order model — decide early).
- Order types: **Delivery** (online order) vs **In-store pickup / visit-to-order**.
- Checkout: delivery address selection, delivery date/time slot (important for made-to-order cakes — lead time), special instructions/customization (message on cake, size).
- Order summary, price breakdown (item price + delivery fee + tax + discounts).
- Payment integration: card/wallet/UPI/COD; secure payment gateway (e.g., Stripe or regional equivalent).
- Order confirmation (in-app + email/SMS).
- Order status tracking: Placed → Confirmed by seller → Preparing → Ready/Out for delivery → Delivered/Completed → Cancelled.
- Order cancellation & refund policy/workflow (customer-initiated within window, seller-initiated, admin-mediated disputes).
- Order history for customers and sellers.

### 3.6 Reviews & Ratings
- Customers can rate and review sellers/products after order completion (verified-purchase reviews).
- Seller can respond to reviews.
- Average rating displayed on seller profile and search results.
- Report/flag inappropriate reviews (admin moderation).

### 3.7 Notifications & Communication
- In-app notifications: order status updates, new messages, promotions, subscription expiry.
- Email/SMS/push notifications for key events (order placed, confirmed, delivered, payment failed).
- In-app chat or messaging between customer and seller (for custom cake requirements/negotiation) — optional but common in this domain.
- **WhatsApp contact button** on seller/product pages — deep link (`wa.me/<seller-number>`, optionally pre-filled with product/order context) so customers can message the seller directly on WhatsApp. This is an alternative/supplementary channel alongside placing an order through the platform's own checkout (buyers are not required to use WhatsApp to purchase — direct in-platform buying remains the primary flow).
- Seller notified of new orders in real time.

### 3.8 Seller Verification (Admin)
- Seller submits business documents (business registration/ID, food safety certificate if applicable, address proof).
- Admin review queue: approve / reject / request more info.
- Verified badge shown on seller profile.
- Re-verification on major profile changes (optional).
- Ability for admin to suspend/ban a seller for policy violations.

### 3.9 Subscription & Monetization (Sellers)
- Subscription tiers (e.g., Free/Basic/Pro/Premium) each defining a **max active listing count** and possibly other perks (featured placement, lower commission, analytics access).

#### 3.9.1 Proposed Subscription Tiers & Pricing (draft — editable by admin, adjust before launch)

| Tier | Price | Billing | Listing Limit | Perks |
|---|---|---|---|---|
| **Free** | $0 | — | Up to 5 active listings | Basic storefront, standard search placement, reviews & ratings |
| **Basic** | $9/mo (or $90/yr — 2 months free) | Monthly/Annual | Up to 20 active listings | Everything in Free + priority support |
| **Pro** | $19/mo (or $190/yr) | Monthly/Annual | Up to 50 active listings | Everything in Basic + featured placement in category/search results + basic sales analytics |
| **Premium** | $39/mo (or $390/yr) | Monthly/Annual | Unlimited listings | Everything in Pro + top featured placement + advanced analytics + reduced/no platform commission |

Notes:
- These figures are a **starting proposal only** — final pricing depends on target market/currency and should be validated against local competitor pricing before launch. They are seeded as **default/initial data**, not hard-coded values.
- **Plans must be fully dynamic, not hard-coded in application logic.** Tier name, price, billing cycle, listing limit, perks/feature flags, and active/inactive status are all stored as data (DB-driven) and managed entirely through the admin panel:
  - **Add** a new plan (define name, price, billing cycle, listing limit, perks).
  - **Update/edit** an existing plan's price, limits, or perks at any time.
  - **Remove/delete** a plan (existing subscribers on a removed plan should be grandfathered or migrated to another plan, not broken).
  - **Enable/disable** a plan without deleting it (hide from new sign-ups, keep existing subscribers active).
  - Mark any plan as fully free (price = $0).
  - Reorder plans for display (e.g., Free → Basic → Pro → Premium).
- No code deployment should ever be required to change subscription pricing or tiers — this is purely admin-panel/config-driven.
- The **Free** tier should always exist as a fallback so a seller with a lapsed paid subscription is downgraded to Free rather than losing their account entirely.
- Consider an introductory/first-3-months-free promo for new sellers to encourage onboarding (optional, admin-configurable).

- Seller subscription purchase flow with recurring billing (monthly/annual) via payment gateway.
- Subscription status visible to seller (current plan, renewal date, usage vs. limit).
- Auto-downgrade / listing-lock behavior when subscription lapses (e.g., excess listings hidden, not deleted).
- Admin subscription plan management:
  - Create / edit / delete plans.
  - Set plan name, price, billing cycle, listing limit, feature flags.
  - Mark a plan as fully free (price = 0).
  - Enable/disable a plan (hide from new sign-ups without breaking existing subscribers).
- Payment/invoice history for sellers; admin view of all subscription revenue.
- Optional: platform commission per order in addition to/instead of subscription.

### 3.10 Admin Panel (General)
- Dashboard: key metrics (total customers, sellers, orders, revenue, pending verifications).
- User management: view/search/suspend/delete customers and sellers.
- Category management: add/edit/remove/reorder cake categories.
- Seller verification queue (see 3.8).
- Subscription plan management (see 3.9).
- Order oversight: view all orders, handle disputes/refunds.
- Review moderation.
- Content/CMS management: banners, promotions, homepage featured sellers.
- Reports/analytics export.
- Admin roles/permissions (super admin vs. support admin) — optional.

### 3.11 Account Management (All Roles)
- Update profile info, password, notification preferences.
- Manage saved addresses (customers), manage payout/bank details (sellers).
- View activity/order history.
- Delete/deactivate account (with data retention/legal compliance considerations).

### 3.12 Common E-commerce Marketplace Features (cross-cutting)
- Wishlist / favorites (save sellers or cake designs).
- Promotions & discount codes/coupons (platform-wide or seller-specific).
- Multi-image gallery with zoom for cake photos.
- Responsive design (mobile-first — most cake browsing/ordering happens on mobile).
- SEO-friendly seller/category pages.
- Multi-currency/multi-language support (optional, based on target market).
- Legal pages: Terms of Service, Privacy Policy, Refund/Cancellation Policy, Seller Agreement.
- Cookie consent / GDPR-style data handling (if applicable).
- Analytics tracking (page views, conversion funnel) for platform improvement.
- Rate limiting / fraud prevention on orders and reviews.
- Accessibility (WCAG basics) for storefront and checkout.
- Audit logs for admin actions (verification decisions, plan changes).

---

## 4. Open Questions (to clarify before/while building)

- Cart model: can a single order include items from multiple sellers, or is checkout restricted to one seller at a time?
- Delivery logistics: does the platform arrange delivery riders, or is delivery entirely the seller's responsibility?
- Payment flow: does the platform hold funds and payout sellers (marketplace/escrow model), or do sellers collect payment directly?
- Commission model: subscription-only, per-order commission, or both?
- Is in-app messaging required for MVP or can it be deferred?
- Target region(s) — affects payment gateway choice, tax rules, and currency.
- MVP scope vs. full feature set — which sections above are Phase 1 vs. later phases?

---

## 5. Suggested MVP Scope

1. Auth (customer/seller/admin) + profile management.
2. Categories + seller listing per category.
3. Location-based / nearby search.
4. Product catalog with seller-enforced listing limits.
5. Basic checkout (delivery date/time, single-seller cart) + one payment gateway.
6. Order status tracking.
7. WhatsApp contact button on seller/product pages (deep link, no backend chat needed).
8. Admin: seller verification, category management, basic subscription plan CRUD.
9. Seller subscription purchase (one payment gateway, 2–3 tiers).
10. Ratings & reviews.

Everything in section 3.7 (chat), 3.12 (wishlist, coupons, multi-language) can be deferred to Phase 2+.
