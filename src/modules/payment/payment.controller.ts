import { Request, Response } from 'express';
import sendResponse from '../../shared/sendResponse';
import AppError from '../../errors/AppError';
import { PaymentService } from './payment.service';

const createPayment = async (req: Request, res: Response) => {
  const result = await PaymentService.createCheckoutSession(
    req.user!.userId,
    req.body.rentalRequestId
  );

  sendResponse(res, {
    statusCode: 201,
    message: 'Stripe checkout session created successfully',
    data: result,
  });
};

// Stripe redirects the browser here after a successful card payment
const paymentSuccess = async (req: Request, res: Response) => {
  const sessionId = req.query.session_id;

  if (!sessionId || typeof sessionId !== 'string') {
    throw new AppError(400, 'session_id query parameter is required');
  }

  const result = await PaymentService.fulfillPayment(sessionId);

  sendResponse(res, {
    statusCode: 200,
    message: result.alreadyProcessed
      ? 'Payment was already confirmed'
      : 'Payment successful! Your rental is now ACTIVE',
    data: result.payment,
  });
};

// Stripe redirects here if the tenant clicks "back" on the checkout page
const paymentCancel = async (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: 200,
    message: 'Payment was cancelled. You can create a new checkout session anytime',
  });
};

// Stripe server calls this directly (not a browser redirect)
const handleWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];

  if (!signature || typeof signature !== 'string') {
    throw new AppError(400, 'Missing stripe-signature header');
  }

  // req.body is a raw Buffer here (express.raw route in app.ts)
  const result = await PaymentService.handleWebhookEvent(req.body, signature);

  res.status(200).json(result);
};

const getMyPayments = async (req: Request, res: Response) => {
  const result = await PaymentService.getMyPayments(req.user!.userId);

  sendResponse(res, {
    statusCode: 200,
    message: 'Payment history retrieved successfully',
    data: result,
  });
};

const getPaymentById = async (req: Request, res: Response) => {
  const result = await PaymentService.getPaymentById(
    req.params.id as string,
    req.user!
  );

  sendResponse(res, {
    statusCode: 200,
    message: 'Payment details retrieved successfully',
    data: result,
  });
};

export const PaymentController = {
  createPayment,
  paymentSuccess,
  paymentCancel,
  handleWebhook,
  getMyPayments,
  getPaymentById,
};
