export type RequestDetail = Awaited<
  ReturnType<
    typeof import("@/features/requests/services/request.service").getRequestById
  >
>;
