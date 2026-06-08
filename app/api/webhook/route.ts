import { NextRequest, NextResponse } from "next/server";
import { handleMessage } from "../../../lib/bot/message.handler";

interface TelegramMessage {
  message_id: number;
  from?: {
    id: number;
    username?: string;
  };
  chat: { id: number };
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

function verifyWebhookSecret(request: NextRequest): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return true; // secret validation is optional but recommended

  const headerSecret = request.headers.get("x-telegram-bot-api-secret-token");
  return headerSecret === secret;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!verifyWebhookSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: TelegramUpdate;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = body.message;
  if (!message || !message.text || !message.from) {
    return NextResponse.json({ ok: true });
  }

  const chatId = message.chat.id;
  const telegramUser = { id: message.from.id, username: message.from.username };

  try {
    const reply = await handleMessage(message.text, telegramUser);
    await sendTelegramMessage(chatId, reply);
  } catch {
    await sendTelegramMessage(chatId, "❌ An unexpected error occurred. Please try again.");
  }

  return NextResponse.json({ ok: true });
}
