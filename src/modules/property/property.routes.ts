import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { PropertyController } from './property.controller';
import {
  createPropertySchema,
  updatePropertySchema,
} from './property.validation';

// Public routes -> mounted at /api/properties
const publicRouter = Router();

publicRouter.get('/', PropertyController.getAllProperties);
publicRouter.get('/:id', PropertyController.getPropertyById);

// Landlord routes -> mounted at /api/landlord/properties
const landlordRouter = Router();

landlordRouter.get('/', auth('LANDLORD'), PropertyController.getMyProperties);
landlordRouter.post(
  '/',
  auth('LANDLORD'),
  validateRequest(createPropertySchema),
  PropertyController.createProperty
);
landlordRouter.put(
  '/:id',
  auth('LANDLORD'),
  validateRequest(updatePropertySchema),
  PropertyController.updateProperty
);
landlordRouter.delete(
  '/:id',
  auth('LANDLORD'),
  PropertyController.deleteProperty
);

export const PropertyRoutes = publicRouter;
export const LandlordPropertyRoutes = landlordRouter;
