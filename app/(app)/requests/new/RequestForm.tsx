"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import { ConfirmDiscardDialog } from "@/components/ui/ConfirmDiscardDialog";
import { FormModal } from "@/components/ui/FormModal";
import {
  createInventoryRequestAction,
  type CreateRequestState,
} from "./actions";

type RequestableItem = {
  available: number;
  category: string;
  id: string;
  name: string;
  sku: string;
};

const initialState: CreateRequestState = {};
const itemPageSize = 25;

export function RequestForm({
  initialItemId,
  onClose,
  requesterName,
}: {
  initialItemId?: string;
  onClose?: () => void;
  requesterName: string;
}) {
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [nextLineIndex, setNextLineIndex] = useState(1);
  const [lines, setLines] = useState([
    { id: "line-0", itemId: "", quantity: 1 },
  ]);
  const [itemQuery, setItemQuery] = useState("");
  const [itemPage, setItemPage] = useState(1);
  const [items, setItems] = useState<RequestableItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<
    Record<string, RequestableItem>
  >({});
  const [itemLookup, setItemLookup] = useState({
    error: "",
    loading: true,
    page: 1,
    pageCount: 1,
    totalCount: 0,
  });
  const [state, formAction, pending] = useActionState(
    createInventoryRequestAction,
    initialState,
  );
  const selectedIds = lines.map((line) => line.itemId).filter(Boolean);
  const itemById = useMemo(() => {
    const entries = [...Object.values(selectedItems), ...items].map(
      (item) => [item.id, item] as const,
    );
    return new Map(entries);
  }, [items, selectedItems]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchItems() {
      setItemLookup((current) => ({ ...current, error: "", loading: true }));
      const params = new URLSearchParams({
        page: String(itemPage),
        pageSize: String(itemPageSize),
      });
      if (itemQuery.trim()) params.set("q", itemQuery.trim());
      if (initialItemId) params.set("selectedId", initialItemId);

      try {
        const response = await fetch(`/api/items/requestable?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Unable to load inventory items.");
        }
        const data = (await response.json()) as {
          page: number;
          pageCount: number;
          rows: RequestableItem[];
          totalCount: number;
        };

        setItems(data.rows);
        setSelectedItems((current) => {
          const next = { ...current };
          for (const item of data.rows) {
            next[item.id] = item;
          }
          return next;
        });
        setItemLookup({
          error: "",
          loading: false,
          page: data.page,
          pageCount: data.pageCount,
          totalCount: data.totalCount,
        });
        setLines((current) => {
          if (current[0]?.itemId) {
            return current;
          }
          const initialItem = initialItemId
            ? data.rows.find((item) => item.id === initialItemId)
            : undefined;
          const fallbackItem = data.rows[0];
          const selectedItemId = initialItem?.id ?? fallbackItem?.id ?? "";
          if (!selectedItemId) {
            return current;
          }
          return current.map((line, index) =>
            index === 0 ? { ...line, itemId: selectedItemId } : line,
          );
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setItemLookup((current) => ({
          ...current,
          error:
            error instanceof Error
              ? error.message
              : "Unable to load inventory items.",
          loading: false,
        }));
      }
    }

    fetchItems();
    return () => controller.abort();
  }, [initialItemId, itemPage, itemQuery]);

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
    if (patch.itemId) {
      const selectedItem = itemById.get(patch.itemId);
      if (selectedItem) {
        setSelectedItems((current) => ({
          ...current,
          [selectedItem.id]: selectedItem,
        }));
      }
    }
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

  function lineOptions(lineItemId: string) {
    const result = new Map<string, RequestableItem>();
    const selectedItem = lineItemId ? itemById.get(lineItemId) : undefined;
    if (selectedItem) {
      result.set(selectedItem.id, selectedItem);
    }
    for (const item of items) {
      result.set(item.id, item);
    }
    return Array.from(result.values());
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
              disabled={
                itemLookup.loading ||
                items.every((item) => selectedIds.includes(item.id))
              }
              onClick={addLine}
              type="button"
            >
              Add another item
            </button>
          </div>
          <label className="field">
            <span>Search inventory items</span>
            <input
              className="input"
              onChange={(event) => {
                setItemPage(1);
                setItemQuery(event.target.value);
              }}
              placeholder="Search by name, SKU, or category"
              type="search"
              value={itemQuery}
            />
          </label>
          {itemLookup.error ? (
            <p aria-live="polite" className="form-message error">
              {itemLookup.error}
            </p>
          ) : null}
          {itemLookup.loading ? (
            <p aria-live="polite" className="muted">
              Loading available inventory items...
            </p>
          ) : null}

          {lines.map((line, index) => {
            const options = lineOptions(line.itemId);
            const selectedItem = line.itemId
              ? itemById.get(line.itemId)
              : undefined;
            const duplicate = lines.some(
              (entry, entryIndex) =>
                entryIndex !== index && entry.itemId === line.itemId,
            );
            const exceedsStock =
              selectedItem !== undefined &&
              line.quantity > selectedItem.available;

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
                    disabled={itemLookup.loading || options.length === 0}
                    name="itemId"
                    onChange={(event) =>
                      updateLine(line.id, { itemId: event.target.value })
                    }
                    required
                    value={line.itemId}
                  >
                    {options.length === 0 ? (
                      <option value="">No matching items</option>
                    ) : null}
                    {options.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.sku}) - {item.available} available
                        {item.available <= 0 ? " - Out of stock" : ""}
                      </option>
                    ))}
                  </select>
                  <FieldError
                    message={state.errors?.[`items.${index}.itemId`]}
                  />
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
                  <p
                    aria-live="polite"
                    className="alert alert-info line-warning"
                  >
                    Requested quantity exceeds current stock. Fulfillment will
                    be blocked until enough stock exists.
                  </p>
                ) : null}
              </div>
            );
          })}
          {itemLookup.pageCount > 1 ? (
            <div className="pagination-row compact-pagination">
              <span>
                Showing {items.length} of {itemLookup.totalCount} matches · Page{" "}
                {itemLookup.page} of {itemLookup.pageCount}
              </span>
              <div>
                <button
                  className="button button-secondary button-compact"
                  disabled={itemLookup.page <= 1 || itemLookup.loading}
                  onClick={() =>
                    setItemPage((current) => Math.max(1, current - 1))
                  }
                  type="button"
                >
                  Previous
                </button>
                <button
                  className="button button-secondary button-compact"
                  disabled={
                    itemLookup.page >= itemLookup.pageCount ||
                    itemLookup.loading
                  }
                  onClick={() => setItemPage((current) => current + 1)}
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
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
            disabled={
              pending ||
              itemLookup.loading ||
              lines.some((line) => line.itemId.length === 0)
            }
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
