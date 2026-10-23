import * as schema from './schema';

type DB = any;

let db: DB;

if (process.env.DATABASE_URL) {
  const { neon } = require('@neondatabase/serverless');
  const { drizzle } = require('drizzle-orm/neon-http');
  const sql = neon(process.env.DATABASE_URL);
  db = drizzle(sql, { schema });
} else {
  const { neon } = require('@neondatabase/serverless');
  const { drizzle } = require('drizzle-orm/neon-http');
  const sql = neon('postgres://placeholder:localhost:5432/postgres');
  db = drizzle(sql, { schema });
}

export { db };