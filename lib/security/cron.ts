import { NextRequest } from 'next/server';
import { logger } from '@/lib/logging/logger';

/**
 * Vercel CRON IP ranges
 * Source: https://vercel.com/docs/cron-jobs/manage-cron-jobs
 *
 * Note: Vercel CRON jobs come from their infrastructure IPs
 * For production, verify these ranges are current
 */
const VERCEL_CRON_IPS = [
  '76.76.21.0/24', // Vercel CRON IP range
  '76.76.21.21', // Primary CRON IP
  '76.76.21.142', // Secondary CRON IP
];

/**
 * Check if IP is in CIDR range
 *
 * @param ip - IP address to check
 * @param cidr - CIDR range (e.g., "192.168.1.0/24")
 * @returns True if IP is in range
 */
function isIPInCIDR(ip: string, cidr: string): boolean {
  try {
    // Handle single IP (no CIDR notation)
    if (!cidr.includes('/')) {
      return ip === cidr;
    }

    const [range, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);

    const ipInt = ipToInt(ip);
    const rangeInt = ipToInt(range);

    return (ipInt & mask) === (rangeInt & mask);
  } catch (error) {
    logger.error('IP CIDR check failed', { ip, cidr, error });
    return false;
  }
}

/**
 * Convert IP address to integer
 */
function ipToInt(ip: string): number {
  return ip.split('.').reduce((int, octet) => (int << 8) + parseInt(octet, 10), 0) >>> 0;
}

/**
 * Check if IP is in whitelist
 *
 * @param ip - IP address to check
 * @returns True if IP is whitelisted
 */
function isIPWhitelisted(ip: string): boolean {
  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') {
    if (ip === 'localhost' || ip === '127.0.0.1' || ip === '::1' || ip === 'unknown') {
      return true;
    }
  }

  // Check against Vercel CRON IPs
  return VERCEL_CRON_IPS.some((range) => isIPInCIDR(ip, range));
}

/**
 * Extract IP from request
 *
 * @param request - Next.js request object
 * @returns IP address or 'unknown'
 */
function extractIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Validate CRON request authentication
 *
 * Security checks:
 * 1. Authorization Bearer token matches CRON_SECRET
 * 2. IP address is in whitelist (Vercel CRON IPs)
 * 3. x-vercel-cron header is present and set to "1"
 * 4. Request timestamp is recent (prevents replay attacks)
 *
 * @param request - Next.js request object
 * @returns Object with validation result and error message
 */
export function validateCronRequest(request: NextRequest): {
  valid: boolean;
  error?: string;
  ip?: string;
} {
  const ip = extractIP(request);

  // 1. Check for Vercel CRON header first (takes precedence)
  const cronHeader = request.headers.get('x-vercel-cron');
  const isVercelCron = cronHeader === '1';

  // 2. Check Authorization header (for manual triggers or non-Vercel crons)
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  const hasValidAuth = authHeader === expectedAuth;

  // Require EITHER Vercel cron header OR valid Bearer token
  if (!isVercelCron && !hasValidAuth) {
    logger.security('CRON request with invalid authentication', {
      ip,
      path: request.nextUrl.pathname,
      hasAuth: !!authHeader,
      hasVercelHeader: !!cronHeader,
    });
    return {
      valid: false,
      error: 'Invalid authentication - missing Vercel CRON header or valid Bearer token',
      ip,
    };
  }

  // 3. If Vercel cron header is present, trust it (Vercel's infrastructure)
  // Skip IP check for Vercel crons - they come from Vercel's infrastructure
  if (isVercelCron) {
    logger.info('CRON request authenticated via x-vercel-cron header', {
      ip,
      path: request.nextUrl.pathname,
    });
  } else if (process.env.NODE_ENV !== 'development') {
    // 4. Check IP whitelist for non-Vercel crons (manual triggers with Bearer token)
    if (!isIPWhitelisted(ip)) {
      logger.security('CRON request from non-whitelisted IP without Vercel header', {
        ip,
        path: request.nextUrl.pathname,
        cronHeader,
      });
      return {
        valid: false,
        error: 'IP not whitelisted and missing Vercel CRON header',
        ip,
      };
    }
  }

  // 5. Optional: Check timestamp to prevent replay attacks
  // Vercel CRON jobs should be recent (within last 5 minutes)
  const timestampHeader = request.headers.get('x-vercel-timestamp');
  if (timestampHeader) {
    const timestamp = parseInt(timestampHeader);
    const now = Date.now();
    const age = now - timestamp;

    // If timestamp is older than 5 minutes, reject
    if (age > 5 * 60 * 1000) {
      logger.security('CRON request with stale timestamp', {
        ip,
        path: request.nextUrl.pathname,
        age: `${Math.floor(age / 1000)}s`,
      });
      return {
        valid: false,
        error: 'Request timestamp too old',
        ip,
      };
    }
  }

  // All checks passed
  logger.info('CRON request validated successfully', {
    ip,
    path: request.nextUrl.pathname,
  });

  return {
    valid: true,
    ip,
  };
}

/**
 * Middleware helper for CRON routes
 * Use at the start of CRON route handlers
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   const validation = validateCronRequest(request);
 *   if (!validation.valid) {
 *     return new Response('Unauthorized', { status: 401 });
 *   }
 *   // ... rest of CRON logic
 * }
 */
export function requireCronAuth(request: NextRequest): Response | null {
  const validation = validateCronRequest(request);

  if (!validation.valid) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: validation.error || 'CRON authentication failed',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return null; // Valid request, continue
}
