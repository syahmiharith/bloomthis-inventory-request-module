import { describe, expect, it } from "vitest";
import {
  assertValidRequestTransition,
  canTransitionRequestStatus,
} from "@/lib/utils";

describe("request status transitions", () => {
  it("allows expected transitions", () => {
    expect(canTransitionRequestStatus("pending", "approved")).toBe(true);
    expect(canTransitionRequestStatus("pending", "rejected")).toBe(true);
    expect(canTransitionRequestStatus("approved", "fulfilled")).toBe(true);
    expect(canTransitionRequestStatus("approved", "rejected")).toBe(true);
  });

  it("blocks terminal status changes", () => {
    expect(() =>
      assertValidRequestTransition("fulfilled", "approved"),
    ).toThrow();
    expect(() =>
      assertValidRequestTransition("rejected", "fulfilled"),
    ).toThrow();
    expect(() =>
      assertValidRequestTransition("fulfilled", "fulfilled"),
    ).toThrow();
  });
});
