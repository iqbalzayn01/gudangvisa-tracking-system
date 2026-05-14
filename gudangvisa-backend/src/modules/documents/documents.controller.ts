import { Request, Response, NextFunction } from 'express';
import { DocumentService } from './documents.service.js';
import { ApiResponse } from '../../types/index.js';

export class DocumentController {
  private documentService = new DocumentService();

  /**
   * Generate a signed upload URL.
   * POST /api/v1/documents/upload-url
   */
  getUploadUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileName, contentType, fileSize } = req.body;
      const result = await this.documentService.generateUploadUrl(
        fileName,
        contentType,
        fileSize,
      );

      const response: ApiResponse = {
        success: true,
        message: 'Signed upload URL generated successfully.',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Attach a document to a ticket (after file upload).
   * POST /api/v1/documents
   */
  addDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ticketId, docName, docType, status, isPublic, storagePath } =
        req.body;

      const newDoc = await this.documentService.addDocumentToTicket(
        ticketId,
        { docName, docType, status, isPublic },
        storagePath,
      );

      const response: ApiResponse = {
        success: true,
        message: 'Document added successfully!',
        data: newDoc,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all documents for a ticket.
   * GET /api/v1/documents/ticket/:ticketId
   */
  getByTicket = async (
    req: Request<{ ticketId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const docs = await this.documentService.getDocumentsByTicket(
        req.params.ticketId,
      );

      const response: ApiResponse = {
        success: true,
        message: 'Documents retrieved successfully.',
        data: docs,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a document.
   * DELETE /api/v1/documents/:id
   */
  deleteDocument = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await this.documentService.removeDocument(req.params.id);

      const response: ApiResponse = {
        success: true,
        message: 'Document deleted successfully.',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
