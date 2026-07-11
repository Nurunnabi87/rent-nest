import { UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import AppError from '../../errors/AppError';
import prisma from '../../shared/prisma';
import { createToken } from '../../shared/jwt';

type TRegisterInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'TENANT' | 'LANDLORD';
};

// Fields that are safe to send back to the client (never the password)
const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

const register = async (payload: TRegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new AppError(409, 'A user with this email already exists');
  }

  // Hash the password: bcrypt adds a random salt and is deliberately slow,
  // so stolen hashes cannot easily be reversed or brute-forced.
  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      phone: payload.phone,
      role: payload.role as UserRole,
    },
    select: safeUserSelect,
  });

  return user;
};

const login = async (payload: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  // Same message for "no such user" and "wrong password" -
  // never reveal which one failed (prevents user enumeration).
  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const isPasswordCorrect = await bcrypt.compare(
    payload.password,
    user.password
  );

  if (!isPasswordCorrect) {
    throw new AppError(401, 'Invalid email or password');
  }

  if (user.status === UserStatus.BANNED) {
    throw new AppError(403, 'Your account has been banned. Contact support');
  }

  const accessToken = createToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

export const AuthService = { register, login };
