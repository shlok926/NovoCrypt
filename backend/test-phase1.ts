import { communityService } from './src/services/community.service';
import { prisma } from './src/config/database';

async function test() {
  try {
    console.log('--- Testing Get Threads ---');
    const threads = await communityService.getCommunityThreads();
    console.log(`Fetched ${threads.length} threads.`);
    if (threads.length > 0) {
      console.log(JSON.stringify(threads[0], null, 2));
    }

    console.log('\n--- Testing Create Thread ---');
    const newThread = await communityService.createThread(
      'Test Thread via Prisma',
      'This is a test content',
      'discussion',
      { id: '00000000-0000-0000-0000-000000000002', username: 'Tester', avatar: '😎', knowledgeLevel: 'advanced' }
    );
    console.log(`Created thread ID: ${newThread.id}`);

    console.log('\n--- Testing Reply to Thread ---');
    const repliedThread = await communityService.replyToThread(
      newThread.id,
      { id: '00000000-0000-0000-0000-000000000003', username: 'Replier', avatar: '💬', knowledgeLevel: 'expert' },
      'This is a test reply!'
    );
    console.log(`Replied. New reply count: ${repliedThread?.replies}`);
  } catch (error) {
    console.error('Test Failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
