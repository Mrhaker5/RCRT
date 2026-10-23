import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

let db: any;

if (connectionString) {
  const { neon } = require('@neondatabase/serverless');
  const { drizzle } = require('drizzle-orm/neon-http');
  const sql = neon(connectionString);
  db = drizzle(sql, { schema });
} else {
  // Fallback for build time only
  const { neon } = require('@neondatabase/serverless');
  const { drizzle } = require('drizzle-orm/neon-http');
  const sql = neon('postgres://placeholder:placeholder@localhost:5432/postgres');
  db = drizzle(sql, { schema });
}

export { db };