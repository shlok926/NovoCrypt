import app from './src/app';
import { prisma } from './src/config/database';
import { hashPassword } from './src/utils/hash.util';
import http from 'http';

const testApp = async () => {
    const server = http.createServer(app);
    server.listen(5015, async () => {
        console.log("Test server running on port 5015");
        const baseUrl = 'http://localhost:5015/api/auth';
        
        const tryReq = async (url: string, body: any) => {
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const data = await res.json().catch(()=>null);
                return { status: res.status, data };
            } catch(e: any) {
                return { error: e.message };
            }
        };

        console.log("\n--- TEST 1: Valid Credentials ---");
        const r1 = await tryReq(`${baseUrl}/login`, { email: 'admin@novocrypt.io', password: 'password123' });
        console.log(r1);

        console.log("\n--- TEST 2: Wrong Password ---");
        const r2 = await tryReq(`${baseUrl}/login`, { email: 'admin@novocrypt.io', password: 'wrong' });
        console.log(r2);

        console.log("\n--- TEST 3: Unknown User ---");
        const r3 = await tryReq(`${baseUrl}/login`, { email: 'unknown@example.com', password: 'password123' });
        console.log(r3);

        server.close();
        process.exit(0);
    });
};
testApp().catch(console.error);
