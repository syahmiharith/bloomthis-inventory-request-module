"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

type FormModalProps = {
  children: ReactNode;
  description?: string;
  disableEscapeClose?: boolean;
  onClose: () => void;
  title: string;
};

export function FormModal({
  children,
  description,
  disableEscapeClose = false,
  onClose,
  title,
}: FormModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || disableEscapeClose) {
        return;
      }
      event.preventDefault();
      onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disableEscapeClose, onClose]);

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
            ref={closeButtonRef}
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
