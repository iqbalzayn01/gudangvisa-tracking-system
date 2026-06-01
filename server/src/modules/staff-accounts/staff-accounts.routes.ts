import { Router } from 'express';
import { StaffAccountsController } from './staff-accounts.controller.js';
import { requireStaffAuth } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createStaffSchema } from './staff-accounts.validation.js';

const router = Router();
const controller = new StaffAccountsController();

// All routes require staff authentication
router.use(requireStaffAuth);

// Get current user profile (admin & staff)
router.get('/me', authorizeRoles('admin', 'staff'), controller.getMe);

// ADMIN-only routes
router.post(
  '/',
  authorizeRoles('admin'),
  validate(createStaffSchema),
  controller.createStaff,
);
router.get('/', authorizeRoles('admin'), controller.getAllStaff);
router.delete('/:id', authorizeRoles('admin'), controller.deleteStaff);

export default router;
