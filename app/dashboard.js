"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { puter } from "@heyputer/puter.js";

const INITIAL_ACCOUNTS = [
  { name: "Everyday checking", bank: "Northstar Bank", balance: 8420.5, type: "Checking", color: "mint" },
  { name: "High-yield savings", bank: "Northstar Bank", balance: 15840.44, type: "Savings", color: "lavender" },
  { name: "Investment portfolio", bank: "Acorn Invest", balance: 9800, type: "Investments", color: "peach" },
];

const INITIAL_TRANSACTIONS = [
  { id: 1, name: "Whole Foods Market", category: "Groceries", date: "Today, 10:42 AM", amount: 84.32, type: "expense", icon: "bag", color: "mint" },
  { id: 2, name: "Salary deposit", category: "Income", date: "Today, 9:15 AM", amount: 3120, type: "income", icon: "arrow-down", color: "lavender" },
  { id: 3, name: "Blue Bottle Coffee", category: "Food & drink", date: "Yesterday", amount: 6.8, type: "expense", icon: "coffee", color: "peach" },
  { id: 4, name: "Monthly rent", category: "Housing", date: "Oct 28, 2026", amount: 1850, type: "expense", icon: "home", color: "blue" },
  { id: 5, name: "Uber", category: "Transport", date: "Oct 27, 2026", amount: 24.5, type: "expense", icon: "car", color: "yellow" },
  { id: 6, name: "Trader Joe’s", category: "Groceries", date: "Oct 25, 2026", amount: 299.68, type: "expense", icon: "bag", color: "mint" },
  { id: 7, name: "Dinner with friends", category: "Food & drink", date: "Oct 23, 2026", amount: 239.2, type: "expense", icon: "coffee", color: "peach" },
  { id: 8, name: "Weekend shopping", category: "Shopping", date: "Oct 21, 2026", amount: 318, type: "expense", icon: "cart", color: "lavender" },
  { id: 9, name: "Lyft", category: "Transport", date: "Oct 19, 2026", amount: 199.5, type: "expense", icon: "car", color: "yellow" },
];

const INITIAL_BUDGETS = [
  { category: "Groceries", spent: 384, limit: 600, color: "mint", icon: "bag" },
  { category: "Food & drink", spent: 246, limit: 350, color: "peach", icon: "coffee" },
  { category: "Shopping", spent: 318, limit: 500, color: "lavender", icon: "cart" },
];

const INITIAL_BILLS = [
  { name: "Electricity", detail: "Due in 2 days", amount: 86.4, icon: "bolt", color: "yellow", paid: false },
  { name: "Internet", detail: "Due Nov 12", amount: 65, icon: "wifi", color: "blue", paid: false },
  { name: "Spotify Premium", detail: "Due Nov 15", amount: 10.99, icon: "music", color: "mint", paid: false },
];

const INITIAL_GOALS = [
  { name: "Japan trip", saved: 2140, target: 3500, icon: "plane", color: "peach" },
  { name: "Emergency fund", saved: 8400, target: 10000, icon: "shield", color: "mint" },
];

const SPENDING_COLORS = {
  Housing: "navy",
  Groceries: "mint",
  "Food & drink": "lavender",
  Shopping: "blue",
  Transport: "peach",
  Bills: "yellow",
  Health: "mint",
  Entertainment: "lavender",
  Other: "blue",
};
const COLOR_VALUES = {
  navy: "var(--navy)",
  mint: "var(--mint)",
  lavender: "var(--lavender)",
  blue: "var(--blue)",
  peach: "var(--peach)",
  yellow: "var(--yellow)",
};

const CATEGORIES = ["Groceries", "Food & drink", "Housing", "Transport", "Shopping", "Health", "Entertainment", "Income", "Other"];
const CURRENCY = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const CURRENT_DATE = new Date().toISOString().slice(0, 10);

function Icon({ name, size = 20, strokeWidth = 1.8 }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    chart: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-5 5" /></>,
    wallet: <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 8h18M16 14h2" /><path d="M6 5V3h12v2" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    receipt: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2z" /><path d="M8 8h8M8 12h8M8 16h4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z" transform="translate(-2 -2) scale(1.16)" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    arrowUp: <><path d="M12 19V5M5 12l7-7 7 7" /></>,
    arrowDown: <><path d="M12 5v14M5 12l7 7 7-7" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    bag: <><path d="M5 8h14l1 12H4L5 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
    coffee: <><path d="M5 8h12v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8ZM17 10h1a2 2 0 1 1 0 4h-1M8 3v2M12 3v2M16 3v2" /></>,
    car: <><path d="m5 11 2-5h10l2 5M3 11h18v7H3z" /><path d="M6 18v2M18 18v2M6 14h2M16 14h2" /></>,
    cart: <><path d="M3 4h2l2.4 11.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 8H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></>,
    bolt: <path d="m13 2-3 8H5l6 12 3-9h5L13 2Z" />,
    wifi: <><path d="M5 12.5a11 11 0 0 1 14 0M8 15.5a6.5 6.5 0 0 1 8 0M11 18.5a2 2 0 0 1 2 0" /><circle cx="12" cy="21" r=".7" /></>,
    music: <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
    plane: <path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13" />,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    sparkle: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3ZM19 14l1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1 0l3-3A5 5 0 0 0 13 2.9l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.1 0l-3 3A5 5 0 0 0 11 21.1l1.7-1.7" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    message: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" /></>,
  };

  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths[name] || paths.sparkle}
    </svg>
  );
}

function money(amount) {
  return CURRENCY.format(amount);
}

function displayDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function prepareFinanceSnapshot(snapshot) {
  return snapshot;
}

function getApiError(responseData, response) {
  return responseData?.error || `The request failed (${response.status}). Please try again.`;
}

