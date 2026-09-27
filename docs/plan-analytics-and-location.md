# CakeHub — Analytics & Location-Picker Plan

Companion to [plan.md](plan.md), scoped separately per the user's request (2026-09-02) rather than folded into the existing phase numbering. Covers two gaps found while auditing the codebase against [screens.md](screens.md)/[requirements.md](requirements.md) ahead of Phase 8's merge: **seller/admin stat graphs**, and **a proper OpenStreetMap location-picker**. This file is a plan only — nothing here is built yet. Once the open decisions below are confirmed, this becomes its own phase (or two) inserted into plan.md.

---

## 1. Current state (what's already there vs. what's missing)

### Stats / graphs
- `screens.md` **S2 (Seller Dashboard)** already specs "recent orders summary, basic stats." Built so far: verification status, listing usage bar, and links only — no order data, no stats, no charts.
- `screens.md` **A1 (Admin Dashboard)** specs "key metrics... grouped by category, not a wall of numbers." Built so far: four flat count cards (customers, sellers, orders, pending verifications) — no trends, no grouping, no charts.
- `requirements.md` §3.9.1 ties analytics to subscription tier: Pro = "basic sales analytics," Premium = "advanced analytics." Free/Basic get none. This was never enforced or built.
- `requirements.md` §3.10 lists "Reports/analytics export" for admin — not built, not yet scoped here (see open items).
- No chart library is installed (`package.json` has none — no Recharts, Chart.js, visx, etc.).

### Location picker
- `screens.md` explicitly specs a shared `<AddressMapPicker>` component for **S1/S7** (seller store location) and **C13** (customer addresses), noting it "depends on Phase 0's maps-provider decision" — which was resolved (OpenStreetMap/Leaflet/Nominatim, confirmed 2026-09-02) but the component itself was never built.
- What exists today: `SellerMap.tsx` — a **read-only, display-only** Leaflet map that plots seller pins for the "nearby" search results view (C5). It has no click-to-place-pin, no geocoding search, and isn't reusable for picking a location.
- **Seller store profile (`StoreProfile.tsx`) has no location UI at all.** The backend (`SellerProfileController`) already accepts `latitude`/`longitude` and stores them as a PostGIS `Point`, but the form never collects them. Every seller location used in testing so far was set directly via factory/tinker, not through the product.
- **Customer addresses (`AccountSettings.tsx`) are plain text fields** (label/line1/line2/city/postal_code) with no map and no geocoding. The backend (`StoreAddressRequest`) already accepts optional `latitude`/`longitude`, but the frontend never sends them.
- Net effect: the "nearby search" feature built in Phase 3 has no real way for a seller to appear in it correctly, and delivery addresses have no coordinates for any future distance/logistics use.

---

## 2. Proposed scope

### 2.1 Stat graphs (Seller + Admin)

**Seller Dashboard (S2) additions:**
- Orders-over-time chart (e.g. last 30 days, daily count) — data already exists (`orders.created_at`, `orders.status`).
- Order status breakdown (placed/confirmed/preparing/ready/delivered/completed/cancelled counts) — small bar or donut.
- Basic revenue-adjacent figure: sum of `orders.total` for completed orders in range (labeled clearly as "order value," not "revenue," since the platform never touches payment — sellers collect directly per the Phase 0 payment decision).
- Recent orders list (last 5–10) — not a chart, but explicitly named in S2's spec and currently missing too.
- Tier-gating per §3.9.1: Free/Basic sellers see counts only (no charts); Pro sees the charts above ("basic sales analytics"); Premium sees the same set for now unless "advanced" is scoped further (see open question below).

**Admin Dashboard (A1) additions:**
- Platform-wide orders-over-time chart.
- New-seller-signups-over-time chart.
- Pending verifications and order-status breakdown as grouped/visual blocks instead of flat numbers, per the screen's own HCI note ("grouped by category, not a wall of numbers").
- CSV export of the dashboard's stats (orders-over-time, new-seller-signups, order-status breakdown) — per §3.10, confirmed in scope (see decisions below). No PDF export in this pass.

**Shared:**
- One small chart component wrapper (line/bar) reused by both dashboards, keeping each surface's own visual theme (per the existing "modern and visually distinct per surface" design rule).

### 2.2 Location picker (`<AddressMapPicker>`)

- One shared component: a Leaflet map + a Nominatim-backed address search box (type → debounced geocode → move pin), plus click-on-map / drag-marker to fine-tune, following screens.md's naming and intended reuse across S1/S7/C13.
- **Seller Store Profile (S7, and the onboarding flow S1 if in scope — see below):** replaces the current no-op location handling with the real picker; submits `latitude`/`longitude` to the existing `SellerProfileController@update` endpoint (already accepts them, unchanged).
- **Customer Account Settings (C13) address form:** adds the picker to the existing add-address form; submits `latitude`/`longitude` to the existing `AddressController@store`/`update` (already accepts them, unchanged).
- No backend schema or endpoint changes needed — this is purely closing a frontend gap against an already-accepting API.
- Respect Nominatim's usage policy: debounce search input (e.g. 500ms+), cap results, set a proper identifying request header/referrer, no bulk/automated geocoding.

---

## 3. Decisions (confirmed 2026-09-02)

1. **Chart library: Recharts.** React-native/composable, plays well with Tailwind and shadcn's styling approach.
2. **Tier-gating: enforced.** Free/Basic sellers see counts only; Pro+ sees the charts. This needs a `Seller` helper (mirroring `listingLimit()`) resolving the seller's plan's analytics perk from `subscription_plans.features` (jsonb) — a `basic_analytics`/`advanced_analytics` flag, admin-editable per plan, not hard-coded.
3. **Location picker scope: Store Profile (S7) only** for now. Seller onboarding (S1) keeps its current flow; the picker can be added there in a later pass.
4. **Time range: fixed 30 days.** No range picker UI or date-range query params for this pass.
5. **Reports/analytics export: included in this plan.** Admin gets a CSV export of the stats shown on their dashboard (orders-over-time, new-seller-signups, order-status breakdown). PDF export is not included — CSV covers the "export for further analysis" need without a PDF-rendering dependency; revisit if a formatted PDF report is specifically needed later.

---

## 4. Sequencing

This runs as its own phase, inserted **before** the existing Phase 8 (Cross-Cutting Testing & Hardening) is merged, since Phase 8's hardening pass should cover these new screens too rather than needing a second pass. Suggested order:
1. Backend: `subscription_plans.features` analytics-perk convention, seller/admin stats endpoints, CSV export endpoint.
2. Frontend: `<AddressMapPicker>` (Store Profile first, since it's the smaller/more contained change), then the dashboard charts.
3. Re-run a targeted HCI/responsive check on just the new screens (not a full Phase 8 repeat) before folding into the existing Phase 8 branch or merging separately.

**Exit criteria:** a seller on the Pro plan sees real order-history charts on their dashboard; a Free-plan seller sees counts only; a new seller can set their store's location by searching an address or dropping a pin, with no manual DB/tinker step; a customer can do the same for a saved address; the admin dashboard shows grouped stats with a working CSV export.

## 5. Not in scope here (explicitly)

- Real payment/revenue analytics — payment is stubbed (Phase 0 decision); "order value" stats use `orders.total`, not real settled revenue.
- Geolocation-based delivery routing/logistics — out of scope per the Phase 0 "seller's own responsibility" delivery decision; the picker only sets a point, it doesn't do routing.
- Multi-language/multi-currency map or chart localization — not requested.
