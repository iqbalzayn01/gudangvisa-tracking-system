import { Router } from 'express';
import { ApplicationDocumentsController } from './application-documents.controller.js';
import { requireStaffAuth } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { trackingLimiter } from '../../middlewares/rate-limit.middleware.js';
import {
  addDocumentSchema,
  verifyDocumentSchema,
  uploadUrlSchema,
} from './application-documents.validation.js';

const router = Router();
const controller = new ApplicationDocumentsController();

// === Public Route (no auth — defined before the staff-auth gate below) ===
// Lets anyone who knows the reference number download a verified document
// once the application is completed. See getPublicDownload for the checks.
router.get(
  '/track/:referenceNumber/documents/:documentId/download',
  trackingLimiter,
  controller.getPublicDownload,
);

// All routes below require staff authentication
router.use(requireStaffAuth);

// Generate signed upload URL
router.post(
  '/upload-url',
  authorizeRoles('admin', 'staff'),
  validate(uploadUrlSchema),
  controller.getUploadUrl,
);

// Add document to application
router.post(
  '/',
  authorizeRoles('admin', 'staff'),
  validate(addDocumentSchema),
  controller.addDocument,
);

// Documents expiring soon (monitoring dashboard) — must precede param routes
router.get('/expiring', authorizeRoles('admin', 'staff'), controller.getExpiring);

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
