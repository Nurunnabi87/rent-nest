import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { PaymentController } from './payment.controller';
import { createPaymentSchema } from './payment.validation';

const router = Router();

// Tenant starts a payment for an approved rental request
router.post(
  '/create',
  auth('TENANT'),
  validateRequest(createPaymentSchema),
  PaymentController.createPayment
);

// Stripe browser redirects (no auth - the session id IS the proof,
// and fulfillment always re-verifies with Stripe's server)
router.get('/success', PaymentController.paymentSuccess);
router.get('/cancel', PaymentController.paymentCancel);

// History (must be before /:id would not matter here, but keep order tidy)
router.get('/', auth('TENANT'), PaymentController.getMyPayments);
router.get('/:id', auth(), PaymentController.getPaymentById);

export const PaymentRoutes = router;
