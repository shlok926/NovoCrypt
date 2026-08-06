import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const email = 'neongaming12456@gmail.com';
  // Bootstrap credential: dynamically generated instead of hardcoded
  const plainPassword = crypto.randomBytes(16).toString('hex');
  
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      name: 'Admin Virtus',
      role: 'admin',
    },
    create: {
      email,
      passwordHash,
      name: 'Admin Virtus',
      role: 'admin',
      avatar: '🛡️',
      knowledgeLevel: 'expert',
    },
  });

  console.log('✅ Admin user created/updated successfully!');
  console.log('-------------------------------------------');
  console.log(`Email:    ${user.email}`);
  console.log(`Password: ${plainPassword}`);
  console.log(`Name:     ${user.name}`);
  console.log(`Role:     ${user.role}`);
  console.log('-------------------------------------------');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
