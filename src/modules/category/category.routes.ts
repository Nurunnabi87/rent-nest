import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { CategoryController } from './category.controller';
import {
  createCategorySchema,
  updateCategorySchema,
} from './category.validation';

const router = Router();

// Public: anyone can browse categories
router.get('/', CategoryController.getAllCategories);

// Admin only: manage categories
router.post(
  '/',
  auth('ADMIN'),
  validateRequest(createCategorySchema),
  CategoryController.createCategory
);
router.patch(
  '/:id',
  auth('ADMIN'),
  validateRequest(updateCategorySchema),
  CategoryController.updateCategory
);
router.delete('/:id', auth('ADMIN'), CategoryController.deleteCategory);

export const CategoryRoutes = router;
