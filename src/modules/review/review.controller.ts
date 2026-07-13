import { Request, Response } from 'express';
import sendResponse from '../../shared/sendResponse';
import { ReviewService } from './review.service';

const createReview = async (req: Request, res: Response) => {
  const result = await ReviewService.createReview(req.user!.userId, req.body);

  sendResponse(res, {
    statusCode: 201,
    message: 'Review submitted successfully',
    data: result,
  });
};

const getMyReviews = async (req: Request, res: Response) => {
  const result = await ReviewService.getMyReviews(req.user!.userId);

  sendResponse(res, {
    statusCode: 200,
    message: 'Your reviews retrieved successfully',
    data: result,
  });
};

export const ReviewController = { createReview, getMyReviews };
