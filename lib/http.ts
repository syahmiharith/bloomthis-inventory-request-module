import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DomainError } from "./errors";

export function handleRouteError(error: unknown) {
  if (error instanceof DomainError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { error: "Unexpected server error." },
    { status: 500 },
  );
}
