import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware factory: Validate request body against a Zod schema.
 * Returns 400 with structured error messages if validation fails.
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map(
          (issue) => `${issue.path.join('.')}: ${issue.message}`,
        );

        _res.status(400).json({
          success: false,
          message: 'Validation failed.',
          errors: messages,
        });
        return;
      }
      next(error);
    }
  };
};
