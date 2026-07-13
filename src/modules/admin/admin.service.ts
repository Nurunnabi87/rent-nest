import { Prisma, RentalStatus, UserRole, UserStatus } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../shared/prisma';

type TListQuery = {
  page?: string;
  limit?: string;
  role?: string;
  status?: string;
};

const buildPagination = (query: TListQuery) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

const getAllUsers = async (query: TListQuery) => {
  const { page, limit, skip } = buildPagination(query);

  const where: Prisma.UserWhereInput = {
    ...(query.role &&
      Object.values(UserRole).includes(query.role as UserRole) && {
        role: query.role as UserRole,
      }),
    ...(query.status &&
      Object.values(UserStatus).includes(query.status as UserStatus) && {
        status: query.status as UserStatus,
      }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        _count: { select: { properties: true, rentalRequests: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data: users,
  };
};

const updateUserStatus = async (userId: string, status: 'ACTIVE' | 'BANNED') => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Admins are protected from each other - no admin can ban an admin
  if (user.role === 'ADMIN') {
    throw new AppError(403, 'Admin accounts cannot be banned or modified');
  }

  return prisma.user.update({
    where: { id: userId },
    data: { status },
    select: { id: true, name: true, email: true, role: true, status: true },
  });
};

const getAllProperties = async (query: TListQuery) => {
  const { page, limit, skip } = buildPagination(query);

  // Admin oversight sees EVERYTHING - including soft-deleted listings
  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        landlord: { select: { id: true, name: true, email: true } },
        category: { select: { name: true } },
        _count: { select: { rentalRequests: true, reviews: true } },
      },
    }),
    prisma.property.count(),
  ]);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data: properties,
  };
};

const getAllRentals = async (query: TListQuery & { status?: string }) => {
  const { page, limit, skip } = buildPagination(query);

  const where: Prisma.RentalRequestWhereInput = {
    ...(query.status &&
      Object.values(RentalStatus).includes(query.status as RentalStatus) && {
        status: query.status as RentalStatus,
      }),
  };

  const [rentals, total] = await Promise.all([
    prisma.rentalRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: { select: { id: true, name: true, email: true } },
        property: {
          select: {
            id: true,
            title: true,
            landlord: { select: { id: true, name: true } },
          },
        },
        payment: { select: { status: true, amount: true, paidAt: true } },
      },
    }),
    prisma.rentalRequest.count({ where }),
  ]);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data: rentals,
  };
};

export const AdminService = {
  getAllUsers,
  updateUserStatus,
  getAllProperties,
  getAllRentals,
};
