# StaffHub Frontend Structure

## Core
- `core/layout/app-shell/`  
  Application shell layout (sidebar + header + content outlet).

## Features
- `features/auth/pages/login-page/`  
  Login and auth-facing pages.
- `features/workspace/pages/workspace-page/`  
  Dashboard and module page containers.

## Shared
- `shared/ui/navigation/app-header/`  
  Reusable design/navigation components.
- `shared/services/`  
  API and utility services.
- `shared/directives/`  
  Common directives.

## Conventions
- Put business/domain pages in `features/*`.
- Put reusable visual components in `shared/ui/*`.
- Keep app-wide layout, interceptors, guards, config in `core/*`.
