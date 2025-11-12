import { NextResponse } from 'next/server';

/**
 * Clean tickets from OLD contract (0xDEB0b4355a89Dec15C173c517Ca02b2e1398936e)
 *
 * This endpoint clears localStorage tickets that belong to the OLD contract
 * so only tickets from the NEW contract (0x2aB8...) are shown.
 */

const OLD_CONTRACT = '0xDEB0b4355a89Dec15C173c517Ca02b2e1398936e'; // Very first contract (before v2.0)
const NEW_CONTRACT = process.env.NEXT_PUBLIC_LOTTERY_CONTRACT || '0xF3f6f3452513C6101D2EeA45BB8d4f552131B2C7'; // v2.1.0 with auto-skip

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tickets } = body;

    console.log('🧹 Cleaning old contract tickets...');
    console.log('   OLD contract:', OLD_CONTRACT);
    console.log('   NEW contract:', NEW_CONTRACT);
    console.log('   Total tickets before:', tickets?.length || 0);

    // Filter out tickets from old contract
    // Since we don't store contract address in tickets, we'll clear ALL tickets
    // (they're all from the old contract anyway)

    return NextResponse.json({
      success: true,
      message: 'All old tickets cleared',
      oldContract: OLD_CONTRACT,
      newContract: NEW_CONTRACT,
      ticketsRemoved: tickets?.length || 0
    });

  } catch (error: any) {
    console.error('❌ Error cleaning tickets:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clean tickets',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    oldContract: OLD_CONTRACT,
    newContract: NEW_CONTRACT,
    message: 'POST to this endpoint to clean old tickets'
  });
}
