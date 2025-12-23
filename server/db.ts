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
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  max: 10,
}) : null;

if (pool) {
  pool.on('error', (err) => {
    const isDnsError = err?.message?.includes('EAI_AGAIN') || 
                       err?.message?.includes('ENOTFOUND') ||
                       err?.message?.includes('getaddrinfo');
    if (isDnsError) {
      console.error('Database DNS resolution error (will retry):', err.message);
    } else {
      console.error('Unexpected database pool error:', err.message);
    }
  });
}

// Health check function with retry
export async function checkDatabaseConnection(retries = 3): Promise<boolean> {
  if (!pool) return false;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error: any) {
      const isDnsError = error?.code === 'EAI_AGAIN' || 
                         error?.message?.includes('EAI_AGAIN') ||
                         error?.code === 'ENOTFOUND';
      if (isDnsError && attempt < retries) {
        console.log(`Database connection attempt ${attempt} failed (DNS error), retrying in ${attempt * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        continue;
      }
      console.error(`Database connection check failed:`, error.message);
      return false;
    }
  }
  return false;
}

// @ts-ignore
export const db = pool ? drizzle(pool, { schema }) : null;
