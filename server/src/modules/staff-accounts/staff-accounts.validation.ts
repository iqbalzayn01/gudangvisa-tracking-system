import { z } from 'zod';

export const createStaffSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().email('Invalid email format.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.enum(['admin', 'staff']).optional().default('staff'),
  phone: z.string().optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
