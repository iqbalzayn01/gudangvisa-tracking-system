import { Request, Response, NextFunction } from 'express';
import { ApplicationDocumentsService } from './application-documents.service.js';
import type { ApiResponse } from '../../types/index.js';
import { AppError } from '../../utils/AppError.js';
import { recordAudit } from '../../utils/audit.js';

export class ApplicationDocumentsController {
  private service = new ApplicationDocumentsService();

  getUploadUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileName, contentType, fileSize } = req.body;
      const result = await this.service.generateUploadUrl(
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

  addDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newDoc = await this.service.addDocument(req.body);

      await recordAudit(req, {
        action: 'UPLOAD',
        entityType: 'document',
        applicationId: newDoc?.applicationId ?? req.body.applicationId ?? null,
        newValues: {
          documentType: newDoc?.documentType ?? req.body.documentType,
          fileName: newDoc?.fileName ?? req.body.fileName,
        },
      });

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

  getByApplication = async (
    req: Request<{ applicationId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const docs = await this.service.getDocumentsByApplication(
        req.params.applicationId,
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

  verifyDocument = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.staffUser) throw new AppError(401, 'Staff auth required.');
      const result = await this.service.verifyDocument(
        req.params.id,
        req.body,
        req.staffUser.id,
      );

      await recordAudit(req, {
        action: 'STATUS_CHANGE',
        entityType: 'document',
        applicationId: result?.applicationId ?? null,
        newValues: { status: req.body.status },
      });

      const response: ApiResponse = {
        success: true,
        message: `Document ${req.body.status} successfully.`,
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getClientDownloadUrl = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.clientUser) throw new AppError(401, 'Client auth required.');
      const result = await this.service.getClientDownloadUrl(
        req.params.id,
        req.clientUser.id,
      );

      const response: ApiResponse = {
        success: true,
        message: 'Download URL generated successfully.',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  deleteDocument = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await this.service.removeDocument(req.params.id);

      await recordAudit(req, {
        action: 'DELETE',
        entityType: 'document',
        oldValues: { documentId: req.params.id },
      });

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
