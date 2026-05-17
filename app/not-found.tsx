import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-state db-free-not-found">
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
      <Link className="button button-primary" href="/">
        Back to dashboard
      </Link>
    </main>
  );
}
