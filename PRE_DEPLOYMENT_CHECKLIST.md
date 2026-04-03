# Pre-Deployment Checklist

Run these steps **EXACTLY** as written before every git push or deployment.

## 1. Local Validation
- [ ] **Cloud Build Verification**: Push to GitHub and verify that the Vercel build completes without errors.
- [ ] **Zero Lint Errors**: Run `npm run lint` (if configured).
- [ ] **Local Test**: Run `npm run dev` and verify the feature works on `localhost`.

## 2. Git Safety
- [ ] **Git Status**: Run `git status`. Ensure no unexpected files are being tracked.
- [ ] **Commit Message**: Write a descriptive commit message.
- [ ] **Correct Branch**: Verify you are on the intended branch (`git branch`).

## 3. Deployment & Live Verification
- [ ] **Git Push**: Push the code to the remote repository.
- [ ] **Vercel Build**: Monitor the Vercel dashboard until the build is "Ready".
- [ ] **Live Test**: Open the production/preview URL in a browser.
- [ ] **Auth Check**: Specifically test the Login/Logout flow on the live site.
- [ ] **Console Check**: Open DevTools on the live site and ensure no red errors appear.

---

> [!IMPORTANT]
> Skip any step, and you risk a production outage. Follow the BLAST Framework.
