# Car Rental Client — Development Conventions

> Reference document for all contributors. Every decision here solves a real past pain-point.
> Update this file when a new pattern is adopted.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Naming Conventions](#2-naming-conventions)
3. [TypeScript](#3-typescript)
4. [Components](#4-components)
5. [State Management](#5-state-management)
6. [Data Fetching & API Layer](#6-data-fetching--api-layer)
7. [Forms & Validation](#7-forms--validation)
8. [Routing](#8-routing)
9. [Styling](#9-styling)
10. [Code Quality Rules](#10-code-quality-rules)
11. [Git Workflow](#11-git-workflow)

---

## 1. Project Structure

```
src/
├── app/                  # Next.js App Router pages only — no logic here
│   ├── (auth)/           # Auth route group (signin, forgot-password)
│   ├── (dashboard)/      # Protected dashboard route group
│   │   └── [section]/    # Feature sections
│   ├── api/              # API route handlers (NextAuth only)
│   └── layout.tsx        # Root layout
├── features/             # Domain modules — one folder per feature
│   └── [feature]/
│       ├── components/   # Feature-specific UI components
│       ├── hooks/        # Feature-specific hooks
│       ├── schemas/      # Zod schemas for this feature
│       ├── store.ts      # Zustand store (if needed)
│       └── types.ts      # TypeScript types for this feature
├── components/
│   ├── ui/               # Shadcn/Radix primitives — DO NOT modify
│   ├── layout/           # Shell components (sidebar, header, providers)
│   └── custom/           # Shared custom components usable across features
├── hooks/                # Shared hooks (useAuth, use-data-table, etc.)
├── lib/                  # Core infrastructure (api client, auth, utils)
├── config/               # Static configuration (apiRoutes, paths)
├── types/                # Global TypeScript types
└── utils/                # Pure utility functions (date, format, etc.)
```

**Rules:**
- Pages in `app/` are thin: they import a feature view and render it — no logic.
- Each feature is self-contained. Cross-feature imports are forbidden (use `components/custom/` for shared UI).
- Add a new feature by creating `src/features/[feature]/` — never scatter files across the project.

---

## 2. Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Files & folders | `kebab-case` | `rental-list.tsx` |
| React components | `PascalCase` | `RentalCard` |
| Hooks | `camelCase` prefixed `use` | `useRentals` |
| Zustand stores | `camelCase` suffixed `Store` | `rentalStore` |
| Zod schemas | `camelCase` suffixed `Schema` | `rentalSchema` |
| TypeScript types/interfaces | `PascalCase` | `Rental`, `RentalStatus` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_RENTAL_DAYS` |
| API route keys | `camelCase` inside `apiRoutes` object | `apiRoutes.rentals.list` |
| CSS classes | Tailwind utility classes only — no custom CSS files per component |

---

## 3. TypeScript

- **Strict mode is on.** Never use `any` — use `unknown` and narrow, or define a proper type.
- No `@ts-ignore`. Use `@ts-expect-error` with a comment explaining why, only as last resort.
- Prefer `type` over `interface` for data shapes. Use `interface` only when declaration merging is needed.
- Export types from the feature's `types.ts`, not from component files.
- Never use `as` casts to bypass type errors. Fix the type instead.

```typescript
// Bad
const rental = data as Rental;

// Good
function isRental(data: unknown): data is Rental {
  return typeof data === 'object' && data !== null && 'id' in data;
}
```

---

## 4. Components

### Structure

Each component file: one default export, one component.

```typescript
// rental-card.tsx
interface RentalCardProps {
  rental: Rental;
  onReturn: (id: string) => void;
}

export default function RentalCard({ rental, onReturn }: RentalCardProps) {
  return (...);
}
```

### Rules

- Props interface is always named `[ComponentName]Props` and placed at the top of the file.
- No inline anonymous functions in JSX for anything more complex than a one-liner.
- No `useEffect` for derived state — compute it inline or with `useMemo`.
- `useEffect` is only for: syncing with external systems, DOM manipulations, subscriptions.
- Components under `components/ui/` are Shadcn primitives — never modify them directly. Extend via wrapper components in `components/custom/`.
- No `console.log` left in committed code. Use `console.error` for caught errors only.

### Server vs Client components

- Default to Server Components.
- Add `'use client'` only when the component uses: browser APIs, React hooks, event handlers, or client state.
- Never import a Client Component into a Server Component without wrapping it in a boundary.

---

## 5. State Management

### Client state: Zustand

- One store per feature, located at `src/features/[feature]/store.ts`.
- Stores are flat — no nested store trees.
- Actions are defined inside the store (not as separate files).
- Always reset store state on logout.

```typescript
// features/rentals/store.ts
import { create } from 'zustand';

interface RentalStore {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

export const useRentalStore = create<RentalStore>((set) => ({
  selectedId: null,
  setSelectedId: (id) => set({ selectedId: id }),
}));
```

### Server state: TanStack Query

Use React Query for all server data (list, detail, mutations). Do not duplicate server data in Zustand.

```typescript
// hooks/use-rentals.ts
export function useRentals(filters: RentalFilters) {
  return useQuery({
    queryKey: ['rentals', filters],
    queryFn: () => apiClient.get(apiRoutes.rentals.list, { params: filters }),
  });
}
```

---

## 6. Data Fetching & API Layer

### API client

`src/lib/api.ts` is the single Axios instance. All requests go through it.
- Auth token is injected automatically via the request interceptor.
- 401 responses trigger automatic sign-out.
- Never create a second Axios instance. Never call `fetch` directly.

### API routes

All endpoint URLs live in `src/config/apiRoutes.ts`:

```typescript
export const apiRoutes = {
  rentals: {
    list: '/rentals',
    detail: (id: string) => `/rentals/${id}`,
    create: '/rentals',
    update: (id: string) => `/rentals/${id}`,
    delete: (id: string) => `/rentals/${id}`,
  },
  files: {
    uploadTemp: '/files/upload-temp',
    cleanupTemp: '/files/cleanup-temp',
  },
} as const;
```

No hardcoded URLs anywhere in the codebase outside this file.

---

## 7. Forms & Validation

- All forms use **React Hook Form** + **Zod**.
- Schema lives in `src/features/[feature]/schemas.ts`, never inside the component.
- Always use `zodResolver` from `@hookform/resolvers/zod`.
- On submit, show a toast on success and display field errors returned by the API.

```typescript
// features/rentals/schemas.ts
import { z } from 'zod';

export const createRentalSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  customerId: z.string().min(1, 'Customer is required'),
});

export type CreateRentalInput = z.infer<typeof createRentalSchema>;
```

---

## 8. Routing

- File-based routing via Next.js App Router.
- All protected routes are inside `src/app/(dashboard)/`.
- The `(auth)` group is for unauthenticated pages only.
- Dynamic segments use descriptive names: `[rentalId]` not `[id]`.
- Route paths are defined as constants in `src/config/paths.ts` — never hardcode paths in `Link` or `router.push`.

```typescript
// config/paths.ts
export const PATHS = {
  auth: {
    signIn: '/',
    forgotPassword: '/auth/forgot-password',
  },
  dashboard: {
    rentals: {
      list: '/dashboard/rentals',
      detail: (id: string) => `/dashboard/rentals/${id}`,
      new: '/dashboard/rentals/new',
    },
  },
} as const;
```

---

## 9. Styling

- **Tailwind CSS only.** No custom CSS files, no inline `style` props (except for dynamic values that cannot be expressed as Tailwind classes).
- Use `cn()` from `@/lib/utils` to merge conditional classes.
- Dark mode is handled by the theme system — never hardcode `dark:` manually for core layout components.
- Do not install additional CSS libraries.
- Responsive design: mobile-first (`sm:`, `md:`, `lg:` breakpoints from Tailwind).

```typescript
// Good
<div className={cn('rounded-lg border p-4', isActive && 'border-primary bg-primary/10')}>

// Bad
<div style={{ borderRadius: 8, padding: 16 }}>
```

---

## 10. Code Quality Rules

These rules exist because Inginuity had significant technical debt from violating them.

### No dead code
Delete code that is no longer used. Do not comment it out. Git history preserves it.

### No comments explaining WHAT the code does
Code should be self-documenting through naming. Write a comment only for the WHY (a non-obvious constraint, a workaround for a third-party bug, a business invariant).

### No prop drilling beyond 2 levels
If a prop needs to pass through more than 2 components, use a Context or Zustand store.

### One responsibility per component
If a component has more than ~150 lines of JSX, it is doing too much. Extract sub-components.

### No mixed concerns
API calls belong in hooks or stores — not in component bodies. Business logic does not belong in UI components.

### Consistent error handling
Every API mutation must handle errors explicitly. Never silently swallow errors.

```typescript
// Bad
try {
  await createRental(data);
} catch {}

// Good
try {
  await createRental(data);
  toast.success('Rental created');
} catch (error) {
  const message = error?.response?.data?.message ?? 'Something went wrong';
  toast.error(message);
}
```

### No magic numbers or magic strings
Extract to named constants.

```typescript
// Bad
if (status === 3) { ... }

// Good
const RENTAL_STATUS = { PENDING: 1, ACTIVE: 2, RETURNED: 3, CANCELLED: 4 } as const;
if (status === RENTAL_STATUS.RETURNED) { ... }
```

---

## 11. Git Workflow

- Branch naming: `feat/[short-description]`, `fix/[short-description]`, `chore/[short-description]`
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat: add rental detail page`
  - `fix: correct date calculation for late returns`
  - `chore: update dependencies`
- One feature per PR. PRs should be reviewable in under 30 minutes.
- Never push directly to `main`. All changes go through pull requests.
- Squash commits on merge to keep history clean.
