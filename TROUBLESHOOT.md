# Troubleshooting Guide

This document contains solutions for common issues encountered in the Coach Connect Hub project.

## 1. Vercel Issues

### Blank Page on Vercel
- **Environment Variables**: Ensure all variables from `.env.local` are also set in the Vercel Project Settings.
- **vercel.json Routing**: If using a Single Page App (SPA), ensure `vercel.json` has the correct rewrite rule:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- **Build Errors**: Check the Vercel deployment logs for specific TypeScript or Lint errors.
- **Supabase API 401 Fix**: If you see "Invalid API key" or 401 Unauthorized in browser logs, update Vercel ENV variables:
  - `VITE_SUPABASE_URL`: `https://nlvqrpxszbdpvqzwqifg.supabase.co`
  - `VITE_SUPABASE_ANON_KEY`: `sb_publishable_iLKbsICXhcBcqKaf27_E-w_XTtnbdh3`

### Changes Not Showing on Vercel
- **Build Cache**: Trigger a deployment with "Redeploy" -> "Use existing Build Cache" set to OFF.
- **Wrong Branch**: Verify that Vercel is tracking the correct branch (usually `main`).
- **Missing Push**: Ensure you have run `git push origin your-branch`.

---

## 2. Supabase & Auth Issues

### Login/Auth Failures
- **Redirect URLs**: Ensure your Vercel URL is added to the "Redirect URLs" list in Supabase Auth Settings.
- **Email Confirmation**: If enabled, users must confirm their email before logging in.
- **RLS Policies**: Check if there's a Row Level Security policy blocking access to the `profiles` or other tables.

### Connection Issues
- **Invalid Keys**: Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **CORS**: Usually handled by Supabase, but check if custom Edge Functions have correct CORS headers.

---

## 3. Local Environment Issues

### NPM Permission Errors (Mac)
If you see `EPERM` or `permission denied` when running `npm` or `npx`:
```bash
sudo chown -R $(whoami):admin ~/.npm
sudo chown -R $(whoami):admin /usr/local/lib/node_modules
# OR the specific fix:
sudo chown -R 501:20 "/Users/oliverandreborchrojas/.npm"
```

### TypeScript Build Errors
- Run `npx tsc --noEmit` to find errors without building.
- Common fix: Ensure all dependencies are installed (`npm install`).

---

## 4. Debugging Tools for AntiGravity
- **Browser Subagent**: Use for testing live URLs and checking console logs.
- **Terminal Logs**: Always check the output of `npm run dev` and Vercel build logs.
- **Git Status**: Use `git status` frequently to track pending changes.
