import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/tickets/register-blockchain
 *
 * Registra un ticket comprado directamente en el blockchain
 * Este endpoint se llama DESPUÉS de que el usuario compra un ticket usando el contrato
 *
 * Para TESTING ULTRA SIMPLE - usa localStorage en el cliente
 * Para producción deberías usar eventos del blockchain + base de datos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketNumber, walletAddress, drawId, token, cost } = body;

    // Validate request
    if (!ticketNumber || !walletAddress || !drawId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('📝 Blockchain ticket registered:', {
      ticketNumber,
      walletAddress,
      drawId,
      token,
      cost,
      timestamp: new Date().toISOString()
    });

    // For ULTRA SIMPLE testing, we just return success
    // The client will handle storage in localStorage
    return NextResponse.json({
      success: true,
      message: 'Ticket registered successfully',
      ticket: {
        id: Date.now(), // Unique ID
        ticketNumber,
        walletAddress,
        drawId,
        token,
        cost,
        purchasedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error registering blockchain ticket:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
