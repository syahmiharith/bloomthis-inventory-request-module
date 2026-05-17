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
  icon,
  label,
  note,
  tone = "neutral",
  value,
}: {
  icon: ReactNode;
  label: string;
  note: string;
  tone?: KpiTone;
  value: number | string;
}) {
  return (
    <article className={`kpi-card tone-${tone}`}>
      <span className="kpi-card-icon">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{note}</span>
      </div>
    </article>
  );
}
