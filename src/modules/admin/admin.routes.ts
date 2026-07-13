import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { AdminController } from './admin.controller';
import { updateUserStatusSchema } from './admin.validation';

const router = Router();

// Every admin route requires the ADMIN role
router.get('/users', auth('ADMIN'), AdminController.getAllUsers);
router.patch(
  '/users/:id',
  auth('ADMIN'),
  validateRequest(updateUserStatusSchema),
  AdminController.updateUserStatus
);
router.get('/properties', auth('ADMIN'), AdminController.getAllProperties);
router.get('/rentals', auth('ADMIN'), AdminController.getAllRentals);

export const AdminRoutes = router;
