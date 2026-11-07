import { getDatabase } from "./auth";

const CATEGORIES = new Set([
  "Groceries",
  "Food & drink",
  "Housing",
  "Transport",
  "Shopping",
  "Health",
  "Entertainment",
  "Income",
  "Bills",
  "Other",
]);

const ACCOUNT_TYPES = new Set(["Checking", "Savings", "Cash", "Credit", "Investments", "Other"]);

function requireText(value, label, maxLength = 100) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
    throw new Error(`INVALID_${label.toUpperCase()}`);
  }
  return value.trim();
}

function toCents(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) {
    throw new Error("INVALID_AMOUNT");
  }
  return Math.round(amount * 100);
}

function toOpeningCents(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || Math.abs(amount) > 100_000_000) {
    throw new Error("INVALID_BALANCE");
  }
  return Math.round(amount * 100);
}

function requireDate(value, label) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`INVALID_${label.toUpperCase()}`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`INVALID_${label.toUpperCase()}`);
  }
  return value;
}

function requireOwnedAccount(database, userId, accountId) {
  const id = Number(accountId);
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("INVALID_ACCOUNT");
  const account = database.prepare(
    "SELECT id FROM finance_accounts WHERE id = ? AND user_id = ?"
  ).get(id, userId);
  if (!account) throw new Error("ACCOUNT_NOT_FOUND");
  return id;
}

function getCategoryIcon(category) {
  return {
    Groceries: "bag",
    "Food & drink": "coffee",
    Housing: "home",
    Transport: "car",
    Shopping: "cart",
    Bills: "bolt",
    Income: "arrow-down",
  }[category] || "receipt";
}

function getCategoryColor(category) {
  return {
    Groceries: "mint",
    "Food & drink": "peach",
    Housing: "blue",
    Transport: "yellow",
    Shopping: "lavender",
    Bills: "yellow",
    Income: "lavender",
  }[category] || "blue";
}

export function getFinanceSnapshot(userId) {
  const database = getDatabase();
  database.prepare("INSERT OR IGNORE INTO finance_preferences (user_id) VALUES (?)").run(userId);
  const { mode } = database.prepare(
    "SELECT mode FROM finance_preferences WHERE user_id = ?"
  ).get(userId);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const accounts = database.prepare(`
    SELECT
      account.id,
      account.name,
      account.institution AS bank,
      account.account_type AS type,
      (
        account.opening_balance_cents
        + COALESCE(SUM(CASE WHEN tx.transaction_type = 'income' THEN tx.amount_cents ELSE -tx.amount_cents END), 0)
      ) AS balance_cents
    FROM finance_accounts AS account
    LEFT JOIN finance_transactions AS tx ON tx.account_id = account.id
    WHERE account.user_id = ?
    GROUP BY account.id
    ORDER BY account.id DESC
  `).all(userId).map((account, index) => ({
    id: account.id,
    name: account.name,
    bank: account.bank || "Manual account",
    type: account.type,
    balance: account.balance_cents / 100,
    color: ["mint", "lavender", "peach", "blue", "yellow"][index % 5],
  }));
  const transactions = database.prepare(`
    SELECT id, account_id AS accountId, description AS name, category,
      amount_cents / 100.0 AS amount, transaction_type AS type, happened_on AS date
    FROM finance_transactions
    WHERE user_id = ?
    ORDER BY happened_on DESC, id DESC
    LIMIT 500
  `).all(userId).map((transaction) => ({
    ...transaction,
    icon: getCategoryIcon(transaction.category),
    color: getCategoryColor(transaction.category),
  }));
  const budgets = database.prepare(`
    SELECT budget.id, budget.category, budget.monthly_limit_cents / 100.0 AS monthly_limit,
      COALESCE(SUM(CASE WHEN tx.transaction_type = 'expense' THEN tx.amount_cents ELSE 0 END), 0) / 100.0 AS spent
    FROM finance_budgets AS budget
    LEFT JOIN finance_transactions AS tx
      ON tx.user_id = budget.user_id
      AND tx.category = budget.category
      AND tx.happened_on LIKE ?
    WHERE budget.user_id = ?
    GROUP BY budget.id
    ORDER BY budget.id
  `).all(`${currentMonth}%`, userId).map((budget) => ({
    ...budget,
    limit: budget.monthly_limit,
    color: getCategoryColor(budget.category),
    icon: getCategoryIcon(budget.category),
  }));
  const bills = database.prepare(`
    SELECT id, account_id AS accountId, name, amount_cents / 100.0 AS amount,
      due_date AS dueDate, paid_at AS paidAt
    FROM finance_bills
    WHERE user_id = ?
    ORDER BY paid_at IS NOT NULL, due_date, id
  `).all(userId).map((bill) => ({
    ...bill,
    paid: Boolean(bill.paidAt),
    detail: bill.paidAt ? "Paid" : `Due ${new Date(`${bill.dueDate}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
    icon: "calendar",
    color: getCategoryColor("Bills"),
  }));
  const goals = database.prepare(`
    SELECT id, name, target_cents / 100.0 AS target, saved_cents / 100.0 AS saved
    FROM finance_goals
    WHERE user_id = ?
    ORDER BY id
  `).all(userId).map((goal) => ({
    ...goal,
    icon: "target",
    color: "mint",
  }));

  return { mode, accounts, transactions, budgets, bills, goals };
}

