import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "test@ignis.local" },
    update: {
      name: "Test User",
      passwordHash: "placeholder",
    },
    create: {
      email: "test@ignis.local",
      passwordHash: "placeholder",
      name: "Test User",
    },
  });

  console.log("Seeded user:", {
    id: user.id,
    email: user.email,
    name: user.name,
  });
}

main()
  .catch((e) => {
    console.error("Error in seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
