import 'dotenv/config';
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// =============================================================================
// CONFIGURATION - Uses DATABASE_URL only (ignores PGHOST, PGUSER, etc.)
// =============================================================================

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn("DATABASE_URL not set. Database features will be unavailable.");
}

// Auto-detect SSL requirement for Neon or explicit sslmode=require
const requiresSSL = DATABASE_URL ? (
  DATABASE_URL.includes('neon.tech') || 
  DATABASE_URL.includes('sslmode=require')
) : false;

// =============================================================================
// SINGLE POOL - Created once at startup, reused for all requests
// =============================================================================

export const pool = DATABASE_URL ? new Pool({ 
  connectionString: DATABASE_URL,
  // Timeouts
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  // Connection limits
  max: 10,
  // Keep-alive to reduce DNS lookups
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  // SSL configuration (auto-detected)
  ssl: requiresSSL ? { rejectUnauthorized: false } : undefined,
}) : null;

// Pool error handler - logs but doesn't crash
if (pool) {
  pool.on('error', (err) => {
    console.error('[DB Pool Error]', err.message);
  });
}

// =============================================================================
// RETRY CONFIGURATION
// =============================================================================

const RETRY_CONFIG = {
  maxAttempts: 5,
  baseDelayMs: 500,
  maxDelayMs: 8000,
  jitterPercent: 0.2, // ±20% jitter
};

// Errors that should trigger retry (transient network/DNS issues)
const RETRYABLE_ERROR_CODES = [
  'EAI_AGAIN',      // DNS temporary failure
  'ECONNRESET',     // Connection reset
  'ETIMEDOUT',      // Timeout
  'ECONNREFUSED',   // Connection refused (might be temporary)
  'ENOTFOUND',      // DNS not found (might be temporary)
  'EPIPE',          // Broken pipe
  'EHOSTUNREACH',   // Host unreachable
];

// Errors that should NOT trigger retry (permanent/logical errors)
const NON_RETRYABLE_SQL_CODES = [
  '23505', // unique_violation
  '23503', // foreign_key_violation
  '23502', // not_null_violation
  '23514', // check_violation
  '42601', // syntax_error
  '42501', // insufficient_privilege
  '42P01', // undefined_table
  '42703', // undefined_column
  '28P01', // invalid_password
];

// =============================================================================
// CUSTOM ERROR TYPE
// =============================================================================

export class DatabaseTemporaryError extends Error {
  type = 'DB_TEMPORARY_FAILURE' as const;
  status = 503 as const;
  
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'DatabaseTemporaryError';
  }
}

// =============================================================================
// RETRY HELPER
// =============================================================================

function isRetryableError(error: any): boolean {
  // Check for network/DNS error codes
  if (error?.code && RETRYABLE_ERROR_CODES.includes(error.code)) {
    return true;
  }
  
  // Check error message for DNS-related issues
  const message = error?.message?.toLowerCase() || '';
  if (
    message.includes('eai_again') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('getaddrinfo')
  ) {
    return true;
  }
  
  // Do NOT retry SQL/constraint errors
  if (error?.code && NON_RETRYABLE_SQL_CODES.includes(error.code)) {
    return false;
  }
  
  return false;
}

function calculateDelay(attempt: number): number {
  // Exponential backoff: 500ms, 1s, 2s, 4s, 8s
  const baseDelay = Math.min(
    RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt - 1),
    RETRY_CONFIG.maxDelayMs
  );
  
  // Add jitter ±20%
  const jitter = baseDelay * RETRY_CONFIG.jitterPercent;
  const randomJitter = (Math.random() * 2 - 1) * jitter;
  
  return Math.floor(baseDelay + randomJitter);
}

/**
 * Execute a database operation with automatic retry for transient errors.
 * 
 * @param operation - Async function that performs the database operation
 * @param operationName - Name for logging purposes
 * @returns Result of the operation
 * @throws DatabaseTemporaryError if all retries exhausted
 * @throws Original error if it's a non-retryable error
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'database operation'
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry non-retryable errors
      if (!isRetryableError(error)) {
        throw error;
      }
      
      // Log retry attempt
      console.warn(
        `[DB Retry] ${operationName} failed (attempt ${attempt}/${RETRY_CONFIG.maxAttempts}):`,
        error.code || error.message
      );
      
      // If not last attempt, wait before retry
      if (attempt < RETRY_CONFIG.maxAttempts) {
        const delay = calculateDelay(attempt);
        console.log(`[DB Retry] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries exhausted - throw typed error
  console.error(
    `[DB Error] ${operationName} failed after ${RETRY_CONFIG.maxAttempts} attempts:`,
    lastError?.message
  );
  
  throw new DatabaseTemporaryError(
    `Database temporarily unavailable after ${RETRY_CONFIG.maxAttempts} attempts`,
    lastError || undefined
  );
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

/**
 * Check database connectivity.
 * Returns true if connected, false otherwise.
 */
export async function checkDbHealth(): Promise<boolean> {
  if (!pool) return false;
  
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[DB Health] Check failed:', error.message);
    return false;
  }
}

/**
 * Get database health status with details.
 */
export async function getDbHealthStatus(): Promise<{
  status: 'healthy' | 'unhealthy' | 'unavailable';
  message: string;
  timestamp: string;
}> {
  const timestamp = new Date().toISOString();
  
  if (!pool) {
    return {
      status: 'unavailable',
      message: 'Database not configured',
      timestamp,
    };
  }
  
  const isHealthy = await checkDbHealth();
  
  return {
    status: isHealthy ? 'healthy' : 'unhealthy',
    message: isHealthy ? 'Database connected' : 'Database connection failed',
    timestamp,
  };
}

// =============================================================================
// DRIZZLE ORM INSTANCE
// =============================================================================

// @ts-ignore - db can be null if DATABASE_URL not set
export const db = pool ? drizzle(pool, { schema }) : null;
