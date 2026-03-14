# Debug Checklist — MANDATORY before every push

1. Run `npm run build` — fix ALL errors before proceeding
2. Test on localhost in browser subagent — verify the change works
3. git add, commit, and push to main branch
4. Wait for Vercel to build — check build logs for errors
5. Test the live URL (coach-connect-hub-fvr4.vercel.app) in browser subagent
6. If Vercel shows blank page: check Environment Variables, vercel.json, build output
7. If changes dont appear on Vercel: redeploy without build cache
8. NEVER say "done" until you have verified the live site works
9. If any step fails: stop, diagnose, fix, and restart from step 1
