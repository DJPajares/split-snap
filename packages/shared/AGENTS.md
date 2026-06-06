# Shared Package Agent Guide

This package contains contracts and logic used by both `apps/web` and `apps/api`.

## What Lives Here

- `src/types.ts`: Shared domain and API payload/response types.
- `src/constants.ts`: App constants, API route builders, storage keys, and session constants.
- `src/schemas.ts`: Client-facing Zod schemas and inferred form types.
- `src/errors.ts`: Shared error codes and user-facing error messages.
- `src/tax.ts`: Per-participant bill summary calculation.
- `src/currency.ts`: Currency formatting and currency metadata.
- `src/utilities.ts`: Shared helper functions.

## Commands

- Build: `pnpm --filter @split-snap/shared build`
- Watch: `pnpm --filter @split-snap/shared dev`

## Implementation Notes

- Changes here affect both web and API. Prefer explicit, stable contracts.
- Keep route constants in sync with API route mounting in `apps/api/src/index.ts` and the route modules.
- Shared exports are package subpath exports; if you add a new public module, update `package.json`.
- Do not put browser-only or Node-only code here unless it is guarded and intentionally shared.
- Build this package before testing web/API changes that consume new shared exports.

## Testing

There is no package-local test script today. When changing shared calculation or schema behavior, add tests in the consumer that exercises it or add a shared test script deliberately.
