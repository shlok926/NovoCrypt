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
  },

  async login(input: LoginInput): Promise<User> {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const passwordOk = await verifyPassword(input.password, user.passwordHash);
    if (!passwordOk) {
      throw new AppError('Invalid credentials', 401);
    }

    return user;
  },
};
