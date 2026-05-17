import { cookies } from "next/headers";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { AuthorizationError, NotFoundError } from "./errors";

const DEMO_USER_COOKIE = "demo-user-email";

export const getDemoUsers = cache(async function getDemoUsers() {
  return db.select().from(users).orderBy(users.role, users.name);
});

export const getCurrentUser = cache(
  async function getCurrentUser(): Promise<User> {
    const cookieStore = await cookies();
    const email =
      cookieStore.get(DEMO_USER_COOKIE)?.value ??
      process.env.DEMO_USER_EMAIL ??
      "admin@inventory.local";
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
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
