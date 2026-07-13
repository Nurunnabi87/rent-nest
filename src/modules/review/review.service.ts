import AppError from '../../errors/AppError';
import prisma from '../../shared/prisma';

type TCreateReviewInput = {
  propertyId: string;
  rating: number;
  comment: string;
};

const createReview = async (tenantId: string, payload: TCreateReviewInput) => {
  // Rule from the assignment: review only AFTER a completed rental.
  // So the tenant must have a COMPLETED rental request on this property.
  const completedRental = await prisma.rentalRequest.findFirst({
    where: {
      tenantId,
      propertyId: payload.propertyId,
      status: 'COMPLETED',
    },
  });

  if (!completedRental) {
    throw new AppError(
      403,
      'You can only review properties where you have completed a rental'
    );
  }

  // One review per tenant per property (also enforced by the DB's
  // @@unique constraint - this check just gives a friendlier message)
  const existingReview = await prisma.review.findFirst({
    where: { tenantId, propertyId: payload.propertyId },
  });

  if (existingReview) {
    throw new AppError(409, 'You have already reviewed this property');
  }

  return prisma.review.create({
    data: { ...payload, tenantId },
    include: {
      property: { select: { title: true } },
      tenant: { select: { name: true } },
    },
  });
};

const getMyReviews = async (tenantId: string) => {
  return prisma.review.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      property: { select: { id: true, title: true, location: true } },
    },
  });
};

export const ReviewService = { createReview, getMyReviews };
