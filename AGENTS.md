# Split Snap Agent Guide

This repo is a pnpm/Turborepo TypeScript monorepo for Split Snap, a receipt-scanning bill-splitting app.

## Product Shape

- Users scan or manually enter receipt items, create a 6-character shareable session, and participants claim items.
- Tax and tip/service charge are split proportionally by claimed item subtotal.
- Sessions update in real time through Server-Sent Events.
- Accounts are optional; guest hosts receive a host token and participants can join with only a display name.

## Workspace Layout

- `apps/web`: Next.js 16 App Router frontend with React 19, Tailwind CSS 4, HeroUI, `@tabler/icons-react`, and Vitest/jsdom tests.
- `apps/api`: Hono API for Node/Vercel, MongoDB/Mongoose persistence, auth, session mutation, receipt scanning, and SSE.
- `packages/shared`: Shared TypeScript contracts, constants, schemas, errors, currency utilities, and bill-splitting math.

## Core Commands

- Install: `pnpm install`
- Full dev: `pnpm dev` from the repo root. Web runs on `http://localhost:3000`; API runs on `http://localhost:3001`.
- Full build: `pnpm build`
- Full lint: `pnpm lint`
- Web tests: `pnpm --filter web test`
- API tests: `pnpm --filter api exec vitest run`
- Shared build: `pnpm --filter @split-snap/shared build`
- Format check: `pnpm prettier`
- Format write: `pnpm prettier:fix`

Run focused commands when possible. Turbo tasks depend on upstream builds, so web/API lint and tests may build `packages/shared` first.

## Environment

Use `.env.example` as the source of truth. Local API dev loads `../../.env` from `apps/api`.

- `API_PORT`, default `3001`
- `MONGODB_URI`, default `mongodb://localhost:27017/split-snap`
- `JWT_SECRET`
- `RECEIPT_SCANNER_PROVIDER`: `auto`, `gemini`, `openai`, or `tesseract`
- `GOOGLE_AI_API_KEY`, optional for Gemini
- `OPENAI_API_KEY`, optional for OpenAI
- `NEXT_PUBLIC_API_URL`, default `http://localhost:3001`

Do not commit secrets or local `.env*` files.

## Architecture Notes

- Keep shared request/response types and route constants in `packages/shared` when a contract is used by both web and API.
- The web API client is centralized in `apps/web/lib/api.ts`; prefer extending it over scattering raw `fetch` calls.
- API routes live under `apps/api/src/routes`; validate request bodies with local Zod schemas from `apps/api/src/lib/schemas.ts`.
- API responses should use `serializeSession` from `apps/api/src/lib/serialize.ts` when returning session documents.
- API errors should use the helpers in `apps/api/src/lib/errors.ts` and shared `ErrorCode` values from `@split-snap/shared/errors`.
- Session updates should publish through `sseManager` after mutations that clients need to see live.
- Receipt scanning is provider-based in `apps/api/src/services/receipt-scanner.ts`; preserve the fallback behavior documented in `README.md`.

## Frontend Notes

- App routes are under `apps/web/app`.
- Reusable layout pieces live in `apps/web/components/layout`; receipt and session components live under their matching component folders.
- Use existing HeroUI components and Tailwind tokens from `apps/web/app/globals.css`.
- `apps/web/app/layout.tsx` defines PWA metadata and points at `/manifest.webmanifest`.
- Local storage keys and API route constants come from `@split-snap/shared/constants`.

## Generated And Ignored Files

Treat these as generated/local artifacts: `node_modules`, `dist`, `.next`, `.turbo`, `coverage`, `*.tsbuildinfo`, `next-env.d.ts`, `.vercel`, and `*.traineddata`.

If they are present in the working tree, do not edit them for source changes. Prefer changing source files and rebuilding.

## Testing Guidance

- Add or update Vitest tests for changed shared math, error parsing, auth/session hooks, receipt parsing, and session item behavior.
- Web tests use jsdom and Testing Library setup from `apps/web/vitest.setup.ts`.
- API tests use Vitest and should live as `src/**/*.test.ts`.
- For UI changes, verify responsive behavior and keep the design consistent with the current simple app surface.

## Git Hygiene

- The worktree may contain user changes. Do not revert changes you did not make.
- Keep edits scoped to source and docs relevant to the request.
- Use pnpm scripts instead of npm/yarn/bun.
