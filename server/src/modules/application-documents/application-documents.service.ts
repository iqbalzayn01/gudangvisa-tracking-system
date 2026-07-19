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
   * Generate a temporary signed download URL for a document via the public,
   * no-auth resi tracking flow. Only issued when the reference number
   * matches the document's own application, the application is fully
   * `completed`, and the document itself is `verified` — anything else 404s
   * with a generic message (don't leak *why* it was refused).
   */
  async getPublicDownloadUrl(referenceNumber: string, documentId: string) {
    const doc = await this.repository.findByIdWithApplicationMeta(documentId);

    const eligible =
      doc &&
      doc.application?.referenceNumber === referenceNumber &&
      doc.application?.status === 'completed' &&
      doc.status === 'verified';

    if (!eligible) {
      throw new AppError(404, 'Document not found.');
    }

    const downloadUrl = await createSignedDownloadUrl(doc.filePath);
    if (!downloadUrl) {
      throw new AppError(404, 'Document file is not available for download.');
    }

    return {
      fileName: doc.fileName,
      downloadUrl,
      applicationId: doc.applicationId,
    };
  }

  async removeDocument(id: string) {
    const deletedDoc = await this.repository.deleteById(id);
    await deleteStorageFile(deletedDoc.filePath);
    return deletedDoc;
  }
}
