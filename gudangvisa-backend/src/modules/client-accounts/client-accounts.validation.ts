import { z } from 'zod';

export const createClientAccountSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().email('Invalid email format.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  passportNumber: z.string().min(1, 'Passport number is required.'),
  nationality: z.string().min(1, 'Nationality is required.'),
  phone: z.string().optional(),
});

export type CreateClientAccountInput = z.infer<typeof createClientAccountSchema>;
