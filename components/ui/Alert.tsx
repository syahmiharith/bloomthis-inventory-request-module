export function Alert({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "error" | "success";
}) {
  return <div className={`alert alert-${tone}`}>{children}</div>;
}
