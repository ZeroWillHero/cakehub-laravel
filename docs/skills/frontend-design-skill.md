---
name: frontend-design-skill
description: Design system and visual/interaction guidelines for CakeHub's three UI surfaces (Customer portal, Seller panel, Admin panel), built on shadcn/ui, following HCI best practices.
---

# Frontend Design Skill

Used by [frontend-agent](../agents/frontend-agent.md) (and checked by [chrome-ui-testing-agent](../agents/chrome-ui-testing-agent.md)) for every screen built in CakeHub.

## Foundation
- **Component library:** shadcn/ui, `base-nova` style (Base UI primitives, not Radix — corrected 2026-09-01 after actual install) + Tailwind, installed via the shadcn CLI into `resources/js/components/ui` (lowercase — see [frontend-agent](../agents/frontend-agent.md)'s case-sensitivity note). Extend/compose shadcn primitives; don't fork or reimplement them. Note: this style's `Button` has no `asChild` prop — for a link styled as a button, apply `buttonVariants({...})` via `cn()` to an `<a>` directly instead (see `Welcome.tsx`).
- **Styling:** Tailwind CSS utility classes; shared design tokens (color, spacing, radius, type scale) defined once (Tailwind config + CSS variables per shadcn's theming convention) and reused across all three surfaces — no surface should hand-roll its own token set.
- **Typography:** one primary typeface for UI text, a clear type scale (e.g. display/h1/h2/h3/body/caption), consistent line-height/weight usage — avoid ad hoc font sizes.
- **Icons:** one icon set only (e.g. lucide-react, shadcn's default pairing) — no mixing icon libraries.

## Look per surface (superseded 2026-09-05 by Phase 7.6 — see [plan.md](../plan.md))
The three-distinct-palette design that used to live under this heading (a separate Customer bakery theme vs. a Seller/Admin neutral theme) **is no longer what's built.** Phase 7.6 replaced it with **one shared palette across all three surfaces**, plus a site-wide light/dark toggle. Surfaces are now differentiated by layout, not color:
- **Customer portal** — shared palette (see Global theme below), header/hero layout with `FloatingNav` (a bottom pill nav that swaps in on scroll: Home/Search/Cart/Orders/Profile), real photography (Pexels images, replacing the old `ImagePlaceholder` blocks — see Imagery below), card-based browsing, prominent search/filter, mobile-first (most browsing happens on phones per [docs/requirements.md](../requirements.md) §3.12).
- **Seller panel** — shared palette, persistent shadcn sidebar shell (Dashboard/Listings/Orders/Reviews/Store Profile/Subscription), "Surface / Page" breadcrumbs, `ChartAreaInteractive`-style dashboard charts with a 7d/30d/90d range toggle. Utilitarian but polished: clear data tables/lists, status badges, forms optimized for frequent repeat use.
- **Admin panel** — shared palette, same sidebar-shell pattern as Seller (Dashboard/Verification Queue/Categories/Subscription Plans), breadcrumbs (seller name shown on SellerDetail specifically). Dense, information-forward, dashboard/table-heavy, clear bulk actions and filters.

If a future request asks to differentiate Customer visually again (e.g. reintroduce a distinct brand palette), treat that as a new design decision to confirm per CLAUDE.md Rule 2 — don't silently partially-revert to the bakery theme.

### Global theme (shared across Customer/Seller/Admin)
Defined as the plain `:root`/`.dark` token set in `resources/css/app.css` — no per-surface CSS class override anymore (the old `.customer-theme` class was removed in Phase 7.6). Never hand-roll a surface-specific palette on top of this.

- **Background:** white (`oklch(1 0 0)`) light / near-black (`oklch(0.141 0.005 285.823)`) dark.
- **Card/surface:** white light / dark gray (`oklch(0.21 0.006 285.885)`) dark.
- **Primary (CTA):** pink/rose (`#EF88AD`) — same hex in both light and dark mode, foreground kept dark (`oklch(0.141 0.005 285.823)`) in both. This is the one brand accent for the whole app now; don't introduce a second brand color per surface.
- **Secondary/muted/accent:** light gray (`oklch(0.967 0.001 286.375)`) light / dark gray (`oklch(0.274 0.006 286.033)`) dark.
- **Destructive:** red (`oklch(0.577 0.245 27.325)` light / `oklch(0.704 0.191 22.216)` dark).
- **Charts:** a dedicated 5-step pink ramp (`--chart-1` through `--chart-5`, `#F8C1D6` → `#9C3A5C`) used by Recharts on Seller/Admin dashboards — same values in light and dark mode. (Fixed 2026-09-03: Recharts' own default `--chart-1` was too low-contrast against this palette to read as a line/bar color; don't revert to a library default without checking contrast.)
- **Radius:** `0.625rem`, uniform across all three surfaces (the old Customer-specific `1rem` softer radius no longer exists).
- **Typography:** the old Customer-only Playfair Display heading font is gone — `--font-sans` (`Inter Variable`) is used for both body and headings everywhere now, including Customer. Don't add a serif heading font back without confirming it's wanted.
- **Light/dark toggle:** `ThemeToggle` (`resources/js/components/shared/ThemeToggle.tsx`) toggles the `.dark` class, persisted to `localStorage` (`cakehub-theme` key, see `resources/js/lib/theme.ts`) and applied pre-paint in `app.blade.php` to avoid a flash-of-wrong-theme. It's available site-wide (not Customer-only) — when adding a new page/surface, make sure it inherits the toggle rather than assuming light mode only, and check contrast for new colors in **both** modes.

### Imagery
Real photography (Pexels stock images, added Phase 7.6) is now used on the Customer home/gallery. `resources/js/components/shared/ImagePlaceholder.tsx` still exists and should still be used for any Customer-facing image slot that doesn't yet have a real asset (e.g. a seller's own product/storefront photos, which are user-uploaded and can't be stocked in advance) — but don't reach for it where a real Pexels/uploaded image is already wired in. Do not fabricate placeholder image URLs (Unsplash links, `picsum.photos`, etc.) for anything — use the component or a real uploaded asset.

### Component import convention
Every `resources/js/components/ui/*.tsx` shadcn primitive imports its `cn` helper from `@/lib/utils` (backed by the `cn` npm package, aliased via `components.json`) — a centralized import, not a per-file relative path. If Vite fails to resolve this import, that's a missing/stale `node_modules` (run `npm install`), not a code bug — don't hand-edit the import path.

## Responsiveness

Mandatory for every screen, not optional polish:

- **Breakpoints:** use Tailwind's default scale consistently — `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px). Don't invent ad hoc breakpoints.
- **Mobile-first CSS:** write the unprefixed (mobile) styles first, layer `md:`/`lg:` on top — never the reverse.
- **Customer portal** is mobile-first in practice, not just in principle: design and build the mobile layout first, then adapt up to tablet/desktop. Every primary action (search, add to cart, checkout, WhatsApp contact) must be reachable one-handed, with touch targets ≥44×44px.
- **Seller panel / Admin panel** are desktop-primary (dashboards, tables) but must still degrade usably on tablet — data tables scroll horizontally or collapse to cards below `md`, never clip or overflow the viewport.
- No fixed pixel widths on layout containers — use relative units (`%`, `rem`, `max-w-*`) and flex/grid so content reflows instead of overflowing or requiring horizontal page scroll.
- Images (product photos, seller galleries) use responsive `srcset`/`sizes` or Tailwind's `object-cover` + container sizing — never a fixed-size `<img>` that breaks the mobile layout.
- Test every screen at minimum three viewport widths: 375px (mobile), 768px (tablet), 1280px (desktop) — this is enforced in [chrome-ui-testing-agent](../agents/chrome-ui-testing-agent.md)'s required pass, not left to spot-checking.

## HCI checklist (apply per screen — mirrors [frontend-agent](../agents/frontend-agent.md))
- [ ] Every async action has a visible loading state (skeletons/spinners from shadcn, not blank screens).
- [ ] Every action has a visible success/error outcome (toast/inline message), never silent failure.
- [ ] Destructive actions (delete listing, cancel subscription, reject seller) require explicit confirmation (shadcn `AlertDialog`), and state clearly what will happen.
- [ ] Forms validate inline, disable submit while invalid/pending, and surface field-specific error text (not just a generic banner).
- [ ] Empty states (no search results, no orders yet, no listings yet) are designed, not blank — explain why and suggest a next action.
- [ ] All interactive elements are reachable and operable via keyboard; focus is visibly indicated (rely on Base UI's built-in focus handling — don't override it away).
- [ ] Color contrast meets WCAG AA; status/role indicators are never conveyed by color alone (pair with icon/text — e.g. "Verified ✓" not just a green dot).
- [ ] Layout is responsive at 375px / 768px / 1280px minimum (see Responsiveness section above); Customer portal must be fully usable one-handed on mobile; no horizontal page scroll at any width; no clipped/overflowing content or overlapping elements at any breakpoint.
- [ ] Navigation/current-location in the app is always evident (breadcrumbs, active nav state, step indicators in checkout/onboarding).
- [ ] No unrequested UI elements — every control on screen maps to a requirement in [docs/requirements.md](../requirements.md).

## Testing hand-off
A component/page is not "done" until:
1. [frontend-unit-testing-agent](../agents/frontend-unit-testing-agent.md) has unit coverage for its logic/rendering states.
2. [frontend-integration-testing-agent](../agents/frontend-integration-testing-agent.md) has a passing happy-path integration test through the real backend.
3. [chrome-ui-testing-agent](../agents/chrome-ui-testing-agent.md) has done a live browser pass against this checklist.
