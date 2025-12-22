import 'dotenv/config';
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set. Falling back to in-memory storage.");
}

export const pool = process.env.DATABASE_URL ? new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
}) : null;

if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err.message);
  });
}

// @ts-ignore
export const db = pool ? drizzle(pool, { schema }) : null;
