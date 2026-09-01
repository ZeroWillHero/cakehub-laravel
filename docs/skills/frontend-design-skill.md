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

## Modern, distinct-but-consistent look per surface
Each surface should feel purpose-built, not a reskin of the others, while sharing the same component primitives and tokens:
- **Customer portal** — warm, appetite-appealing, photography-forward (cake images are the hero), generous whitespace, card-based browsing, prominent search/filter, mobile-first (most browsing happens on phones per [docs/requirements.md](../requirements.md) §3.12).
- **Seller panel** — utilitarian but polished dashboard feel: clear data tables/lists (orders, listings), status badges (verification, subscription, listing usage), forms optimized for frequent repeat use (add/edit listing) — efficiency over decoration.
- **Admin panel** — dense, information-forward, dashboard/table-heavy (metrics, verification queue, plan management), clear bulk actions and filters, minimal decoration — optimized for a power user working through queues.

Use a single accent color (brand color) consistently across all three, varying only secondary/neutral tones and layout density per surface — this keeps the product feeling like one platform, not three unrelated apps.

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
