"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
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
  onClose,
  requesterName,
}: {
  initialItemId?: string;
  items: RequestableItem[];
  onClose?: () => void;
  requesterName: string;
}) {
  const router = useRouter();
  const firstItemId =
    initialItemId && items.some((item) => item.id === initialItemId)
      ? initialItemId
      : (items[0]?.id ?? "");
  const [dirty, setDirty] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [nextLineIndex, setNextLineIndex] = useState(1);
  const [lines, setLines] = useState([
    { id: "line-0", itemId: firstItemId, quantity: 1 },
  ]);
  const [state, formAction, pending] = useActionState(
    createInventoryRequestAction,
    initialState,
  );
  const selectedIds = lines.map((line) => line.itemId).filter(Boolean);

  function closeCleanForm() {
    if (onClose) {
      onClose();
      return;
    }
    router.push("/requests");
  }

  function closeForm() {
    if (dirty) {
      setShowDiscardDialog(true);
      return;
    }

    closeCleanForm();
  }

  function updateLine(
    lineId: string,
    patch: Partial<{ itemId: string; quantity: number }>,
  ) {
    setDirty(true);
    setLines((current) =>
      current.map((line) =>
        line.id === lineId ? { ...line, ...patch } : line,
      ),
    );
  }

  function addLine() {
    setDirty(true);
    const nextItem = items.find((item) => !selectedIds.includes(item.id));
    setLines((current) => [
      ...current,
      {
        id: `line-${nextLineIndex}`,
        itemId: nextItem?.id ?? "",
        quantity: 1,
      },
    ]);
    setNextLineIndex((current) => current + 1);
  }

  function removeLine(lineId: string) {
    setDirty(true);
    setLines((current) =>
      current.length === 1
        ? current
        : current.filter((line) => line.id !== lineId),
    );
  }

  return (
    <FormModal
      description="Submit an inventory request for admin review."
      disableEscapeClose={showDiscardDialog}
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
            <span>Reason</span>
            <textarea
              aria-invalid={Boolean(state.errors?.reason)}
              className="input textarea"
              name="reason"
              required
            />
            <FieldError message={state.errors?.reason} />
          </label>
        </div>

        <div className="request-lines">
          <div className="request-lines-header">
            <h3>Items</h3>
            <button
              className="button button-secondary button-compact"
              disabled={lines.length >= items.length}
              onClick={addLine}
              type="button"
            >
              Add another item
            </button>
          </div>

          {lines.map((line, index) => {
            const selectedItem = items.find((item) => item.id === line.itemId);
            const duplicate = lines.some(
              (entry, entryIndex) =>
                entryIndex !== index && entry.itemId === line.itemId,
            );
            const exceedsStock =
              selectedItem !== undefined && line.quantity > selectedItem.available;

            return (
              <div className="request-line" key={line.id}>
                <input name="lineId" type="hidden" value={line.id} />
                <label className="field">
                  <span>Item</span>
                  <select
                    aria-invalid={Boolean(
                      state.errors?.[`items.${index}.itemId`] || duplicate,
                    )}
                    className="input"
                    name="itemId"
                    onChange={(event) =>
                      updateLine(line.id, { itemId: event.target.value })
                    }
                    required
                    value={line.itemId}
                  >
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.sku}) - {item.available} available
                        {item.available <= 0 ? " - Out of stock" : ""}
                      </option>
                    ))}
                  </select>
                  <FieldError message={state.errors?.[`items.${index}.itemId`]} />
                  {duplicate ? (
                    <span className="form-message error">
                      Duplicate item lines are not allowed.
                    </span>
                  ) : null}
                </label>

                <div className="field">
                  <span>Available</span>
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
                      state.errors?.[`items.${index}.quantityRequested`],
                    )}
                    className="input"
                    min="1"
                    name="quantityRequested"
                    onChange={(event) =>
                      updateLine(line.id, {
                        quantity: Number(event.target.value),
                      })
                    }
                    required
                    step="1"
                    type="number"
                    value={line.quantity}
                  />
                  <FieldError
                    message={state.errors?.[`items.${index}.quantityRequested`]}
                  />
                </label>

                <button
                  aria-label="Remove item line"
                  className="button button-secondary remove-line"
                  disabled={lines.length === 1}
                  onClick={() => removeLine(line.id)}
                  type="button"
                >
                  Remove
                </button>

                {exceedsStock ? (
                  <p aria-live="polite" className="alert alert-info line-warning">
                    Requested quantity exceeds current stock. Fulfillment will be
                    blocked until enough stock exists.
                  </p>
                ) : null}
              </div>
            );
          })}
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
          onDiscard={onClose}
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
