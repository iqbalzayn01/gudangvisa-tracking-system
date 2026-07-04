import { ApplicationDocumentsService } from './application-documents.service.js';
import {
  asyncHandler,
  sendSuccess,
  getStaffUser,
  getClientUser,
} from '../../utils/handler.js';
import { recordAudit } from '../../utils/audit.js';

export class ApplicationDocumentsController {
  private service = new ApplicationDocumentsService();

  getUploadUrl = asyncHandler(async (req, res) => {
    const { fileName, contentType, fileSize } = req.body;
    const result = await this.service.generateUploadUrl(
      fileName,
      contentType,
      fileSize,
    );

    sendSuccess(res, 200, 'Signed upload URL generated successfully.', result);
  });

  addDocument = asyncHandler(async (req, res) => {
    const newDoc = await this.service.addDocument(req.body);

    await recordAudit(req, {
      action: 'UPLOAD',
      entityType: 'document',
      applicationId: newDoc.applicationId,
      newValues: {
        documentType: newDoc.documentType,
        fileName: newDoc.fileName,
      },
    });

    sendSuccess(res, 201, 'Document added successfully!', newDoc);
  });

  getByApplication = asyncHandler<{ applicationId: string }>(
    async (req, res) => {
      const docs = await this.service.getDocumentsByApplication(
        req.params.applicationId,
      );
      sendSuccess(res, 200, 'Documents retrieved successfully.', docs);
    },
  );

  getExpiring = asyncHandler(async (req, res) => {
    const days = Number.parseInt(String(req.query.days ?? '30'), 10);
    const docs = await this.service.getExpiringDocuments(
      Number.isNaN(days) ? 30 : days,
    );
    sendSuccess(res, 200, 'Expiring documents retrieved successfully.', docs);
  });

  verifyDocument = asyncHandler<{ id: string }>(async (req, res) => {
    const staff = getStaffUser(req);
    const result = await this.service.verifyDocument(
      req.params.id,
      req.body,
      staff.id,
    );

    await recordAudit(req, {
      action: 'STATUS_CHANGE',
      entityType: 'document',
      applicationId: result.applicationId,
      newValues: { status: req.body.status },
    });

    sendSuccess(res, 200, `Document ${req.body.status} successfully.`, result);
  });

  getClientDownloadUrl = asyncHandler<{ id: string }>(async (req, res) => {
    const client = getClientUser(req);
    const result = await this.service.getClientDownloadUrl(
      req.params.id,
      client.id,
    );

    // Client downloads are part of the audit trail (staffId stays null).
    await recordAudit(req, {
      action: 'DOWNLOAD',
      entityType: 'document',
      applicationId: result.applicationId,
      newValues: {
        documentId: req.params.id,
        fileName: result.fileName,
        clientId: client.id,
      },
    });

    sendSuccess(res, 200, 'Download URL generated successfully.', {
      fileName: result.fileName,
      downloadUrl: result.downloadUrl,
    });
  });

  deleteDocument = asyncHandler<{ id: string }>(async (req, res) => {
    await this.service.removeDocument(req.params.id);

    await recordAudit(req, {
      action: 'DELETE',
      entityType: 'document',
      oldValues: { documentId: req.params.id },
    });

    sendSuccess(res, 200, 'Document deleted successfully.');
  });
}
