import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ error: 'Name is required' })
      .min(2, 'Name must be at least 2 characters'),
    email: z.email('A valid email address is required'),
    password: z
      .string({ error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters'),
    phone: z.string().min(6, 'Phone number is too short').optional(),
    // Users choose TENANT or LANDLORD at registration.
    // ADMIN is deliberately NOT allowed here - admins are created by seeding.
    role: z.enum(['TENANT', 'LANDLORD'], {
      error: 'Role must be either TENANT or LANDLORD',
    }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email('A valid email address is required'),
    password: z.string({ error: 'Password is required' }),
  }),
});
