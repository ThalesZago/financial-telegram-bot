import { pool } from "../db";

export type TransactionType = "INCOME" | "EXPENSE";

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string | null;
  transaction_date: Date;
  created_at: Date;
}

export interface CreateTransactionInput {
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const { rows } = await pool.query<Transaction>(
    `INSERT INTO transactions (user_id, type, amount, category, description)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.userId, input.type, input.amount, input.category.toLowerCase(), input.description ?? null]
  );
  return rows[0];
}

export async function getBalance(userId: string) {
  const { rows } = await pool.query<{ type: TransactionType; total: string }>(
    `SELECT type, COALESCE(SUM(amount), 0) AS total
     FROM transactions
     WHERE user_id = $1
     GROUP BY type`,
    [userId]
  );

  const income = parseFloat(rows.find((r) => r.type === "INCOME")?.total ?? "0");
  const expenses = parseFloat(rows.find((r) => r.type === "EXPENSE")?.total ?? "0");

  return { income, expenses, balance: income - expenses };
}

export async function getRecentTransactions(userId: string, limit = 5): Promise<Transaction[]> {
  const { rows } = await pool.query<Transaction>(
    `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return rows;
}

export async function deleteLastTransaction(userId: string): Promise<Transaction | null> {
  const { rows } = await pool.query<Transaction>(
    `DELETE FROM transactions
     WHERE id = (
       SELECT id FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1
     )
     RETURNING *`,
    [userId]
  );
  return rows[0] ?? null;
}
