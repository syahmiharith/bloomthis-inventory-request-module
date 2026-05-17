"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

type FormModalProps = {
  children: ReactNode;
  description?: string;
  onClose: () => void;
  title: string;
};

export function FormModal({
  children,
  description,
  onClose,
  title,
}: FormModalProps) {
  return (
    <div className="form-modal-backdrop">
      <section
        aria-describedby={description ? "form-modal-description" : undefined}
        aria-labelledby="form-modal-title"
        aria-modal="true"
        className="form-modal"
        role="dialog"
      >
        <div className="form-modal-header">
          <div>
            <h2 id="form-modal-title">{title}</h2>
            {description ? (
              <p id="form-modal-description">{description}</p>
            ) : null}
          </div>
          <button
            aria-label="Close form"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="form-modal-body">{children}</div>
      </section>
    </div>
  );
}
