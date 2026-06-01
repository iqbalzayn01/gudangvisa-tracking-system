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
    'document_collection',
    'document_verification',
    'document_revision',
    'submission_to_immigration',
    'immigration_review',
    'biometric_scheduled',
    'biometric_completed',
    'immigration_processing',
    'approval_pending',
    'approved',
    'evisa_issued',
    'completed',
    'rejected',
    'cancelled',
    'on_hold',
  ]),
  description: z.string().min(1, 'Description is required.'),
  isVisibleToClient: z.boolean().optional().default(true),
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
  biometricDate: z.string().optional(),
  biometricTime: z.string().optional(),
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
