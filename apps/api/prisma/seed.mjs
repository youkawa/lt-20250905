/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = [
    { email: 'alice@example.com', name: 'Alice', role: 'ADMIN' },
    { email: 'bob@example.com', name: 'Bob', role: 'USER' },
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: u,
    });
    console.log(`Seeded user: ${user.email} id=${user.id}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

