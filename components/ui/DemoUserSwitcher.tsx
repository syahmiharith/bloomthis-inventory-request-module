"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select } from "./Select";

type DemoUser = {
  id: string;
  name: string;
  email: string;
  role: "employee" | "admin";
};

export function DemoUserSwitcher({
  initialUsers,
  initialCurrentUser,
}: {
  initialUsers: DemoUser[];
  initialCurrentUser: DemoUser;
}) {
  const router = useRouter();
  const [currentEmail, setCurrentEmail] = useState(initialCurrentUser.email);

  async function handleChange(email: string) {
    await fetch("/api/demo-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setCurrentEmail(email);
    router.refresh();
  }

  return (
    <label className="actions">
      <span className="muted">Viewing as</span>
      <Select
        value={currentEmail}
        onChange={(event) => void handleChange(event.target.value)}
      >
        {initialUsers.map((user) => (
          <option key={user.id} value={user.email}>
            {user.name} ({user.role})
          </option>
        ))}
      </Select>
    </label>
  );
}
