import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/tokens/proposals/current
 *
 * Obtiene la propuesta activa del mes actual con información de votos.
 *
 * Query params:
 * - wallet_address (opcional): Si se provee, incluye si el usuario ya votó
 *
 * Response:
 * {
 *   "success": true,
 *   "proposal": {
 *     "id": 1,
 *     "month": 1,
 *     "year": 2025,
 *     "proposed_tokens": ["BTC", "JUP", "BONK", "DOGE", "USDC"],
 *     "status": "active",
 *     "total_votes": 150,
 *     "voting_end_date": "2025-01-31T23:59:59",
 *     "votes_breakdown": {
 *       "BTC": { "count": 60, "percentage": 40 },
 *       "JUP": { "count": 45, "percentage": 30 },
 *       "BONK": { "count": 30, "percentage": 20 },
 *       "DOGE": { "count": 10, "percentage": 6.67 },
 *       "USDC": { "count": 5, "percentage": 3.33 }
 *     },
 *     "user_voted": false,
 *     "user_vote": null
 *   }
 * }
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('wallet_address');

    // Obtener propuesta activa del mes actual
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const { data: proposal, error: proposalError } = await supabase
      .from('monthly_token_proposals')
      .select('*')
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .eq('status', 'active')
      .single();

    if (proposalError || !proposal) {
      return NextResponse.json({
        success: false,
        error: 'No active proposal found for current month',
        message: 'An admin needs to generate proposals first',
      }, { status: 404 });
    }

    // Obtener todos los votos ponderados (ticket_votes) para esta propuesta
    const { data: votes, error: votesError } = await supabase
      .from('ticket_votes')
      .select('token_symbol, wallet_address')
      .eq('proposal_id', proposal.id);

    if (votesError) {
      console.error('Error fetching votes:', votesError);
    }

    // Calcular breakdown de votos PONDERADOS (cada ticket = 1 voto)
    const votesBreakdown: Record<string, { count: number; percentage: number }> = {};
    const totalVotes = votes?.length || 0; // Total de tickets que votaron

    // Inicializar todos los tokens propuestos con 0 votos
    proposal.proposed_tokens.forEach((token: string) => {
      votesBreakdown[token] = { count: 0, percentage: 0 };
    });

    // Contar votos (cada entrada en ticket_votes = 1 voto)
    votes?.forEach((vote) => {
      if (votesBreakdown[vote.token_symbol]) {
        votesBreakdown[vote.token_symbol].count++;
      }
    });

    // Calcular porcentajes
    Object.keys(votesBreakdown).forEach((token) => {
      if (totalVotes > 0) {
        votesBreakdown[token].percentage = Number(
          ((votesBreakdown[token].count / totalVotes) * 100).toFixed(2)
        );
      }
    });

    // Verificar si el usuario ya votó
    let userVoted = false;
    let userVote: string | null = null;

    if (walletAddress && votes) {
      const userVoteRecord = votes.find(
        (vote) => vote.wallet_address.toLowerCase() === walletAddress.toLowerCase()
      );
      if (userVoteRecord) {
        userVoted = true;
        userVote = userVoteRecord.token_symbol;
      }
    }

    // Calcular tiempo restante
    const endDate = new Date(proposal.voting_end_date);
    const now = new Date();
    const timeRemaining = endDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      success: true,
      proposal: {
        id: proposal.id,
        month: proposal.month,
        year: proposal.year,
        proposed_tokens: proposal.proposed_tokens,
        status: proposal.status,
        total_votes: totalVotes,
        voting_end_date: proposal.voting_end_date,
        days_remaining: daysRemaining > 0 ? daysRemaining : 0,
        votes_breakdown: votesBreakdown,
        user_voted: userVoted,
        user_vote: userVote,
      },
    });

  } catch (error) {
    console.error('Error fetching current proposal:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
