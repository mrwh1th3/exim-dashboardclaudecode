# Exim Dashboard — CLAUDE.md

## Stack
- **Framework:** Next.js 16 (App Router) · React 19 · TypeScript 5
- **Styling:** Tailwind CSS v4 (PostCSS, `@tailwindcss/postcss`) — no `tailwind.config.js`
- **UI:** shadcn/ui (base-nova style) · Radix UI primitives · Framer Motion · Lucide icons
- **State:** Zustand 5 (with persist middleware)
- **Backend:** Supabase (Auth + PostgreSQL via `@supabase/ssr`)
- **Payments:** Stripe 20 + `@stripe/stripe-js`
- **Forms:** React Hook Form 7 + Zod 4
- **Tables:** TanStack Table 8
- **Rich Text:** Tiptap 3
- **Drag & Drop:** dnd-kit (core, sortable, utilities)
- **Charts:** Recharts 3
- **Notifications:** Sonner 2
- **PWA:** Custom service worker + install banner

## Project Language
The application is in **Spanish** (`lang="es"` in `layout.tsx`). UI text, error messages, and user-facing strings should be in Spanish.

## Directory Structure

```
src/
├── app/
│   ├── (auth)/                     # Auth routes (login, forgot-password)
│   ├── (dashboard)/                # Protected dashboard shell
│   │   ├── layout.tsx              # Dashboard layout (auth guard, header)
│   │   ├── admin/                  # Admin-only pages
│   │   │   ├── clients/            # Client management
│   │   │   ├── onboarding/         # Onboarding flow builder
│   │   │   ├── requests/           # Service requests
│   │   │   ├── subscriptions/      # Subscription management
│   │   │   ├── social/             # Social media (calendar, posts, strategy, brand, files)
│   │   │   ├── web/                # Web page management
│   │   │   └── settings/           # System settings (statuses, social accounts)
│   │   ├── client/                 # Client-facing pages
│   │   │   ├── onboarding/         # Client onboarding flow
│   │   │   ├── requests/           # Submit requests
│   │   │   ├── subscription/       # Subscription info
│   │   │   ├── social/             # Social content (posts, calendar, strategy, brand, files)
│   │   │   └── web/                # Web pages + files
│   │   ├── admin/page.tsx          # Admin dashboard
│   │   ├── client/page.tsx         # Client dashboard
│   │   └── demo/page.tsx           # Demo page
│   ├── api/
│   │   ├── auth/login/             # Email/password auth
│   │   ├── auth/callback/          # OAuth callback
│   │   ├── admin/create-client/    # Create client account
│   │   └── stripe/                 # Stripe: checkout, customers, plans, portal, sync, webhook
│   ├── globals.css                 # All CSS tokens + animations + utilities
│   └── layout.tsx                  # Root layout (fonts, theme, PWA, toaster)
├── components/
│   ├── layout/
│   │   ├── horizontal-header.tsx   # Main nav (role-based, desktop + mobile)
│   │   ├── sidebar.tsx             # Sidebar nav
│   │   └── user-menu.tsx           # User profile dropdown
│   ├── shared/
│   │   ├── empty-state.tsx
│   │   ├── file-manager.tsx
│   │   ├── post-media-upload.tsx
│   │   ├── profile-dialog.tsx
│   │   ├── service-not-available.tsx
│   │   └── stat-card.tsx
│   └── ui/                         # 50+ shadcn-based UI components
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client (singleton)
│   │   ├── server.ts               # Server client (SSR cookie handling)
│   │   └── admin.ts                # Service-role client (lazy singleton)
│   ├── db/                         # Database query functions
│   │   ├── profiles.ts, posts.ts, brand-guidelines.ts
│   │   ├── social-accounts.ts, calendar-log.ts, flows.ts
│   │   ├── files.ts, requests.ts, subscriptions.ts
│   │   ├── web-pages.ts, post-feedback.ts
│   ├── utils.ts                    # cn() helper (clsx + tailwind-merge)
│   └── stripe.ts                   # Stripe singleton client
├── stores/
│   ├── auth-store.ts               # Zustand auth store
│   ├── sidebar-store.ts            # Sidebar collapse (persisted)
│   ├── flows-store.ts              # Onboarding flows/forms (persisted)
│   └── files-store.ts              # File/folder management (persisted)
└── types/
    ├── auth.ts                     # UserRole, Profile
    ├── onboarding.ts               # Flow, Stage, FormField, Submission types
    ├── social.ts                   # Platform, PostStatus, SocialPost, BrandGuideline
    ├── subscriptions.ts            # SubscriptionStatus, Plan, Invoice
    ├── requests.ts                 # RequestType, UrgencyLevel, Request
    ├── files.ts                    # FileItem
    └── web-pages.ts                # Web page config types
```

