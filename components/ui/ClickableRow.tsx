import type { ReactNode } from "react";
import { ClickableTableRow } from "./ClickableTableRow";

export function ClickableRow({
  children,
  className,
  href,
  selected,
}: {
  children: ReactNode;
  className?: string;
  href: string;
  selected?: boolean;
}) {
  return (
    <ClickableTableRow className={className} href={href} selected={selected}>
      {children}
    </ClickableTableRow>
  );
}
