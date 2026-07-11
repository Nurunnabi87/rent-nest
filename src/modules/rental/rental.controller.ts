import { Request, Response } from 'express';
import sendResponse from '../../shared/sendResponse';
import { RentalService } from './rental.service';

const createRental = async (req: Request, res: Response) => {
  const result = await RentalService.createRental(req.user!.userId, req.body);

  sendResponse(res, {
    statusCode: 201,
    message: 'Rental request submitted successfully',
    data: result,
  });
};

const getMyRentals = async (req: Request, res: Response) => {
  const result = await RentalService.getMyRentals(req.user!.userId);

  sendResponse(res, {
    statusCode: 200,
    message: 'Your rental requests retrieved successfully',
    data: result,
  });
};

const getRentalById = async (req: Request, res: Response) => {
  const result = await RentalService.getRentalById(
    req.params.id as string,
    req.user!
  );

  sendResponse(res, {
    statusCode: 200,
    message: 'Rental request details retrieved successfully',
    data: result,
  });
};

const getLandlordRequests = async (req: Request, res: Response) => {
  const result = await RentalService.getLandlordRequests(
    req.user!.userId,
    req.query as { status?: string }
  );

  sendResponse(res, {
    statusCode: 200,
    message: 'Rental requests for your properties retrieved successfully',
    data: result,
  });
};

const updateRentalStatus = async (req: Request, res: Response) => {
  const result = await RentalService.updateRentalStatus(
    req.params.id as string,
    req.user!.userId,
    req.body
  );

  sendResponse(res, {
    statusCode: 200,
    message: `Rental request ${result.status.toLowerCase()} successfully`,
    data: result,
  });
};

export const RentalController = {
  createRental,
  getMyRentals,
  getRentalById,
  getLandlordRequests,
  updateRentalStatus,
};
