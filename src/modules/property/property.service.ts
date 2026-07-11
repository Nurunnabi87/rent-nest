import { Prisma, PropertyAvailability } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../shared/prisma';

type TPropertyFilters = {
  searchTerm?: string;
  location?: string;
  categoryId?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  amenities?: string; // comma separated: "wifi,parking"
  availability?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
};

// ---------- PUBLIC ----------

const getAllProperties = async (query: TPropertyFilters) => {
  // Pagination: sane defaults, hard cap so nobody can request 1M rows
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  // Build the WHERE clause piece by piece from the query params
  const conditions: Prisma.PropertyWhereInput[] = [{ isDeleted: false }];

  if (query.searchTerm) {
    conditions.push({
      OR: [
        { title: { contains: query.searchTerm, mode: 'insensitive' } },
        { description: { contains: query.searchTerm, mode: 'insensitive' } },
        { location: { contains: query.searchTerm, mode: 'insensitive' } },
      ],
    });
  }

  if (query.location) {
    conditions.push({
      location: { contains: query.location, mode: 'insensitive' },
    });
  }

  if (query.categoryId) {
    conditions.push({ categoryId: query.categoryId });
  }

  if (query.minPrice && !isNaN(Number(query.minPrice))) {
    conditions.push({ rentAmount: { gte: Number(query.minPrice) } });
  }

  if (query.maxPrice && !isNaN(Number(query.maxPrice))) {
    conditions.push({ rentAmount: { lte: Number(query.maxPrice) } });
  }

  if (query.bedrooms && !isNaN(Number(query.bedrooms))) {
    conditions.push({ bedrooms: Number(query.bedrooms) });
  }

  if (query.amenities) {
    // ?amenities=wifi,parking -> property must have ALL of them
    conditions.push({
      amenities: { hasEvery: query.amenities.split(',').map((a) => a.trim()) },
    });
  }

  if (
    query.availability &&
    Object.values(PropertyAvailability).includes(
      query.availability as PropertyAvailability
    )
  ) {
    conditions.push({
      availability: query.availability as PropertyAvailability,
    });
  }

  const where: Prisma.PropertyWhereInput = { AND: conditions };

  // Sorting: whitelist of allowed fields to prevent abuse
  const sortableFields = ['rentAmount', 'createdAt', 'title'];
  const sortBy = sortableFields.includes(query.sortBy || '')
    ? (query.sortBy as string)
    : 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  // Run the data query and the count query in parallel
  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: { select: { id: true, name: true } },
        landlord: { select: { id: true, name: true } },
      },
    }),
    prisma.property.count({ where }),
  ]);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data: properties,
  };
};

const getPropertyById = async (id: string) => {
  const property = await prisma.property.findFirst({
    where: { id, isDeleted: false },
    include: {
      category: { select: { id: true, name: true } },
      landlord: { select: { id: true, name: true, email: true, phone: true } },
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          tenant: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!property) {
    throw new AppError(404, 'Property not found');
  }

  // Average rating computed by the database
  const ratingStats = await prisma.review.aggregate({
    where: { propertyId: id },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return {
    ...property,
    averageRating: ratingStats._avg.rating
      ? Number(ratingStats._avg.rating.toFixed(1))
      : null,
    totalReviews: ratingStats._count.rating,
  };
};

// ---------- LANDLORD ----------

const createProperty = async (
  landlordId: string,
  payload: Prisma.PropertyUncheckedCreateInput
) => {
  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category) {
    throw new AppError(404, 'Category not found. Use GET /api/categories');
  }

  return prisma.property.create({
    data: { ...payload, landlordId },
    include: { category: { select: { name: true } } },
  });
};

const getMyProperties = async (landlordId: string) => {
  return prisma.property.findMany({
    where: { landlordId, isDeleted: false },
    orderBy: { createdAt: 'desc' },
    include: {
      category: { select: { name: true } },
      _count: { select: { rentalRequests: true, reviews: true } },
    },
  });
};

// Shared guard: the property must exist and belong to this landlord
const assertOwnership = async (propertyId: string, landlordId: string) => {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, isDeleted: false },
  });

  if (!property) {
    throw new AppError(404, 'Property not found');
  }

  if (property.landlordId !== landlordId) {
    throw new AppError(403, 'You can only manage your own properties');
  }

  return property;
};

const updateProperty = async (
  propertyId: string,
  landlordId: string,
  payload: Prisma.PropertyUncheckedUpdateInput & { categoryId?: string }
) => {
  await assertOwnership(propertyId, landlordId);

  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });
    if (!category) {
      throw new AppError(404, 'Category not found');
    }
  }

  return prisma.property.update({
    where: { id: propertyId },
    data: payload,
    include: { category: { select: { name: true } } },
  });
};

const deleteProperty = async (propertyId: string, landlordId: string) => {
  await assertOwnership(propertyId, landlordId);

  // Soft delete: keep the row (rental/payment history references it),
  // but hide it from every public query.
  return prisma.property.update({
    where: { id: propertyId },
    data: { isDeleted: true, availability: 'UNAVAILABLE' },
  });
};

export const PropertyService = {
  getAllProperties,
  getPropertyById,
  createProperty,
  getMyProperties,
  updateProperty,
  deleteProperty,
};
