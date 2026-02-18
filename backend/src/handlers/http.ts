import { Request, Response } from 'express';
import { fail, ok } from '../utils/response';
import { ServiceResult } from '../services/result';

export const getPagination = (req: Request): { page: number; limit: number } => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.max(1, Number(req.query.limit || 20));
  return { page, limit };
};

export const sendResult = <T>(res: Response, result: ServiceResult<T>): void => {
  if (!result.ok) {
    fail(res, result.error, result.status);
    return;
  }

  ok(res, result.data, result.status);
};
