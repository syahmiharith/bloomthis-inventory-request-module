export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "blue" | "red" | "green" | "amber";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
