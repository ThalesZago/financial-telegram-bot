import { prisma } from "../db";

export async function findOrCreateUser(telegramId: string, username?: string) {
  return prisma.user.upsert({
    where: { telegramId },
    update: {},
    create: { telegramId, username },
  });
}
