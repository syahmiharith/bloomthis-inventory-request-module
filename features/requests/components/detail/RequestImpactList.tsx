import type { ReactNode } from "react";
import type { RequestDetail } from "./types";

export function RequestImpactList({
  request,
}: {
  request: NonNullable<RequestDetail>;
}) {
  return (
    <section className="detail-section">
      <div className="detail-section-header">
        <div>
          <h3>Inventory impact</h3>
          <p>Current stock and fulfillment preview.</p>
        </div>
      </div>
      <div className="request-impact-list">
        {request.items.map((item) => {
          const after = item.availableQuantity - item.requestedQuantity;
          const itemIsShort = after < 0;
          return (
            <article
              className={`request-impact-card ${itemIsShort ? "is-short" : ""}`}
              key={item.id}
            >
              <div>
                <strong>{item.itemName}</strong>
                <span>
                  {item.itemSku} · {item.itemCategory}
                </span>
              </div>
              <div className="request-impact-numbers">
                <ImpactNumber label="Current" value={item.availableQuantity} />
                <ImpactNumber label="Requested" value={item.requestedQuantity} />
                <ImpactNumber
                  label="After"
                  value={
                    itemIsShort ? (
                      <span className="badge badge-stock-insufficient">
                        Short
                      </span>
                    ) : (
                      after
                    )
                  }
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ImpactNumber({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="impact-number">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
