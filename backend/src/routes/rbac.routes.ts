import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { rbacController } from '../controllers/rbac.controller';

const router = Router();

// All RBAC routes require authentication
router.use(requireAuth);

router.get('/roles', requirePermission('roles:manage'), rbacController.getRoles);
router.delete('/roles/:roleCode', requirePermission('roles:manage'), rbacController.deleteRole);
router.get('/permissions', requirePermission('roles:manage'), rbacController.getPermissions);
router.post('/roles/assign', requirePermission('roles:assign'), rbacController.assignRole);
router.post('/roles/remove', requirePermission('roles:assign'), rbacController.removeRole);

router.get('/my-permissions', rbacController.getUserPermissions);
router.get('/users/:userId/permissions', requirePermission('users:read'), rbacController.getUserPermissions);

router.get('/sessions', rbacController.getUserSessions);
router.post('/sessions/revoke-all', rbacController.revokeAllSessions);

router.get('/audit-logs', requirePermission('audit:view'), rbacController.getAuditLogs);

export default router;
