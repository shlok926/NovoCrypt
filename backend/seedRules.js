const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.threatRule.createMany({
    data: [
      {
        ruleId: 'RULE-PQC-001',
        title: 'Deprecated RSA Key Size',
        description: 'RSA key sizes below 3072-bit are considered insecure against upcoming quantum threats and are deprecated by NIST.',
        severity: 'high',
        priority: 85,
        condition: { algorithmFamily: 'RSA' },
        recommendedAction: 'Migrate to ML-KEM or increase key size to 3072-bit minimum.',
        deprecationStatus: 'deprecated'
      },
      {
        ruleId: 'RULE-PQC-002',
        title: 'Vulnerable ECC Curve',
        description: 'Elliptic Curve Cryptography is vulnerable to Shor\'s algorithm.',
        severity: 'critical',
        priority: 95,
        condition: { algorithmFamily: 'ECC' },
        recommendedAction: 'Migrate to ML-KEM (Kyber) or implement hybrid key exchange.',
        deprecationStatus: 'disallowed'
      }
    ],
    skipDuplicates: true
  });
  console.log('Seeded rules');
}
run().catch(console.error).finally(() => prisma.$disconnect());
