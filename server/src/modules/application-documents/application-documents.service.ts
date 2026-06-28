import { ApplicationDocumentsRepository } from './application-documents.repository.js';
import { AppError } from '../../utils/AppError.js';
import {
  validateFileMetadata,
  generateStoragePath,
  createSignedUploadUrl,
  verifyFileExists,
  createSignedDownloadUrl,
  deleteStorageFile,
} from '../../utils/storage.js';
import type {
  AddDocumentInput,
  VerifyDocumentInput,
} from './application-documents.validation.js';

export class ApplicationDocumentsService {
  private repository = new ApplicationDocumentsRepository();

  async generateUploadUrl(
    fileName: string,
    contentType: string,
    fileSize?: number,
  ) {
    validateFileMetadata(fileName, contentType, fileSize);
    const storagePath = generateStoragePath(fileName);
    const uploadData = await createSignedUploadUrl(storagePath);

    return {
      signedUrl: uploadData.signedUrl,
      storagePath: uploadData.path,
      token: uploadData.token,
    };
  }

  async addDocument(data: AddDocumentInput) {
    await verifyFileExists(data.storagePath);

    return await this.repository.create({
      applicationId: data.applicationId,
      documentType: data.documentType,
      fileName: data.fileName,
      filePath: data.storagePath,
      status: 'pending',
      issuedDate: data.issuedDate ?? null,
      expiryDate: data.expiryDate ?? null,
    });
  }

  /**
   * List documents whose validity expires within the next `days` (or are
   * already expired). Powers the dashboard "Expiring Documents" monitoring
   * widget. Capped to a sane window to avoid scanning unbounded ranges.
   */
  async getExpiringDocuments(days: number) {
    const window = Number.isFinite(days)
      ? Math.min(Math.max(Math.trunc(days), 1), 365)
      : 30;
    return await this.repository.findExpiringWithin(window);
  }

  async getDocumentsByApplication(applicationId: string) {
    const docs =
      await this.repository.findByApplicationId(applicationId);

    return await Promise.all(
      docs.map(async (doc) => ({
        ...doc,
        fileDownloadUrl: await createSignedDownloadUrl(doc.filePath),
      })),
    );
  }

  async verifyDocument(
    docId: string,
    data: VerifyDocumentInput,
    staffId: string,
  ) {
    return await this.repository.updateVerification(docId, {
      status: data.status,
      rejectionReason: data.rejectionReason ?? null,
      verifiedByStaffId: staffId,
      verifiedAt: new Date(),
    });
  }

  /**
   * Generate a temporary signed download URL for a document, but only if it
   * belongs to the requesting client. Used by the client tracking portal to
   * download completed documents (e-Visa PDFs, etc.).
   */
  async getClientDownloadUrl(documentId: string, clientId: string) {
    const doc = await this.repository.findByIdWithOwner(documentId);
    if (!doc) throw new AppError(404, 'Document not found.');

    if (doc.application?.clientId !== clientId) {
      throw new AppError(403, 'You do not have access to this document.');
    }

    const downloadUrl = await createSignedDownloadUrl(doc.filePath);
    if (!downloadUrl) {
      throw new AppError(404, 'Document file is not available for download.');
    }

    return { fileName: doc.fileName, downloadUrl };
  }

  async removeDocument(id: string) {
    const deletedDoc = await this.repository.deleteById(id);
    await deleteStorageFile(deletedDoc.filePath);
    return deletedDoc;
  }
}
