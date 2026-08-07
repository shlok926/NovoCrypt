import { authService } from './src/services/auth.service';
import { prisma } from './src/config/database';
import { hashPassword } from './src/utils/hash.util';

const testApp = async () => {
    try {
        console.log("Seeding test user...");
        const pwd = await hashPassword('password123');
        await prisma.user.upsert({
            where: { email: 'admin@novocrypt.io' },
            update: { passwordHash: pwd },
            create: {
                email: 'admin@novocrypt.io',
                passwordHash: pwd,
                name: 'Admin Test'
            }
        });
        console.log("Seed success");
    } catch(e: any) {
        console.log("Seed failed", e.message);
    }

    const tryLogin = async (email: string, pass: string) => {
        try {
            const user = await authService.login({ email, password: pass });
            return { status: 200, user: user.email };
        } catch (e: any) {
            return { status: e.statusCode || 500, error: e.message };
        }
    };

    console.log("\n--- TEST 1: Valid Credentials ---");
    console.log(await tryLogin('admin@novocrypt.io', 'password123'));

    console.log("\n--- TEST 2: Wrong Password ---");
    console.log(await tryLogin('admin@novocrypt.io', 'wrong'));

    console.log("\n--- TEST 3: Unknown User ---");
    console.log(await tryLogin('unknown@example.com', 'password123'));
    
    process.exit(0);
};
testApp().catch(console.error);
