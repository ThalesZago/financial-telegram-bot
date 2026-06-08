import { pool } from "../db";

export interface User {
  id: string;
  telegram_id: string;
  username: string | null;
  created_at: Date;
}

export async function findOrCreateUser(telegramId: string, username?: string): Promise<User> {
  const { rows } = await pool.query<User>(
    `INSERT INTO users (telegram_id, username)
     VALUES ($1, $2)
     ON CONFLICT (telegram_id) DO UPDATE SET username = EXCLUDED.username
     RETURNING *`,
    [telegramId, username ?? null]
  );
  return rows[0];
}
