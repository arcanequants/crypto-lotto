/**
 * CRITICAL FIX C-4: Admin Authentication System
 * ==============================================
 * CVSS: 9.2/10 (CRITICAL)
 * Prevents unauthorized access to admin endpoints
 * ==============================================
 *
 * VULNERABILITY:
 * - Admin endpoints have NO authentication
 * - Anyone can mark draws as expired, execute draws, etc.
 * - Platform can be completely broken by attackers
 *
 * FIX:
 * - Signature-based authentication for admins
 * - Database-backed admin whitelist
 * - Comprehensive audit trail
 * - Permission-based access control
 */

import { NextRequest } from 'next/server';
import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import { normalizeAddress } from '@/lib/security/address';
import { logger } from '@/lib/logging/logger';

// Initialize Supabase client with service role (full access)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for admin operations
);

export interface AdminUser {
  id: string;
  wallet_address: string;
  role: 'owner' | 'admin' | 'moderator';
  permissions: Record<string, boolean>;
  active: boolean;
}

export interface AdminAuthResult {
  success: boolean;
  admin?: AdminUser;
  error?: string;
}

/**
 * Verify admin authentication via EIP-191 message signature
 *
 * Flow:
 * 1. Frontend signs message: "Authorize admin action: {action} at {timestamp}"
 * 2. Backend verifies signature and recovers signer address
 * 3. Backend checks if signer is in admins table
 * 4. Backend validates timestamp (prevent replay attacks)
 *
 * @param message - Signed message
 * @param signature - EIP-191 signature
 * @param requiredPermission - Optional permission to check
 * @returns Admin user if authenticated, null otherwise
 */
export async function verifyAdminSignature(
  message: string,
  signature: string,
  requiredPermission?: string
): Promise<AdminAuthResult> {
  try {
    // 1. Verify signature and recover signer address
    const messageHash = ethers.hashMessage(message);
    const recoveredAddress = ethers.recoverAddress(messageHash, signature);
    const normalizedAddress = normalizeAddress(recoveredAddress);

    logger.info('Admin signature verification', {
      message,
      recoveredAddress: normalizedAddress,
    });

    // 2. Parse message to extract timestamp
    const timestampMatch = message.match(/at (\d+)/);
    if (timestampMatch) {
      const messageTimestamp = parseInt(timestampMatch[1]);
      const now = Math.floor(Date.now() / 1000);
      const age = now - messageTimestamp;

      // Reject if message is older than 5 minutes
      if (age > 300 || age < -60) {
        logger.security('Admin signature with stale timestamp', {
          messageTimestamp,
          currentTimestamp: now,
          age,
        });

        return {
          success: false,
          error: 'Signature expired (must be within 5 minutes)',
        };
      }
    }

    // 3. Check if address is in admins table
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('wallet_address', normalizedAddress)
      .eq('active', true)
      .single();

    if (adminError || !adminData) {
      logger.security('Admin authentication failed - not in admins table', {
        address: normalizedAddress,
        error: adminError?.message,
      });

      return {
        success: false,
        error: 'Not authorized as admin',
      };
    }

    // 4. Check specific permission if required
    if (requiredPermission) {
      const hasPermission = adminData.permissions?.[requiredPermission] === true;

      if (!hasPermission) {
        logger.security('Admin lacks required permission', {
          address: normalizedAddress,
          requiredPermission,
          permissions: adminData.permissions,
        });

        return {
          success: false,
          error: `Missing permission: ${requiredPermission}`,
        };
      }
    }

    // 5. Success - return admin user
    const admin: AdminUser = {
      id: adminData.id,
      wallet_address: adminData.wallet_address,
      role: adminData.role,
      permissions: adminData.permissions || {},
      active: adminData.active,
    };

    logger.info('Admin authenticated successfully', {
      id: admin.id,
      role: admin.role,
      address: normalizedAddress,
    });

    return {
      success: true,
      admin,
    };
  } catch (error) {
    logger.error('Admin signature verification error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: 'Signature verification failed',
    };
  }
}

/**
 * Log admin action to audit trail
 *
 * @param adminId - Admin user ID
 * @param action - Action name (e.g., 'mark_expired_draws')
 * @param details - Action-specific details
 * @param request - Next.js request object (for IP/user agent)
 * @param success - Whether action succeeded
 * @param errorMessage - Error message if failed
 */
export async function logAdminAction(
  adminWallet: string,
  action: string,
  details?: Record<string, any>,
  request?: NextRequest,
  success: boolean = true,
  errorMessage?: string
): Promise<void> {
  try {
    const ip = request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = request?.headers.get('user-agent') || null;
    const endpoint = request?.nextUrl.pathname || null;

    await supabase.rpc('log_admin_action', {
      p_admin_wallet: normalizeAddress(adminWallet),
      p_action: action,
      p_endpoint: endpoint,
      p_details: details ? JSON.parse(JSON.stringify(details)) : null,
      p_ip_address: ip,
      p_user_agent: userAgent,
      p_success: success,
      p_error_message: errorMessage || null,
    });

    logger.info('Admin action logged', {
      action,
      success,
      endpoint,
    });
  } catch (error) {
    // Don't fail the request if logging fails
    logger.error('Failed to log admin action', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Middleware helper to require admin authentication
 *
 * Usage:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const authResult = await requireAdminAuth(request, 'can_execute_draws');
 *   if (!authResult.success) {
 *     return NextResponse.json({ error: authResult.error }, { status: 401 });
 *   }
 *
 *   const admin = authResult.admin!;
 *   // ... proceed with admin action
 * }
 * ```
 */
export async function requireAdminAuth(
  request: NextRequest,
  requiredPermission?: string
): Promise<AdminAuthResult> {
  try {
    // Extract authentication from headers
    const authHeader = request.headers.get('x-admin-auth');

    if (!authHeader) {
      return {
        success: false,
        error: 'Missing admin authentication header (x-admin-auth)',
      };
    }

    // Parse authentication (format: "message|signature")
    const [message, signature] = authHeader.split('|');

    if (!message || !signature) {
      return {
        success: false,
        error: 'Invalid authentication format',
      };
    }

    // Verify signature
    const result = await verifyAdminSignature(message, signature, requiredPermission);

    // Log authentication attempt
    if (result.success) {
      await logAdminAction(
        result.admin!.wallet_address,
        'authenticate',
        { requiredPermission },
        request,
        true
      );
    } else {
      logger.security('Admin authentication failed', {
        endpoint: request.nextUrl.pathname,
        error: result.error,
      });
    }

    return result;
  } catch (error) {
    logger.error('Admin authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * Check if wallet address is an active admin
 * (Simpler check without signature verification)
 */
export async function isAdmin(walletAddress: string): Promise<boolean> {
  try {
    const normalized = normalizeAddress(walletAddress);

    const { data, error } = await supabase
      .from('admins')
      .select('id')
      .eq('wallet_address', normalized)
      .eq('active', true)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
}

/**
 * Get admin record by wallet address
 */
export async function getAdmin(walletAddress: string): Promise<AdminUser | null> {
  try {
    const normalized = normalizeAddress(walletAddress);

    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('wallet_address', normalized)
      .eq('active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      wallet_address: data.wallet_address,
      role: data.role,
      permissions: data.permissions || {},
      active: data.active,
    };
  } catch {
    return null;
  }
}
