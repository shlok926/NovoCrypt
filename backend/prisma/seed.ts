import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'alice@example.com',
      passwordHash: 'dummy',
      name: 'QuantumVanguard',
      avatar: '👩‍💻',
      knowledgeLevel: 'expert'
    }
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'bob@example.com',
      passwordHash: 'dummy',
      name: 'CryptoGuardian',
      avatar: '🔐',
      knowledgeLevel: 'advanced'
    }
  });

  const thread1 = await prisma.communityThread.create({
    data: {
      title: 'Best practices for ML-KEM integration',
      content: 'What are the recommended best practices when integrating ML-KEM into existing systems?',
      category: 'guide',
      authorId: user1.id,
      tags: ['ML-KEM', 'Integration'],
      views: 347,
      upvotes: 89,
      replies: {
        create: [
          { content: 'Start with hybrid mode!', authorId: user2.id }
        ]
      }
    }
  });

  console.log('Seeding complete!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
