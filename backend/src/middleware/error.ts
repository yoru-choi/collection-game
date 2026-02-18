import { NextFunction, Request, Response } from 'express';
import { fail } from '../utils/response';

export const notFoundMiddleware = (_req: Request, res: Response): void => {
  fail(res, 'not found', 404);
};

export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof Error) {
    fail(res, err.message, 500);
    return;
  }

  fail(res, 'internal server error', 500);
};
