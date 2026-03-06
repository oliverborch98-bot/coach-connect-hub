# Technical Architecture Summary - Coach Connect Hub

Welcome to the technical overview of the Coach Connect Hub. This document outlines the core architecture, data flow, and project structure.

## 🏗 Project Structure

- `src/components`: UI components.
  - `/ui`: Atomic components powered by **shadcn/ui** and **Tailwind CSS**.
  - `/coach`: Business logic components specifically for the coach interface (e.g., training tabs, nutrition tabs).
- `src/pages`: Top-level route components.
  - `/coach`: Dashboard, Client Details, Program/Nutrition Builders, etc.
  - `/client`: Client-facing features like Habits, Training, and Profile.
- `src/layouts`: Persistent UI wrappers.
  - `CoachLayout.tsx`: Sidebar and desktop/mobile navigation for coaches.
  - `ClientLayout.tsx`: Specialized navigation for client users.
- `src/contexts`: Global state management.
  - `AuthContext.tsx`: Handles authentication state, profile fetching, and session persistence using Supabase.
- `src/integrations`: External service configurations.
  - `/supabase`: Supabase logic, including the generated client and TypeScript types.
- `src/hooks`: Custom React hooks (e.g., `use-toast`, `use-mobile`).
- `src/lib`: Core utility functions (e.g., `cn` for class merging).

---

## 🛣 Routing Structure (`App.tsx`)

The application implements **Role-Based Routing** using `react-router-dom`:

- **Public Routes:** Login page.
- **Protected Routes:** Wrapped in `AuthProvider`. 
  - **Coach Path (`/coach/*`):** Requires `role === 'coach'`. Uses `CoachLayout` as a parent route.
  - **Client Path (`/client/*`):** Requires `role === 'client'`. Uses `ClientLayout` as a parent route.
- **Auto-Redirection:** Users are automatically funneled to their respective dashboards based on their role upon authentication.

---

## ⚡️ Supabase Integration

- **Auth:** Managed via `supabase.auth` inside `AuthContext.tsx`.
- **Database:** PostgreSQL on Supabase.
- **Data Fetching:** Handled by **TanStack Query (React Query)** for efficient caching/syncing.
- **Type Safety:** Full TypeScript support via `src/integrations/supabase/types.ts`.
- **Client Access:** Centralized in `@/integrations/supabase/client`.

---

## 🛠 Shared Hooks & Utilities

- **Caching:** `QueryClient` (TanStack Query) ensures data is fetched once and shared across components.
- **UI Feedback:** `useToast` hook for standardized notifications.
- **Responsiveness:** `useMobile` hook for detecting screen sizes and adjusting layouts.
- **Styling:** `cn` utility in `src/lib/utils.ts` for dynamic and predictable Tailwind class merging.

---

## 🔄 Data Flow

1. **Authentication:** User logs in → `AuthContext` detects session → Fetches `profile` (fullName, role) → Updates state.
2. **Navigation:** React Router renders the appropriate `Layout` and `Page`.
3. **Fetching:** Page components use TanStack Query hooks to fetch data via the Supabase client.
4. **Rendering:** Data passed down to feature-specific components.
