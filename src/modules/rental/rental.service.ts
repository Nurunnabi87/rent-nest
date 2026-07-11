import { RentalStatus } from '@prisma/client';
import AppError from '../../errors/AppError';
import { TTokenPayload } from '../../shared/jwt';
import prisma from '../../shared/prisma';

type TCreateRentalInput = {
  propertyId: string;
  moveInDate: Date;
  durationMonths: number;
  message?: string;
};

// ---------- TENANT ----------

const createRental = async (tenantId: string, payload: TCreateRentalInput) => {
  const property = await prisma.property.findFirst({
    where: { id: payload.propertyId, isDeleted: false },
  });

  if (!property) {
    throw new AppError(404, 'Property not found');
  }

  if (property.availability !== 'AVAILABLE') {
    throw new AppError(400, 'This property is not available for rent');
  }

  // One live request per tenant per property:
  // block if a PENDING or APPROVED request already exists
  const existingRequest = await prisma.rentalRequest.findFirst({
    where: {
      tenantId,
      propertyId: payload.propertyId,
      status: { in: ['PENDING', 'APPROVED'] },
    },
  });

  if (existingRequest) {
    throw new AppError(
      409,
      `You already have a ${existingRequest.status} request for this property`
    );
  }

  return prisma.rentalRequest.create({
    data: { ...payload, tenantId },
    include: {
      property: { select: { title: true, location: true, rentAmount: true } },
    },
  });
};

const getMyRentals = async (tenantId: string) => {
  return prisma.rentalRequest.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      property: { select: { id: true, title: true, location: true, rentAmount: true } },
      payment: { select: { id: true, status: true, amount: true, paidAt: true } },
    },
  });
};

// ---------- SHARED (tenant owner / property landlord / admin) ----------

const getRentalById = async (rentalId: string, user: TTokenPayload) => {
  const rental = await prisma.rentalRequest.findUnique({
    where: { id: rentalId },
    include: {
      property: {
        select: { id: true, title: true, location: true, rentAmount: true, landlordId: true },
      },
      tenant: { select: { id: true, name: true, email: true, phone: true } },
      payment: true,
    },
  });

  if (!rental) {
    throw new AppError(404, 'Rental request not found');
  }

  const isTenantOwner = rental.tenantId === user.userId;
  const isPropertyLandlord = rental.property.landlordId === user.userId;
  const isAdmin = user.role === 'ADMIN';

  if (!isTenantOwner && !isPropertyLandlord && !isAdmin) {
    throw new AppError(403, 'You are not allowed to view this rental request');
  }

  return rental;
};

// ---------- LANDLORD ----------

const getLandlordRequests = async (
  landlordId: string,
  query: { status?: string }
) => {
  const statusFilter =
    query.status &&
    Object.values(RentalStatus).includes(query.status as RentalStatus)
      ? (query.status as RentalStatus)
      : undefined;

  return prisma.rentalRequest.findMany({
    where: {
      // Relation filter: requests whose property belongs to this landlord
      property: { landlordId },
      ...(statusFilter && { status: statusFilter }),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      tenant: { select: { id: true, name: true, email: true, phone: true } },
      property: { select: { id: true, title: true, rentAmount: true } },
      payment: { select: { status: true, paidAt: true } },
    },
  });
};

const updateRentalStatus = async (
  rentalId: string,
  landlordId: string,
  payload: { status: 'APPROVED' | 'REJECTED' | 'COMPLETED'; landlordNote?: string }
) => {
  const rental = await prisma.rentalRequest.findUnique({
    where: { id: rentalId },
    include: { property: { select: { id: true, landlordId: true } } },
  });

  if (!rental) {
    throw new AppError(404, 'Rental request not found');
  }

  if (rental.property.landlordId !== landlordId) {
    throw new AppError(403, 'You can only manage requests for your own properties');
  }

  // State machine: only these transitions are legal
  //   PENDING -> APPROVED | REJECTED   (landlord decides)
  //   ACTIVE  -> COMPLETED             (tenancy ended)
  if (
    (payload.status === 'APPROVED' || payload.status === 'REJECTED') &&
    rental.status !== 'PENDING'
  ) {
    const verb = payload.status === 'APPROVED' ? 'approve' : 'reject';
    throw new AppError(
      400,
      `Cannot ${verb} a request that is already ${rental.status}`
    );
  }

  if (payload.status === 'COMPLETED') {
    if (rental.status !== 'ACTIVE') {
      throw new AppError(
        400,
        `Only an ACTIVE rental can be completed (current status: ${rental.status})`
      );
    }

    // Completing a rental frees the property again - two updates that
    // must succeed or fail together, so they run in one transaction
    const [updatedRental] = await prisma.$transaction([
      prisma.rentalRequest.update({
        where: { id: rentalId },
        data: { status: 'COMPLETED', landlordNote: payload.landlordNote },
      }),
      prisma.property.update({
        where: { id: rental.property.id },
        data: { availability: 'AVAILABLE' },
      }),
    ]);

    return updatedRental;
  }

  return prisma.rentalRequest.update({
    where: { id: rentalId },
    data: { status: payload.status, landlordNote: payload.landlordNote },
    include: {
      tenant: { select: { name: true, email: true } },
      property: { select: { title: true } },
    },
  });
};

export const RentalService = {
  createRental,
  getMyRentals,
  getRentalById,
  getLandlordRequests,
  updateRentalStatus,
};
