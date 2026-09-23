import prisma from "@/lib/prisma";

export const TEST_USER_EMAIL = "test@ignis.local";

export async function getOrCreateTestUser() {
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
