import { NextResponse } from "next/server";
import { getSessionCookieName, isSameOrigin, revokeSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  const cookieName = getSessionCookieName();
  revokeSession(request.cookies.get(cookieName)?.value);
  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}
