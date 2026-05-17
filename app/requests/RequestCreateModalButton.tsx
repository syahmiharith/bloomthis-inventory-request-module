"use client";

import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { RequestForm } from "./new/RequestForm";

type RequestableItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  available: number;
};

export function RequestCreateModalButton({
  items,
  requesterName,
}: {
  items: RequestableItem[];
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
          items={items}
          onClose={() => setOpen(false)}
          requesterName={requesterName}
        />
      ) : null}
    </>
  );
}
