"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { ConfirmDiscardDialog } from "@/components/ui/ConfirmDiscardDialog";
import { FormModal } from "@/components/ui/FormModal";
import {
  createInventoryItemAction,
  type CreateInventoryItemState,
} from "./actions";

const initialState: CreateInventoryItemState = {};

export function InventoryItemForm() {
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [state, formAction, pending] = useActionState(
    createInventoryItemAction,
    initialState,
  );

  function closeForm() {
    if (dirty) {
      setShowDiscardDialog(true);
      return;
    }

    router.push("/inventory");
  }

  return (
    <FormModal
      description="Create a stock item with a SKU, category, and threshold."
      onClose={closeForm}
      title="Add Inventory Item"
    >
      <form
        action={formAction}
        className="form-panel"
        onChange={() => setDirty(true)}
      >
        {state.message ? (
          <p aria-live="polite" className="form-message error">
            {state.message}
          </p>
        ) : null}

        <div className="form-grid two-column-form">
          <label className="field">
            <span>Item name</span>
            <input
              aria-invalid={Boolean(state.errors?.name)}
              className="input"
              name="name"
              required
            />
            <FieldError message={state.errors?.name} />
          </label>

          <label className="field">
            <span>SKU / code</span>
            <input
              aria-invalid={Boolean(state.errors?.sku)}
              className="input"
              name="sku"
              required
            />
            <FieldError message={state.errors?.sku} />
          </label>

          <label className="field">
            <span>Category</span>
            <input
              aria-invalid={Boolean(state.errors?.category)}
              className="input"
              name="category"
              required
            />
            <FieldError message={state.errors?.category} />
          </label>

          <label className="field">
            <span>Quantity available</span>
            <input
              aria-invalid={Boolean(state.errors?.quantityOnHand)}
              className="input"
              min="0"
              name="quantityAvailable"
              required
              step="1"
              type="number"
            />
            <FieldError message={state.errors?.quantityOnHand} />
          </label>

          <label className="field">
            <span>Low-stock threshold</span>
            <input
              aria-invalid={Boolean(state.errors?.reorderPoint)}
              className="input"
              defaultValue="5"
              min="0"
              name="lowStockThreshold"
              step="1"
              type="number"
            />
            <FieldError message={state.errors?.reorderPoint} />
          </label>
        </div>

        <div className="button-row form-actions">
          <button
            className="button button-secondary"
            onClick={closeForm}
            type="button"
          >
            Cancel
          </button>
          <button
            className="button button-primary"
            disabled={pending}
            type="submit"
          >
            {pending ? "Creating..." : "Create item"}
          </button>
        </div>
      </form>

      {showDiscardDialog ? (
        <ConfirmDiscardDialog
          discardHref="/inventory"
          onKeepEditing={() => setShowDiscardDialog(false)}
        />
      ) : null}
    </FormModal>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <span className="form-message error">{message}</span>;
}
