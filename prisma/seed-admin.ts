import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@gmail.com';
  const password = await bcrypt.hash('admin@gmail.com', 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { password, role: 'ADMIN' },
    create: { name: 'Admin', email, password, role: 'ADMIN' },
  });
  console.log('Seeded admin:', user.email, user.role);
}

main().finally(() => prisma.$disconnect());
