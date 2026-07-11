import { z } from 'zod';

export const createRentalSchema = z.object({
  body: z.object({
    propertyId: z.uuid('propertyId must be a valid UUID'),
    // z.coerce.date() accepts "2026-09-01" (JSON has no date type)
    // and converts it into a real Date object
    moveInDate: z.coerce
      .date({ error: 'moveInDate is required (e.g. "2026-09-01")' })
      .refine((date) => date > new Date(), {
        message: 'moveInDate must be in the future',
      }),
    durationMonths: z
      .number()
      .int()
      .min(1, 'Duration must be at least 1 month')
      .max(60, 'Duration cannot exceed 60 months')
      .default(12),
    message: z.string().max(500).optional(),
  }),
});

// Landlord decides on a request. Allowed transitions are checked
// in the service: PENDING -> APPROVED/REJECTED, ACTIVE -> COMPLETED
export const updateRentalStatusSchema = z.object({
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'COMPLETED'], {
      error: 'status must be APPROVED, REJECTED or COMPLETED',
    }),
    landlordNote: z.string().max(500).optional(),
  }),
});
