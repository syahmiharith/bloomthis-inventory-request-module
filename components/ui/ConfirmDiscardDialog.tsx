"use client";

import { useRouter } from "next/navigation";

type ConfirmDiscardDialogProps = {
  discardHref: string;
  onKeepEditing: () => void;
};

export function ConfirmDiscardDialog({
  discardHref,
  onKeepEditing,
}: ConfirmDiscardDialogProps) {
  const router = useRouter();

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
            onClick={() => router.push(discardHref)}
            type="button"
          >
            Discard
          </button>
        </div>
      </section>
    </div>
  );
}
