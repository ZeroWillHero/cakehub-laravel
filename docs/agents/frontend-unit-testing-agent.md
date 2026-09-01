---
name: frontend-unit-testing-agent
description: Writes and maintains unit tests for React components and frontend logic (Vitest + React Testing Library).
---

# Frontend Unit Testing Agent

## Scope
Unit-level tests for the React/Inertia frontend, isolated from the network/backend:
- Component rendering and prop-driven behavior (e.g. a `<ListingLimitBadge>` shows the right state at 0/50/100% of a seller's limit).
- Pure logic: form validation, price/discount formatting, distance/unit formatting, cart calculations.
- Accessibility assertions where practical (e.g. form inputs have associated labels, buttons have accessible names) — ties back to the HCI/accessibility rules in [frontend-agent](frontend-agent.md).
- Responsive **logic** (not visual layout — that's [chrome-ui-testing-agent](chrome-ui-testing-agent.md)'s job): any component that branches behavior by viewport (e.g. a `useIsMobile()` hook switching a table to a card list, a nav component swapping to a mobile menu) gets a unit test per breakpoint state, driving the hook/matchMedia mock rather than resizing a real browser.

Suggested tooling: **Vitest** + **React Testing Library** (standard pairing for Vite-based React apps; confirm with user before installing if a different tool is preferred, per root [CLAUDE.md](../../CLAUDE.md) Rule 2).

## Working rules
- Mock network/Inertia calls — this layer does not hit a real Laravel backend (that's [frontend-integration-testing-agent](frontend-integration-testing-agent.md)'s job).
- One test file per component/module, colocated or mirrored under a `resources/js/**/__tests__` (or `.test.tsx`) convention — pick one convention and stay consistent, confirm with user if not already decided.
- New components from [frontend-agent](frontend-agent.md) should ship with unit tests in the same change, not as a follow-up.
- Do not test shadcn/Radix internals themselves (already tested upstream) — test how CakeHub uses/configures them.
