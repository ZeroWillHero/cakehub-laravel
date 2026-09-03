# CakeHub — Admin/Seller Sidebar & Chart Redesign Plan

Companion to [plan.md](plan.md), scoped separately per the user's request (2026-09-03). Covers replacing the Admin and Seller panels' current per-page header-link navigation with shadcn's persistent sidebar layout ([ui.shadcn.com/blocks/sidebar](https://ui.shadcn.com/blocks/sidebar)), plus restyling the Phase 7.5 charts to match shadcn's `ChartAreaInteractive` block pattern. This file is a plan only — nothing here is built yet.

---

## 1. Current state

- Every Admin/Seller page (`Admin/Dashboard`, `Admin/VerificationQueue`, `Admin/SellerDetail`, `Admin/Categories`, `Admin/SubscriptionPlans`, `Seller/Dashboard`, `Seller/Listings`, `Seller/ListingForm`, `Seller/Orders`, `Seller/Reviews`, `Seller/StoreProfile`, `Seller/Subscription`) builds its own header row inline (`<h1>` + a handful of `<Link>`s), no shared layout component, no persistent nav, no breadcrumbs.
- Phase 7.5 just added `OrdersLineChart`/`StatusBreakdownChart` as small hand-rolled Recharts wrappers reading raw `var(--chart-N)` tokens directly — not using shadcn's `chart.json` registry component (`ChartContainer`/`ChartConfig`/`ChartTooltip`), which is what the pasted `ChartAreaInteractive` block is built on.
- None of `sidebar`, `breadcrumb`, `separator`, `chart`, `toggle-group` are installed yet (checked `resources/js/components/ui/` — empty for all five); `use-mobile` hook doesn't exist yet either. The `shadcn` CLI is already configured (`components.json`, `base-nova` style) so these install the same way the existing components did.

## 2. Proposed scope

### 2.1 Sidebar shell (Admin + Seller only — Customer portal untouched)
- Install shadcn's `sidebar`, `breadcrumb`, `separator` components (+ `use-mobile` hook, which `Sidebar` depends on for its mobile sheet behavior — this is exactly the "mobile responsiveness" the referenced block already handles: below `md` the sidebar becomes an off-canvas sheet triggered by `SidebarTrigger`, above `md` it's a persistent rail/pinned panel).
- One `AdminSidebar` component (nav: Dashboard, Verification Queue, Categories, Subscription Plans) and one `SellerSidebar` component (nav: Dashboard, Listings, Orders, Reviews, Store Profile, Subscription) — same primitive (`AppSidebar` pattern), different nav items/branding per surface, matching the existing "shared primitives, distinct per surface" design rule.
- One shared layout wrapper per surface (`AdminLayout.tsx`, `SellerLayout.tsx` — mirroring the existing `CustomerLayout.tsx` pattern) wrapping `SidebarProvider` + the sidebar + `SidebarInset` + a header (`SidebarTrigger` + breadcrumb) + page content. Every Admin/Seller page gets wrapped in its surface's layout instead of hand-building its own header.
- `NotificationBell` moves from each page's ad hoc header into the new shared header (once per surface, not per page).
- Breadcrumbs: static per-page ("Admin / Categories", "Seller / Orders"), except `Admin/SellerDetail` which shows "Admin / Verification Queue / {seller name}" since it's reached from that queue.

### 2.2 Chart restyle
- Install shadcn's `chart` registry component (wraps Recharts with `ChartContainer`/`ChartConfig`/`ChartTooltip`/`ChartTooltipContent`, CSS-variable-driven color mapping via `--color-<key>` per series — this supersedes the raw `var(--chart-N)` approach `OrdersLineChart`/`StatusBreakdownChart` use today).
- Restyle the existing orders-over-time chart as an area chart with gradient fill (matching `ChartAreaInteractive`'s `<Area>` + `<linearGradient>` pattern) instead of a plain line.
- Keep the status-breakdown chart as a bar chart (shadcn's chart primitives support both; the pasted reference is area-specific but the same `ChartContainer` wraps either).
- 7d/30d/90d range toggle (`ToggleGroup` on desktop, `Select` below `@[767px]` per the reference block's container-query pattern) added to the orders-over-time chart on both dashboards — see decisions below.

### 2.3 Explicitly not in scope here
- Customer portal — keeps its current `CustomerLayout` + warm bakery theme, no sidebar (its own nav pattern, mobile-first cards, isn't what's being asked to change).
- Re-theming Admin/Seller's color palette — this is a structural/layout change (sidebar shell, chart primitives), not a color-scheme change; both stay on the existing neutral palette per the design skill doc unless you want that revisited too.
- Admin's Seller-detail document viewer, dialogs, forms, etc. — these stay as-is inside the new layout shell; only the outer page chrome (header/nav) changes.

## 3. Decisions (confirmed 2026-09-03)

1. **Date-range toggle: added.** The 7d/30d/90d toggle from the reference block is in scope. Backend: `OrderStats` needs a `days` parameter (7/30/90, validated, default 30) instead of the hard-coded `DAYS = 30` constant; both `Seller\DashboardController` and `Admin\DashboardController` accept a `?range=7|30|90` query param and pass it through. This supersedes Phase 7.5's "fixed 30 days, no range picker" note.
2. **Rollout order: sidebar shell first, then charts.**
3. **Sidebar nav items: confirmed as proposed** — Admin: Dashboard/Verification Queue/Categories/Subscription Plans; Seller: Dashboard/Listings/Orders/Reviews/Store Profile/Subscription.
4. **Breadcrumbs: simple "Surface / Page name"** (e.g. "Admin / Categories", "Seller / Orders"). On `Admin/SellerDetail` specifically: "Admin / Verification Queue / {seller name}", since that page is reached from the queue.

## 4. Sequencing

Runs after Phase 7.5 (already committed) and before Phase 8's hardening pass merges — same reasoning as Phase 7.5: Phase 8's responsive/HCI checklist pass should cover the new sidebar shell rather than needing a second pass. Suggested order once confirmed:
1. Install the five new shadcn pieces (`sidebar`, `breadcrumb`, `separator`, `chart`, `toggle-group`) + `use-mobile` hook.
2. Build `AdminSidebar`/`AdminLayout`, migrate the 5 Admin pages.
3. Build `SellerSidebar`/`SellerLayout`, migrate the 7 Seller pages.
4. Restyle `OrdersLineChart`/`StatusBreakdownChart` (or replace them) using the `chart` registry component.
5. Targeted responsive pass (375/768/1280px) on the new shell specifically — sidebar collapse-to-sheet behavior on mobile is the highest-risk part.

**Exit criteria:** every Admin and Seller page shares one persistent sidebar (collapses to an off-canvas sheet below `md`, exactly like the reference block), a breadcrumb replaces the old ad hoc header links, `NotificationBell` lives once per surface in the shared header, and the dashboard charts use shadcn's `chart` component with the area+gradient style from the reference block.
