import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
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
  it("shows the demo user switcher and current viewer summary", () => {
    render(<AppHeader currentUser={users[0]} demoUsers={users} />);
    expect(screen.getByRole("heading", { name: "BloomThis" })).toBeVisible();
    expect(screen.getByText("Viewing as")).toBeVisible();
    expect(screen.getByTestId("profile-summary")).toHaveTextContent("AA");
    expect(screen.getByTestId("profile-summary")).toHaveTextContent("Admin");
  });
});
