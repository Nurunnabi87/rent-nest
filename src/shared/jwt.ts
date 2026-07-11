import { UserRole } from '@prisma/client';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import config from '../config';

// What we store inside the token. Keep it small - it travels
// with every request. NEVER put passwords or sensitive data here.
export type TTokenPayload = {
  userId: string;
  email: string;
  role: UserRole;
};

export const createToken = (payload: TTokenPayload): string => {
  return jwt.sign(payload, config.jwt_secret, {
    expiresIn: config.jwt_expires_in as SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string): TTokenPayload => {
  // Throws JsonWebTokenError / TokenExpiredError if invalid,
  // which the global error handler turns into a 401 response.
  return jwt.verify(token, config.jwt_secret) as JwtPayload & TTokenPayload;
};
