import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppHeader } from "@/components/layout/AppHeader";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ refresh: vi.fn() }),
}));

const users = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Aisha Admin",
    email: "admin@inventory.local",
    role: "admin" as const,
    department: "Operations",
    createdAt: new Date(),
  },
];

describe("AppHeader", () => {
  it("shows an avatar button and opens a profile dropdown", () => {
    render(<AppHeader currentUser={users[0]} demoUsers={users} />);
    expect(screen.getByTestId("profile-avatar-button")).toHaveTextContent("AA");
    fireEvent.click(screen.getByTestId("profile-avatar-button"));
    expect(screen.getByTestId("profile-dropdown")).toHaveTextContent(
      "Aisha Admin",
    );
    expect(screen.getByTestId("profile-dropdown")).toHaveTextContent(
      "Operations Admin",
    );
  });
});
