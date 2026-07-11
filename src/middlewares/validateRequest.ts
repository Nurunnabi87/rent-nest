import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';

// Reusable validation middleware.
// Usage on a route:  router.post('/', validateRequest(createSchema), controller)
// If validation fails, Zod throws and the global error handler formats it.
const validateRequest =
  (schema: ZodType) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = await schema.parseAsync({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    // Replace body with the parsed (and cleaned) version
    if (parsed && typeof parsed === 'object' && 'body' in parsed) {
      req.body = (parsed as { body: unknown }).body;
    }

    next();
  };

export default validateRequest;
