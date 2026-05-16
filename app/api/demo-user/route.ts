import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { demoUserCookieName, getCurrentUser, getDemoUsers } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";

export async function GET() {
  const [usersList, currentUser] = await Promise.all([
    getDemoUsers(),
    getCurrentUser(),
  ]);
  return NextResponse.json({ users: usersList, currentUser });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, body.email ?? ""))
    .limit(1);

  if (!user) {
    throw new NotFoundError("Demo user not found.");
  }

  const cookieStore = await cookies();
  cookieStore.set(demoUserCookieName, user.email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.json({ currentUser: user });
}
