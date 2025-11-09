import { z } from 'zod';

// Ethereum address validation regex
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

// Ethereum signature component regex (32 bytes hex)
const ETH_SIGNATURE_COMPONENT_REGEX = /^0x[a-fA-F0-9]{64}$/;

/**
 * Ticket Purchase Schema
 * Validates ticket purchase requests with number selection
 */
export const TicketPurchaseSchema = z.object({
  tickets: z.array(
    z.object({
      numbers: z
        .array(z.number().int().min(1).max(50))
        .length(5, 'Must select exactly 5 numbers')
        .refine(
          (nums) => new Set(nums).size === nums.length,
          'Numbers must be unique'
        ),
      powerNumber: z.number().int().min(1).max(20),
    })
  )
    .min(1, 'Must purchase at least 1 ticket')
    .max(50000, 'Cannot purchase more than 50,000 tickets at once'),
  walletAddress: z
    .string()
    .regex(ETH_ADDRESS_REGEX, 'Invalid Ethereum address format')
    .transform((addr) => addr.toLowerCase()), // Normalize to lowercase
});

export type TicketPurchaseInput = z.infer<typeof TicketPurchaseSchema>;

/**
 * Gasless Ticket Purchase Schema
 * Validates EIP-712 signed gasless ticket purchase requests
 */
export const GaslessTicketPurchaseSchema = z.object({
  buyer: z
    .string()
    .regex(ETH_ADDRESS_REGEX, 'Invalid buyer address format')
    .transform((addr) => addr.toLowerCase()),
  // SECURITY FIX: Only ONE ticket per signature to prevent nonce mismatch
  numbers: z
    .array(z.number().int().min(1).max(50))
    .length(5, 'Must select exactly 5 numbers')
    .refine(
      (nums) => new Set(nums).size === nums.length,
      'Numbers must be unique'
    ),
  powerNumber: z.number().int().min(1).max(20),
  nonce: z.number().int().min(0, 'Nonce must be non-negative'),
  deadline: z
    .number()
    .int()
    .positive('Deadline must be positive')
    .refine(
      (timestamp) => timestamp > Math.floor(Date.now() / 1000),
      'Deadline must be in the future'
    )
    .refine(
      (timestamp) => timestamp < Math.floor(Date.now() / 1000) + 3600,
      'Deadline must be within 1 hour'
    ),
  v: z.number().int().min(27).max(28, 'v must be 27 or 28'),
  r: z.string().regex(ETH_SIGNATURE_COMPONENT_REGEX, 'Invalid r signature component'),
  s: z.string().regex(ETH_SIGNATURE_COMPONENT_REGEX, 'Invalid s signature component'),
});

export type GaslessTicketPurchaseInput = z.infer<typeof GaslessTicketPurchaseSchema>;

/**
 * Token Vote Schema
 * Validates voting requests for monthly token selection
 */
export const VoteSchema = z.object({
  wallet_address: z
    .string()
    .regex(ETH_ADDRESS_REGEX, 'Invalid Ethereum address format')
    .transform((addr) => addr.toLowerCase()),
  token_symbol: z
    .string()
    .min(2, 'Token symbol must be at least 2 characters')
    .max(10, 'Token symbol must be at most 10 characters')
    .transform((sym) => sym.toUpperCase()),
  proposal_id: z.number().int().positive('Proposal ID must be positive'),
});

export type VoteInput = z.infer<typeof VoteSchema>;

/**
 * Gasless Withdrawal Schema
 * Validates EIP-712 signed withdrawal requests
 */
export const WithdrawSchema = z.object({
  token: z.enum(['USDC', 'USDT'], {
    message: 'Token must be USDC or USDT',
  }),
  user: z
    .string()
    .regex(ETH_ADDRESS_REGEX, 'Invalid user address format')
    .transform((addr) => addr.toLowerCase()),
  destination: z
    .string()
    .regex(ETH_ADDRESS_REGEX, 'Invalid destination address format')
    .transform((addr) => addr.toLowerCase()),
  amount: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Amount must be a valid number')
    .refine(
      (val) => {
        const num = parseFloat(val);
        return num > 0 && num <= 1000000;
      },
      'Amount must be between 0 and 1,000,000'
    ),
  deadline: z
    .number()
    .int()
    .positive('Deadline must be positive')
    .refine(
      (timestamp) => timestamp > Math.floor(Date.now() / 1000),
      'Deadline must be in the future'
    )
    .refine(
      (timestamp) => timestamp < Math.floor(Date.now() / 1000) + 3600,
      'Deadline must be within 1 hour'
    ),
  v: z.number().int().min(27).max(28, 'v must be 27 or 28'),
  r: z.string().regex(ETH_SIGNATURE_COMPONENT_REGEX, 'Invalid r signature component'),
  s: z.string().regex(ETH_SIGNATURE_COMPONENT_REGEX, 'Invalid s signature component'),
});

export type WithdrawInput = z.infer<typeof WithdrawSchema>;

/**
 * CRON Job Authentication Schema
 * Validates CRON job requests with secret and IP verification
 */
export const CronAuthSchema = z.object({
  authorization: z.string().startsWith('Bearer ', 'Authorization must be Bearer token'),
  'x-vercel-cron': z
    .string()
    .optional()
    .refine((val) => !val || val === '1', 'Invalid Vercel CRON header'),
  'x-forwarded-for': z.string().optional(),
  ip: z.string().optional(),
});

export type CronAuthInput = z.infer<typeof CronAuthSchema>;

/**
 * Draw Execution Schema
 * Validates draw execution parameters
 */
export const DrawExecutionSchema = z.object({
  draw_id: z.number().int().positive('Draw ID must be positive'),
  draw_type: z.enum(['daily', 'weekly'], {
    message: 'Draw type must be daily or weekly',
  }),
});

export type DrawExecutionInput = z.infer<typeof DrawExecutionSchema>;

/**
 * Generic Database ID Schema
 */
export const DatabaseIdSchema = z.number().int().positive('ID must be a positive integer');

/**
 * Pagination Schema
 */
export const PaginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

/**
 * Helper function to validate and parse request body
 * Returns typed data or throws validation error
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Helper function to format Zod errors for API responses
 */
export function formatZodError(error: z.ZodError): {
  message: string;
  errors: Array<{ field: string; message: string }>;
} {
  return {
    message: 'Validation failed',
    errors: error.issues.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
    })),
  };
}
