import type { ParsedIntent } from "../parser/deterministic.parser";

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "google/gemma-3-27b-it:free";

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
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status}`);
  }

  const data = await response.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
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
