// DEBUG: Check if environment variable is available
// DELETE THIS FILE after debugging

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    executor_wallet_configured: !!process.env.NEXT_PUBLIC_EXECUTOR_WALLET,
    executor_wallet_value: process.env.NEXT_PUBLIC_EXECUTOR_WALLET ?
      `${process.env.NEXT_PUBLIC_EXECUTOR_WALLET.substring(0, 6)}...${process.env.NEXT_PUBLIC_EXECUTOR_WALLET.substring(38)}` :
      'NOT SET',
    all_env_keys: Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC')),
  })
}
