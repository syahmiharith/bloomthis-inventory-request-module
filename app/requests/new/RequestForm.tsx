"use client";

import { useRouter } from "next/navigation";
import { useActionState, useMemo, useState } from "react";
import { ConfirmDiscardDialog } from "@/components/ui/ConfirmDiscardDialog";
import { FormModal } from "@/components/ui/FormModal";
import {
  createInventoryRequestAction,
  type CreateRequestState,
} from "./actions";

type RequestableItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  available: number;
};

const initialState: CreateRequestState = {};

export function RequestForm({
  initialItemId,
  items,
  requesterName,
}: {
  initialItemId?: string;
  items: RequestableItem[];
  requesterName: string;
}) {
  const router = useRouter();
  const firstItemId =
    initialItemId && items.some((item) => item.id === initialItemId)
      ? initialItemId
      : (items[0]?.id ?? "");
  const [dirty, setDirty] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(firstItemId);
  const [quantity, setQuantity] = useState(1);
  const [state, formAction, pending] = useActionState(
    createInventoryRequestAction,
    initialState,
  );
  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId),
    [items, selectedItemId],
  );
  const exceedsStock =
    selectedItem !== undefined && quantity > selectedItem.available;

  function closeForm() {
    if (dirty) {
      setShowDiscardDialog(true);
      return;
    }

    router.push("/requests");
  }

  return (
    <FormModal
      description="Submit an inventory request for admin review."
      onClose={closeForm}
      title="New Request"
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
            <span>Requester name</span>
            <input
              aria-invalid={Boolean(state.errors?.requesterName)}
              className="input"
              defaultValue={requesterName}
              name="requesterName"
              readOnly
              required
            />
            <FieldError message={state.errors?.requesterName} />
          </label>

          <label className="field">
            <span>Item</span>
            <select
              aria-invalid={Boolean(state.errors?.["items.0.itemId"])}
              className="input"
              name="itemId"
              onChange={(event) => setSelectedItemId(event.target.value)}
              required
              value={selectedItemId}
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.sku}) - {item.available} available
                  {item.available <= 0 ? " - Out of stock" : ""}
                </option>
              ))}
            </select>
            <FieldError message={state.errors?.["items.0.itemId"]} />
          </label>

          <div className="field">
            <span>Available stock</span>
            <div className="input read-only-field">
              {selectedItem
                ? `${selectedItem.available} available`
                : "No item selected"}
            </div>
          </div>

          <label className="field">
            <span>Quantity</span>
            <input
              aria-invalid={Boolean(
                state.errors?.["items.0.quantityRequested"],
              )}
              className="input"
              min="1"
              name="quantityRequested"
              onChange={(event) => setQuantity(Number(event.target.value))}
              required
              step="1"
              type="number"
              value={quantity}
            />
            <FieldError message={state.errors?.["items.0.quantityRequested"]} />
          </label>
        </div>

        {exceedsStock ? (
          <p aria-live="polite" className="alert alert-info">
            Requested quantity exceeds current stock. The request can still be
            submitted, but fulfillment will be blocked until enough stock
            exists.
          </p>
        ) : null}

        <label className="field">
          <span>Reason</span>
          <textarea
            aria-invalid={Boolean(state.errors?.reason)}
            className="input textarea"
            name="reason"
            required
          />
          <FieldError message={state.errors?.reason} />
        </label>

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
            disabled={pending || items.length === 0}
            type="submit"
          >
            {pending ? "Submitting..." : "Submit request"}
          </button>
        </div>
      </form>

      {showDiscardDialog ? (
        <ConfirmDiscardDialog
          discardHref="/requests"
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