## Design System

All design tokens live in `src/app/globals.css` using **Tailwind v4** `@theme inline` syntax.

### Colors
- OKLCH color space throughout — **never use hex in CSS vars**
- Dark mode background: `oklch(0.14 0 0)` (warm charcoal ~`#1b1b1b`)
- Dark mode foreground: `oklch(0.79 0.008 82)` (warm taupe ~`#c5c1b9`)
- Primary accent: `oklch(0.82 0.04 175)` (mint green — same in light and dark)
- Cards: `oklch(0.17 0 0 / 70%)` (semi-transparent dark)
- Destructive: `oklch(0.577 0.245 27.325)` (red)

### Typography
- Root layout loads **Inter** (400–900 weights) and **JetBrains Mono** via `next/font/google`
- CSS vars: `--font-sans`, `--font-mono`
- `lang="es"` — all user-facing text in Spanish

### Borders & Radius
- Base: `15px` · sm: `9px` · md: `12px` · lg: `15px` · xl: `21px` · 2xl: `27px`

### Utility Classes (defined in globals.css)
- `.glass` — glassmorphism (backdrop-blur, semi-transparent bg)
- `.glow-primary` — mint color glow shadow
- `.brand-gradient` — mint gradient
- `.bg-dot-grid` / `.bg-line-grid` — decorative backgrounds
- `.hover-overlay` — subtle hover tint
- `.btn-sweep` — button sweep animation
- `.line-clamp-1/2/3` — text truncation

### Animations
`gradient`, `shimmer-slide`, `spin-around`, `meteor`, `shine`, `fade-up`, `fade-in`, `scale-in`, `dialog-in/out`, `accordion-down/up`, `spinner`, `caret-blink`

### Theme
- ThemeProvider from `next-themes` (light default, system detection) — theme toggle is available
- The dashboard uses a **dark** appearance by default via CSS; do not hardcode `class="dark"` on `<html>`

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/app/globals.css` | All CSS tokens, animations, utility classes |
| `src/app/layout.tsx` | Root layout: fonts, ThemeProvider, Sonner, PWA |
| `src/app/(dashboard)/layout.tsx` | Dashboard shell: auth guard, HorizontalHeader, dot-grid bg |
| `src/components/layout/horizontal-header.tsx` | Main nav (role-based admin/client, desktop + mobile, 466 lines) |
| `src/components/ui/button.tsx` | CVA variants + @base-ui/react primitive |
| `src/stores/auth-store.ts` | Zustand auth: user, login, logout, loadUser, updateProfile |
| `src/lib/utils.ts` | `cn()` — use for all className merging |
| `src/types/auth.ts` | `UserRole`, `Profile` — import from here |

## Auth & Roles

**UserRole:** `'admin' | 'editor' | 'client' | 'client_approver' | 'client_viewer'`

**Profile fields:** `id, email, fullName, avatarUrl, role, companyName, phone, isActive, createdAt, updatedAt`

**Auth flow:**
1. `useAuthStore()` provides `user`, `isLoading`, `login()`, `logout()`, `loadUser()`
2. Dashboard layout calls `loadUser()` on mount; redirects to `/login` if no session
3. Navigation in `horizontal-header.tsx` renders different items based on `user.role`
4. Server-side: use `src/lib/supabase/server.ts`; privileged ops: `src/lib/supabase/admin.ts`

## Supabase Clients

```typescript
// Browser (client components)
import { createClient } from '@/lib/supabase/client'

