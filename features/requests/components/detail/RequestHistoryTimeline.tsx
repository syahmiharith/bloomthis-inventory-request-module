import type { RequestDetail } from "./types";
import {
  formatDateTime,
  formatHistoryMeta,
  humanize,
  timelineTone,
} from "./utils";

export function RequestHistoryTimeline({
  request,
}: {
  request: NonNullable<RequestDetail>;
}) {
  return (
    <section className="detail-section">
      <div className="detail-section-header">
        <div>
          <h3>Request history</h3>
          <p>Status and creation events for this request.</p>
        </div>
      </div>
      {request.requestHistory.length === 0 ? (
        <p className="empty-state">No history yet.</p>
      ) : (
        <div className="request-history-list" role="list">
          {request.requestHistory.map((entry, index) => (
            <article
              className={`request-history-card ${timelineTone(entry.action)}`}
              key={entry.id}
              role="listitem"
            >
              <div className="timeline-marker" aria-hidden="true">
                <span className="timeline-dot" />
                {index < request.requestHistory.length - 1 ? (
                  <span className="timeline-connector" />
                ) : null}
              </div>
              <div className="request-history-content">
                <div className="request-history-heading">
                  <strong>{humanize(entry.action)}</strong>
                  <time>{formatDateTime(entry.createdAt)}</time>
                </div>
                <p>{formatHistoryMeta(entry)}</p>
                {entry.note ? (
                  <em className="history-note">{entry.note}</em>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
