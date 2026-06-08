import { prisma } from "../db";
import { TransactionType } from "../../app/generated/prisma";

export interface CreateTransactionInput {
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
}

export async function createTransaction(input: CreateTransactionInput) {
  return prisma.transaction.create({
    data: {
      userId: input.userId,
      type: input.type,
      amount: input.amount,
      category: input.category.toLowerCase(),
      description: input.description,
    },
  });
}

export async function getBalance(userId: string) {
  const result = await prisma.transaction.groupBy({
    by: ["type"],
    where: { userId },
    _sum: { amount: true },
  });

  const income =
    result.find((r) => r.type === "INCOME")?._sum.amount?.toNumber() ?? 0;
  const expenses =
    result.find((r) => r.type === "EXPENSE")?._sum.amount?.toNumber() ?? 0;

  return { income, expenses, balance: income - expenses };
}

export async function getRecentTransactions(userId: string, limit = 5) {
  return prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function deleteLastTransaction(userId: string) {
  const last = await prisma.transaction.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!last) return null;

  await prisma.transaction.delete({ where: { id: last.id } });
  return last;
}
