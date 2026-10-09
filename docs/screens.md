# CakeHub — Screen-by-Screen UI Plan

Companion to [plan.md](plan.md) (phase sequencing) and [requirements.md](requirements.md) (scope). Every screen here traces to a requirement — do not add a screen that isn't listed here without updating this doc first (per [../CLAUDE.md](../CLAUDE.md) Rule 1).

Design system and full HCI checklist: [skills/frontend-design-skill.md](skills/frontend-design-skill.md) — apply it to every screen below; this doc lists what's on each screen, not the full checklist again.

Built with: Inertia.js + React + shadcn/ui + Tailwind. Types: every page component's props are typed against the matching backend Inertia response shape (see [skills/rest-api-skill.md](skills/rest-api-skill.md) §Typed Contracts).

---

## Customer Portal

| # | Screen | Purpose | Key elements | HCI focus |
|---|---|---|---|---|
| C1 | **Sign in** | Google OAuth entry point | Since Phase 11 there's no dedicated sign-in page: a "Continue with Google" button in the header, plus the **Sign in to checkout** dialog (C8) for guests. The dialog says the cart is kept and that only name/email/photo come from Google. | Recognition over recall — no form to fill; minimal, single clear action; sign-in asked only when it's needed (checkout) |
| C2 | **Role/Onboarding (first login only)** | Confirm Customer role, collect name/address if not from Google | Simple form, skip-able where possible | Error prevention — inline validation, sensible defaults from Google profile |
| C3 | **Home / Category Grid** | Entry point for category-first browsing. Shown to guests too (Phase 11). | Hero (live ads rotate as hero slides — ad image/name/description; default hero when none), category tiles directly under the hero (photo with the name large, bold and centered over a dark scrim), search bar, "near me" toggle, featured/promoted sellers; "Become a seller" CTAs + subscription plans for guests only (hidden from signed-in customers) | Match real world — categories use cake-industry language, not generic e-commerce terms |
| C4 | **Search / Category Results** | Browse sellers for a category or search term | Seller cards (photo, rating, distance, verified badge), filters (distance, rating, price, open now), list/map toggle | Recognition, not recall — active filters always visible; empty state designed for zero results |
| C4b | **All Products (Shop)** | Browse/search individual products across all sellers, reached via the Home "Shop now" CTA | Product grid cards (image, name, price, seller name, availability badge), filters (search by product title or seller name, category, in-stock only, near me), loading skeleton, empty state | Recognition, not recall — active filters stay visible; distinct from C4 (which browses sellers, not products) |
| C5 | **Nearby Map View** | Location-based discovery | Map with seller pins, radius selector, list synced to map bounds | Visibility of system status — loading state while geolocating/fetching |
| C6 | **Seller Storefront** | View one seller's full profile | Cover/logo, description, address+map, hours, verified badge, rating summary, WhatsApp CTA button, product grid grouped by category | User control — WhatsApp contact is an equally prominent, clearly alternative path to in-platform ordering, never hidden |
| C7 | **Product Detail** | View/customize one product before adding to cart. Public (Phase 11). | Images, price, size/flavor variant selector, customization note field, add-to-cart (guests add to a session cart; disabled for seller/admin accounts with a "Sign in with a customer account to order" label), WhatsApp button for everyone | Error prevention — required customization fields block add-to-cart with inline messaging |
| C8 | **Cart** | Review items before checkout. Works for guests (Phase 11). | Line items, quantity edit, remove, subtotal. Guests: "Proceed to checkout" opens a **Sign in to checkout** dialog whose button is a full-page link to `/checkout` (Google → back to checkout). After sign-in, if the account already had a cart from another seller, a **Which cart do you want to keep?** dialog names both sellers. | User control — easy remove/undo, clear running total |
| C9 | **Checkout** | Place the order | Delivery vs. pickup toggle, address selection, date/time slot picker, order summary, then (Phase 8) a bank-transfer payment step — active bank accounts, reference field, slip upload | Visibility of system status — multi-step indicator (breadcrumb/stepper), disabled submit until valid; order shows "Awaiting payment verification" after slip submission |
| C10 | **Order Confirmation** | Post-purchase confirmation | Order number, summary, next-steps text, link to tracking | Immediate, unambiguous success feedback |
| C11 | **Order Tracking / History** | View current + past orders | Status timeline per order, reorder action, review prompt on completed orders | Recognition — visual status timeline, not just a text label |
| C12 | **Leave a Review** | Rate a completed order | Star rating, comment field, submit | Error prevention — only shown for orders eligible for review (verified purchase, not yet reviewed) |
| C13 | **Account Settings** | Manage profile/addresses | Name/avatar (from Google), saved addresses (add/edit/delete/set default), notification preferences | Consistency — same form patterns as Seller's profile settings |

## Seller Panel

