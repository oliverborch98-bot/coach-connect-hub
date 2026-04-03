# Agent Operations Protocol

This document defines the strict communication and verification protocol that I (AntiGravity) must follow after every change.

## Post-Change Protocol
After making any code changes, I must provide a summary to the user containing:

1.  **Change Summary**: Exactly what was changed (files and logic).
2.  **Manual Actions**: Any steps the user needs to take (e.g., "Run this SQL", "Update this Vercel Secret").
3.  **Redeploy Requirement**: State clearly if a redeploy is needed.
4.  **Verification Result**: Evidence that the change works (Terminal output or Browser subagent report).

## Debugging Standards
- If a build fails, I must analyze the **entire** build log.
- If a live site fails, I must use the **Browser Subagent** to capture console and network logs.
- I must check `git status` before and after every major task.
