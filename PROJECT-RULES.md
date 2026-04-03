# PROJECT RULES — Coach Connect Hub
# AntiGravity SKAL læse dette FØR enhver opgave.

## IDENTITY
- Project: Coach Connect Hub (The Build Method Platform)
- Owner: Oliver Borch — Built By Borch
- Stack: React + Vite + TypeScript + Supabase + Stripe + Vercel + Tailwind
- Supabase Project ID: nlvqrpxszbdpvqzwqifg
- Vercel URL: https://coach-connect-hub-fvr4.vercel.app (Verified Live)
- Design: Ultra-dark (#1a1a2e) + Royal Blue (#2563eb)
- Build Note: Local `npm run build` may fail with EPERM on node_modules; rely on Vercel remote builds for final verification.

## CRITICAL CONSTRAINTS — BREAK THESE AND EVERYTHING BREAKS

### Environment Variables
- This is VITE, not Next.js. All client-side env vars MUST use `VITE_` prefix
- NEVER use `NEXT_PUBLIC_` — it will silently fail and produce blank pages
- NEVER use `process.env` in client code — use `import.meta.env`

### Authentication
- Supabase Auth with email/password
- ALWAYS call `.trim().toLowerCase()` on email before auth calls
- ALWAYS handle the case where signIn succeeds but profile fetch fails
- NEVER redirect to /login inside a component that's already on /login (causes infinite loop)
- Auth state check: use `supabase.auth.onAuthStateChange()` — NEVER poll
- After login: check `session?.user` exists before fetching profile
- If profile doesn't exist: CREATE it with INSERT, don't fail silently

### RLS Policies (Supabase)
- profiles table MUST have an INSERT policy: `auth.uid() = id`
- ALWAYS verify RLS allows the operation BEFORE writing the query
- Test queries in Supabase SQL editor first if unsure
- Common trap: SELECT works, but INSERT/UPDATE fails silently due to missing policy

### Routing
- React Router with SPA routing
- vercel.json must have: `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}`
- Protected routes: check auth THEN check role THEN render
- NEVER render a blank component — always show loading state or error state

### Supabase Queries
- ALWAYS wrap in try/catch
- ALWAYS check `error` before using `data`
- ALWAYS handle `null` data gracefully (show empty state, not crash)
- Pattern:
  ```typescript
  const { data, error } = await supabase.from('table').select('*');
  if (error) { console.error('Query failed:', error); return; }
  if (!data || data.length === 0) { /* show empty state */ }
  ```

## KNOWN BUGS — ALREADY FIXED, DO NOT REINTRODUCE

### Bug #1: Blank page after Vercel deploy
- Cause: NEXT_PUBLIC_ env vars instead of VITE_
- Fix: Use VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
- NEVER change env var prefixes

### Bug #2: Login 400 invalid_credentials
- Cause: Email not trimmed/lowercased, OR user doesn't exist in auth.users
- Fix: .trim().toLowerCase() on email, proper error messages to user

### Bug #3: Login redirect loop
- Cause: Auth check redirects to /login, which triggers auth check, which redirects
- Fix: If already on /login page, do NOT redirect. Check `pathname` first.

### Bug #4: /coach blank after login
- Cause: Profile fetch fails (missing RLS INSERT policy), component receives null, renders nothing
- Fix: INSERT policy on profiles, null checks, loading/error states on ALL pages

### Bug #5: Git interactive rebase stuck
- Cause: AI started interactive rebase without ability to complete it
- Fix: NEVER use `git rebase -i`. Use `git rebase` (non-interactive) or `git merge`.

## ANTI-LOOP RULES — READ THIS CAREFULLY

1. Before starting ANY task, state what you're about to do and WHY
2. Before editing a file, read it FIRST. Never edit blind.
3. If an approach fails ONCE, do NOT try the same approach again. Try a DIFFERENT approach.
4. If you've tried 3 different approaches and all failed: STOP. Report what you tried and what failed. Ask for guidance.
5. NEVER start a new feature if existing features are broken. Fix first, build second.
6. After EVERY code change: build the project (`npm run build`). If build fails, fix it BEFORE moving on.
7. After EVERY deployment: verify the live URL loads correctly.
8. Keep a mental log of what you've already tried in this session. Reference it before trying again.
9. If you see an error you've seen before in this session: the previous fix didn't work. Try something fundamentally different.
10. NEVER use `git rebase -i`, `git add -i`, or any interactive git command.

## DEPLOYMENT CHECKLIST — BEFORE EVERY PUSH

- [ ] `npm run build` passes with 0 errors
- [ ] All env vars use VITE_ prefix
- [ ] No `console.log` with sensitive data
- [ ] Auth flow tested: login → dashboard → logout → login
- [ ] All pages have loading and error states (no blank screens)
- [ ] RLS policies allow all necessary operations
- [ ] vercel.json SPA routing in place

## FILE STRUCTURE EXPECTATIONS

```
src/
  components/     # Reusable UI components
  contexts/       # AuthContext, ThemeContext
  hooks/          # Custom React hooks
  pages/
    auth/         # Login.tsx, Register.tsx
    coach/        # CoachDashboard.tsx, ClientList.tsx, etc.
    client/       # ClientDashboard.tsx, Workouts.tsx, etc.
  lib/            # supabaseClient.ts, stripe.ts
  types/          # TypeScript interfaces
  test/           # Test setup and test files
```

## PACKAGES (BUSINESS)
- The System: 1.000 kr/md, 6 mdr binding
- Build Method: 1.500 kr/md, 6 mdr binding
- 3-phase journey: Foundation → Acceleration → Transformation
