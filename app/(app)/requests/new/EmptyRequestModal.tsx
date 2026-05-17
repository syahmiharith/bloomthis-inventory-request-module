"use client";

import { useRouter } from "next/navigation";
import { FormModal } from "@/components/ui/FormModal";

export function EmptyRequestModal() {
  const router = useRouter();

  return (
    <FormModal
      description="Submit an inventory request for admin review."
      onClose={() => router.push("/requests")}
      title="New Request"
    >
      <div className="empty-modal-state">
        <p className="empty-state">No inventory items are available yet.</p>
        <div className="button-row form-actions">
          <button
            className="button button-secondary"
            onClick={() => router.push("/requests")}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </FormModal>
  );
}
