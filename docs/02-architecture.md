# Architecture

Browser UI -> Next.js App Router -> API routes -> service layer -> Drizzle ORM -> PostgreSQL

React Server Components render read-heavy pages. Client Components are limited to forms, role switching, and status controls. Business rules remain in services rather than UI components.
