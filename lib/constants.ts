export const REQUEST_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "fulfilled",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const USER_ROLES = ["employee", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const REQUEST_PRIORITIES = ["low", "normal", "high"] as const;
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];
