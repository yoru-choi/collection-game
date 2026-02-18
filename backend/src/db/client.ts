import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { env } from '../config/env';

const connectionString = [
  'postgres://',
  encodeURIComponent(env.db.user),
  ':',
  encodeURIComponent(env.db.password),
  '@',
  env.db.host,
  ':',
  String(env.db.port),
  '/',
  env.db.name,
].join('');

const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(sql);
export { sql };