export default function Dashboard({ user, initialFinance }) {
  const router = useRouter();
  const displayName = user.username.slice(0, 1).toUpperCase() + user.username.slice(1);
  const [financeMode, setFinanceMode] = useState(initialFinance.mode);
  const isDemoMode = financeMode === "demo";
  const [accounts, setAccounts] = useState(isDemoMode ? INITIAL_ACCOUNTS : initialFinance.accounts);
  const [transactions, setTransactions] = useState(isDemoMode ? INITIAL_TRANSACTIONS : prepareFinanceSnapshot(initialFinance).transactions);
  const [budgets, setBudgets] = useState(isDemoMode ? INITIAL_BUDGETS : initialFinance.budgets);
  const [bills, setBills] = useState(isDemoMode ? INITIAL_BILLS : initialFinance.bills);
  const [goals, setGoals] = useState(isDemoMode ? INITIAL_GOALS : initialFinance.goals);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: `Hi ${displayName}! I’m your **Puter AI finance copilot**. Ask for practical ideas based on the financial data you’ve chosen to share.` },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [bankModal, setBankModal] = useState(false);
  const [activeModal, setActiveModal] = useState("");
  const [transactionName, setTransactionName] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionCategory, setTransactionCategory] = useState("Groceries");
  const [transactionType, setTransactionType] = useState("expense");
  const [transactionAccountId, setTransactionAccountId] = useState("");
  const [transactionDate, setTransactionDate] = useState(CURRENT_DATE);
  const [accountName, setAccountName] = useState("");
  const [accountInstitution, setAccountInstitution] = useState("");
  const [accountType, setAccountType] = useState("Checking");
  const [accountBalance, setAccountBalance] = useState("0");
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billDate, setBillDate] = useState(CURRENT_DATE);
  const [billAccountId, setBillAccountId] = useState("");
  const [budgetCategory, setBudgetCategory] = useState("Groceries");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalSaved, setGoalSaved] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [notice, setNotice] = useState("");
  const [activeNav, setActiveNav] = useState("Overview");
  const [chatLoading, setChatLoading] = useState(false);
  const [puterConsent, setPuterConsent] = useState(false);
  const [pendingChat, setPendingChat] = useState("");
  const [isPuterConnected, setIsPuterConnected] = useState(false);

  const reportError = (error) => {
    setNotice(error);
    window.setTimeout(() => setNotice(""), 5000);
  };

  const applyFinanceSnapshot = (snapshot) => {
    const prepared = prepareFinanceSnapshot(snapshot);
    setFinanceMode(prepared.mode);
    setAccounts(prepared.mode === "demo" ? INITIAL_ACCOUNTS : prepared.accounts);
    setTransactions(prepared.mode === "demo" ? INITIAL_TRANSACTIONS : prepared.transactions);
    setBudgets(prepared.mode === "demo" ? INITIAL_BUDGETS : prepared.budgets);
    setBills(prepared.mode === "demo" ? INITIAL_BILLS : prepared.bills);
    setGoals(prepared.mode === "demo" ? INITIAL_GOALS : prepared.goals);
  };

  const saveFinanceAction = async (action, payload = {}) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const result = await response.json();
      if (!response.ok) {
        reportError(getApiError(result, response));
        return false;
      }
      applyFinanceSnapshot(result);
      return true;
    } catch (error) {
      console.error("Saving finance data failed:", error);
      reportError("Unable to reach the server. Your change was not saved.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const totalBalance = accounts.reduce((total, account) => total + account.balance, 0);
  const monthlyTransactions = transactions.filter((item) => isDemoMode || item.date.startsWith(CURRENT_DATE.slice(0, 7)));
  const monthlyIncome = monthlyTransactions.filter((item) => item.type === "income").reduce((total, item) => total + item.amount, 0);
  const monthlySpent = monthlyTransactions.filter((item) => item.type === "expense").reduce((total, item) => total + item.amount, 0);
  const spendingTotals = monthlyTransactions.reduce((result, item) => {
    if (item.type === "expense") {
      const category = SPENDING_COLORS[item.category] ? item.category : "Other";
      result[category] = (result[category] || 0) + item.amount;
    }
    return result;
  }, {});
  const spendingBreakdown = Object.entries(spendingTotals)
    .map(([label, amount]) => ({ label, amount, color: SPENDING_COLORS[label] }))
    .sort((first, second) => second.amount - first.amount);
  let chartPosition = 0;
  const donutGradient = spendingBreakdown.length
    ? `conic-gradient(${spendingBreakdown.map((item) => {
      const start = chartPosition;
      chartPosition += item.amount / monthlySpent * 360;
      return `${COLOR_VALUES[item.color]} ${start}deg ${chartPosition}deg`;
    }).join(", ")})`
    : "conic-gradient(#f0f3ef 0deg 360deg)";
  const filteredTransactions = useMemo(() => transactions.filter((item) => (
    `${item.name} ${item.category}`.toLowerCase().includes(search.toLowerCase())
  )), [transactions, search]);

  const addTransaction = async (event) => {
    event.preventDefault();
    const amount = Number(transactionAmount);
    if (!transactionName.trim() || !Number.isFinite(amount) || amount <= 0) return;

    const isIncome = transactionType === "income";
    const category = isIncome ? "Income" : transactionCategory;
    if (!isDemoMode) {
      const selectedAccountId = transactionAccountId || accounts[0]?.id;
      if (!selectedAccountId) {
        reportError("Add an account before entering a transaction.");
        return;
      }
      const saved = await saveFinanceAction("add-transaction", {
        transaction: {
          name: transactionName.trim(),
          amount,
          category,
          type: transactionType,
          accountId: selectedAccountId,
          date: transactionDate,
        },
      });
      if (!saved) return;
      setTransactionName("");
      setTransactionAmount("");
      setTransactionDate(CURRENT_DATE);
      setActiveModal("");
      setNotice("Transaction saved to your account.");
      window.setTimeout(() => setNotice(""), 3200);
      return;
    }

    const colors = { Groceries: "mint", "Food & drink": "peach", Housing: "blue", Transport: "yellow", Shopping: "lavender" };
    const icons = { Groceries: "bag", "Food & drink": "coffee", Housing: "home", Transport: "car", Shopping: "cart" };
    setTransactions((current) => [{
      id: Date.now(),
      name: transactionName.trim(),
      category,
      date: "Just now",
      amount,
      type: transactionType,
      icon: isIncome ? "arrow-down" : icons[category] || "receipt",
      color: isIncome ? "lavender" : colors[category] || "blue",
    }, ...current]);
    setAccounts((current) => current.map((account, index) => (
      index === 0 ? { ...account, balance: account.balance + (isIncome ? amount : -amount) } : account
    )));
    if (!isIncome) {
      setBudgets((current) => current.map((budget) => (
        budget.category === category ? { ...budget, spent: budget.spent + amount } : budget
      )));
    }
    setTransactionName("");
    setTransactionAmount("");
    setActiveModal("");
    setNotice("Transaction added to your demo account.");
    window.setTimeout(() => setNotice(""), 3200);
  };

  const addAccount = async (event) => {
    event.preventDefault();
    const saved = await saveFinanceAction("add-account", {
      account: {
        name: accountName.trim(),
        institution: accountInstitution.trim(),
        type: accountType,
        openingBalance: accountBalance,
      },
    });
    if (!saved) return;
    setAccountName("");
    setAccountInstitution("");
    setAccountBalance("0");
    setActiveModal("");
    setNotice("Account saved.");
    window.setTimeout(() => setNotice(""), 3200);
  };

  const addBill = async (event) => {
    event.preventDefault();
    const selectedAccountId = billAccountId || accounts[0]?.id;
    if (!selectedAccountId) {
      reportError("Add an account before creating a bill.");
      return;
    }
    const saved = await saveFinanceAction("add-bill", {
      bill: {
        name: billName.trim(),
        amount: billAmount,
        dueDate: billDate,
        accountId: selectedAccountId,
      },
    });
    if (!saved) return;
    setBillName("");
    setBillAmount("");
    setBillDate(CURRENT_DATE);
    setActiveModal("");
    setNotice("Bill saved to your account.");
    window.setTimeout(() => setNotice(""), 3200);
  };

  const addBudget = async (event) => {
    event.preventDefault();
    const saved = await saveFinanceAction("add-budget", {
      budget: { category: budgetCategory, limit: budgetLimit },
    });
    if (!saved) return;
    setBudgetLimit("");
    setActiveModal("");
    setNotice("Monthly budget saved.");
    window.setTimeout(() => setNotice(""), 3200);
  };

  const addGoal = async (event) => {
    event.preventDefault();
    const saved = await saveFinanceAction("add-goal", {
      goal: { name: goalName.trim(), target: goalTarget, saved: goalSaved || "0" },
    });
    if (!saved) return;
    setGoalName("");
    setGoalTarget("");
    setGoalSaved("");
    setActiveModal("");
    setNotice("Savings goal saved.");
    window.setTimeout(() => setNotice(""), 3200);
  };

  const markBillPaid = async (bill) => {
    if (!bill || bill.paid) return;
    if (!isDemoMode) {
      if (!await saveFinanceAction("pay-bill", { billId: bill.id })) return;
      setNotice(`${bill.name} marked as paid and added to transactions.`);
      window.setTimeout(() => setNotice(""), 3200);
      return;
    }
    setBills((current) => current.map((item) => item.name === bill.name ? { ...item, paid: true } : item));
    setAccounts((current) => current.map((account, index) => index === 0 ? { ...account, balance: account.balance - bill.amount } : account));
    setTransactions((current) => [{
      id: Date.now(),
      name: bill.name,
      category: "Bills",
      date: "Just now",
      amount: bill.amount,
      type: "expense",
      icon: bill.icon,
      color: bill.color,
    }, ...current]);
    setNotice(`${bill.name} marked as paid in the demo account.`);
    window.setTimeout(() => setNotice(""), 3200);
  };

  const setMode = async (mode) => {
    if (mode === "real" && !window.confirm("Switch to real data? Your saved demo data will remain separate. Only data you enter in real mode will be saved to your account.")) return;
    const saved = await saveFinanceAction("set-mode", { mode });
    if (!saved) return;
    setChatMessages([{
      role: "assistant",
      content: `You’re now viewing **${mode === "demo" ? "demo data" : "your saved data"}**. I’m your **Puter AI finance copilot**. Ask for practical ideas based on the financial data you’ve chosen to share.`,
    }]);
    setPuterConsent(false);
    setPendingChat("");
    setNotice(mode === "demo" ? "Switched to demo mode. Your saved data is unchanged." : "Real-data mode is on. Add your accounts and transactions to get started.");
    window.setTimeout(() => setNotice(""), 4000);
  };

  const buildFinanceContext = () => {
    const relevantTransactions = (isDemoMode
      ? transactions
      : transactions.filter((item) => item.date.startsWith(CURRENT_DATE.slice(0, 7))))
      .slice(0, 40)
      .map(({ name, category, amount, type, date }) => ({ description: name, category, amount, type, date }));
    return JSON.stringify({
      dataSource: isDemoMode ? "Clearly marked sample data" : "User-entered personal finance data",
      currency: "USD",
      currentMonth: CURRENT_DATE.slice(0, 7),
      accountBalances: accounts.map(({ name, type, balance }) => ({ name, type, balance })),
      transactions: relevantTransactions,
      monthlyBudgets: budgets.map(({ category, spent, limit }) => ({ category, spent, limit, remaining: limit - spent })),
      upcomingBills: bills.filter((bill) => !bill.paid).map(({ name, amount, dueDate, detail }) => ({ name, amount, due: dueDate || detail })),
      savingsGoals: goals.map(({ name, saved, target }) => ({ name, saved, target, remaining: target - saved })),
    });
  };

  const requestPuterChat = async (content) => {
    setPendingChat("");
    setChatInput("");
    setChatLoading(true);
    setChatMessages((current) => [
      ...current,
      { role: "user", content },
      { role: "assistant", content: "" },
    ]);

    try {
      const history = chatMessages
        .filter((message) => message.content)
        .slice(-8)
        .map(({ role, content: messageContent }) => ({ role, content: messageContent }));
      const systemPrompt = `You are a practical, empathetic personal finance copilot. Give specific, actionable ways to reduce unnecessary spending when asked. Be nonjudgmental; distinguish essential from discretionary spending; suggest realistic options and trade-offs, not just generic advice. Ground all factual claims in the user's financial data below. Do not invent missing amounts, budgets, dates, or trends; say when the available data is insufficient and ask a focused follow-up question. You are not a licensed financial advisor, do not guarantee results, and do not recommend high-risk investments. Use concise headings and bullets where useful. Mention that figures are sample data when the data source says sample. Financial context: ${buildFinanceContext()}`;
      const response = await puter.ai.chat(
        [{ role: "system", content: systemPrompt }, ...history, { role: "user", content }],
        { model: "gpt-5.4-nano", stream: true }
      );
      let assistantReply = "";
      for await (const part of response) {
        if (part?.type === "error") throw new Error(part.message || "Puter returned an AI error.");
        if (part?.type !== "text" || typeof part.text !== "string") continue;
        assistantReply += part.text;
        setChatMessages((current) => {
          const updated = [...current];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantReply };
          return updated;
        });
      }
      if (!assistantReply) throw new Error("Puter returned an empty response. Please try again.");
    } catch (error) {
      console.error("Puter AI request failed:", error);
      const message = error instanceof Error ? error.message : "Something went wrong while contacting Puter.";
      setChatMessages((current) => {
        const updated = [...current];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: `I couldn’t get a response from Puter AI. ${message}`,
        };
        return updated;
      });
    } finally {
      setChatLoading(false);
    }
  };

  const sendChatMessage = (event) => {
    event.preventDefault();
    const content = chatInput.trim();
    if (!content || chatLoading) return;
    if (!puterConsent) {
      setPendingChat(content);
      return;
    }
    if (!puter.auth.isSignedIn()) {
      setPendingChat(content);
      return;
    }
    requestPuterChat(content);
  };

  const connectPuterAndSend = async () => {
    if (!pendingChat || chatLoading) return;
    try {
      if (!puter.auth.isSignedIn()) await puter.auth.signIn();
      setPuterConsent(true);
      setIsPuterConnected(true);
      await requestPuterChat(pendingChat);
    } catch (error) {
      console.error("Puter sign-in failed:", error);
      reportError(error instanceof Error ? error.message : "Could not connect to Puter. Please try again.");
    }
  };

  const simulateBankLink = () => {
    if (!accounts.some((account) => account.name === "Demo savings account")) {
      setAccounts((current) => [...current, {
        name: "Demo savings account",
        bank: "Sample Credit Union",
        balance: 2481.15,
        type: "Savings",
        color: "blue",
      }]);
      setNotice("Sample account linked. No bank credentials were collected.");
      window.setTimeout(() => setNotice(""), 3600);
    }
    setBankModal(false);
  };

  const signOut = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        setNotice("Could not sign out. Please try again.");
        window.setTimeout(() => setNotice(""), 3200);
        return;
      }
      router.refresh();
    } catch (error) {
      console.error("Sign out failed:", error);
      setNotice("Could not sign out. Please try again.");
      window.setTimeout(() => setNotice(""), 3200);
    }
  };

  const scrollTo = (id, label) => {
    setActiveNav(label);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand-lockup" href="#overview" onClick={(event) => { event.preventDefault(); scrollTo("overview", "Overview"); }}>
          <span className="brand-icon"><Icon name="sparkle" size={21} /></span>
          <span className="brand-name">pocketful<span>.</span></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {[
            { label: "Overview", icon: "home", id: "overview" },
            { label: "Transactions", icon: "receipt", id: "transactions" },
            { label: "Budgets", icon: "chart", id: "budgets" },
            { label: "Savings goals", icon: "target", id: "goals" },
            { label: "Upcoming bills", icon: "calendar", id: "bills" },
          ].map((item) => (
            <button type="button" className={`nav-item ${activeNav === item.label ? "active" : ""}`} key={item.label} onClick={() => scrollTo(item.id, item.label)}>
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.label === "Upcoming bills" ? <span className="nav-count">{isDemoMode ? 3 : bills.filter((bill) => !bill.paid).length}</span> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span className="tip-icon"><Icon name="sparkle" size={17} /></span>
            <p>Your money, a little more <strong>mindful.</strong></p>
            <span className="tip-caption">Small steps add up.</span>
          </div>
          <button type="button" className="profile-button" onClick={signOut}>
            <span className="profile-avatar">{displayName.slice(0, 1)}</span>
            <span className="profile-copy"><strong>{displayName}</strong><small>Sign out</small></span>
            <Icon name="chevron" size={17} />
          </button>
        </div>
      </aside>

      <section className="main-content" id="overview">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-icon"><Icon name="sparkle" size={20} /></span><span className="brand-name">pocketful<span>.</span></span></div>
          <div className="breadcrumb"><span>My finances</span><Icon name="chevron" size={15} /><strong>{activeNav}</strong></div>
          <div className="topbar-actions">
            <button type="button" className={`mode-toggle ${isDemoMode ? "mode-demo" : "mode-real"}`} onClick={() => setMode(isDemoMode ? "real" : "demo")} disabled={isSaving} aria-label={isDemoMode ? "Switch from demo mode to your real data" : "Switch from your real data to demo mode"}>
              <span /> {isDemoMode ? "Try real data" : "Demo mode"}
            </button>
            <button type="button" className="icon-button top-search" aria-label="Search transactions" onClick={() => document.getElementById("transaction-search")?.focus()}><Icon name="search" /></button>
            <button type="button" className="profile-avatar top-avatar" aria-label={`Sign out ${displayName}`} onClick={signOut}>{displayName.slice(0, 1)}</button>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">{isDemoMode ? "SAMPLE FINANCIAL SNAPSHOT" : "YOUR SAVED FINANCIAL DATA"} <span className="eyebrow-dot">·</span> {new Date(`${CURRENT_DATE.slice(0, 7)}-01T12:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" }).toUpperCase()}</p>
              <h1>Good morning, {displayName} <span className="wave">✳</span></h1>
              <p className="welcome-subtitle">{isDemoMode ? "Sample figures to explore the dashboard. Switch to real data whenever you’re ready." : "Only data you enter is saved to your private account."}</p>
            </div>
            <button type="button" className="button button-outline" onClick={() => isDemoMode ? setBankModal(true) : setActiveModal("account")}><Icon name={isDemoMode ? "link" : "wallet"} size={17} /> {isDemoMode ? "Connect sample" : "Add account"}</button>
          </section>

          <section className="summary-grid" aria-label="Monthly financial summary">
            <article className="balance-card">
              <div className="card-overline"><span>Total balance</span><span className="balance-status"><span /> All accounts</span></div>
              <div className="balance-amount">{money(totalBalance)}</div>
              <div className="balance-foot">{isDemoMode ? <><span className="positive-change"><Icon name="arrowUp" size={15} /> 4.8%</span><span>vs. last month</span></> : <span>Opening balances + saved transactions</span>}<span className="balance-foot-end">Across {accounts.length} accounts</span></div>
              <div className="balance-wave" aria-hidden="true"><svg viewBox="0 0 450 90" preserveAspectRatio="none"><path d="M0 68 C38 63 47 30 88 43 S140 78 184 56 239 22 275 38 335 72 377 45 423 24 450 14" /><path className="wave-fill" d="M0 68 C38 63 47 30 88 43 S140 78 184 56 239 22 275 38 335 72 377 45 423 24 450 14 V90 H0Z" /></svg></div>
            </article>
            <article className="metric-card income-card">
              <div className="metric-icon income-icon"><Icon name="arrowDown" size={18} /></div>
              <p className="metric-label">Income this month</p>
              <strong className="metric-amount">{money(monthlyIncome)}</strong>
              <p className="metric-note">{isDemoMode ? <><span className="positive-change">↗ 8.2%</span> <span>vs. last month</span></> : "From your entries this month"}</p>
              <div className="mini-bars income-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
            </article>
            <article className="metric-card spending-card">
              <div className="metric-icon spending-icon"><Icon name="arrowUp" size={18} /></div>
              <p className="metric-label">Spent this month</p>
              <strong className="metric-amount">{money(monthlySpent)}</strong>
              <p className="metric-note">{isDemoMode ? <><span className="positive-change">↘ 3.1%</span> <span>vs. last month</span></> : "From your entries this month"}</p>
              <div className="mini-bars spending-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
            </article>
          </section>

          {!isDemoMode && accounts.length ? (
            <section className="panel saved-accounts" aria-labelledby="accounts-title">
              <div className="panel-header"><div><h2 id="accounts-title">Your accounts</h2><p className="panel-subtitle">Balances are based on the opening amounts and entries you save.</p></div><button type="button" className="text-link account-add-link" onClick={() => setActiveModal("account")}><Icon name="plus" size={14} /> Add account</button></div>
              <div className="saved-account-list">{accounts.map((account) => <div className="saved-account-row" key={account.id}><span className={`saved-account-icon ${account.color}`}><Icon name="wallet" size={17} /></span><span className="saved-account-name"><strong>{account.name}</strong><small>{account.bank || "Manual account"} · {account.type}</small></span><strong className="saved-account-balance">{money(account.balance)}</strong></div>)}</div>
            </section>
          ) : null}

          <div className="dashboard-grid">
            <div className="dashboard-main-column">
              <section className="panel spending-panel" aria-labelledby="spending-title">
                <div className="panel-header">
                  <div><h2 id="spending-title">Spending breakdown</h2><p className="panel-subtitle">A little clarity goes a long way.</p></div>
                  <button type="button" className="select-button">This month <Icon name="chevron" size={14} /></button>
                </div>
                <div className="spending-content">
                  <div className="donut-wrap">
                    <div className="donut-chart" style={{ background: donutGradient }}><div className="donut-center"><strong>{money(monthlySpent)}</strong><span>Total spent</span></div></div>
                  </div>
                  <div className="spending-legend">
                    {spendingBreakdown.map((item) => (
                      <div className="legend-row" key={item.label}>
                        <span className={`legend-dot ${item.color}`} /><span className="legend-label">{item.label}</span><strong>{money(item.amount)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="spending-insight"><span className="insight-sparkle"><Icon name="sparkle" size={16} /></span><span>{spendingBreakdown.length ? isDemoMode ? <>You’ve spent <strong>12% less</strong> on dining than last month. Keep it up!</> : <>Your top spending category is <strong>{spendingBreakdown[0].label}</strong> at {money(spendingBreakdown[0].amount)} this month.</> : "Add transactions to see your spending breakdown and find opportunities to save."}</span>{!isDemoMode ? <button type="button" className="insight-chat-link" onClick={() => document.getElementById("chat-input")?.focus()}>Ask copilot</button> : <Icon name="chevron" size={15} />}</div>
              </section>

              <section className="panel transactions-panel" id="transactions" aria-labelledby="transactions-title">
                <div className="panel-header transaction-header">
                  <div><h2 id="transactions-title">Recent transactions</h2><p className="panel-subtitle">Your money in motion.</p></div>
                  <div className="transaction-actions">
                    <label className="search-field" htmlFor="transaction-search"><Icon name="search" size={16} /><input id="transaction-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" /></label>
                    <button type="button" className="button button-small" onClick={() => { setTransactionAccountId(accounts[0]?.id || ""); setActiveModal(isDemoMode || accounts.length ? "transaction" : "account"); }}><Icon name="plus" size={16} /> Add new</button>
                  </div>
                </div>
                <div className="table-scroll">
                  <table className="transactions-table">
                    <thead><tr><th>TRANSACTION</th><th>CATEGORY</th><th>DATE</th><th className="amount-cell">AMOUNT</th></tr></thead>
                    <tbody>
                      {filteredTransactions.length ? filteredTransactions.slice(0, showAllTransactions ? filteredTransactions.length : 5).map((item) => (
                        <tr key={item.id}>
                          <td><span className={`transaction-icon ${item.color}`}><Icon name={item.icon} size={17} /></span><strong className="transaction-name">{item.name}</strong></td>
                          <td><span className="category-chip">{item.category}</span></td>
                          <td className="date-cell">{displayDate(item.date)}</td>
                          <td className={`amount-cell transaction-amount ${item.type === "income" ? "income-amount" : ""}`}>{item.type === "income" ? "+" : "−"}{money(item.amount)}</td>
                        </tr>
                      )) : <tr><td className="empty-search" colSpan="4">{search ? `No transactions match “${search}”.` : isDemoMode ? "No transactions to show." : "No saved transactions yet. Add one to start seeing where your money goes."}</td></tr>}
                    </tbody>
                  </table>
                </div>
                <button type="button" className="text-link" onClick={() => { setShowAllTransactions((current) => !current); scrollTo("transactions", "Transactions"); }}>{showAllTransactions ? "Show fewer transactions" : "View all transactions"} <Icon name="chevron" size={15} /></button>
              </section>
            </div>

            <div className="dashboard-side-column">
              <section className="panel budgets-panel" id="budgets" aria-labelledby="budgets-title">
                <div className="panel-header">
                  <div><h2 id="budgets-title">Monthly budgets</h2><p className="panel-subtitle">{isDemoMode ? "You’re right on track." : "Set a limit to keep spending intentional."}</p></div>
                  {!isDemoMode ? <button type="button" className="icon-button subtle-icon" aria-label="Add monthly budget" onClick={() => setActiveModal("budget")}><Icon name="plus" size={18} /></button> : null}
                </div>
                <div className="budget-list">
                  {budgets.map((budget) => {
                    const percent = Math.min(100, Math.round((budget.spent / budget.limit) * 100));
                    return (
                      <div className="budget-item" key={budget.category}>
                        <div className="budget-topline"><span className={`budget-icon ${budget.color}`}><Icon name={budget.icon} size={16} /></span><strong>{budget.category}</strong><span className="budget-amount">{money(budget.spent)} <small>/ {money(budget.limit)}</small></span></div>
                        <div className="progress-track"><span className={`progress-fill ${budget.color}`} style={{ width: `${percent}%` }} /></div>
                        <div className="budget-remaining">{money(Math.max(0, budget.limit - budget.spent))} left</div>
                      </div>
                    );
                  })}
                  {!budgets.length ? <p className="empty-panel-copy">No budgets yet. Create one to compare your spending with a monthly limit.</p> : null}
                </div>
                {!isDemoMode ? <button type="button" className="text-link" onClick={() => setActiveModal("budget")}>Add a monthly budget <Icon name="plus" size={14} /></button> : <button type="button" className="text-link" onClick={() => scrollTo("budgets", "Budgets")}>Manage budgets <Icon name="chevron" size={15} /></button>}
              </section>

              <section className="panel goals-panel" id="goals" aria-labelledby="goals-title">
                <div className="panel-header">
                  <div><h2 id="goals-title">Savings goals</h2><p className="panel-subtitle">{isDemoMode ? "Dream a little. Save a little." : "Track something you’re saving for."}</p></div>
                  <button type="button" className="icon-button subtle-icon" aria-label="Add savings goal" onClick={() => isDemoMode ? setGoals((current) => [...current, { name: "New goal", saved: 0, target: 1000, icon: "target", color: "lavender" }]) : setActiveModal("goal")}><Icon name="plus" size={18} /></button>
                </div>
                <div className="goal-list">
                  {goals.map((goal) => {
                    const percent = Math.min(100, Math.round((goal.saved / goal.target) * 100));
                    return (
                      <div className="goal-item" key={goal.name}>
                        <span className={`goal-icon ${goal.color}`}><Icon name={goal.icon} size={18} /></span>
                        <div className="goal-info"><div className="goal-title-row"><strong>{goal.name}</strong><span>{percent}%</span></div><div className="progress-track"><span className={`progress-fill ${goal.color}`} style={{ width: `${percent}%` }} /></div><small>{money(goal.saved)} <span>of {money(goal.target)}</span></small></div>
                      </div>
                    );
                  })}
                  {!goals.length ? <p className="empty-panel-copy">No savings goals yet. Add one to keep a goal in view.</p> : null}
                </div>
              </section>

              <section className="panel bills-panel" id="bills" aria-labelledby="bills-title">
                <div className="panel-header">
                  <div><h2 id="bills-title">Upcoming bills</h2><p className="panel-subtitle">{isDemoMode ? "Stay one step ahead." : "Keep upcoming payments in one place."}</p></div>
                  <div className="bill-header-actions">{!isDemoMode ? <button type="button" className="icon-button subtle-icon" aria-label="Add bill" onClick={() => setActiveModal(accounts.length ? "bill" : "account")}><Icon name="plus" size={18} /></button> : null}<span className="bills-due">{bills.filter((bill) => !bill.paid).length} due</span></div>
                </div>
                <div className="bill-list">
                  {bills.map((bill) => (
                    <div className={`bill-item ${bill.paid ? "bill-paid" : ""}`} key={bill.id || bill.name}>
                      <span className={`bill-icon ${bill.color}`}><Icon name={bill.icon} size={17} /></span>
                      <span className="bill-copy"><strong>{bill.name}</strong><small>{bill.paid ? "Paid" : bill.detail || `Due ${displayDate(bill.dueDate)}`}</small></span>
                      <span className="bill-price">{money(bill.amount)}</span>
                      {!bill.paid ? <button type="button" className="bill-pay" onClick={() => markBillPaid(bill)} aria-label={`Mark ${bill.name} paid`}><Icon name="check" size={15} /></button> : <span className="bill-check"><Icon name="check" size={15} /></span>}
                    </div>
                  ))}
                  {!bills.length ? <p className="empty-panel-copy">No bills saved yet. Add a bill to track its due date and amount.</p> : null}
                </div>
                {!isDemoMode ? <button type="button" className="text-link" onClick={() => setActiveModal(accounts.length ? "bill" : "account")}>Add an upcoming bill <Icon name="plus" size={14} /></button> : null}
              </section>
            </div>
          </div>

          <section className="chat-section" aria-labelledby="chat-title">
            <div className="chat-heading">
              <div className="chat-heading-icon"><Icon name="sparkle" size={21} /></div>
              <div><h2 id="chat-title">Your money, meet your copilot.</h2><p>Ask a real AI for practical, data-grounded ideas.</p></div>
              <span className="prototype-label">{isPuterConnected ? "PUTER AI · CONNECTED" : "POWERED BY PUTER AI"}</span>
            </div>
            <div className="chat-disclaimer"><Icon name="sparkle" size={14} /> {isDemoMode ? "Puter AI can see the sample data you share. Its responses aren’t financial advice." : "Puter AI receives your question and the account summaries you approve. Its responses aren’t financial advice."}</div>
            <div className="chat-thread" aria-live="polite">
              {chatMessages.map((item, index) => (
                <div className={`chat-message ${item.role === "user" ? "chat-user" : ""}`} key={`${index}-${item.role}`}>
                  {item.role === "assistant" ? <span className="chat-avatar"><Icon name="sparkle" size={15} /></span> : null}
                  <div className="chat-bubble">{item.content ? item.content.split(/(\*\*.*?\*\*)/g).map((part, partIndex) => part.startsWith("**") && part.endsWith("**") ? <strong key={partIndex}>{part.slice(2, -2)}</strong> : part) : chatLoading && index === chatMessages.length - 1 ? <span className="typing-indicator" aria-label="Puter AI is responding"><span /><span /><span /></span> : null}</div>
                </div>
              ))}
            </div>
            {chatMessages.length === 1 ? <div className="suggestion-row">{["How can I cut unnecessary spending?", "Where did I spend the most?", "What bills are coming up?"].map((suggestion) => <button type="button" className="suggestion-chip" key={suggestion} onClick={() => { setChatInput(suggestion); }}>{suggestion}</button>)}</div> : null}
            {pendingChat ? <div className="ai-consent" role="group" aria-label="Puter AI data-sharing consent"><span className="ai-consent-icon"><Icon name="shield" size={18} /></span><div className="ai-consent-copy"><strong>Before your first AI question</strong><p>Your question and the finance summaries shown above will be sent to Puter to generate a reply. This is separate from your pocketful account. Continue only if you’re comfortable sharing them.</p><div className="ai-consent-actions"><button type="button" className="button button-primary" onClick={connectPuterAndSend} disabled={chatLoading}>Continue and connect Puter</button><button type="button" className="button button-outline" onClick={() => setPendingChat("")}>Cancel</button></div></div></div> : null}
            <form className="chat-composer" onSubmit={sendChatMessage}>
              <input id="chat-input" aria-label="Ask your Puter AI finance copilot" placeholder="Ask how to cut unnecessary spending..." value={chatInput} maxLength={1500} onChange={(event) => setChatInput(event.target.value)} disabled={chatLoading} />
              <button type="submit" className="send-button" aria-label="Send message" disabled={!chatInput.trim() || chatLoading}><Icon name={chatLoading ? "sparkle" : "send"} size={17} /></button>
            </form>
          </section>

          <footer className="page-footer"><span>Made for a more mindful relationship with money <span className="footer-heart">♥</span></span><span>{isDemoMode ? "Demo figures · Changes stay in this session" : "Your entries are saved to your private account"}</span></footer>
        </div>
      </section>

      {notice ? <div className="toast-message" role="status"><Icon name="check" size={17} />{notice}</div> : null}

      {activeModal ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) setActiveModal(""); }}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="transaction-modal-title">
            <div className="modal-header"><div><p className="eyebrow">{isDemoMode ? "SAMPLE DATA" : "SAVED TO YOUR ACCOUNT"}</p><h2 id="transaction-modal-title">{activeModal === "transaction" ? "Add a transaction" : activeModal === "account" ? "Add an account" : activeModal === "bill" ? "Add an upcoming bill" : activeModal === "budget" ? "Set a monthly budget" : "Add a savings goal"}</h2></div><button type="button" className="icon-button" aria-label="Close dialog" onClick={() => setActiveModal("")} disabled={isSaving}><Icon name="close" /></button></div>
            {activeModal === "transaction" ? <form className="modal-form" onSubmit={addTransaction}>
              <label>Transaction name<input autoFocus required maxLength={100} value={transactionName} onChange={(event) => setTransactionName(event.target.value)} placeholder="e.g. Lunch with friends" /></label>
              <div className="form-row"><label>Amount<input required type="number" min="0.01" max="100000000" step="0.01" value={transactionAmount} onChange={(event) => setTransactionAmount(event.target.value)} placeholder="$0.00" /></label><label>Type<select value={transactionType} onChange={(event) => setTransactionType(event.target.value)}><option value="expense">Expense</option><option value="income">Income</option></select></label></div>
              {transactionType === "expense" ? <label>Category<select value={transactionCategory} onChange={(event) => setTransactionCategory(event.target.value)}>{CATEGORIES.filter((category) => category !== "Income").map((category) => <option key={category}>{category}</option>)}</select></label> : null}
              {!isDemoMode ? <><label>Account<select required value={transactionAccountId || accounts[0]?.id || ""} onChange={(event) => setTransactionAccountId(event.target.value)}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label>Date<input required type="date" value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} /></label></> : null}
              <p className="modal-note">{isDemoMode ? "This only changes the sample data shown in this session." : "This transaction is saved to your account and updates its balance."}</p>
              <div className="modal-actions"><button type="button" className="button button-outline" onClick={() => setActiveModal("")}>Cancel</button><button type="submit" className="button button-primary" disabled={isSaving}><Icon name="plus" size={16} /> {isSaving ? "Saving..." : "Add transaction"}</button></div>
            </form> : null}
            {activeModal === "account" ? <form className="modal-form" onSubmit={addAccount}>
              <label>Account name<input autoFocus required maxLength={60} value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder="e.g. Everyday checking" /></label>
              <div className="form-row"><label>Account type<select value={accountType} onChange={(event) => setAccountType(event.target.value)}>{["Checking", "Savings", "Cash", "Credit", "Investments", "Other"].map((type) => <option key={type}>{type}</option>)}</select></label><label>Opening balance<input type="number" step="0.01" value={accountBalance} onChange={(event) => setAccountBalance(event.target.value)} /></label></div>
              <label>Bank or institution <span className="optional-label">(optional)</span><input maxLength={60} value={accountInstitution} onChange={(event) => setAccountInstitution(event.target.value)} placeholder="e.g. Local credit union" /></label>
              <p className="modal-note">Manual account only. No bank connection or credentials are required.</p>
              <div className="modal-actions"><button type="button" className="button button-outline" onClick={() => setActiveModal("")}>Cancel</button><button type="submit" className="button button-primary" disabled={isSaving}><Icon name="plus" size={16} /> {isSaving ? "Saving..." : "Save account"}</button></div>
            </form> : null}
            {activeModal === "bill" ? <form className="modal-form" onSubmit={addBill}>
              <label>Bill name<input autoFocus required maxLength={100} value={billName} onChange={(event) => setBillName(event.target.value)} placeholder="e.g. Electricity" /></label>
              <div className="form-row"><label>Amount<input required type="number" min="0.01" max="100000000" step="0.01" value={billAmount} onChange={(event) => setBillAmount(event.target.value)} placeholder="$0.00" /></label><label>Due date<input required type="date" value={billDate} onChange={(event) => setBillDate(event.target.value)} /></label></div>
              <label>Pay from<select required value={billAccountId || accounts[0]?.id || ""} onChange={(event) => setBillAccountId(event.target.value)}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
              <p className="modal-note">Bills are stored in your account. Marking one paid records an expense.</p>
              <div className="modal-actions"><button type="button" className="button button-outline" onClick={() => setActiveModal("")}>Cancel</button><button type="submit" className="button button-primary" disabled={isSaving}><Icon name="plus" size={16} /> {isSaving ? "Saving..." : "Save bill"}</button></div>
            </form> : null}
            {activeModal === "budget" ? <form className="modal-form" onSubmit={addBudget}>
              <label>Category<select value={budgetCategory} onChange={(event) => setBudgetCategory(event.target.value)}>{CATEGORIES.filter((category) => category !== "Income").map((category) => <option key={category}>{category}</option>)}</select></label>
              <label>Monthly limit<input autoFocus required type="number" min="0.01" max="100000000" step="0.01" value={budgetLimit} onChange={(event) => setBudgetLimit(event.target.value)} placeholder="$0.00" /></label>
              <p className="modal-note">Your current-month transactions will be compared with this limit.</p>
              <div className="modal-actions"><button type="button" className="button button-outline" onClick={() => setActiveModal("")}>Cancel</button><button type="submit" className="button button-primary" disabled={isSaving}><Icon name="plus" size={16} /> {isSaving ? "Saving..." : "Save budget"}</button></div>
            </form> : null}
            {activeModal === "goal" ? <form className="modal-form" onSubmit={addGoal}>
              <label>Goal name<input autoFocus required maxLength={80} value={goalName} onChange={(event) => setGoalName(event.target.value)} placeholder="e.g. Emergency fund" /></label>
              <div className="form-row"><label>Target amount<input required type="number" min="0.01" max="100000000" step="0.01" value={goalTarget} onChange={(event) => setGoalTarget(event.target.value)} placeholder="$0.00" /></label><label>Already saved<input type="number" min="0" step="0.01" value={goalSaved} onChange={(event) => setGoalSaved(event.target.value)} placeholder="$0.00" /></label></div>
              <div className="modal-actions"><button type="button" className="button button-outline" onClick={() => setActiveModal("")}>Cancel</button><button type="submit" className="button button-primary" disabled={isSaving}><Icon name="plus" size={16} /> {isSaving ? "Saving..." : "Save goal"}</button></div>
            </form> : null}
          </section>
        </div>
      ) : null}

      {bankModal ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setBankModal(false); }}>
          <section className="modal-card bank-modal" role="dialog" aria-modal="true" aria-labelledby="bank-modal-title">
            <div className="modal-header"><div><p className="eyebrow">SAMPLE CONNECTION</p><h2 id="bank-modal-title">Connect an account</h2></div><button type="button" className="icon-button" aria-label="Close dialog" onClick={() => setBankModal(false)}><Icon name="close" /></button></div>
            <div className="bank-lock"><span><Icon name="shield" size={22} /></span><p>This is a demo. No real bank connection or credentials are used.</p></div>
            <button type="button" className="bank-option" onClick={simulateBankLink}><span className="bank-logo">N</span><span><strong>Northstar Bank</strong><small>Checking, savings</small></span><Icon name="chevron" size={18} /></button>
            <button type="button" className="bank-option" onClick={simulateBankLink}><span className="bank-logo bank-logo-alt">S</span><span><strong>Sample Credit Union</strong><small>Checking, savings</small></span><Icon name="chevron" size={18} /></button>
            <button type="button" className="button button-outline bank-cancel" onClick={() => setBankModal(false)}>Maybe later</button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
