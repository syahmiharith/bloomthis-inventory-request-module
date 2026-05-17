"use client";

import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { InventoryItemForm } from "./new/InventoryItemForm";

export function InventoryCreateModalButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="button button-primary button-compact actions"
        onClick={() => setOpen(true)}
        type="button"
      >
        <PlusCircle size={16} />
        Add Item
      </button>
      {open ? <InventoryItemForm onClose={() => setOpen(false)} /> : null}
    </>
  );
}
