import { findOrCreateUser } from "../services/user.service";
import {
  createTransaction,
  getBalance,
  getRecentTransactions,
  deleteLastTransaction,
} from "../services/transaction.service";
import { getMonthlySummary, getCategoryReport } from "../services/report.service";
import { parseMessage } from "../parser/deterministic.parser";
import { parseWithAI } from "../ai/ollama.service";
import {
  formatExpenseCreated,
  formatIncomeCreated,
  formatBalance,
  formatMonthlySummary,
  formatCategoryReport,
  formatRecentTransactions,
  formatDeletedTransaction,
  formatError,
} from "../formatter/response.formatter";

export interface TelegramUser {
  id: number;
  username?: string;
}

export async function handleMessage(text: string, telegramUser: TelegramUser): Promise<string> {
  const user = await findOrCreateUser(
    String(telegramUser.id),
    telegramUser.username
  );

  let intent = parseMessage(text);

  if (!intent) {
    try {
      intent = await parseWithAI(text);
    } catch {
      return formatError("I could not understand your message. Try: 'spent 20 on food' or 'balance'.");
    }
  }

  if (!intent) {
    return formatError("I could not understand your message. Try: 'spent 20 on food' or 'balance'.");
  }

  try {
    switch (intent.intent) {
      case "create_expense": {
        await createTransaction({
          userId: user.id,
          type: "EXPENSE",
          amount: intent.amount,
          category: intent.category,
          description: intent.description,
        });
        return formatExpenseCreated(intent.amount, intent.category);
      }

      case "create_income": {
        await createTransaction({
          userId: user.id,
          type: "INCOME",
          amount: intent.amount,
          category: intent.category,
          description: intent.description,
        });
        return formatIncomeCreated(intent.amount, intent.category);
      }

      case "balance": {
        const { income, expenses, balance } = await getBalance(user.id);
        return formatBalance(income, expenses, balance);
      }

      case "summary": {
        const { income, expenses, balance, topCategories } = await getMonthlySummary(user.id);
        return formatMonthlySummary(income, expenses, balance, topCategories);
      }

      case "recent_transactions": {
        const transactions = await getRecentTransactions(user.id);
        return formatRecentTransactions(transactions);
      }

      case "delete_last_transaction": {
        const deleted = await deleteLastTransaction(user.id);
        if (!deleted) return formatError("No transactions to delete.");
        return formatDeletedTransaction(Number(deleted.amount), deleted.category);
      }

      case "category_report": {
        const { category, total, count, average } = await getCategoryReport(
          user.id,
          intent.category,
          intent.period
        );
        return formatCategoryReport(category, total, count, average);
      }

      default:
        return formatError("Unsupported operation.");
    }
  } catch {
    return formatError("Something went wrong. Please try again later.");
  }
}
