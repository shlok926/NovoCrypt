import { User } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { hashPassword, verifyPassword } from '../utils/hash.util';


type RegisterInput = {
  email: string;
  password: string;
  name?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

export const authService = {
  async register(input: RegisterInput): Promise<User> {
    try {
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing) {
        throw new AppError('Email already in use', 409);
      }

      const passwordHash = await hashPassword(input.password);
      return await prisma.user.create({
        data: {
          email: input.email,
          passwordHash,
          name: input.name,
        },
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Authentication infrastructure error during registration:', error);
      throw new AppError('Authentication service temporarily unavailable.', 503);
    }
  },

  async login(input: LoginInput): Promise<User> {
    try {
      const user = await prisma.user.findUnique({ where: { email: input.email } });
      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      const passwordOk = await verifyPassword(input.password, user.passwordHash);
      if (!passwordOk) {
        throw new AppError('Invalid credentials', 401);
      }

      return user;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('Authentication infrastructure error during login:', error);
      throw new AppError('Authentication service temporarily unavailable.', 503);
    }
  },
};
