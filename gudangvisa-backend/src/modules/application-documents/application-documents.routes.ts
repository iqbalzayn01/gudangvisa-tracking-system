import { Router } from 'express';
import { ApplicationDocumentsController } from './application-documents.controller.js';
import { requireStaffAuth } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  addDocumentSchema,
  verifyDocumentSchema,
} from './application-documents.validation.js';

const router = Router();
const controller = new ApplicationDocumentsController();

// All routes require staff authentication
router.use(requireStaffAuth);

// Generate signed upload URL
router.post(
  '/upload-url',
  authorizeRoles('admin', 'staff'),
  controller.getUploadUrl,
);

// Add document to application
router.post(
  '/',
  authorizeRoles('admin', 'staff'),
  validate(addDocumentSchema),
  controller.addDocument,
);

// Get all documents for an application
router.get(
  '/application/:applicationId',
  authorizeRoles('admin', 'staff'),
  controller.getByApplication,
);

// Verify/reject a document
router.patch(
  '/:id/verify',
  authorizeRoles('admin', 'staff'),
  validate(verifyDocumentSchema),
  controller.verifyDocument,
);

// Delete a document
router.delete('/:id', authorizeRoles('admin'), controller.deleteDocument);

export default router;
