import { Router } from 'express';
import { ApplicationsController } from './applications.controller.js';
import { requireStaffAuth } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { trackingLimiter } from '../../middlewares/rate-limit.middleware.js';
import {
  createApplicationSchema,
  updateStatusSchema,
  updateBiometricSchema,
  toggleChecklistSchema,
} from './applications.validation.js';

const router = Router();
const controller = new ApplicationsController();

// === Public Routes (no auth — resi-based client tracking) ===
router.get('/track/:referenceNumber', trackingLimiter, controller.trackByReference);

// === Staff Routes ===
router.post(
  '/',
  requireStaffAuth,
  authorizeRoles('admin', 'staff'),
  validate(createApplicationSchema),
  controller.create,
);

router.get(
  '/',
  requireStaffAuth,
  authorizeRoles('admin', 'staff'),
  controller.getAll,
);

router.get(
  '/:id',
  requireStaffAuth,
  authorizeRoles('admin', 'staff'),
  controller.getById,
);

router.patch(
  '/:id/status',
  requireStaffAuth,
  authorizeRoles('admin', 'staff'),
  validate(updateStatusSchema),
  controller.updateStatus,
);

router.patch(
  '/:id/biometric',
  requireStaffAuth,
  authorizeRoles('admin', 'staff'),
  validate(updateBiometricSchema),
  controller.updateBiometric,
);

router.patch(
  '/:id/checklist',
  requireStaffAuth,
  authorizeRoles('admin', 'staff'),
  validate(toggleChecklistSchema),
  controller.toggleChecklist,
);

router.delete(
  '/:id',
  requireStaffAuth,
  authorizeRoles('admin'),
  controller.delete,
);

export default router;
