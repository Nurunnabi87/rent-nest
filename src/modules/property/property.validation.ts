import { z } from 'zod';

export const createPropertySchema = z.object({
  body: z.object({
    title: z
      .string({ error: 'Title is required' })
      .min(3, 'Title must be at least 3 characters'),
    description: z
      .string({ error: 'Description is required' })
      .min(10, 'Description must be at least 10 characters'),
    location: z
      .string({ error: 'Location is required' })
      .min(2, 'Location must be at least 2 characters'),
    rentAmount: z
      .number({ error: 'Rent amount is required and must be a number' })
      .int('Rent amount must be a whole number')
      .positive('Rent amount must be greater than 0'),
    bedrooms: z
      .number({ error: 'Number of bedrooms is required' })
      .int()
      .min(0, 'Bedrooms cannot be negative'),
    bathrooms: z
      .number({ error: 'Number of bathrooms is required' })
      .int()
      .min(0, 'Bathrooms cannot be negative'),
    amenities: z.array(z.string()).default([]),
    images: z.array(z.url('Each image must be a valid URL')).default([]),
    categoryId: z.uuid('categoryId must be a valid UUID'),
  }),
});

// For updates every field is optional - landlords send only what changes.
// availability is updatable here too (set property availability status).
export const updatePropertySchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    location: z.string().min(2).optional(),
    rentAmount: z.number().int().positive().optional(),
    bedrooms: z.number().int().min(0).optional(),
    bathrooms: z.number().int().min(0).optional(),
    amenities: z.array(z.string()).optional(),
    images: z.array(z.url()).optional(),
    categoryId: z.uuid().optional(),
    availability: z
      .enum(['AVAILABLE', 'RENTED', 'UNAVAILABLE'], {
        error: 'availability must be AVAILABLE, RENTED or UNAVAILABLE',
      })
      .optional(),
  }),
});
