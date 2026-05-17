"use client";

import { type FormEvent, useRef } from "react";
import type { RequestStatus } from "@/lib/constants";

type StatusActionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
  disabledReason?: string;
  fulfillPreview?: string;
  label: string;
  requestId: string;
  status: RequestStatus;
  variant?: "secondary" | "danger";
};

export function StatusActionForm({
  action,
  disabled = false,
  disabledReason,
  fulfillPreview,
  label,
  requestId,
  status,
  variant = "secondary",
}: StatusActionFormProps) {
  const noteRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (disabled) {
      event.preventDefault();
      return;
    }

    if (status === "rejected") {
      const note = window.prompt("Optional rejection note", "");
      if (note === null) {
        event.preventDefault();
        return;
      }
      if (noteRef.current) {
        noteRef.current.value = note.trim();
      }
      return;
    }

    const detail =
      status === "fulfilled" && fulfillPreview ? `\n\n${fulfillPreview}` : "";
    const confirmed = window.confirm(`Confirm ${label.toLowerCase()}?${detail}`);
    if (!confirmed) {
      event.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit}>
      <input name="requestId" type="hidden" value={requestId} />
      <input name="status" type="hidden" value={status} />
      <input name="adminComment" ref={noteRef} type="hidden" />
      <button
        aria-disabled={disabled}
        className={`button button-${variant}`}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        type="submit"
      >
        {label}
      </button>
      {disabled && disabledReason ? (
        <span className="sr-only">{disabledReason}</span>
      ) : null}
    </form>
  );
}
