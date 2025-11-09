import { NextResponse } from 'next/server';
import { getActiveLotteries } from '@/lib/contracts/factory';

/**
 * GET /api/lotteries/active
 * Returns all active lotteries from Factory contract
 */
export async function GET() {
  try {
    const lotteries = await getActiveLotteries();

    return NextResponse.json({
      success: true,
      lotteries,
      count: lotteries.length
    });
  } catch (error: any) {
    console.error('Error fetching active lotteries:', error);

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch lotteries',
      lotteries: []
    }, {
      status: 500
    });
  }
}
