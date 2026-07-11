import { UserRole, UserStatus } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import AppError from '../errors/AppError';
import { verifyToken } from '../shared/jwt';
import prisma from '../shared/prisma';

// Higher-order middleware guarding protected routes.
//   auth()                      -> any logged-in user
//   auth('TENANT')              -> tenants only
//   auth('LANDLORD', 'ADMIN')   -> landlords or admins
const auth =
  (...requiredRoles: UserRole[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Expect header:  Authorization: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'You are not logged in. Please provide a token');
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify signature + expiry (throws 401 via global handler if bad)
    const payload = verifyToken(token);

    // 3. Check the user still exists and is not banned.
    //    A token stays valid for 7 days - without this DB check,
    //    a banned or deleted user could keep using their old token.
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, status: true, role: true },
    });

    if (!user) {
      throw new AppError(401, 'The account for this token no longer exists');
    }

    if (user.status === UserStatus.BANNED) {
      throw new AppError(403, 'Your account has been banned. Contact support');
    }

    // 4. Role check (skipped when no roles were specified)
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      throw new AppError(
        403,
        `Access denied. This route requires role: ${requiredRoles.join(' or ')}`
      );
    }

    // 5. Attach the verified identity for controllers to use
    req.user = { ...payload, role: user.role };

    next();
  };

export default auth;
