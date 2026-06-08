# Personal Finance Telegram Bot

A personal finance assistant that lets you manage expenses, income, and view reports directly from Telegram using natural language.

## How it works

```
Telegram → Webhook → Next.js API → PostgreSQL (Neon)
```

Messages are first parsed with deterministic rules (regex/keywords). If no match is found, the message is sent to an AI model via OpenRouter as a fallback.

---

## Features

- Record expenses and income via natural language
- Check your current balance
- View monthly summaries with top spending categories
- View spending by category
- List recent transactions
- Delete last transaction
- AI fallback for conversational messages (OpenRouter)

---

## Commands

| Message example | Action |
|---|---|
| `spent 20 on food` | Record expense |
| `paid 80 for groceries` | Record expense |
| `received 3000 salary` | Record income |
| `balance` | Show current balance |
| `summary` | Show monthly summary |
| `last transactions` | Show recent transactions |
| `delete my last transaction` | Delete last transaction |
| `"I grabbed lunch and spent 35 bucks"` | AI fallback → record expense |

---

## Prerequisites

- [Node.js](https://nodejs.org) 20+
- [Neon](https://neon.tech) account (free PostgreSQL)
- [Telegram bot](https://t.me/BotFather) token
- [OpenRouter](https://openrouter.ai) API key (optional, for AI fallback)
- [Vercel](https://vercel.com) account for deployment

---

## Setup

### 1. Fork and clone

```bash
git clone https://github.com/your-username/financial-telegram-bot.git
cd financial-telegram-bot
npm install
```

### 2. Create the database

Run the SQL in [`db/schema.sql`](db/schema.sql) in your Neon project's SQL editor. This creates the `users` and `transactions` tables.

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `TELEGRAM_BOT_TOKEN` | Token from [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_WEBHOOK_SECRET` | Random secret to authenticate Telegram requests (optional but recommended) |
| `OPENROUTER_API_KEY` | API key from [openrouter.ai/keys](https://openrouter.ai/keys) (optional) |
| `OPENROUTER_MODEL` | Model slug, e.g. `google/gemma-3-27b-it:free` |

To generate a strong webhook secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Run locally

```bash
npm run dev
```

> Note: Telegram cannot reach `localhost` directly. Use [ngrok](https://ngrok.com) or deploy to Vercel to test the webhook.

---

## Deploy to Vercel

### 1. Push to GitHub and import the repo in Vercel

### 2. Add all environment variables in the Vercel dashboard

### 3. Deploy, then register the Telegram webhook

```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<YOUR_VERCEL_DOMAIN>/api/webhook&secret_token=<YOUR_WEBHOOK_SECRET>
```

Verify it was set:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

---

## Project structure

```
app/
  api/webhook/route.ts      # Telegram webhook endpoint
lib/
  db.ts                     # PostgreSQL pool (Neon serverless)
  services/
    user.service.ts         # Auto user registration
    transaction.service.ts  # Create, query, delete transactions
    report.service.ts       # Monthly summary, category reports
  parser/
    deterministic.parser.ts # Regex/keyword message parsing
  ai/
    ollama.service.ts       # OpenRouter AI fallback
  formatter/
    response.formatter.ts   # Telegram response messages
  bot/
    message.handler.ts      # Orchestrates the full flow
db/
  schema.sql                # Database schema
```

---

## Tech stack

- [Next.js 16](https://nextjs.org) — App Router, API Route Handlers
- [Neon](https://neon.tech) — Serverless PostgreSQL
- [@neondatabase/serverless](https://github.com/neondatabase/serverless) — Neon's serverless pg driver
- [OpenRouter](https://openrouter.ai) — AI model routing (optional)
- [Vercel](https://vercel.com) — Deployment
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
