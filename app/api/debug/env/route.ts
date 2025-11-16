// DEBUG: Check if environment variable is available
// DELETE THIS FILE after debugging

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const allEnvKeys = Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC'))
  const executorKey = allEnvKeys.find(k => k.toLowerCase().includes('executor'))

  return NextResponse.json({
    executor_wallet_configured: !!process.env.NEXT_PUBLIC_EXECUTOR_WALLET,
    executor_wallet_value: process.env.NEXT_PUBLIC_EXECUTOR_WALLET ?
      `${process.env.NEXT_PUBLIC_EXECUTOR_WALLET.substring(0, 6)}...${process.env.NEXT_PUBLIC_EXECUTOR_WALLET.substring(38)}` :
      'NOT SET',
    executor_wallet_full_length: process.env.NEXT_PUBLIC_EXECUTOR_WALLET?.length || 0,
    executor_wallet_has_spaces: process.env.NEXT_PUBLIC_EXECUTOR_WALLET?.includes(' ') || false,
    found_executor_key_variant: executorKey || 'NONE',
    all_env_keys: allEnvKeys,
    // Show ALL env vars that contain 'EXEC' (case insensitive)
    all_executor_related: Object.keys(process.env).filter(k => k.toUpperCase().includes('EXEC')),
  })
}
