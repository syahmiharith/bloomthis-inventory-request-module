import Link from "next/link";
import type { ReactNode } from "react";

type KpiTone = "blue" | "green" | "amber" | "red" | "neutral";

export function KpiGrid({
  children,
  testId,
}: {
  children: ReactNode;
  testId?: string;
}) {
  return (
    <section className="kpi-grid" data-testid={testId}>
      {children}
    </section>
  );
}

export function KpiCard({
  footerHref,
  footerLabel = "See more",
  icon,
  label,
  note,
  tone = "neutral",
  value,
}: {
  footerHref?: string;
  footerLabel?: string;
  icon: ReactNode;
  label: string;
  note: string;
  tone?: KpiTone;
  value: number | string;
}) {
  return (
    <article className={`kpi-card tone-${tone}`}>
      <div className="kpi-card-body">
        <span className="kpi-card-icon">{icon}</span>
        <div>
          <p>{label}</p>
          <strong>{value}</strong>
          <span>{note}</span>
        </div>
      </div>
      {footerHref ? (
        <Link className="kpi-card-footer" href={footerHref}>
          {footerLabel}
          <span aria-hidden="true">→</span>
        </Link>
      ) : null}
    </article>
  );
}
