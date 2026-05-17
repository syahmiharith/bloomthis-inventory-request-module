import { RequestDetailHero } from "./RequestDetailHero";
import { RequestHistoryTimeline } from "./RequestHistoryTimeline";
import { RequestImpactList } from "./RequestImpactList";
import type { RequestDetail } from "./types";

export function RequestDetailPanel({
  query,
  request,
}: {
  isAdmin: boolean;
  query?: { error?: string; success?: string };
  request: NonNullable<RequestDetail>;
}) {
  const totalQuantity = request.items.reduce(
    (sum, item) => sum + item.requestedQuantity,
    0,
  );

  return (
    <div className="request-detail-sheet" data-testid="request-detail-panel">
      {query?.success ? (
        <p aria-live="polite" className="alert alert-success">
          {query.success}
        </p>
      ) : null}

      {query?.error ? (
        <p aria-live="polite" className="alert alert-error">
          {query.error}
        </p>
      ) : null}

      <RequestDetailHero request={request} totalQuantity={totalQuantity} />

      <section className="request-reason-card">
        <span>Reason</span>
        <p title={request.reason}>{request.reason}</p>
      </section>

      <RequestImpactList request={request} />
      <RequestHistoryTimeline request={request} />
    </div>
  );
}
