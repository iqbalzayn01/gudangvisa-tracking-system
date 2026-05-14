import { Router } from 'express';
import { TicketsController } from './tickets.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = Router();
const controller = new TicketsController();

// All routes require authentication
router.use(requireAuth);

// 1. Create a new ticket (STAFF, ADMIN)
router.post('/', authorizeRoles('STAFF', 'ADMIN'), controller.create);

// 2. Get all tickets (STAFF, ADMIN)
router.get('/', authorizeRoles('STAFF', 'ADMIN'), controller.getAll);

// 3. Get a ticket by ID (STAFF, ADMIN)
router.get('/:id', authorizeRoles('STAFF', 'ADMIN'), controller.getById);

// 4. Update ticket status (STAFF, ADMIN)
router.patch(
  '/:id/status',
  authorizeRoles('STAFF', 'ADMIN'),
  controller.updateStatus,
);

// 5. Delete a ticket (ADMIN only)
router.delete('/:id', authorizeRoles('ADMIN'), controller.delete);

export default router;
