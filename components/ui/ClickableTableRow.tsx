"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

const interactiveSelector =
  'a, button, input, select, textarea, form, [role="button"], [data-row-action]';

export function ClickableTableRow({
  children,
  className,
  href,
  selected = false,
}: {
  children: ReactNode;
  className?: string;
  href: string;
  selected?: boolean;
}) {
  const router = useRouter();

  function shouldIgnoreNavigation(target: EventTarget | null) {
    return target instanceof Element && Boolean(target.closest(interactiveSelector));
  }

  function navigate() {
    router.push(href);
  }

  function handleClick(event: MouseEvent<HTMLTableRowElement>) {
    if (!shouldIgnoreNavigation(event.target)) {
      navigate();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (shouldIgnoreNavigation(event.target)) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate();
    }
  }

  return (
    <tr
      aria-current={selected ? "true" : undefined}
      className={`clickable-row ${selected ? "selected" : ""} ${className ?? ""}`.trim()}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {children}
    </tr>
  );
}
