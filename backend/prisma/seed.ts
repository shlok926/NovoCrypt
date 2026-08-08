import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const SYSTEM_ROLES = [
  { code: 'SUPER_ADMIN', name: 'Super Administrator', description: 'System-wide administrative access', isSystem: true },
  { code: 'ADMIN', name: 'Administrator', description: 'User, role, and asset management', isSystem: true },
  { code: 'SECURITY_ADMIN', name: 'Security Officer', description: 'Scanner policies and threat rules', isSystem: true },
  { code: 'ANALYST', name: 'Security Analyst', description: 'Scanner execution and report generation', isSystem: true },
  { code: 'AUDITOR', name: 'Compliance Auditor', description: 'Read-only access to audit logs and reports', isSystem: true },
  { code: 'USER', name: 'Standard User', description: 'Access to owned assets and lab sessions', isSystem: true },
  { code: 'READ_ONLY', name: 'Read-Only Viewer', description: 'Inspection-only access', isSystem: true },
];

const SYSTEM_PERMISSIONS = [
  { code: 'users:read', resource: 'users', action: 'read', description: 'Read user profiles' },
  { code: 'users:create', resource: 'users', action: 'create', description: 'Create user profiles' },
  { code: 'users:update', resource: 'users', action: 'update', description: 'Update user profiles' },
  { code: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },
  { code: 'roles:assign', resource: 'roles', action: 'assign', description: 'Assign roles to users' },
  { code: 'roles:manage', resource: 'roles', action: 'manage', description: 'Create and manage custom roles' },

  { code: 'assets:read', resource: 'assets', action: 'read', description: 'Read assets' },
  { code: 'assets:create', resource: 'assets', action: 'create', description: 'Create assets' },
  { code: 'assets:update', resource: 'assets', action: 'update', description: 'Update assets' },
  { code: 'assets:delete', resource: 'assets', action: 'delete', description: 'Delete assets' },

  { code: 'scanner:execute', resource: 'scanner', action: 'execute', description: 'Execute cryptography scans' },
  { code: 'jobs:read', resource: 'jobs', action: 'read', description: 'Read background jobs' },
  { code: 'jobs:cancel', resource: 'jobs', action: 'cancel', description: 'Cancel background jobs' },
  { code: 'workflows:manage', resource: 'workflows', action: 'manage', description: 'Manage scanning workflows' },

  { code: 'compliance:read', resource: 'compliance', action: 'read', description: 'Read compliance standards' },
  { code: 'reports:generate', resource: 'reports', action: 'generate', description: 'Generate compliance reports' },
  { code: 'reports:download', resource: 'reports', action: 'download', description: 'Download compliance reports' },

  { code: 'threats:read', resource: 'threats', action: 'read', description: 'Read threat advisories' },
  { code: 'threats:manage', resource: 'threats', action: 'manage', description: 'Manage threat intel rules' },

  { code: 'audit:view', resource: 'audit', action: 'view', description: 'View security audit logs' },
  { code: 'sessions:revoke', resource: 'sessions', action: 'revoke', description: 'Revoke active user sessions' },
  { code: 'system:configure', resource: 'system', action: 'configure', description: 'Configure system settings' },
];

async function seedRBAC() {
  console.log('Seeding RBAC system roles and permissions...');

  // 1. Seed Roles
  const roleMap: Record<string, string> = {};
  for (const r of SYSTEM_ROLES) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description, isSystem: r.isSystem },
      create: r,
    });
    roleMap[r.code] = role.id;
  }

  // 2. Seed Permissions
  const permMap: Record<string, string> = {};
  for (const p of SYSTEM_PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { code: p.code },
      update: { resource: p.resource, action: p.action, description: p.description },
      create: p,
    });
    permMap[p.code] = perm.id;
  }

  // 3. Bind Permissions to SUPER_ADMIN (All permissions)
  for (const permCode of Object.keys(permMap)) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleMap['SUPER_ADMIN'],
          permissionId: permMap[permCode],
        },
      },
      create: {
        roleId: roleMap['SUPER_ADMIN'],
        permissionId: permMap[permCode],
      },
      update: {},
    });
  }

  // 4. Bind Permissions to USER (Standard permissions)
  const userPermissions = ['assets:read', 'assets:create', 'scanner:execute', 'jobs:read', 'compliance:read', 'reports:generate', 'threats:read'];
  for (const permCode of userPermissions) {
    if (permMap[permCode]) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roleMap['USER'],
            permissionId: permMap[permCode],
          },
        },
        create: {
          roleId: roleMap['USER'],
          permissionId: permMap[permCode],
        },
        update: {},
      });
    }
  }

  // 5. User Migration: Assign default USER role to all existing users without roles
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const user of users) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: roleMap['USER'],
        },
      },
      create: {
        userId: user.id,
        roleId: roleMap['USER'],
      },
      update: {},
    });
  }

  console.log('RBAC Seeding and Migration complete!');
}

async function main() {
  await seedRBAC();

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

  console.log('Seeding complete!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
