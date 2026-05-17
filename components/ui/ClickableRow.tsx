"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

const interactiveSelector =
  'a, button, input, select, textarea, form, [role="button"], [data-row-action]';

export function ClickableRow({
  children,
  className,
  href,
}: {
  children: ReactNode;
  className?: string;
  href: string;
}) {
  const router = useRouter();

  function shouldIgnoreNavigation(target: EventTarget | null) {
    return target instanceof Element && Boolean(target.closest(interactiveSelector));
  }

  function navigate() {
    router.push(href);
  }

  function handleClick(event: MouseEvent<HTMLTableRowElement>) {
    if (shouldIgnoreNavigation(event.target)) {
      return;
    }
    navigate();
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
      className={`clickable-row ${className ?? ""}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {children}
    </tr>
  );
}
