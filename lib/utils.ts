import type { RequestStatus } from "./constants";
import { DomainError } from "./errors";

const allowedTransitions: Record<RequestStatus, RequestStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["fulfilled", "rejected"],
  rejected: [],
  fulfilled: [],
};

export function canTransitionRequestStatus(
  fromStatus: RequestStatus,
  toStatus: RequestStatus,
) {
  return allowedTransitions[fromStatus].includes(toStatus);
}

export function assertValidRequestTransition(
  fromStatus: RequestStatus,
  toStatus: RequestStatus,
) {
  if (!canTransitionRequestStatus(fromStatus, toStatus)) {
    throw new DomainError(
      `Cannot change request status from ${fromStatus} to ${toStatus}.`,
    );
  }
}
