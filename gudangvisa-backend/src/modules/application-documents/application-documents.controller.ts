import { Request, Response, NextFunction } from 'express';
import { ApplicationDocumentsService } from './application-documents.service.js';
import type { ApiResponse } from '../../types/index.js';
import { AppError } from '../../utils/AppError.js';

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

  deleteDocument = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await this.service.removeDocument(req.params.id);

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
