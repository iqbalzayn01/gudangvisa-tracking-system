import { Router } from 'express';
import { ClientAccountsController } from './client-accounts.controller.js';
import { requireStaffAuth } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createClientAccountSchema,
  updateClientAccountSchema,
} from './client-accounts.validation.js';

const router = Router();
const controller = new ClientAccountsController();

// All routes require staff authentication (clients are managed by staff)
router.use(requireStaffAuth);

// Create a new client account (STAFF, ADMIN)
router.post(
  '/',
  authorizeRoles('admin', 'staff'),
  validate(createClientAccountSchema),
  controller.create,
);

// Get all client accounts (STAFF, ADMIN)
router.get('/', authorizeRoles('admin', 'staff'), controller.getAll);

// Get a client account by ID (STAFF, ADMIN)
router.get('/:id', authorizeRoles('admin', 'staff'), controller.getById);

// Update a client account — name, nationality, phone only (ADMIN only)
router.patch(
  '/:id',
  authorizeRoles('admin'),
  validate(updateClientAccountSchema),
  controller.update,
);

// Delete a client account (ADMIN only)
router.delete('/:id', authorizeRoles('admin'), controller.delete);

export default router;
