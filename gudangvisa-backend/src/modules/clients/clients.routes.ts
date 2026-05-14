import { Router } from 'express';
import { ClientsController } from './clients.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = Router();
const controller = new ClientsController();

// All routes require authentication
router.use(requireAuth);

// 1. Create a new client (STAFF, ADMIN)
router.post('/', authorizeRoles('STAFF', 'ADMIN'), controller.create);

// 2. Get all clients (STAFF, ADMIN)
router.get('/', authorizeRoles('STAFF', 'ADMIN'), controller.getAll);

// 3. Get a client by ID (STAFF, ADMIN)
router.get('/:id', authorizeRoles('STAFF', 'ADMIN'), controller.getById);

// 4. Delete a client (ADMIN only)
router.delete('/:id', authorizeRoles('ADMIN'), controller.delete);

export default router;
