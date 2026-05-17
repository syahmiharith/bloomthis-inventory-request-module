"use client";

import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { RequestForm } from "./RequestForm";

export function RequestCreateModalButton({
  requesterName,
}: {
  requesterName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="button button-primary button-compact actions"
        onClick={() => setOpen(true)}
        type="button"
      >
        <PlusCircle size={16} />
        Create Request
      </button>
      {open ? (
        <RequestForm
          onClose={() => setOpen(false)}
          requesterName={requesterName}
        />
      ) : null}
    </>
  );
}
