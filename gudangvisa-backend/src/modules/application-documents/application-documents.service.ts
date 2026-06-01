import { ApplicationDocumentsRepository } from './application-documents.repository.js';
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
    });
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

  async removeDocument(id: string) {
    const deletedDoc = await this.repository.deleteById(id);
    await deleteStorageFile(deletedDoc.filePath);
    return deletedDoc;
  }
}
