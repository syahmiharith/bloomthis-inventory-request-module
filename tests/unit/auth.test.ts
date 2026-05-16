import { describe, expect, it } from "vitest";
import { assertAdminRole } from "@/lib/auth";
import { AuthorizationError } from "@/lib/errors";

describe("authorization rules", () => {
  it("allows admins to create items and update statuses", () => {
    expect(() => assertAdminRole("admin")).not.toThrow();
  });

  it("blocks employees from admin-only actions", () => {
    expect(() => assertAdminRole("employee")).toThrow(AuthorizationError);
  });
});
