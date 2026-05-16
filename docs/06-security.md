# Security

- All mutations use Zod validation.
- Admin-only actions are checked server-side.
- No client-side database access is exposed.
- Raw database errors are converted to friendly user messages.
- Secrets are configured through environment variables.

Authentication is intentionally simulated for the assessment through seeded demo users and a server-managed cookie.
