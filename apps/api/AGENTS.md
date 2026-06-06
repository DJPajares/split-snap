# API App Agent Guide

This directory is the Hono backend for Split Snap.

## What Lives Here

- `src/index.ts`: Hono app composition, middleware, health routes, and route mounting.
- `src/dev.ts`: Local Node server entrypoint.
- `src/routes`: Auth, receipt, session, and exchange-rate endpoints.
- `src/models`: Mongoose schemas.
- `src/services`: Receipt scanner provider logic and SSE manager.
- `src/middleware`: JWT auth and centralized error handling.
- `src/lib`: Config, DB connection, API schemas, error helpers, serialization, and utilities.
- `api/[[...route]].ts`: Vercel serverless route entry.

## Commands

- Dev: `pnpm --filter api dev`
- Build: `pnpm --filter api build`
- Lint: `pnpm --filter api lint`
- Tests: `pnpm --filter api exec vitest run`

## Environment

Local dev loads the repo root `.env` via `tsx watch --env-file=../../.env src/dev.ts`.

Relevant variables are `API_PORT`, `MONGODB_URI`, `JWT_SECRET`, `RECEIPT_SCANNER_PROVIDER`, `GOOGLE_AI_API_KEY`, and `OPENAI_API_KEY`.

## Implementation Notes

- Use ESM imports with `.js` extensions for local TypeScript files, matching the current source.
- Use Zod schemas from `src/lib/schemas.ts` for request validation.
- Use `badRequest`, `notFound`, `forbidden`, `internal`, and `AppError` from `src/lib/errors.ts`.
- Return session data through `serializeSession` rather than raw Mongoose documents.
- Use `optionalAuth`, `requireAuth`, `optionalHostToken`, and `generateHostToken` for authenticated and guest-host flows.
- After mutating session state that clients watch, publish through `sseManager`.
- Keep scanner provider fallback behavior: `auto` tries Gemini, then OpenAI, then Tesseract.
- Avoid changing generated `dist` files; build output is ignored.

## Tests

- Vitest config includes `src/**/*.test.ts`.
- Receipt scanner tests currently live in `src/services/receipt-scanner.test.ts`.
- Add focused tests for parser/provider logic, auth-sensitive session behavior, serialization, and shared error responses when those areas change.
