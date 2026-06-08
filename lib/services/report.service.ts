import { prisma } from "../db";

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

export async function getMonthlySummary(userId: string) {
  const { start, end } = currentMonthRange();

  const transactions = await prisma.transaction.findMany({
    where: { userId, transactionDate: { gte: start, lte: end } },
  });

  let income = 0;
  let expenses = 0;
  const categoryTotals: Record<string, number> = {};

  for (const t of transactions) {
    const amount = t.amount.toNumber();
    if (t.type === "INCOME") {
      income += amount;
    } else {
      expenses += amount;
      categoryTotals[t.category] = (categoryTotals[t.category] ?? 0) + amount;
    }
  }

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return { income, expenses, balance: income - expenses, topCategories };
}

export async function getCategoryReport(
  userId: string,
  category: string,
  period: "current_month" | "all_time" = "current_month"
) {
  const where: Record<string, unknown> = {
    userId,
    category: category.toLowerCase(),
    type: "EXPENSE",
  };

  if (period === "current_month") {
    const { start, end } = currentMonthRange();
    where.transactionDate = { gte: start, lte: end };
  }

  const transactions = await prisma.transaction.findMany({ where });

  const total = transactions.reduce((sum: number, t) => sum + t.amount.toNumber(), 0);
  const count = transactions.length;
  const average = count > 0 ? total / count : 0;

  return { category, total, count, average };
}
