export type ParsedIntent =
  | { intent: "create_expense"; amount: number; category: string; description?: string }
  | { intent: "create_income"; amount: number; category: string; description?: string }
  | { intent: "balance" }
  | { intent: "summary" }
  | { intent: "recent_transactions" }
  | { intent: "delete_last_transaction" }
  | { intent: "category_report"; category: string; period: "current_month" | "all_time" }
  | null;

const EXPENSE_PATTERNS = [
  /(?:spent|spend|paid|pay|bought|purchased)\s+(?:\$|usd|dollars?)?\s*(\d+(?:\.\d{1,2})?)\s+(?:on\s+|at\s+|for\s+)?(.+)/i,
  /(\d+(?:\.\d{1,2})?)\s+(?:on\s+|at\s+|for\s+)(.+)/i,
];

const INCOME_PATTERNS = [
  /(?:received|got paid|income|earned|salary|deposited)\s+(?:\$|usd|dollars?)?\s*(\d+(?:\.\d{1,2})?)\s*(.+)?/i,
  /(?:received|got)\s+(\d+(?:\.\d{1,2})?)\s*(.+)?/i,
];

const BALANCE_KEYWORDS = /^(?:balance|how much (?:money )?(?:do i have|is in my account)?|current balance)\??$/i;
const SUMMARY_KEYWORDS = /(?:summary|monthly (?:report|summary)|show (?:me )?(?:this month|monthly))/i;
const RECENT_KEYWORDS = /(?:last|recent) (?:transactions?|expenses?|spending)|what did i spend recently/i;
const DELETE_KEYWORDS = /(?:delete|remove|undo) (?:my )?(?:last|recent) (?:transaction|expense)/i;

export function parseMessage(text: string): ParsedIntent {
  const trimmed = text.trim();

  if (BALANCE_KEYWORDS.test(trimmed)) {
    return { intent: "balance" };
  }

  if (SUMMARY_KEYWORDS.test(trimmed)) {
    return { intent: "summary" };
  }

  if (RECENT_KEYWORDS.test(trimmed)) {
    return { intent: "recent_transactions" };
  }

  if (DELETE_KEYWORDS.test(trimmed)) {
    return { intent: "delete_last_transaction" };
  }

  for (const pattern of EXPENSE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const amount = parseFloat(match[1]);
      const category = extractCategory(match[2] ?? "general");
      const description = match[2]?.trim();
      if (amount > 0) {
        return { intent: "create_expense", amount, category, description };
      }
    }
  }

  for (const pattern of INCOME_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const amount = parseFloat(match[1]);
      const category = extractCategory(match[2] ?? "income");
      const description = match[2]?.trim();
      if (amount > 0) {
        return { intent: "create_income", amount, category, description };
      }
    }
  }

  return null;
}

function extractCategory(raw: string): string {
  const cleaned = raw.toLowerCase().trim();

  const categoryMap: Record<string, string[]> = {
    food: ["food", "lunch", "dinner", "breakfast", "restaurant", "mcdonalds", "pizza", "meal", "groceries", "grocery", "eat"],
    transport: ["transport", "transportation", "uber", "taxi", "bus", "train", "gas", "fuel", "parking"],
    health: ["health", "doctor", "medicine", "pharmacy", "hospital", "gym"],
    entertainment: ["entertainment", "movie", "netflix", "game", "cinema", "concert"],
    shopping: ["shopping", "clothes", "amazon", "store", "market"],
    salary: ["salary", "wage", "paycheck", "payroll"],
    freelance: ["freelance", "client", "project", "invoice"],
  };

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some((kw) => cleaned.includes(kw))) {
      return category;
    }
  }

  return cleaned.split(/\s+/)[0] ?? "general";
}
