import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    propertyId: z.uuid('propertyId must be a valid UUID'),
    rating: z
      .number({ error: 'Rating is required' })
      .int('Rating must be a whole number')
      .min(1, 'Rating must be between 1 and 5')
      .max(5, 'Rating must be between 1 and 5'),
    comment: z
      .string({ error: 'Comment is required' })
      .min(5, 'Comment must be at least 5 characters')
      .max(1000, 'Comment must be at most 1000 characters'),
  }),
});