export function setFinanceMode(userId, mode) {
  if (mode !== "demo" && mode !== "real") throw new Error("INVALID_MODE");
  getDatabase().prepare(`
    INSERT INTO finance_preferences (user_id, mode) VALUES (?, ?)
    ON CONFLICT(user_id) DO UPDATE SET mode = excluded.mode
  `).run(userId, mode);
  return mode;
}

export function addFinanceAccount(userId, input) {
  const database = getDatabase();
  const name = requireText(input?.name, "account_name", 60);
  const institution = typeof input?.institution === "string" ? input.institution.trim().slice(0, 60) : "";
  const type = input?.type;
  if (!ACCOUNT_TYPES.has(type)) throw new Error("INVALID_ACCOUNT_TYPE");
  const openingBalanceCents = toOpeningCents(input?.openingBalance);
  try {
    const result = database.prepare(`
      INSERT INTO finance_accounts (user_id, name, institution, account_type, opening_balance_cents)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, name, institution, type, openingBalanceCents);
    return Number(result.lastInsertRowid);
  } catch (error) {
    if (error?.code === "SQLITE_CONSTRAINT_UNIQUE") throw new Error("ACCOUNT_NAME_TAKEN");
    throw error;
  }
}

export function addFinanceTransaction(userId, input) {
  const database = getDatabase();
  const accountId = requireOwnedAccount(database, userId, input?.accountId);
  const description = requireText(input?.name, "transaction_name", 100);
  const category = input?.category;
  const type = input?.type;
  if (!CATEGORIES.has(category) || category === "Bills") throw new Error("INVALID_CATEGORY");
  if (type !== "income" && type !== "expense") throw new Error("INVALID_TRANSACTION_TYPE");
  if ((type === "income") !== (category === "Income")) throw new Error("CATEGORY_TYPE_MISMATCH");
  const amountCents = toCents(input?.amount);
  const happenedOn = requireDate(input?.date, "transaction_date");
  const result = database.prepare(`
    INSERT INTO finance_transactions
      (user_id, account_id, description, category, amount_cents, transaction_type, happened_on)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, accountId, description, category, amountCents, type, happenedOn);
  return Number(result.lastInsertRowid);
}

export function addFinanceBill(userId, input) {
  const database = getDatabase();
  const accountId = requireOwnedAccount(database, userId, input?.accountId);
  const name = requireText(input?.name, "bill_name", 100);
  const amountCents = toCents(input?.amount);
  const dueDate = requireDate(input?.dueDate, "due_date");
  const result = database.prepare(`
    INSERT INTO finance_bills (user_id, account_id, name, amount_cents, due_date)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, accountId, name, amountCents, dueDate);
  return Number(result.lastInsertRowid);
}

export function markFinanceBillPaid(userId, billId) {
  const database = getDatabase();
  const id = Number(billId);
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("INVALID_BILL");
  const pay = database.transaction(() => {
    const bill = database.prepare(`
      SELECT id, account_id, name, amount_cents, due_date
      FROM finance_bills
      WHERE id = ? AND user_id = ? AND paid_at IS NULL
    `).get(id, userId);
    if (!bill) throw new Error("BILL_NOT_FOUND");
    const paidAt = new Date().toISOString();
    database.prepare("UPDATE finance_bills SET paid_at = ? WHERE id = ? AND user_id = ?").run(paidAt, id, userId);
    database.prepare(`
      INSERT INTO finance_transactions
        (user_id, account_id, description, category, amount_cents, transaction_type, happened_on, source_bill_id)
      VALUES (?, ?, ?, 'Bills', ?, 'expense', ?, ?)
    `).run(userId, bill.account_id, bill.name, bill.amount_cents, paidAt.slice(0, 10), id);
  });
  pay();
}

export function addFinanceBudget(userId, input) {
  const database = getDatabase();
  const category = input?.category;
  if (!CATEGORIES.has(category) || category === "Income" || category === "Bills") {
    throw new Error("INVALID_CATEGORY");
  }
  const limitCents = toCents(input?.limit);
  try {
    const result = database.prepare(`
      INSERT INTO finance_budgets (user_id, category, monthly_limit_cents)
      VALUES (?, ?, ?)
    `).run(userId, category, limitCents);
    return Number(result.lastInsertRowid);
  } catch (error) {
    if (error?.code === "SQLITE_CONSTRAINT_UNIQUE") throw new Error("BUDGET_ALREADY_EXISTS");
    throw error;
  }
}

export function addFinanceGoal(userId, input) {
  const name = requireText(input?.name, "goal_name", 80);
  const targetCents = toCents(input?.target);
  const savedCents = input?.saved === undefined || input.saved === "" ? 0 : toOpeningCents(input.saved);
  if (savedCents < 0 || savedCents > targetCents) throw new Error("INVALID_SAVED_AMOUNT");
  const result = getDatabase().prepare(`
    INSERT INTO finance_goals (user_id, name, target_cents, saved_cents)
    VALUES (?, ?, ?, ?)
  `).run(userId, name, targetCents, savedCents);
  return Number(result.lastInsertRowid);
}
