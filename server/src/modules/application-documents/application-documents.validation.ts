import { z } from 'zod';

export const addDocumentSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID.'),
  documentType: z.enum([
    'passport',
    'photo',
    'sponsor_letter',
    'company_nib',
    'bank_statement',
    'rejection_letter',
    'final_evisa',
  ]),
  fileName: z.string().min(1, 'File name is required.'),
  storagePath: z.string().min(1, 'Storage path is required.'),
});

export const verifyDocumentSchema = z.object({
  status: z.enum(['verified', 'rejected']),
  rejectionReason: z.string().optional(),
});

export type AddDocumentInput = z.infer<typeof addDocumentSchema>;
export type VerifyDocumentInput = z.infer<typeof verifyDocumentSchema>;
