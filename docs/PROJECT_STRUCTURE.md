# StaffHub UI project structure

This structure keeps features isolated, shared code reusable, and layout concerns centralized.

## Current baseline

- `src/app/core` → auth, guards, interceptors, layout shell/header/footer
- `src/app/features/auth` → login and register
- `src/app/components/ess` → ESS feature screens
- `src/app/shared` → reusable UI, directives, services, and common components
- `src/app/routes` → lazy route trees

## Rules for future work

1. New business screens should go inside feature-first folders (`features/<feature-name>`).
2. Keep `core` for app-level concerns only (auth/session/layout/api plumbing).
3. Put reusable widgets in `shared/ui` and keep page logic out of them.
4. Avoid duplicate dashboard locations; keep one dashboard per feature area.
5. For all new pages, build mobile-first:
   - Start with one-column layout.
   - Add `sm/md/lg` breakpoints only where needed.
   - Keep tables wrapped in horizontal scroll containers.
6. Use route-based lazy loading for each feature area.

## Suggested target shape (incremental migration)

```text
src/app
├─ core
│  ├─ auth
│  ├─ layout
│  └─ services
├─ features
│  ├─ auth
│  ├─ ess
│  │  ├─ dashboard
│  │  ├─ attendance
│  │  ├─ leave
│  │  └─ ...
│  └─ hradmin
├─ shared
│  ├─ components
│  ├─ directives
│  ├─ services
│  └─ ui
└─ routes
```
