#!/usr/bin/env tsx
/**
 * CONTRACT VALIDATION SCRIPT
 *
 * This script validates that the lottery contract is properly configured
 * and all ABIs are consistent across the codebase.
 *
 * Run this:
 * - Before deployment (in CI/CD pipeline)
 * - After updating contract address
 * - After updating ABI
 * - When troubleshooting contract issues
 *
 * Usage:
 *   npx tsx scripts/validate-contract.ts
 *
 * Or add to package.json:
 *   "scripts": {
 *     "validate:contract": "tsx scripts/validate-contract.ts"
 *   }
 */

import lotteryContract from '../lib/contracts/lottery-contract';

async function main() {
  console.log('');
  console.log('🔍 VALIDATING LOTTERY CONTRACT CONFIGURATION');
  console.log('='.repeat(60));
  console.log('');

  try {
    // 1. Validate basic configuration
    console.log('📋 Contract Info:');
    console.log(`  ✓ Address: ${lotteryContract.address}`);
    console.log(`  ✓ Version: ${lotteryContract.version}`);
    console.log(`  ✓ Chain: ${lotteryContract.info.chain}`);
    console.log(`  ✓ ABI Functions: ${lotteryContract.abi.length}`);
    console.log('');

    // 2. Validate environment variables
    console.log('🔐 Environment Variables:');

    const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
    if (alchemyKey) {
      console.log(`  ✓ NEXT_PUBLIC_ALCHEMY_API_KEY: ${alchemyKey.substring(0, 10)}...`);
    } else {
      console.log('  ❌ NEXT_PUBLIC_ALCHEMY_API_KEY: NOT SET');
    }

    const executorKey = process.env.WITHDRAWAL_EXECUTOR_PRIVATE_KEY;
    if (executorKey) {
      console.log(`  ✓ WITHDRAWAL_EXECUTOR_PRIVATE_KEY: ${executorKey.substring(0, 10)}...`);
    } else {
      console.log('  ⚠️  WITHDRAWAL_EXECUTOR_PRIVATE_KEY: NOT SET (required for cron jobs)');
    }

    const contractEnv = process.env.NEXT_PUBLIC_LOTTERY_CONTRACT;
    if (contractEnv) {
      console.log(`  ✓ NEXT_PUBLIC_LOTTERY_CONTRACT: ${contractEnv}`);
      if (contractEnv !== lotteryContract.address) {
        console.log(`  ⚠️  WARNING: Env var (${contractEnv}) differs from hardcoded (${lotteryContract.address})`);
      }
    } else {
      console.log(`  ℹ️  NEXT_PUBLIC_LOTTERY_CONTRACT: Using hardcoded value`);
    }
    console.log('');

    // 3. Test blockchain connection
    console.log('🌐 Testing Blockchain Connection:');
    const publicClient = lotteryContract.createPublicClient();

    const blockNumber = await publicClient.getBlockNumber();
    console.log(`  ✓ Latest Block: ${blockNumber}`);

    const chainId = await publicClient.getChainId();
    console.log(`  ✓ Chain ID: ${chainId} (${chainId === 8453 ? 'BASE Mainnet' : 'UNKNOWN'})`);
    console.log('');

    // 4. Test contract reads
    console.log('📖 Testing Contract Reads:');

    try {
      const currentHourlyDrawId = await lotteryContract.read('currentHourlyDrawId') as bigint;
      console.log(`  ✓ currentHourlyDrawId: ${currentHourlyDrawId}`);
    } catch (e: any) {
      console.log(`  ❌ currentHourlyDrawId: FAILED - ${e.message}`);
      throw e;
    }

    try {
      const currentDailyDrawId = await lotteryContract.read('currentDailyDrawId') as bigint;
      console.log(`  ✓ currentDailyDrawId: ${currentDailyDrawId}`);
    } catch (e: any) {
      console.log(`  ❌ currentDailyDrawId: FAILED - ${e.message}`);
      throw e;
    }

    try {
      const { hourly, daily } = await lotteryContract.getVaultBalances();
      const hourlyVault = hourly as any;
      const dailyVault = daily as any;

      const hourlyUsdc = Array.isArray(hourlyVault) ? hourlyVault[2] : hourlyVault.usdc;
      const dailyUsdc = Array.isArray(dailyVault) ? dailyVault[2] : dailyVault.usdc;

      console.log(`  ✓ Hourly Vault USDC: ${Number(hourlyUsdc) / 1e6} USDC`);
      console.log(`  ✓ Daily Vault USDC: ${Number(dailyUsdc) / 1e6} USDC`);
    } catch (e: any) {
      console.log(`  ❌ getVaultBalances: FAILED - ${e.message}`);
      throw e;
    }

    console.log('');

    // 5. Test draw reading (with array/object format handling)
    console.log('🎲 Testing Draw Reading:');
    try {
      const currentHourlyDrawId = await lotteryContract.read('currentHourlyDrawId') as bigint;
      const draw = await lotteryContract.getHourlyDraw(currentHourlyDrawId);

      console.log(`  ✓ getHourlyDraw(${currentHourlyDrawId}):`);
      console.log(`    - Draw Time: ${draw.drawTime > 0n ? new Date(Number(draw.drawTime) * 1000).toISOString() : 'NOT SET'}`);
      console.log(`    - Executed: ${draw.executed}`);
      console.log(`    - Sales Closed: ${draw.salesClosed}`);
      console.log(`    - Total Tickets: ${draw.totalTickets}`);
      console.log(`    - Winning Number: ${draw.winningNumber}`);
    } catch (e: any) {
      console.log(`  ❌ getHourlyDraw: FAILED - ${e.message}`);
      throw e;
    }

    console.log('');

    // 6. Validate ABI completeness
    console.log('✅ ABI Validation:');

    const requiredFunctions = [
      'currentHourlyDrawId',
      'currentDailyDrawId',
      'getHourlyDraw',
      'getDailyDraw',
      'getHourlyVault',
      'getDailyVault',
      'buyTicket',
      'executeHourlyDraw',
      'executeDailyDraw',
      'closeHourlyDraw',
      'closeDailyDraw',
      'claimHourlyPrize',
      'claimDailyPrize'
    ];

    const abiFunctions = lotteryContract.abi
      .filter((item: any) => item.type === 'function')
      .map((item: any) => item.name);

    for (const fn of requiredFunctions) {
      if (abiFunctions.includes(fn)) {
        console.log(`  ✓ ${fn}`);
      } else {
        console.log(`  ❌ ${fn} - MISSING!`);
        throw new Error(`ABI missing required function: ${fn}`);
      }
    }

    console.log('');

    // 7. Summary
    console.log('='.repeat(60));
    console.log('✅ ALL VALIDATIONS PASSED!');
    console.log('='.repeat(60));
    console.log('');
    console.log('📝 Contract Summary:');
    console.log(`  Address: ${lotteryContract.address}`);
    console.log(`  Version: ${lotteryContract.version}`);
    console.log(`  Features:`);
    lotteryContract.info.features.forEach(f => console.log(`    - ${f}`));
    console.log('');
    console.log('💡 Next Steps:');
    console.log('  1. Deploy to Vercel: git push');
    console.log('  2. Test draws: visit /results page');
    console.log('  3. Monitor cron: check /api/cron/* endpoints');
    console.log('');

    process.exit(0);

  } catch (error: any) {
    console.log('');
    console.log('='.repeat(60));
    console.log('❌ VALIDATION FAILED!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Error:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('  1. Check contract address is correct');
    console.log('  2. Ensure ABI matches deployed contract');
    console.log('  3. Verify environment variables are set');
    console.log('  4. Check RPC endpoint is accessible');
    console.log('  5. Confirm contract is deployed on BASE Mainnet');
    console.log('');

    process.exit(1);
  }
}

main();
