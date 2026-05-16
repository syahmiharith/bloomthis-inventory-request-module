"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-state">
      <p>Unable to load inventory requests.</p>
      <button className="button button-secondary" onClick={reset} type="button">
        Try again
      </button>
    </div>
  );
}
