// Custom error class for expected ("operational") errors.
// Anywhere in the app we can do: throw new AppError(404, 'Property not found')
// and the global error handler will turn it into a proper JSON response.
class AppError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
