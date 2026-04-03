# PHASE 1 AUDIT: Codebase Health Check

## Supabase & Security

### 1. Query Error Handling & try/catch
- **Finding**: Most `useQuery` calls in the frontend (e.g., `ExerciseLibrary.tsx`, `ClientDetail.tsx`) include error throwing within the `queryFn`, which is handled by React Query. However, some components (e.g., `ClientCheckinsTab.tsx`) do not explicitly use the `error` or `isLoading` states from `useQuery`, potentially leading to a silent failure UI (showing empty lists instead of error messages).
- **Finding**: Mutations generally follow the pattern `if (error) throw error;` with toast notifications for feedback, which is robust.
- **Recommendation**: Ensure all `useQuery` hooks destructure and handle `error` and `isLoading` to provide better UX on network failures.

### 2. RLS Policies
- **Finding**: Policies for the `profiles` table are well-implemented, and recursive issues have been fixed using a `SECURITY DEFINER` function (`is_coach()`).
- **Finding**: The audit focused on `profiles`. A deeper dive into other tables (e.g., `training_programs`, `weekly_checkins`) is needed to ensure they all have strict RLS that validates the `coach_id` or `client_id` relationship.
- **Recommendation**: Audit RLS for all client-facing tables to ensure clients cannot access each other's data even if they know the UUID.

---

## Frontend Performance Bottlenecks

### 1. `ClientDetail.tsx` & Data Fetching
- **Finding (Duplicate Fetching)**: `ClientDetail.tsx` fetches `weekly_checkins` for the overview, AND `ClientCheckinsTab.tsx` re-fetches the exact same data. While React Query caches, this is redundant logic.
- **Finding (Heavy Tabs)**: All tab components are imported at the top of `ClientDetail.tsx`. While they only render conditionally, their code is bundled together.
- **Recommendation**: Move common data to a shared query or lift state if necessary. Consider lazy loading tab components if the bundle size for `ClientDetail` becomes too large.

### 2. Pagination & Lazy Loading
- **Finding (Check-ins)**: `ClientCheckinsTab.tsx` fetches *all* submitted/reviewed check-ins without pagination. For long-term clients (1+ year), this could be 50+ detailed records.
- **Finding (Workout Logs)**: `ClientTrainingTab.tsx` fetches up to 500 workout logs and processes them on the client side using `useMemo`. This is a performance risk as the database grows.
- **Finding (Exercises)**: `ExerciseLibrary.tsx` fetches the entire exercise library at once.
- **Recommendation**: Implement server-side pagination for check-ins and workout logs. Limit the initial load of the exercise library and add "Load More" functionality or virtualized lists.

### 3. Missing UI States
- **Finding**: Some tabs lack skeleton loaders or specific error boundaries, leading to layout shifts or "no data" messages appearing briefly before data arrives.

---

## Stripe & Auth Resilience

### 1. Stripe Webhook Handler
- **Finding (Security Fallback)**: In `supabase/functions/stripe-webhook/index.ts`, if `STRIPE_WEBHOOK_SECRET` is missing, the code falls back to `JSON.parse(body)` without signature verification. 
- **Finding (Robustness)**: The handler correctly uses the `service_role` key and handles the primary subscription lifecycle events (`completed`, `succeeded`, `failed`, `updated`, `deleted`).
- **Recommendation**: Remove the insecure fallback for production. Signature verification should be mandatory.

### 2. Auth Flow & Redirects
- **Finding**: Redirects are correctly centralized in `App.tsx` and `AppRoutes`.
- **Finding**: The onboarding logic in `ClientRoutes` is a conditional render rather than a redirect, which keeps the URL clean but effectively acts as a global guard.
- **Recommendation**: Maintain this centralized structure. Ensure `mustChangePassword` is always checked before other routes.
