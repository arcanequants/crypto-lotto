/**
 * CRITICAL FIX C-4: CRON Authentication with HMAC
 * =================================================
 * CVSS: 8.0/10 (CRITICAL)
 * Prevents unauthorized execution of CRON jobs
 * =================================================
 *
 * VULNERABILITY:
 * - CRON endpoints use Bearer token only
 * - If CRON_SECRET leaked (committed to git), attackers can:
 *   - Execute draws at will
 *   - Mark draws as expired
 *   - Manipulate voting results
 *   - Calculate fees multiple times
 *
 * FIX:
 * - HMAC signature verification
 * - Timestamp-based replay protection
 * - Constant-time comparison
 * - Comprehensive logging
 */

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { logger } from '@/lib/logging/logger';

export interface CronAuthResult {
  authenticated: boolean;
  error?: string;
}

/**
 * Verify CRON request with HMAC signature
 *
 * Security improvements over Bearer token:
 * 1. HMAC prevents secret exposure in headers
 * 2. Timestamp prevents replay attacks
 * 3. Path binding prevents cross-endpoint attacks
 * 4. Timing-safe comparison prevents timing attacks
 *
 * @param request - Next.js request object
 * @returns Authentication result
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = verifyCronRequest(request);
 *   if (!authResult.authenticated) {
 *     return NextResponse.json({ error: authResult.error }, { status: 401 });
 *   }
 *   // ... proceed with CRON job
 * }
 * ```
 */
export function verifyCronRequest(request: NextRequest): CronAuthResult {
  const signature = request.headers.get('x-cron-signature');
  const timestamp = request.headers.get('x-cron-timestamp');
  const path = new URL(request.url).pathname;

  // 1. Check required headers
  if (!signature || !timestamp) {
    logger.security('CRON auth failed - missing headers', {
      path,
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
    });

    return {
      authenticated: false,
      error: 'Missing x-cron-signature or x-cron-timestamp header',
    };
  }

  // 2. Check timestamp (prevent replay attacks)
  const now = Math.floor(Date.now() / 1000);
  const requestTime = parseInt(timestamp, 10);

  if (isNaN(requestTime)) {
    logger.security('CRON auth failed - invalid timestamp', {
      path,
      timestamp,
    });

    return {
      authenticated: false,
      error: 'Invalid timestamp format',
    };
  }

  // Allow 5 minute window (300 seconds)
  const timeDiff = Math.abs(now - requestTime);
  if (timeDiff > 300) {
    logger.security('CRON auth failed - expired timestamp', {
      path,
      timeDiff,
      maxAge: 300,
    });

    return {
      authenticated: false,
      error: `Request expired (timestamp too old: ${timeDiff}s > 300s)`,
    };
  }

  // 3. Get secret from environment
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logger.error('CRON_SECRET not configured', { path });

    return {
      authenticated: false,
      error: 'CRON authentication not configured',
    };
  }

  // 4. Compute expected HMAC signature
  // Payload format: "{timestamp}:{path}"
  // Example: "1698765432:/api/cron/execute-daily-draw"
  const payload = `${timestamp}:${path}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // 5. Compare signatures using timing-safe comparison
  // Prevents timing attacks where attacker measures comparison time
  // to guess signature byte-by-byte
  let signatureValid = false;
  try {
    signatureValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    // Signature lengths don't match or invalid hex
    logger.security('CRON auth failed - invalid signature format', {
      path,
      signatureLength: signature.length,
      expectedLength: expectedSignature.length,
    });

    return {
      authenticated: false,
      error: 'Invalid signature format',
    };
  }

  if (!signatureValid) {
    logger.security('CRON auth failed - signature mismatch', {
      path,
      timestamp,
    });

    return {
      authenticated: false,
      error: 'Invalid signature',
    };
  }

  // 6. Authentication successful
  logger.info('CRON request authenticated', {
    path,
    timestamp: new Date(requestTime * 1000).toISOString(),
  });

  return { authenticated: true };
}

/**
 * Generate HMAC signature for CRON request
 * Useful for testing and manual CRON triggering
 *
 * @param path - CRON endpoint path
 * @param secret - CRON secret (defaults to env var)
 * @param timestamp - Unix timestamp (defaults to now)
 * @returns Signature and timestamp
 *
 * @example
 * ```bash
 * # Generate signature for manual testing
 * node -e "
 * const { generateCronSignature } = require('./lib/auth/cron.ts');
 * const { signature, timestamp } = generateCronSignature('/api/cron/execute-daily-draw');
 * console.log('Signature:', signature);
 * console.log('Timestamp:', timestamp);
 * "
 *
 * # Use in curl
 * curl https://crypto-lotto.com/api/cron/execute-daily-draw \
 *   -H "x-cron-signature: $SIGNATURE" \
 *   -H "x-cron-timestamp: $TIMESTAMP"
 * ```
 */
export function generateCronSignature(
  path: string,
  secret?: string,
  timestamp?: number
): {
  signature: string;
  timestamp: string;
  payload: string;
} {
  const cronSecret = secret || process.env.CRON_SECRET;

  if (!cronSecret) {
    throw new Error('CRON_SECRET not configured');
  }

  const ts = timestamp || Math.floor(Date.now() / 1000);
  const tsString = ts.toString();
  const payload = `${tsString}:${path}`;

  const signature = crypto
    .createHmac('sha256', cronSecret)
    .update(payload)
    .digest('hex');

  return {
    signature,
    timestamp: tsString,
    payload,
  };
}

/**
 * Middleware wrapper for CRON routes
 * Automatically applies HMAC verification
 *
 * @param handler - CRON job handler
 * @returns Wrapped handler with authentication
 *
 * @example
 * ```typescript
 * export const GET = withCronAuth(async (request: NextRequest) => {
 *   // Request is authenticated at this point
 *   const { data } = await executeDraw();
 *   return NextResponse.json({ success: true, data });
 * });
 * ```
 */
export function withCronAuth(
  handler: (request: NextRequest) => Promise<Response> | Response
) {
  return async (request: NextRequest): Promise<Response> => {
    // Verify authentication
    const authResult = verifyCronRequest(request);

    if (!authResult.authenticated) {
      logger.security('CRON request rejected', {
        path: new URL(request.url).pathname,
        error: authResult.error,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: authResult.error,
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Execute handler
    return handler(request);
  };
}

/**
 * Check if request is from Vercel Cron
 * Additional layer - Vercel sets specific headers
 *
 * @param request - Next.js request
 * @returns True if request is from Vercel Cron
 */
export function isVercelCron(request: NextRequest): boolean {
  const vercelCronHeader = request.headers.get('x-vercel-cron');
  return vercelCronHeader === '1';
}

/**
 * Verify both HMAC signature AND Vercel Cron header
 * Maximum security - requires both verifications
 *
 * @param request - Next.js request
 * @returns Authentication result
 */
export function verifyStrictCronAuth(request: NextRequest): CronAuthResult {
  // 1. Verify HMAC signature
  const hmacResult = verifyCronRequest(request);
  if (!hmacResult.authenticated) {
    return hmacResult;
  }

  // 2. Verify Vercel Cron header (production only)
  if (process.env.NODE_ENV === 'production' && !isVercelCron(request)) {
    logger.security('CRON auth failed - not from Vercel', {
      path: new URL(request.url).pathname,
    });

    return {
      authenticated: false,
      error: 'Request not from Vercel Cron',
    };
  }

  return { authenticated: true };
}