| # | Screen | Purpose | Key elements | HCI focus |
|---|---|---|---|---|
| S1 | **Seller Onboarding** | Collect business info + verification documents after Google sign-in | Business name/description/logo/cover, address (with map pin placement), WhatsApp number, document upload | Visibility of status — clear "pending verification" state after submit, not a dead end |
| S2 | **Seller Dashboard** | At-a-glance overview | Verification status, listing usage (X/limit), subscription status, recent orders summary, basic stats | Recognition — every key constraint (limit, verification, subscription) visible without digging |
| S3 | **Listings — List View** | Manage all products | Table/grid of products with status, quick edit/delete, "Add product" (disabled + explained when at limit) | Error prevention — limit-reached state is explained, not just a disabled button |
| S4 | **Listing — Create/Edit** | Add or edit a product | Name, description, images, categories (multi-select), price, size/flavor variants, availability toggle | Consistency with Customer's Product Detail — same variant model reflected identically on both sides |
| S5 | **Orders — Incoming/Active** | Manage orders in progress | Order list with status, action buttons to advance status (Confirm → Preparing → Ready), customer contact | Visibility of status — real-time new-order indicator; (Phase 8) status controls disabled with an "Awaiting payment verification" badge while `payment_status !== paid` |
| S6 | **Orders — History** | Past/completed orders | Filterable order history, linked reviews | Recognition over recall |
| S7 | **Store Profile Settings** | Edit storefront details | Same fields as S1 minus documents, plus store open/closed/vacation toggle, operating hours | Consistency with S1's form layout |
| S8 | **Subscription Management** | View/change plan | Current plan card, usage vs. limit, available plans comparison, upgrade/downgrade action, billing history, then (Phase 8) a bank-transfer payment step for the new plan | Visibility of status — renewal date and usage always shown, not buried; new plan shows as pending until an admin verifies payment |
| S9 | **Reviews** | View and respond to reviews | Review list with rating, customer comment, response field | Error prevention — one response per review, edit not duplicate |
| S10 | **Payouts** (Phase 8) | Track money owed by the platform | List of payouts per completed order, view admin-uploaded slip, "Confirm received" action | Visibility of status — clear pending/paid/confirmed states |

## Admin Panel

| # | Screen | Purpose | Key elements | HCI focus |
|---|---|---|---|---|
| A1 | **Admin Dashboard** | Platform overview | Key metrics (customers, sellers, orders, revenue, pending verifications); each metric card links to its list (A8 tabs, A6, A2) (Phase 12) | Information-dense but scannable — group by category, not a wall of numbers |
| A2 | **Seller Verification Queue** | Review pending sellers | Queue list, document viewer, approve/reject/request-info actions with required reason on reject | Error prevention — reject requires a reason so the seller gets actionable feedback |
| A3 | **Seller Detail / Management** | View/manage one seller | Full profile, documents, status history, suspend/ban action (confirm dialog) | Destructive-action confirmation (shadcn AlertDialog) |
| A4 | **Category Management** | CRUD cake categories | Table with add/edit/delete/reorder (drag or up/down), active/inactive toggle | Consistency — same table/action pattern as A6 (plans) |
| A5 | **Subscription Plan Management** | CRUD dynamic plans | Table of plans (name, price, billing cycle, listing limit, status), add/edit/delete, mark-free toggle, enable/disable, reorder | Error prevention — deleting a plan with active subscribers prompts a migration choice, not silent breakage |
| A6 | **Orders Oversight** | View all orders, handle disputes | Filterable order list, dispute/refund action. **Built (Phase 12):** searchable/filterable paginated table (status, payment, date range, per-customer/per-seller deep links); row opens a side Sheet with items, totals, delivery details and links to the seller/customer. Dispute/refund action not built yet. | Visibility of status |
| A7 | **Review Moderation** | Handle flagged reviews | Flagged review queue, remove/restore action | Error prevention — confirm before removal |
| A8 | **User Management** | Manage customer/seller accounts | Searchable list, suspend/reactivate action. **Built (Phase 12):** one page with Customers/Sellers tabs, same table + side Sheet pattern as A6; suspend/reactivate behind an AlertDialog. Suspending a seller's account also hides their store from public browse/search/cart. Admin accounts aren't listed. | Consistency with A3's suspend pattern |
| A9 | **Bank Accounts** (Phase 8) | CRUD the accounts customers/sellers pay into | Table with add/edit/delete, active/inactive toggle | Consistency — same table/action pattern as A4/A5 |
| A10 | **Payment Verifications** (Phase 8) | Approve/reject submitted payment slips | Queue of pending payments (payable, amount, submitted-by, slip viewer), verify/reject with required reason on reject | Error prevention — reject requires a reason so the customer/seller gets actionable feedback, same pattern as A2 |
| A11 | **Seller Payouts** (Phase 8) | Pay out sellers for completed orders and track confirmation | Queue of payouts, upload slip + mark paid action, status (pending/paid/confirmed) | Visibility of status — clear pending/paid/confirmed states |

---

## Shared components (build once, reuse across surfaces)

- `<VerifiedBadge>`, `<RatingStars>`, `<StatusBadge>` (order/verification/subscription status — one visual language for "status" everywhere).
- `<ListingUsageIndicator>` (used on S2, S3, S8).
- `<ConfirmDialog>` wrapper around shadcn `AlertDialog` for every destructive action across all three surfaces (C-cart removal doesn't need it; S4/A3/A5/A7 do).
- `<EmptyState>` (designed empty states for C4 zero-results, S3 no-listings-yet, S5 no-orders-yet, A2 empty queue).
- `<AddressMapPicker>` (S7 store location, C13 customer addresses) — see [plan-analytics-and-location.md](plan-analytics-and-location.md); not yet built as of Phase 8.

## Open items this doc surfaces (not yet decided — see [plan.md](plan.md) Phase 0)

- Map/geolocation provider affects C5 and `<AddressMapPicker>` implementation.
- Multi-seller vs. single-seller cart affects C8/C9 layout (a multi-seller cart would need seller-grouped sections).
- Delivery-vs-pickup logistics ownership affects what C9's delivery step actually configures.
