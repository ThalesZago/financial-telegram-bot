import type { ParsedIntent } from "../parser/deterministic.parser";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3";

const SYSTEM_PROMPT = `You are a financial assistant. Parse the user message and return ONLY a JSON object with no extra text.

Supported intents and their JSON shapes:
- {"intent":"create_expense","amount":number,"category":"string","description":"string"}
- {"intent":"create_income","amount":number,"category":"string","description":"string"}
- {"intent":"balance"}
- {"intent":"summary"}
- {"intent":"recent_transactions"}
- {"intent":"delete_last_transaction"}
- {"intent":"category_report","category":"string","period":"current_month"|"all_time"}

Rules:
- amount must be a positive number
- category must be a single lowercase word
- Return null if the message is not related to personal finance
- Return ONLY valid JSON, no markdown, no explanation`;

export async function parseWithAI(message: string): Promise<ParsedIntent> {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status}`);
  }

  const data = await response.json();
  const content: string = data?.message?.content ?? "";

  return validateAIResponse(content);
}

function validateAIResponse(raw: string): ParsedIntent {
  let parsed: unknown;

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;

  const obj = parsed as Record<string, unknown>;
  const intent = obj.intent;

  if (intent === "create_expense" || intent === "create_income") {
    const amount = Number(obj.amount);
    if (!amount || amount <= 0) return null;
    if (typeof obj.category !== "string" || !obj.category) return null;
    return {
      intent,
      amount,
      category: String(obj.category).toLowerCase(),
      description: typeof obj.description === "string" ? obj.description : undefined,
    };
  }

  if (intent === "balance") return { intent: "balance" };
  if (intent === "summary") return { intent: "summary" };
  if (intent === "recent_transactions") return { intent: "recent_transactions" };
  if (intent === "delete_last_transaction") return { intent: "delete_last_transaction" };

  if (intent === "category_report") {
    if (typeof obj.category !== "string" || !obj.category) return null;
    const period = obj.period === "all_time" ? "all_time" : "current_month";
    return { intent: "category_report", category: String(obj.category).toLowerCase(), period };
  }

  return null;
}
