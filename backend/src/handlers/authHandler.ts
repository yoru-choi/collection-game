import { Request, Response } from 'express';
import { env, isProduction } from '../config/env';
import { ok } from '../utils/response';
import { authService } from '../services/authService';
import { sendResult } from './http';

const setRefreshCookie = (res: Response, refreshToken: string): void => {
  res.cookie(env.refreshCookieName, refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/api/v1/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearRefreshCookie = (res: Response): void => {
  res.clearCookie(env.refreshCookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/api/v1/auth/refresh',
  });
};

const getRefreshTokenFromRequest = (req: Request): string | null => {
  const bodyToken = typeof req.body?.refresh_token === 'string' ? req.body.refresh_token : null;
  const cookieToken = typeof req.cookies?.[env.refreshCookieName] === 'string'
    ? req.cookies[env.refreshCookieName]
    : null;

  return bodyToken || cookieToken;
};

export const authHandler = {
  register: async (req: Request, res: Response): Promise<void> => {
    const { username, email, password } = req.body as { username?: string; email?: string; password?: string };
    const result = await authService.register(username, email, password);
    if (!result.ok) {
      sendResult(res, result);
      return;
    }

    setRefreshCookie(res, result.data.refreshToken);
    ok(res, {
      authToken: result.data.authToken,
      user: result.data.user,
    }, result.status);
  },

  login: async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body as { username?: string; password?: string };
    const result = await authService.login(username, password);
    if (!result.ok) {
      sendResult(res, result);
      return;
    }

    setRefreshCookie(res, result.data.refreshToken);
    ok(res, {
      authToken: result.data.authToken,
      user: result.data.user,
    }, result.status);
  },

  refresh: async (req: Request, res: Response): Promise<void> => {
    const token = getRefreshTokenFromRequest(req);
    const result = await authService.refresh(token);
    if (!result.ok) {
      if (result.status === 401) {
        clearRefreshCookie(res);
      }
      sendResult(res, result);
      return;
    }

    setRefreshCookie(res, result.data.refreshToken);
    ok(res, { authToken: result.data.authToken }, result.status);
  },

  logout: async (req: Request, res: Response): Promise<void> => {
    const refreshToken = getRefreshTokenFromRequest(req);
    const authorization = req.header('Authorization') || '';
    const accessToken = authorization.startsWith('Bearer ')
      ? authorization.replace('Bearer ', '').trim()
      : undefined;

    const result = await authService.logout(refreshToken, accessToken);

    clearRefreshCookie(res);
    sendResult(res, result);
  },
};
