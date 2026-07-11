import cors from 'cors';
import express, { Application, Request, Response } from 'express';

const app: Application = express();

// Global middlewares
app.use(cors());
app.use(express.json());

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

export default app;
