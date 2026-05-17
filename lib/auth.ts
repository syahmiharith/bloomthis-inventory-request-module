import { cookies } from "next/headers";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { AuthorizationError, NotFoundError } from "./errors";

const DEMO_USER_COOKIE = "demo-user-email";
const DEMO_USERS: User[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Evan Employee",
    email: "employee@inventory.local",
    role: "employee",
    department: "Marketing",
    createdAt: new Date(0),
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Aisha Admin",
    email: "admin@inventory.local",
    role: "admin",
    department: "Operations",
    createdAt: new Date(0),
  },
];

export const getDemoUsers = cache(async function getDemoUsers() {
  return withFallback(
    db.select().from(users).orderBy(users.role, users.name),
    DEMO_USERS,
  );
});

export const getCurrentUser = cache(
  async function getCurrentUser(): Promise<User> {
    const cookieStore = await cookies();
    const email =
      cookieStore.get(DEMO_USER_COOKIE)?.value ??
      process.env.DEMO_USER_EMAIL ??
      "admin@inventory.local";
    const [user] = await withFallback(
      db.select().from(users).where(eq(users.email, email)).limit(1),
      [] as User[],
    );

    if (!user) {
      const fallbackUser = DEMO_USERS.find((entry) => entry.email === email);
      if (fallbackUser) {
        return fallbackUser;
      }
      throw new NotFoundError("Current demo user was not found.");
    }

    return user;
  },
);

export async function requireAdmin() {
  const user = await getCurrentUser();
  assertAdminRole(user.role);
  return user;
}

export const demoUserCookieName = DEMO_USER_COOKIE;

export function assertAdminRole(role: User["role"]) {
  if (role !== "admin") {
    throw new AuthorizationError();
  }
}

async function withFallback<T>(promise: Promise<T>, fallback: T) {
  try {
    return await promise;
  } catch (error) {
    if (isStatementTimeout(error)) {
      return fallback;
    }
    throw error;
  }
}

function isStatementTimeout(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if ("code" in error && error.code === "57014") {
    return true;
  }

  if (
    "cause" in error &&
    typeof error.cause === "object" &&
    error.cause !== null &&
    "code" in error.cause &&
    error.cause.code === "57014"
  ) {
    return true;
  }

  return error instanceof Error && error.message.includes("statement timeout");
}
