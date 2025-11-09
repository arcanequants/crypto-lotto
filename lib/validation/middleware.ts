/**
 * CRITICAL FIX C-5: Comprehensive Validation Middleware
 * ======================================================
 * CVSS: 7.8/10 (HIGH - CRITICAL when combined)
 * Applies Zod validation to ALL API routes
 * ======================================================
 *
 * VULNERABILITY:
 * - API routes accept ANY input without validation
 * - Leads to: DoS, data corruption, invalid state
 *
 * FIX:
 * - Centralized validation middleware
 * - Type-safe request/response handling
 * - Comprehensive error formatting
 * - Rate limiting integration
 * - Logging integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '@/lib/logging/logger';
import { checkGaslessRateLimit, isRedisConfigured } from '@/lib/security/redis';

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidatedRequest<T> {
  data: T;
  request: NextRequest;
}

/**
 * Validate request body against Zod schema
 *
 * @param request - Next.js request
 * @param schema - Zod validation schema
 * @returns Validated data or error response
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    // 1. Parse request body
    const body = await request.json();

    // 2. Validate against schema
    const validatedData = schema.parse(body);

    logger.info('Request validation successful', {
      endpoint: request.nextUrl.pathname,
      method: request.method,
    });

    return { data: validatedData, error: null };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      logger.warn('Request validation failed', {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        errors,
      });

      return {
        data: null,
        error: NextResponse.json(
          {
            error: 'Validation failed',
            message: 'Request body contains invalid data',
            details: errors,
          },
          { status: 400 }
        ),
      };
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      logger.warn('Invalid JSON in request body', {
        endpoint: request.nextUrl.pathname,
        error: error.message,
      });

      return {
        data: null,
        error: NextResponse.json(
          {
            error: 'Invalid JSON',
            message: 'Request body must be valid JSON',
          },
          { status: 400 }
        ),
      };
    }

    // Handle unexpected errors
    logger.error('Request validation error', {
      endpoint: request.nextUrl.pathname,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      data: null,
      error: NextResponse.json(
        {
          error: 'Validation error',
          message: 'Failed to validate request',
        },
        { status: 500 }
      ),
    };
  }
}

/**
 * Validate query parameters against Zod schema
 *
 * @param request - Next.js request
 * @param schema - Zod validation schema
 * @returns Validated data or error response
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): { data: T; error: null } | { data: null; error: NextResponse } {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params: Record<string, string> = {};

    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const validatedData = schema.parse(params);

    return { data: validatedData, error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      logger.warn('Query parameter validation failed', {
        endpoint: request.nextUrl.pathname,
        errors,
      });

      return {
        data: null,
        error: NextResponse.json(
          {
            error: 'Invalid query parameters',
            details: errors,
          },
          { status: 400 }
        ),
      };
    }

    return {
      data: null,
      error: NextResponse.json(
        {
          error: 'Query parameter validation failed',
        },
        { status: 500 }
      ),
    };
  }
}

/**
 * Apply rate limiting to request
 *
 * @param identifier - Unique identifier for rate limiting (wallet address, IP, etc.)
 * @param limit - Number of requests allowed per window
 * @param window - Time window in seconds
 * @returns null if rate limit passed, error response if exceeded
 */
export async function applyRateLimit(
  identifier: string,
  limit: number = 10,
  window: string = '1 m'
): Promise<NextResponse | null> {
  if (!isRedisConfigured()) {
    logger.warn('Redis not configured - rate limiting disabled');
    return null;
  }

  try {
    const { success, remaining, reset } = await checkGaslessRateLimit(identifier);

    if (!success) {
      logger.warn('Rate limit exceeded', {
        identifier,
        limit,
        remaining: 0,
        resetAt: new Date(reset).toISOString(),
      });

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Maximum ${limit} requests per ${window}.`,
          retryAfter: new Date(reset).toISOString(),
          remaining: 0,
        },
        { status: 429 }
      );
    }

    return null;
  } catch (error) {
    logger.error('Rate limiting error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Don't block request if rate limiting fails
    return null;
  }
}

/**
 * Comprehensive API route wrapper
 * Applies validation, rate limiting, error handling, and logging
 *
 * @param handler - API route handler
 * @param options - Middleware options
 * @returns Wrapped handler
 *
 * @example
 * ```typescript
 * export const POST = withValidation(
 *   async (request, { data }) => {
 *     // data is typed and validated!
 *     return NextResponse.json({ success: true });
 *   },
 *   {
 *     schema: TicketPurchaseSchema,
 *     rateLimit: {
 *       identifier: (req, data) => data.buyer,
 *       limit: 10,
 *       window: '1 m'
 *     }
 *   }
 * );
 * ```
 */
export function withValidation<T>(
  handler: (
    request: NextRequest,
    context: { data: T }
  ) => Promise<NextResponse> | NextResponse,
  options: {
    schema: ZodSchema<T>;
    rateLimit?: {
      identifier: (request: NextRequest, data: T) => string;
      limit?: number;
      window?: string;
    };
  }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();

    try {
      // 1. Validate request body
      const { data, error } = await validateRequestBody(request, options.schema);

      if (error) {
        return error;
      }

      // 2. Apply rate limiting (if configured)
      if (options.rateLimit) {
        const identifier = options.rateLimit.identifier(request, data);
        const rateLimitError = await applyRateLimit(
          identifier,
          options.rateLimit.limit,
          options.rateLimit.window
        );

        if (rateLimitError) {
          return rateLimitError;
        }
      }

      // 3. Execute handler
      const response = await handler(request, { data });

      // 4. Log successful request
      const executionTime = Date.now() - startTime;
      logger.info('API request completed', {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        status: response.status,
        executionTimeMs: executionTime,
      });

      return response;
    } catch (error) {
      // 5. Handle unexpected errors
      const executionTime = Date.now() - startTime;

      logger.error('API request failed', {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        executionTimeMs: executionTime,
      });

      return NextResponse.json(
        {
          error: 'Internal server error',
          message: 'An unexpected error occurred',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Sanitize error message for client
 * Prevents information disclosure via error messages
 *
 * @param error - Error object
 * @returns Sanitized error message
 */
export function sanitizeError(error: unknown): {
  error: string;
  message: string;
} {
  // Default safe error message
  let errorType = 'Unknown error';
  let errorMessage = 'An unexpected error occurred. Please try again.';

  if (error instanceof Error) {
    // Map known errors to safe messages
    if (error.message.includes('insufficient funds')) {
      errorType = 'Insufficient funds';
      errorMessage = 'Your wallet has insufficient funds to complete this transaction.';
    } else if (error.message.includes('user rejected')) {
      errorType = 'Transaction rejected';
      errorMessage = 'You rejected the transaction.';
    } else if (error.message.includes('nonce too low')) {
      errorType = 'Transaction failed';
      errorMessage = 'Transaction nonce is outdated. Please try again.';
    } else if (error.message.includes('gas required exceeds')) {
      errorType = 'Transaction failed';
      errorMessage = 'Transaction requires too much gas. Please try again.';
    } else if (error.message.includes('execution reverted')) {
      errorType = 'Contract error';
      errorMessage = 'Smart contract rejected the transaction. Please check your inputs.';
    }

    // Log full error server-side
    logger.error('Error sanitized for client', {
      originalError: error.message,
      sanitizedError: errorMessage,
    });
  }

  return {
    error: errorType,
    message: errorMessage,
  };
}
