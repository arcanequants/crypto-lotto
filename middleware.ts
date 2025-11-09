import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/logging/logger';

// In-memory rate limiter (use Redis/Upstash in production for distributed systems)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration per endpoint
const RATE_LIMITS: Record<string, { max: number; window: number }> = {
  '/api/tickets/purchase': { max: 10, window: 60000 }, // 10 requests per minute
  '/api/tokens/vote': { max: 5, window: 60000 }, // 5 requests per minute
  '/api/withdraw/gasless': { max: 3, window: 60000 }, // 3 requests per minute
};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  // Check if this path needs rate limiting
  const limit = RATE_LIMITS[pathname];
  if (!limit) {
    return NextResponse.next();
  }

  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    // Start new window
    rateLimitMap.set(key, { count: 1, resetTime: now + limit.window });
    return NextResponse.next();
  }

  if (record.count >= limit.max) {
    // Rate limit exceeded
    logger.security('Rate limit exceeded', {
      ip,
      path: pathname,
      count: record.count,
      limit: limit.max,
    });

    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString(),
          'X-RateLimit-Limit': limit.max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
        },
      }
    );
  }

  // Increment count
  record.count++;

  // Add rate limit headers to response
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', limit.max.toString());
  response.headers.set('X-RateLimit-Remaining', (limit.max - record.count).toString());
  response.headers.set('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
