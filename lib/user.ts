import prisma from "@/lib/prisma";

export const TEST_USER_EMAIL = "test@ignis.local";

export async function getOrCreateTestUser() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "База данных не подключена: переменная DATABASE_URL не найдена. Пожалуйста, добавьте DATABASE_URL в настройках проекта на Vercel (Project Settings -> Environment Variables)."
    );
  }

  let user = await prisma.user.findUnique({
    where: { email: TEST_USER_EMAIL },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: TEST_USER_EMAIL,
        name: "Test User",
        passwordHash: "placeholder",
      },
    });
  }

  return user;
}
