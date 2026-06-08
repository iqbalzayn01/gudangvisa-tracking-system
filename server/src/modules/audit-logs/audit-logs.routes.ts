import { Router } from 'express';
import { AuditLogsController } from './audit-logs.controller.js';
import { requireStaffAuth } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = Router();
const controller = new AuditLogsController();

router.use(requireStaffAuth);

// Only admin can view audit logs
router.get('/', authorizeRoles('admin'), controller.getAll);
router.get('/:id', authorizeRoles('admin'), controller.getById);

export default router;
