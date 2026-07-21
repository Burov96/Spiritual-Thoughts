import { PrismaClient } from "@prisma/client";
import randomColor from "randomcolor";

const prisma = new PrismaClient();

async function generateUserColors() {
  const users = await prisma.user.findMany({
    where: { color: null },
  });

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { color: randomColor() },
    });
  }

  console.log(`Updated colors for ${users.length} users.`);
}

generateUserColors()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
