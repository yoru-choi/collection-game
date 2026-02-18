import dotenv from 'dotenv';

dotenv.config();

const value = (key: string, fallback: string): string => process.env[key] || fallback;
const valueNum = (key: string, fallback: number): number => {
  const parsed = Number(process.env[key]);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: value('ENV', 'development'),
  host: value('SERVER_HOST', '0.0.0.0'),
  port: valueNum('SERVER_PORT', 8080),
  db: {
    host: value('DB_HOST', 'localhost'),
    port: valueNum('DB_PORT', 5432),
    user: value('DB_USER', 'postgres'),
    password: value('DB_PASSWORD', 'postgres_password'),
    name: value('DB_NAME', 'collection_game'),
    sslMode: value('DB_SSLMODE', 'disable'),
  },
  redis: {
    host: value('REDIS_HOST', 'localhost'),
    port: valueNum('REDIS_PORT', 6379),
    password: value('REDIS_PASSWORD', ''),
    db: valueNum('REDIS_DB', 0),
  },
  jwtSecret: value('JWT_SECRET', 'change-me'),
  jwtExpiration: value('JWT_EXPIRATION', '15m'),
  jwtRefreshExpiration: value('JWT_REFRESH_EXPIRATION', '168h'),
  refreshCookieName: value('REFRESH_COOKIE_NAME', 'refresh_token'),
  maxEnergy: valueNum('MAX_ENERGY', 100),
  energyRegenMinutes: valueNum('ENERGY_REGEN_MINUTES', 5),
  allowedOrigins: value('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export const isProduction = env.nodeEnv === 'production';
