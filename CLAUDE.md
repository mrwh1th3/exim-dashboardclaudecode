# Exim Dashboard — CLAUDE.md

## Stack
- Next.js 14 App Router · TypeScript · Tailwind CSS v4 (PostCSS, no tailwind.config.js)
- Supabase (auth + DB) · Zustand (auth store) · shadcn/ui (base-nova style) · Radix UI

## Design System
- All tokens in `src/app/globals.css` via `@theme inline` (Tailwind v4 syntax)
- OKLCH color space — never use hex in CSS vars
- Dark mode always on: `html class="dark"` hardcoded in `layout.tsx`
- Font: Bebas Neue (`--font-display`) — also mapped to `--font-sans` and `--font-mono`
- Base radius: `0.375rem` · Easing: `cubic-bezier(0.16, 1, 0.32, 1)`

## Key Files
- `src/app/globals.css` — all CSS tokens, animations, utilities
- `src/app/layout.tsx` — font imports (next/font/google), dark class
- `src/app/(dashboard)/layout.tsx` — dashboard shell (horizontal header, no sidebar)
- `src/components/layout/horizontal-header.tsx` — main nav, role-based (admin/client)
- `src/components/ui/button.tsx` — CVA variants, @base-ui/react primitive
- `src/stores/auth-store.ts` — Zustand auth store, `useAuthStore()`

## Gotchas
- Edit tool can fail on Windows paths — use Write (full rewrite) for layout.tsx if Edit fails
- `--font-mono` is intentionally aliased to `--font-display` (not a separate font)
- No `tailwind.config.js` — do not create one; use `@theme inline` in globals.css
- Supabase client requires env vars; placeholder values used during build (`src/lib/supabase/`)
