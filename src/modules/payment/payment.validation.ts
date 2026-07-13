import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    rentalRequestId: z.uuid('rentalRequestId must be a valid UUID'),
  }),
});
