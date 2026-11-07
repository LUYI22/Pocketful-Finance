import { NextResponse } from "next/server";
import {
  getSessionCookieName,
  getSessionLifetime,
  isSameOrigin,
  issueSession,
  validateCredentials,
  verifyUser,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON request is required." }, { status: 400 });
  }

  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = body?.password;
  const validationError = validateCredentials(username, password);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  try {
    const user = await verifyUser(username, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const session = issueSession(user.id);
    const response = NextResponse.json({ user: { username: user.username } });
    response.cookies.set(getSessionCookieName(), session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: getSessionLifetime(),
      expires: new Date(session.expiresAt * 1000),
    });
    return response;
  } catch (error) {
    console.error("Account login failed:", error);
    return NextResponse.json({ error: "We couldn’t sign you in. Please try again." }, { status: 500 });
  }
}
