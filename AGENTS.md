# AGENTS.md

## Project
Build a simple Inventory Request Module using Next.js App Router, TypeScript, PostgreSQL, and Drizzle.

## Core rules
- Build one phase at a time.
- Do not overbuild.
- No real auth; use simple Admin/Employee demo role.
- New requests start as Pending.
- Approve/reject do not deduct stock.
- Fulfill deducts stock only when request is Approved and stock is sufficient.
- Never allow double fulfillment.
- Add request history for request creation and status changes.
- After each phase, run TypeScript/lint/tests if available and output a compact audit.

## Pages
- /
- /inventory
- /inventory/new
- /requests
- /requests/new
- /requests/[id]

## Audit format
Return only:
- Status: PASS/NEEDS FIX
- Files changed
- Checks run
- Issues fixed
- Remaining risks

## Deploying to Vercel

This project is designed to deploy on Vercel as a Next.js App Router application.

### Required Environment Variables

Set these in Vercel Project Settings → Environment Variables:

DATABASE_URL=your_postgres_connection_string

Do not commit `.env` or production secrets.

### Deployment Steps

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Set the required environment variables.
4. Run database migrations against the production database.
5. Deploy the project.
6. Open the deployed URL and verify:
   - `/`
   - `/inventory`
   - `/inventory/new`
   - `/requests`
   - `/requests/new`
   
Deployment rules:
- Keep the app compatible with Vercel deployment.
- Do not commit secrets.
- Required production env var should be documented, especially DATABASE_URL.
- Use server-side database access only.
- Do not expose database env vars to the browser.
- Do not add unnecessary deployment complexity.
- Do not add Docker unless already present.
- Do not run destructive migrations automatically during Vercel build.
- README must include Vercel deployment steps.

Deployment audit should include:
- Production build result
- Required Vercel environment variables
- Database migration/seed instructions for production
- Deployed URL if available
- Any Vercel-specific known issues