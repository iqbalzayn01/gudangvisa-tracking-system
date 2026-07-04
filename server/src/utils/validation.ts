import { z } from 'zod';

/**
 * Credentials schema shared by the staff and client login endpoints
 * (the two flows accept identical bodies).
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email format.'),
  password: z.string().min(1, 'Password is required.'),
});

export type LoginInput = z.infer<typeof loginSchema>;
