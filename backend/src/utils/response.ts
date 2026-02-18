import { Response } from 'express';

export const ok = <T>(res: Response, data: T, status = 200): void => {
  res.status(status).json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const fail = (res: Response, error: string, status = 400): void => {
  res.status(status).json({
    success: false,
    error,
    timestamp: new Date().toISOString(),
  });
};
