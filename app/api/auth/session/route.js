import { NextResponse } from "next/server";
import { findSession, getSessionCookieName } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  return NextResponse.json({ user: findSession(token) }, {
    headers: { "Cache-Control": "no-store" },
  });
}
