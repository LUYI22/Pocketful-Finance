import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findSession, getSessionCookieName, isSameOrigin } from "@/lib/auth";
import {
  addFinanceAccount,
  addFinanceBill,
  addFinanceBudget,
  addFinanceGoal,
  addFinanceTransaction,
  getFinanceSnapshot,
  markFinanceBillPaid,
  setFinanceMode,
} from "@/lib/finance";

export const runtime = "nodejs";

const ERROR_MESSAGES = {
  INVALID_ACCOUNT_NAME: "Enter an account name (up to 60 characters).",
  INVALID_ACCOUNT: "Choose an account.",
  INVALID_ACCOUNT_TYPE: "Choose an account type.",
  INVALID_ACCOUNT_NOT_FOUND: "That account could not be found.",
  ACCOUNT_NOT_FOUND: "That account could not be found.",
  ACCOUNT_NAME_TAKEN: "You already have an account with that name.",
  INVALID_BALANCE: "Enter a valid opening balance.",
  INVALID_TRANSACTION_NAME: "Enter a transaction description (up to 100 characters).",
  INVALID_AMOUNT: "Enter a valid positive amount.",
  INVALID_TRANSACTION_DATE: "Choose a valid transaction date.",
  INVALID_TRANSACTION_TYPE: "Choose income or expense.",
  INVALID_CATEGORY: "Choose a supported category.",
  CATEGORY_TYPE_MISMATCH: "Income transactions must use the Income category.",
  INVALID_BILL_NAME: "Enter a bill name (up to 100 characters).",
  INVALID_DUE_DATE: "Choose a valid bill due date.",
  INVALID_BILL: "That bill could not be found.",
  BILL_NOT_FOUND: "That unpaid bill could not be found.",
  INVALID_MODE: "Choose demo or real mode.",
  BUDGET_ALREADY_EXISTS: "You already have a budget for that category.",
  INVALID_GOAL_NAME: "Enter a goal name (up to 80 characters).",
  INVALID_SAVED_AMOUNT: "Enter a saved amount between zero and the goal target.",
};

async function getAuthenticatedUser() {
  const token = (await cookies()).get(getSessionCookieName())?.value;
  return findSession(token);
}

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON request is required." }, { status: 400 });
  }

  try {
    switch (body?.action) {
      case "set-mode":
        setFinanceMode(user.id, body.mode);
        break;
      case "add-account":
        addFinanceAccount(user.id, body.account);
        break;
      case "add-transaction":
        addFinanceTransaction(user.id, body.transaction);
        break;
      case "add-bill":
        addFinanceBill(user.id, body.bill);
        break;
      case "pay-bill":
        markFinanceBillPaid(user.id, body.billId);
        break;
      case "add-budget":
        addFinanceBudget(user.id, body.budget);
        break;
      case "add-goal":
        addFinanceGoal(user.id, body.goal);
        break;
      default:
        return NextResponse.json({ error: "Choose a supported finance action." }, { status: 400 });
    }

    return NextResponse.json(getFinanceSnapshot(user.id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const message = ERROR_MESSAGES[code];
    if (message) return NextResponse.json({ error: message }, { status: 400 });
    console.error("Finance data update failed:", error);
    return NextResponse.json({ error: "We couldn’t save that change. Please try again." }, { status: 500 });
  }
}
