import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type TokenPayload = {
  userId: string;
  email: string;
  role: string;
  jti?: string;
};

export type VerifiedTokenPayload = {
  userId: string;
  email: string;
  role: string;
  jti: string;
};

export const signAccessToken = (payload: TokenPayload): string => {
  const jti = payload.jti || crypto.randomUUID();
  return jwt.sign({ ...payload, jti }, env.JWT_SECRET as string, { expiresIn: env.JWT_EXPIRES_IN as any });
};

export const verifyAccessToken = (token: string): VerifiedTokenPayload =>
  jwt.verify(token, env.JWT_SECRET as string) as VerifiedTokenPayload;

