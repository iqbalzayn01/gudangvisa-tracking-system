import { z } from 'zod';

export const createApplicationSchema = z.object({
  clientId: z.string().uuid('Invalid client ID.'),
  visaType: z.enum([
    'B211A',
    'KITAS_WORKING',
    'KITAS_SPOUSE',
    'KITAS_INVESTOR',
    'KITAS_RETIREMENT',
  ]),
  notes: z.string().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum([
    'draft',
    'document_verification',
    'immigration_processing',
    'approval_pending',
    'completed',
    'cancelled',
  ]),
  description: z.string().optional(),
});

export const updateBiometricSchema = z.object({
  biometricStatus: z.enum([
    'not_scheduled',
    'scheduled',
    'completed',
    'rescheduled',
    'cancelled',
    'no_show',
  ]),
  // Column types are DATE/TIME — malformed strings must 400 here, not 500 in the DB.
  biometricDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.')
    .optional(),
  biometricTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be in HH:MM format.')
    .optional(),
  biometricLocation: z.string().optional(),
  fieldAssistantName: z.string().optional(),
  fieldAssistantPhone: z.string().optional(),
});

export const toggleChecklistSchema = z.object({
  itemIndex: z.number().int().min(0),
  isChecked: z.boolean(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type UpdateBiometricInput = z.infer<typeof updateBiometricSchema>;
export type ToggleChecklistInput = z.infer<typeof toggleChecklistSchema>;
