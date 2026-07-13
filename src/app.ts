import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import globalErrorHandler from './middlewares/globalErrorHandler';
import notFound from './middlewares/notFound';
import { PaymentController } from './modules/payment/payment.controller';
import router from './routes';

const app: Application = express();

// Global middlewares
app.use(cors());

// Stripe webhook needs the RAW request body to verify the signature,
// so this route is registered BEFORE express.json() parses bodies.
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.handleWebhook
);

app.use(express.json());

// All feature routes live under /api
app.use('/api', router);

// Root & health check routes
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to RentNest API - Find & List Rental Properties with Ease',
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'RentNest API is running',
    timestamp: new Date().toISOString(),
  });
});

// Must be registered AFTER all routes:
// notFound catches unknown URLs, globalErrorHandler catches all thrown errors
app.use(notFound);
app.use(globalErrorHandler);

export default app;
