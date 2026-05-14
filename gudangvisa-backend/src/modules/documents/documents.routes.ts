import { Router } from 'express';
import { DocumentController } from './documents.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = Router();
const controller = new DocumentController();

// All routes require authentication
router.use(requireAuth);

// 1. Generate a signed upload URL (STAFF, ADMIN)
router.post(
  '/upload-url',
  authorizeRoles('STAFF', 'ADMIN'),
  controller.getUploadUrl,
);

// 2. Attach a document to a ticket (STAFF, ADMIN)
router.post('/', authorizeRoles('STAFF', 'ADMIN'), controller.addDocument);

// 3. Get all documents for a ticket (STAFF, ADMIN)
router.get(
  '/ticket/:ticketId',
  authorizeRoles('STAFF', 'ADMIN'),
  controller.getByTicket,
);

// 4. Delete a document (ADMIN only)
router.delete('/:id', authorizeRoles('ADMIN'), controller.deleteDocument);

export default router;
