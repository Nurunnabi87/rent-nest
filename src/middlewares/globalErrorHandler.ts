/* eslint-disable @typescript-eslint/no-unused-vars */
import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import config from '../config';
import AppError from '../errors/AppError';

// Express recognizes an error handler by its FOUR parameters (err first).
// Every error from any route/middleware ends up here, so the whole API
// returns one consistent error shape: { success, message, errorDetails }
const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Something went wrong';
  let errorDetails: unknown = err.message || 'Internal server error';

  // Our own thrown errors: throw new AppError(403, '...')
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorDetails = err.message;
  }
  // Zod validation failures
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';
    errorDetails = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }
  // Prisma "known" database errors (they carry an error code)
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = 'Duplicate value: a record with this value already exists';
      errorDetails = { duplicateFields: err.meta?.target };
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Requested record was not found';
      errorDetails = err.meta?.cause || err.message;
    } else if (err.code === 'P2003') {
      statusCode = 400;
      message = 'Invalid reference: related record does not exist';
      errorDetails = { field: err.meta?.field_name };
    }
  }
  // Prisma query shape errors (wrong/missing fields sent to the DB)
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data sent to the database';
    errorDetails = 'One or more fields are missing or have the wrong type';
  }
  // JWT errors (thrown by jsonwebtoken during auth)
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please login again';
    errorDetails = err.message;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please login again';
    errorDetails = err.message;
  }
  // Malformed JSON in the request body
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON in request body';
    errorDetails = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorDetails,
    // Stack trace helps debugging but must never leak in production
    ...(config.node_env === 'development' && { stack: err.stack }),
  });
};

export default globalErrorHandler;
