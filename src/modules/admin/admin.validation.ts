import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'BANNED'], {
      error: 'status must be ACTIVE or BANNED',
    }),
  }),
});
