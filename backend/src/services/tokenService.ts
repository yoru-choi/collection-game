import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import Redis from 'ioredis';

interface AccessPayload {
  sub: number;
  type: 'access';
  jti: string;
}

interface RefreshPayload {
  sub: number;
  type: 'refresh';
  jti: string;
}

const blacklist = new Set<string>();
const refreshTokens = new Map<string, { userId: number; expiresAt: number }>();

const redis = new Redis({
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password || undefined,
  db: env.redis.db,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

let redisReady = false;

const ensureRedis = async (): Promise<boolean> => {
  if (redisReady) {
    return true;
  }

  try {
    if (redis.status !== 'ready') {
      await redis.connect();
    }
    redisReady = true;
    return true;
  } catch {
    return false;
  }
};

const decodeRefresh = (token: string): { sub: number; jti: string } | null => {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (typeof decoded !== 'object' || decoded === null) {
      return null;
    }

    const payload = decoded as jwt.JwtPayload & { type?: string; sub?: string | number; jti?: string };
    if (payload.type !== 'refresh' || !payload.jti || payload.sub === undefined) {
      return null;
    }

    return {
      sub: Number(payload.sub),
      jti: payload.jti,
    };
  } catch {
    return null;
  }
};

const decodeAccess = (token: string): { sub: number; jti: string } | null => {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (typeof decoded !== 'object' || decoded === null) {
      return null;
    }

    const payload = decoded as jwt.JwtPayload & { type?: string; sub?: string | number; jti?: string };
    if (payload.type !== 'access' || !payload.jti || payload.sub === undefined) {
      return null;
    }

    return {
      sub: Number(payload.sub),
      jti: payload.jti,
    };
  } catch {
    return null;
  }
};

const parseDurationMs = (duration: string, fallbackMs: number): number => {
  const matched = duration.trim().match(/^(\d+)(ms|s|m|h|d)$/);
  if (!matched) {
    return fallbackMs;
  }

  const value = Number(matched[1]);
  const unit = matched[2];
  if (unit === 'ms') return value;
  if (unit === 's') return value * 1000;
  if (unit === 'm') return value * 60 * 1000;
  if (unit === 'h') return value * 60 * 60 * 1000;
  if (unit === 'd') return value * 24 * 60 * 60 * 1000;
  return fallbackMs;
};

const refreshTtlMs = parseDurationMs(env.jwtRefreshExpiration, 7 * 24 * 60 * 60 * 1000);
const accessTtlMs = parseDurationMs(env.jwtExpiration, 15 * 60 * 1000);

export const createAccessToken = (userId: number): string => {
  const payload: AccessPayload = { sub: userId, type: 'access', jti: uuidv4() };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiration as jwt.SignOptions['expiresIn'] });
};

export const createRefreshToken = (userId: number): string => {
  const jti = uuidv4();
  const payload: RefreshPayload = { sub: userId, type: 'refresh', jti };
  const token = jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtRefreshExpiration as jwt.SignOptions['expiresIn'],
  });

  const expiresAt = Date.now() + refreshTtlMs;
  refreshTokens.set(token, { userId, expiresAt });
  return token;
};

export const persistRefreshToken = async (token: string): Promise<void> => {
  const decoded = decodeRefresh(token);
  if (!decoded) {
    return;
  }

  const key = `refresh_token:${decoded.sub}:${decoded.jti}`;
  if (await ensureRedis()) {
    await redis.set(key, token, 'PX', refreshTtlMs);
  }
};

export const verifyAccessToken = async (token: string): Promise<number | null> => {
  if (blacklist.has(token)) {
    return null;
  }

  const payload = decodeAccess(token);
  if (!payload) {
    return null;
  }

  if (await ensureRedis()) {
    const exists = await redis.exists(`token_blacklist:${payload.jti}`);
    if (exists > 0) {
      return null;
    }
  }

  return payload.sub;
};

export const verifyRefreshToken = async (token: string): Promise<number | null> => {
  const saved = refreshTokens.get(token);
  if (!saved || saved.expiresAt < Date.now()) {
    refreshTokens.delete(token);
    const decoded = decodeRefresh(token);
    if (decoded && await ensureRedis()) {
      const key = `refresh_token:${decoded.sub}:${decoded.jti}`;
      const redisToken = await redis.get(key);
      if (redisToken === token) {
        return decoded.sub;
      }
    }
    return null;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (typeof decoded !== 'object' || decoded === null) {
      return null;
    }

    const payload = decoded as jwt.JwtPayload & { type?: string; sub?: string | number };
    if (payload.type !== 'refresh') {
      return null;
    }

    const userId = Number(payload.sub);
    if (await ensureRedis()) {
      const jti = String((payload as jwt.JwtPayload & { jti?: string }).jti || '');
      if (jti) {
        const key = `refresh_token:${userId}:${jti}`;
        const redisToken = await redis.get(key);
        if (redisToken !== token) {
          return null;
        }
      }
    }

    return userId;
  } catch {
    refreshTokens.delete(token);
    return null;
  }
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  refreshTokens.delete(token);

  const decoded = decodeRefresh(token);
  if (!decoded) {
    return;
  }

  if (await ensureRedis()) {
    const key = `refresh_token:${decoded.sub}:${decoded.jti}`;
    await redis.del(key);
  }
};

export const blacklistAccessToken = async (token: string): Promise<void> => {
  blacklist.add(token);

  try {
    const decoded = jwt.decode(token) as jwt.JwtPayload | null;
    const jti = decoded?.jti;
    if (!jti) {
      return;
    }

    if (await ensureRedis()) {
      await redis.set(`token_blacklist:${jti}`, '1', 'PX', accessTtlMs);
    }
  } catch {
    return;
  }
};
