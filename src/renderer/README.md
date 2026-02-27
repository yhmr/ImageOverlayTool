# Renderer Structure Rules

This directory follows a feature-first structure with limited shared roots.

## Placement rules

- Put feature-specific code under feature directories:
  - `main-window/`
  - `image-settings/`
  - `dimension-settings/`
- Keep root-level shared directories only for cross-feature reuse:
  - `components/` (shared UI primitives)
  - `hooks/` (used by multiple features)
  - `services/`, `store/`, `providers/`, `utils/`
- If a module is used only by one feature, move it into that feature folder.

## Naming rules

- Use `PascalCase.tsx` for React components.
- Use `camelCase.ts` for hooks/services/utils.
- Prefer `*Utils` over `*Helpers` for utility modules.
- Use `*Manager` only when the module actually coordinates multiple collaborators/stateful lifecycle concerns.

## Refactor policy

- Move files gradually to avoid wide import churn.
- Preserve runtime behavior and test IDs while restructuring.
