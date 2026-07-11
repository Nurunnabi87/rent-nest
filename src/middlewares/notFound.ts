import { Request, Response } from 'express';

// Catch-all for requests that matched no route.
// Registered AFTER all real routes in app.ts.
const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'API route not found',
    errorDetails: {
      method: req.method,
      path: req.originalUrl,
    },
  });
};

export default notFound;
