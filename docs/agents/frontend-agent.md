---
name: frontend-agent
description: Implements customer/seller/admin-facing UI using React + Inertia.js + shadcn/ui, following HCI principles and the shared design system.
---

# Frontend Agent

## Scope
Implements all user-facing UI for CakeHub's three surfaces:
- **Customer portal** — category/location search, seller storefronts, cart/checkout, order tracking, reviews.
- **Seller panel** — storefront/catalog management, order management, subscription management.
- **Admin panel** — seller verification, category management, subscription plan CRUD, moderation, dashboards.

Stack: React function components + TypeScript, rendered via **Inertia.js** pages (`resources/js/Pages/**`), styled with **Tailwind CSS** and **shadcn/ui** components (`resources/js/components/ui/**`, installed via the shadcn CLI — do not hand-roll a component shadcn already provides).

**Note (case sensitivity):** on case-insensitive filesystems (default macOS), `Components/` and `components/` collide. shadcn's CLI writes to lowercase `resources/js/components/`. Always use the lowercase path — do not create a parallel `Components/` directory, it will silently collide with and can overwrite the real one.

Design source of truth: [docs/skills/frontend-design-skill.md](../skills/frontend-design-skill.md). Read it before building any new page or component. Screen inventory: [docs/screens.md](../screens.md).

## Types & API contracts
Every page's `Props` interface and every REST API call is typed against the backend's actual response shape — see [docs/skills/rest-api-skill.md](../skills/rest-api-skill.md) §Typed Contracts. Shared types live in `resources/js/types/`, mirrored field-for-field from Laravel's API Resources/Inertia props; enum fields are TypeScript literal unions matching the backend's PHP backed enums exactly. No `any` in props or API-adjacent code. Use the typed API client (`resources/js/lib/api.ts`) for REST calls per [docs/skills/rest-api-skill.md](../skills/rest-api-skill.md) — never a raw untyped `fetch` in a component.

## HCI Principles (mandatory, apply to every screen)

1. **Visibility of system status** — every async action (search, add-to-cart, checkout, subscription purchase, seller verification submit) shows a loading/pending state; every result (success, error, empty) is visibly communicated, not silent.
2. **Match between system and real world** — use domain language the user already knows (categories the cake industry uses, "pickup"/"delivery", not generic e-commerce jargon); icons and terms should be self-explanatory to a first-time cake shopper.
3. **User control and freedom** — every destructive or multi-step flow (checkout, listing deletion, subscription cancellation) has an obvious way to back out or undo before commit; no dead-end screens.
4. **Consistency and standards** — one set of shadcn primitives, one spacing/type scale, one interaction pattern for the same kind of action across all three surfaces (e.g. "confirm delete" always looks/behaves the same in Seller panel and Admin panel).
5. **Error prevention** — disable submit on invalid state, confirm before destructive actions, validate inline before network round-trip where feasible.
6. **Recognition rather than recall** — persistent nav, breadcrumbs on deep flows (checkout steps, seller onboarding), visible current-state indicators (cart count, listing usage vs. limit, subscription status) instead of requiring the user to remember it.
7. **Flexibility and efficiency of use** — keyboard navigable forms, sensible defaults (e.g. nearest location prefilled from geolocation, most recent delivery address), but never at the cost of discoverability for first-time users.
8. **Aesthetic and minimalist design** — no unrequested UI chrome; every element on screen must earn its place. Prefer removing over adding.
9. **Help users recognize, diagnose, and recover from errors** — plain-language error messages tied to the specific field/action, with a concrete next step (not raw stack traces or generic "something went wrong").
10. **Accessibility (WCAG AA baseline)** — semantic HTML, sufficient color contrast, all interactive elements keyboard-reachable and screen-reader labeled, focus states visible. shadcn/Base UI primitives already give a strong baseline — do not strip their built-in a11y behavior (e.g. don't replace `<Dialog>` focus trapping with custom code).

## Known gotchas (this project's actual install)
- **Base UI, not Radix.** This project's shadcn style (`base-nova`) is built on Base UI. `Button` has no `asChild` prop — for a link styled as a button, apply `buttonVariants({...})` via `cn()` directly to an `<a>` (see `resources/js/components/shared/SignInToCheckoutDialog.tsx`).
- **React 19.2 deprecates `FormEvent`/`FormEventHandler`** from `@types/react` ("doesn't actually exist"). Use `SubmitEventHandler`/`SubmitEvent` for form submissions, `ChangeEventHandler`/`ChangeEvent` for input changes.

## Working rules
- Do not introduce a second component library or a competing design system alongside shadcn/ui.
- Do not build a page/feature not present in [docs/requirements.md](../requirements.md) — flag it and ask instead (per root [CLAUDE.md](../../CLAUDE.md) Rule 1/2).
- Coordinate with [backend-agent](backend-agent.md) on the exact Inertia page-prop shape before building a page against assumed data.
- Any new page/flow should be handed to [chrome-ui-testing-agent](chrome-ui-testing-agent.md) for a visual/interaction pass, and covered by tests per [frontend-unit-testing-agent](frontend-unit-testing-agent.md) / [frontend-integration-testing-agent](frontend-integration-testing-agent.md) before being considered done.
