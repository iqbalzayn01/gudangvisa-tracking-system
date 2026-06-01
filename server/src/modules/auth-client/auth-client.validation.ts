import { z } from 'zod';

export const clientLoginSchema = z.object({
  email: z.string().email('Invalid email format.'),
  password: z.string().min(1, 'Password is required.'),
});

export type ClientLoginInput = z.infer<typeof clientLoginSchema>;
