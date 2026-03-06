# Codebase Improvement Report - Coach Connect Hub

Based on a technical audit of the current architecture, here are 5 key areas where the codebase can be optimized for better performance, maintainability, and scalability.

---

## 1. 🎣 Centralized Query Hooks (TanStack Query)
**Current State:** Components like `ProgramBuilder.tsx`, `NutritionBuilder.tsx`, and `ClientTrainingTab.tsx` all repeat identical Supabase queries (e.g., fetching client lists or active programs).
**Improvement:** Move individual `useQuery` calls into dedicated custom hooks in `src/hooks/queries/`.
- **Benefit:** Ensures cache consistency across the app, reduces boilerplate, and makes it easier to update query logic in one place.

## 2. 🧠 State Management for Complex Builders
**Current State:** Both the Program and Nutrition builders use very large `useState` objects to manage highly nested data (Days -> Exercises or Meals). This makes update logic complex (heavy use of spread operators) and can lead to performance "jank" during re-renders.
**Improvement:** Implement `useReducer` for the builder components or use a lightweight store like **Zustand**.
- **Benefit:** cleaner state transitions, easier debugging of complex form updates, and better performance by isolating updates.

## 3. 🚀 Optimized Supabase Fetching (Nested Selects)
**Current State:** Several components perform sequential `await` calls to fetch related data (e.g., fetching a Program, then its Days, then its Exercises). This creates a "request waterfall" that slows down page loads.
**Improvement:** Utilize PostgREST's nested selection capabilities to fetch entire relational trees in a single request.
- **Example:** `supabase.from('programs').select('*, training_days(*, training_exercises(*))')`.
- **Benefit:** Significantly reduces network latency and eliminates manual data joining in the frontend.

## 4. 🧩 Component Decomposition & UI Reuse
**Current State:** The builder pages are "God Components" (500+ lines) that manage everything from backend logic to complex UI elements like the Exercise Search Picker.
**Improvement:** Extract large UI blocks into standalone, reusable components.
- **Priority:** Create a standalone `ExercisePicker` component and a shared `MacroOverview` component.
- **Benefit:** Smaller, more readable files and the ability to reuse the same Search/Picker logic in other parts of the app (e.g., the Exercise Library page).

## 5. 🏗 Shared Constants & Domain Utilities
**Current State:** Business logic (e.g., calculating macro totals) and constants (e.g., 'foundation', 'acceleration' phases) are often hardcoded or duplicated across files.
**Improvement:** Establish standard `src/constants/` and `src/utils/` directories.
- **Benefit:** Creates a single source of truth for the app's business rules, preventing bugs caused by inconsistent hardcoded strings.
