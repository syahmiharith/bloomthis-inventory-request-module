"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type ConfirmDiscardDialogProps = {
  discardHref?: string;
  onDiscard?: () => void;
  onKeepEditing: () => void;
};

export function ConfirmDiscardDialog({
  discardHref,
  onDiscard,
  onKeepEditing,
}: ConfirmDiscardDialogProps) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onKeepEditing();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onKeepEditing]);

  function discard() {
    if (onDiscard) {
      onDiscard();
      return;
    }
    if (discardHref) {
      router.push(discardHref);
    }
  }

  return (
    <div className="confirm-backdrop">
      <section
        aria-labelledby="discard-dialog-title"
        aria-modal="true"
        className="confirm-dialog"
        role="alertdialog"
      >
        <div>
          <h3 id="discard-dialog-title">You have unsaved changes.</h3>
          <p>Discard this form and return to the list?</p>
        </div>
        <div className="button-row form-actions">
          <button
            className="button button-secondary"
            onClick={onKeepEditing}
            type="button"
          >
            Keep editing
          </button>
          <button
            className="button button-danger"
            onClick={discard}
            type="button"
          >
            Discard
          </button>
        </div>
      </section>
    </div>
  );
}
