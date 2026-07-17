import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email().trim().toLowerCase(),
    password: z.string().min(8).max(128),
    name: z.string().min(2).max(80).trim().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().trim().toLowerCase(),
    password: z.string().min(8).max(128),
  }),
});
