import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { RentalController } from './rental.controller';
import {
  createRentalSchema,
  updateRentalStatusSchema,
} from './rental.validation';

// Tenant routes -> mounted at /api/rentals
const rentalRouter = Router();

rentalRouter.post(
  '/',
  auth('TENANT'),
  validateRequest(createRentalSchema),
  RentalController.createRental
);
rentalRouter.get('/', auth('TENANT'), RentalController.getMyRentals);
// Any logged-in user may call; the service decides who can see it
// (the tenant who made it, the property's landlord, or an admin)
rentalRouter.get('/:id', auth(), RentalController.getRentalById);

// Landlord routes -> mounted at /api/landlord/requests
const landlordRequestRouter = Router();

landlordRequestRouter.get(
  '/',
  auth('LANDLORD'),
  RentalController.getLandlordRequests
);
landlordRequestRouter.patch(
  '/:id',
  auth('LANDLORD'),
  validateRequest(updateRentalStatusSchema),
  RentalController.updateRentalStatus
);

export const RentalRoutes = rentalRouter;
export const LandlordRequestRoutes = landlordRequestRouter;
