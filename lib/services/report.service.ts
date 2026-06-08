import { pool } from "../db";

export async function getMonthlySummary(userId: string) {
  const { rows: totals } = await pool.query<{ type: string; total: string }>(
    `SELECT type, COALESCE(SUM(amount), 0) AS total
     FROM transactions
     WHERE user_id = $1
       AND DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', NOW())
     GROUP BY type`,
    [userId]
  );

  const income = parseFloat(totals.find((r) => r.type === "INCOME")?.total ?? "0");
  const expenses = parseFloat(totals.find((r) => r.type === "EXPENSE")?.total ?? "0");

  const { rows: categories } = await pool.query<{ category: string; total: string }>(
    `SELECT category, SUM(amount) AS total
     FROM transactions
     WHERE user_id = $1
       AND type = 'EXPENSE'
       AND DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', NOW())
     GROUP BY category
     ORDER BY total DESC
     LIMIT 5`,
    [userId]
  );

  const topCategories: [string, number][] = categories.map((r) => [r.category, parseFloat(r.total)]);

  return { income, expenses, balance: income - expenses, topCategories };
}

export async function getCategoryReport(
  userId: string,
  category: string,
  period: "current_month" | "all_time" = "current_month"
) {
  const periodFilter =
    period === "current_month"
      ? `AND DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', NOW())`
      : "";

  const { rows } = await pool.query<{ total: string; count: string }>(
    `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
     FROM transactions
     WHERE user_id = $1
       AND type = 'EXPENSE'
       AND category = $2
       ${periodFilter}`,
    [userId, category.toLowerCase()]
  );

  const total = parseFloat(rows[0]?.total ?? "0");
  const count = parseInt(rows[0]?.count ?? "0", 10);
  const average = count > 0 ? total / count : 0;

  return { category, total, count, average };
}
