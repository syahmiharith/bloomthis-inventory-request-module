"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
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
  const firstItemId =
    initialItemId && items.some((item) => item.id === initialItemId)
      ? initialItemId
      : (items[0]?.id ?? "");
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

  return (
    <form action={formAction} className="panel form-panel">
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
            aria-invalid={Boolean(state.errors?.["items.0.quantityRequested"])}
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
          submitted, but fulfillment will be blocked until enough stock exists.
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
        <Link className="button button-secondary" href="/requests">
          Cancel
        </Link>
        <button
          className="button button-primary"
          disabled={pending || items.length === 0}
          type="submit"
        >
          {pending ? "Submitting..." : "Submit request"}
        </button>
      </div>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <span className="form-message error">{message}</span>;
}
