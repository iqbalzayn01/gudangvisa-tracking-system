import { z } from 'zod';

/**
 * Document types accepted from the client. Must stay in sync with
 * `documentTypeEnum` in `db/schema.ts`.
 */
export const DOCUMENT_TYPES = [
  // Core / general documents
  'passport',
  'photo',
  'sponsor_letter',
  'company_nib',
  'bank_statement',
  'rejection_letter',
  'final_evisa',
  // KITAS professional / legal documents
  'marriage_certificate',
  'insurance_certificate',
  'rptka',
  'notifikasi',
  'vitas_telex',
  'dkptka_payment',
  'domicile_certificate',
  'diploma_certificate',
  'cv_resume',
  'kitas_card',
  'other',
] as const;

// Accept ISO date strings (YYYY-MM-DD) for document validity tracking.
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.')
  .optional();

export const addDocumentSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID.'),
  documentType: z.enum(DOCUMENT_TYPES),
  fileName: z.string().min(1, 'File name is required.'),
  storagePath: z.string().min(1, 'Storage path is required.'),
  issuedDate: isoDate,
  expiryDate: isoDate,
});

export const verifyDocumentSchema = z.object({
  status: z.enum(['verified', 'rejected']),
  rejectionReason: z.string().optional(),
});

export type AddDocumentInput = z.infer<typeof addDocumentSchema>;
export type VerifyDocumentInput = z.infer<typeof verifyDocumentSchema>;
