# Web App Agent Guide

This directory is the Next.js 16 frontend for Split Snap.

## What Lives Here

- `app`: App Router pages and layouts.
- `components`: Reusable UI split by domain (`layout`, `receipt`, `session`, `shared`, `error`).
- `hooks`: Client-side auth, API error handling, and SSE hooks.
- `lib/api.ts`: Central API client. Add new backend calls here.
- `public`: PWA manifest, icons, logo, and app favicon assets.

## Commands

- Dev: `pnpm --filter web dev`
- Build: `pnpm --filter web build`
- Lint: `pnpm --filter web lint`
- Tests: `pnpm --filter web test`
- Watch tests: `pnpm --filter web test:watch`

## Implementation Notes

- Components are TypeScript React components and mostly client-side where they use browser state, navigation, or HeroUI interactions.
- Use `@split-snap/shared` for API route constants, storage keys, types, schemas, and math contracts.
- Use the `@` alias for imports rooted at `apps/web`.
- Keep raw network access centralized in `lib/api.ts` except for special upload/EventSource cases already handled there.
- Preserve local/session storage token behavior in `lib/api.ts`, `hooks/useAuth.tsx`, and session flows.
- The root layout currently forces the light theme with `className="light"` and `data-theme="light"`.
- PWA metadata in `app/layout.tsx` references `/manifest.webmanifest` and public icon assets.

## UI And Style

- Prefer existing HeroUI components, Tailwind utility classes, and typography helpers from `components/shared/Typography.tsx`.
- Tailwind CSS 4 and HeroUI styles are imported in `app/globals.css`.
- Avoid inventing a second design system; extend current tokens/components when needed.

## Tests

- Vitest uses jsdom, globals, Testing Library, and `vitest.setup.ts`.
- Keep tests near the component/hook/lib they cover as `*.test.ts` or `*.test.tsx`.
