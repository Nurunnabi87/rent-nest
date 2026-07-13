import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ReviewController } from './review.controller';
import { createReviewSchema } from './review.validation';

const router = Router();

router.post(
  '/',
  auth('TENANT'),
  validateRequest(createReviewSchema),
  ReviewController.createReview
);
router.get('/', auth('TENANT'), ReviewController.getMyReviews);

export const ReviewRoutes = router;
