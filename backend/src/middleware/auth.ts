import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../services/tokenService';
import { fail } from '../utils/response';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authorization = req.header('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) {
    fail(res, 'unauthorized', 401);
    return;
  }

  const token = authorization.replace('Bearer ', '').trim();
  const userId = await verifyAccessToken(token);

  if (!userId) {
    fail(res, 'unauthorized', 401);
    return;
  }

  req.userId = userId;
  req.accessToken = token;
  next();
};
