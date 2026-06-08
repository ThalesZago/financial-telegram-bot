import type { Transaction } from "../../app/generated/prisma";

export function formatExpenseCreated(amount: number, category: string): string {
  return `✅ Expense recorded successfully.\n\nAmount: $${amount.toFixed(2)}\nCategory: ${capitalize(category)}`;
}

export function formatIncomeCreated(amount: number, category: string): string {
  return `✅ Income recorded successfully.\n\nAmount: $${amount.toFixed(2)}\nCategory: ${capitalize(category)}`;
}

export function formatBalance(income: number, expenses: number, balance: number): string {
  return `💰 Current Balance\n\nIncome: $${income.toFixed(2)}\nExpenses: $${expenses.toFixed(2)}\n\nAvailable: $${balance.toFixed(2)}`;
}

export function formatMonthlySummary(
  income: number,
  expenses: number,
  balance: number,
  topCategories: [string, number][]
): string {
  const topLines = topCategories
    .map(([cat, total]) => `  • ${capitalize(cat)}: $${total.toFixed(2)}`)
    .join("\n");

  return (
    `📅 Monthly Summary\n\n` +
    `Income: $${income.toFixed(2)}\n` +
    `Expenses: $${expenses.toFixed(2)}\n` +
    `Balance: $${balance.toFixed(2)}` +
    (topLines ? `\n\nTop Categories:\n${topLines}` : "")
  );
}

export function formatCategoryReport(
  category: string,
  total: number,
  count: number,
  average: number
): string {
  return (
    `📊 ${capitalize(category)} Expenses - Current Month\n\n` +
    `Total spent: $${total.toFixed(2)}\n` +
    `Transactions: ${count}\n` +
    `Average expense: $${average.toFixed(2)}`
  );
}

export function formatRecentTransactions(transactions: Transaction[]): string {
  if (transactions.length === 0) return "No recent transactions found.";

  const lines = transactions.map((t) => {
    const sign = t.type === "EXPENSE" ? "-" : "+";
    return `${sign}$${Number(t.amount).toFixed(2)} · ${capitalize(t.category)}${t.description ? ` (${t.description})` : ""}`;
  });

  return `🕒 Recent Transactions\n\n${lines.join("\n")}`;
}

export function formatDeletedTransaction(amount: number, category: string): string {
  return `🗑️ Last transaction deleted.\n\nAmount: $${amount.toFixed(2)}\nCategory: ${capitalize(category)}`;
}

export function formatError(message: string): string {
  return `❌ ${message}`;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
