import { DocumentRepository } from './documents.repository.js';
import { AppError } from '../../utils/AppError.js';
import {
  validateFileMetadata,
  generateStoragePath,
  createSignedUploadUrl,
  verifyFileExists,
  createSignedDownloadUrl,
  deleteStorageFile,
} from '../../utils/storage.js';

type DocType = 'VISA' | 'KITAS' | 'PASSPORT';
type DocStatus =
  | 'RECEIVED'
  | 'IN_REVIEW'
  | 'IN_PROCESS'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

export class DocumentService {
  private documentRepo = new DocumentRepository();

  /**
   * Generate a signed upload URL for direct client-to-Supabase upload.
   */
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

  /**
   * Add a document (file attachment) to a ticket.
   * Verifies the file exists in Supabase Storage before saving.
   */
  async addDocumentToTicket(
    ticketId: string,
    data: {
      docName: string;
      docType: DocType;
      status?: DocStatus;
      isPublic?: boolean;
    },
    storagePath: string,
  ) {
    // Verify the file exists in storage
    await verifyFileExists(storagePath);

    return await this.documentRepo.addDocument({
      ticketId,
      docName: data.docName,
      docType: data.docType,
      status: data.status || 'RECEIVED',
      fileUrl: storagePath,
      isPublic: data.isPublic ?? false,
    });
  }

  /**
   * Get all documents for a ticket, with signed download URLs.
   */
  async getDocumentsByTicket(ticketId: string) {
    const docs = await this.documentRepo.findByTicketId(ticketId);

    return await Promise.all(
      docs.map(async (doc) => ({
        ...doc,
        fileDownloadUrl: await createSignedDownloadUrl(doc.fileUrl),
      })),
    );
  }

  /**
   * Delete a document from DB and clean up the file from storage.
   */
  async removeDocument(id: string) {
    const deletedDoc = await this.documentRepo.deleteById(id);
    await deleteStorageFile(deletedDoc.fileUrl);
    return deletedDoc;
  }
}
