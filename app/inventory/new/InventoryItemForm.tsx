"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createInventoryItemAction,
  type CreateInventoryItemState,
} from "./actions";

const initialState: CreateInventoryItemState = {};

export function InventoryItemForm() {
  const [state, formAction, pending] = useActionState(
    createInventoryItemAction,
    initialState,
  );

  return (
    <form action={formAction} className="panel form-panel">
      {state.message ? (
        <p className="form-message error">{state.message}</p>
      ) : null}

      <div className="form-grid two-column-form">
        <label className="field">
          <span>Item name</span>
          <input className="input" name="name" required />
          <FieldError message={state.errors?.name} />
        </label>

        <label className="field">
          <span>SKU / code</span>
          <input className="input" name="sku" required />
          <FieldError message={state.errors?.sku} />
        </label>

        <label className="field">
          <span>Category</span>
          <input className="input" name="category" required />
          <FieldError message={state.errors?.category} />
        </label>

        <label className="field">
          <span>Quantity available</span>
          <input
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
        <Link className="button button-secondary" href="/inventory">
          Cancel
        </Link>
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Creating..." : "Create item"}
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
