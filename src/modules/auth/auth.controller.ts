import { Request, Response } from 'express';
import sendResponse from '../../shared/sendResponse';
import { AuthService } from './auth.service';

// Controllers stay thin: take the request, call the service, send the response.
// All business rules live in the service layer.
const register = async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body);

  sendResponse(res, {
    statusCode: 201,
    message: 'User registered successfully',
    data: result,
  });
};

const login = async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body);

  sendResponse(res, {
    statusCode: 200,
    message: 'Logged in successfully',
    data: result,
  });
};

export const AuthController = { register, login };