// Server (Server Components, API routes, Server Actions)
import { createClient } from '@/lib/supabase/server'

// Admin / privileged ops (API routes only — never in client code)
import { supabaseAdmin } from '@/lib/supabase/admin'
```

The browser client has hardcoded fallback credentials for local builds. Env vars override them:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Stripe Integration

Env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

API routes under `src/app/api/stripe/`:
- `checkout` — create checkout session
- `customers` — manage customers
- `plans` — list/retrieve plans
- `portal` — billing portal access
- `sync` — sync Stripe data with DB
- `webhook` — handles: `checkout.session.completed`, `customer.subscription.*`, `invoice.paid/payment_failed`
- `import-subscriptions` — bulk import

## Development Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

## Component Conventions

- **Class merging:** Always use `cn()` from `@/lib/utils` — never concatenate class strings directly
- **Variants:** Use `class-variance-authority` (CVA) for multi-variant components (see `button.tsx`)
- **shadcn components:** Extend, don't replace; keep them in `src/components/ui/`
- **Shared business components:** Put in `src/components/shared/` (not `ui/`)
- **Dashboard layout:** `max-w-7xl` centered container, `p-6 lg:p-8` padding, dot-grid background
- **Dynamic imports:** Heavy components (e.g., HorizontalHeader) use `dynamic()` with `{ ssr: false }`

## State Management (Zustand)

```typescript
import { useAuthStore } from '@/stores/auth-store'
const { user, isLoading, login, logout, loadUser } = useAuthStore()
```

Stores with `persist` middleware: `sidebar-store`, `flows-store`, `files-store`

## Onboarding Flow System

Complex multi-stage form builder with types in `src/types/onboarding.ts`:
- `FlowType`: `'web' | 'social'`
- `FieldType`: text, textarea, select, checkbox, file_upload, date_picker, etc.
- Flows have Stages → Stages have FormFields
- `ClientFlow` tracks per-client progress (`FlowStatus`, `StageStatus`, `SubmissionStatus`)
- Store: `useFlowsStore()` from `src/stores/flows-store.ts`

## Social Media Module

Types in `src/types/social.ts`:
- `Platform`: `'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'linkedin'`
- Posts have full approval workflow: `draft → pending_review → changes_requested → approved → scheduled → published`
- Brand guidelines: typography, colors, tone, rules
- Calendar log entries for scheduling

## Gotchas & Important Notes

- **No `tailwind.config.js`** — do not create one; all tokens go in `globals.css` via `@theme inline`
- **OKLCH only** — never add hex values to CSS custom properties
- **Spanish UI** — all user-facing strings must be in Spanish
- **Supabase fallback credentials** — hardcoded in `client.ts` and `admin.ts` for build-time safety; always use env vars in production
- **Edit tool on Windows paths** — if Edit fails on `layout.tsx`, use Write (full rewrite) instead
- **React 19** — avoid patterns deprecated in React 18 (e.g., `ReactDOM.render`)
- **`force-dynamic`** — the dashboard layout exports `export const dynamic = 'force-dynamic'`; keep this to prevent stale auth state
- **ThemeProvider wraps everything** — use `useTheme()` from `next-themes` for theme-aware logic, not hardcoded dark class
- **Path alias** — always import with `@/` (maps to `src/`); never use relative `../../` for cross-module imports
- **PWA** — service worker registered via `pwa-register.tsx`; SW headers configured in `next.config.ts`
