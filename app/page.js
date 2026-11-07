import { cookies } from "next/headers";
import Dashboard from "./dashboard";
import AuthScreen from "./auth-screen";
import { findSession, getSessionCookieName } from "@/lib/auth";
import { getFinanceSnapshot } from "@/lib/finance";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home() {
  const token = (await cookies()).get(getSessionCookieName())?.value;
  const user = findSession(token);

  return user
    ? <Dashboard user={user} initialFinance={getFinanceSnapshot(user.id)} />
    : <AuthScreen />;
}
