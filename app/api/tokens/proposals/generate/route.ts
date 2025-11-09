import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/tokens/proposals/generate
 *
 * Genera propuestas de tokens automáticamente para un mes específico
 * usando el Bracket System v2.0 con BTC siempre incluido.
 *
 * Body (opcional):
 * {
 *   "month": 1,     // Opcional: Si no se provee, usa mes actual
 *   "year": 2025    // Opcional: Si no se provee, usa año actual
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "proposal": {
 *     "id": 1,
 *     "month": 1,
 *     "year": 2025,
 *     "proposed_tokens": ["BTC", "JUP", "BONK", "DOGE", "USDC"],
 *     "cycle_position": 0
 *   }
 * }
 */

// Configuración de tokens por tier (basado en BRACKET-SYSTEM-V2-SOLANA.md)
const TIER_3_DEFI = ['JUP', 'RAY', 'JTO', 'PYTH', 'ORCA'];
const TIER_4_MEME = ['BONK', 'WIF', 'POPCAT'];
const ADDITIONAL_OPTIONS = ['DOGE', 'JUP', 'RAY', 'JTO', 'PYTH', 'ORCA'];
const WILDCARD_OPTIONS = ['USDC', 'PYTH', 'ORCA', 'DOGE', 'USDT', 'BONK', 'WIF', 'JUP', 'RAY', 'PYTH', 'JUP', 'RAY'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Parsear body
    const body = await request.json().catch(() => ({}));
    const targetMonth = body.month || new Date().getMonth() + 1;
    const targetYear = body.year || new Date().getFullYear();

    // Validar mes y año
    if (targetMonth < 1 || targetMonth > 12) {
      return NextResponse.json(
        { success: false, error: 'Month must be between 1 and 12' },
        { status: 400 }
      );
    }

    if (targetYear < 2025) {
      return NextResponse.json(
        { success: false, error: 'Year must be 2025 or later' },
        { status: 400 }
      );
    }

    // Verificar si ya existe propuesta para este mes
    const { data: existingProposal } = await supabase
      .from('monthly_token_proposals')
      .select('id, status, proposed_tokens')
      .eq('month', targetMonth)
      .eq('year', targetYear)
      .single();

    if (existingProposal) {
      return NextResponse.json({
        success: true,
        message: 'Proposal already exists for this month',
        proposal: existingProposal,
        is_existing: true,
      });
    }

    // Calcular posición en el ciclo (0-11 para 12 meses)
    const cyclePosition = (targetMonth - 1) % 12;

    // BTC SIEMPRE está incluido (posición 0)
    const proposedTokens: string[] = ['BTC'];

    // TIER 3: DeFi (posición 1)
    const tier3Index = cyclePosition % TIER_3_DEFI.length;
    proposedTokens.push(TIER_3_DEFI[tier3Index]);

    // TIER 4: Meme (posición 2)
    const tier4Index = cyclePosition % TIER_4_MEME.length;
    proposedTokens.push(TIER_4_MEME[tier4Index]);

    // Adicional (posición 3) - mix de tiers
    const additionalIndex = cyclePosition % ADDITIONAL_OPTIONS.length;
    const additional = ADDITIONAL_OPTIONS[additionalIndex];
    if (!proposedTokens.includes(additional)) {
      proposedTokens.push(additional);
    } else {
      // Si ya está incluido, buscar el siguiente disponible
      for (let i = 0; i < ADDITIONAL_OPTIONS.length; i++) {
        const nextIndex = (additionalIndex + i) % ADDITIONAL_OPTIONS.length;
        const nextToken = ADDITIONAL_OPTIONS[nextIndex];
        if (!proposedTokens.includes(nextToken)) {
          proposedTokens.push(nextToken);
          break;
        }
      }
    }

    // Wildcard (posición 4) - sorpresa
    const wildcardIndex = cyclePosition % WILDCARD_OPTIONS.length;
    const wildcard = WILDCARD_OPTIONS[wildcardIndex];
    if (!proposedTokens.includes(wildcard)) {
      proposedTokens.push(wildcard);
    } else {
      // Si ya está incluido, buscar el siguiente disponible
      for (let i = 0; i < WILDCARD_OPTIONS.length; i++) {
        const nextIndex = (wildcardIndex + i) % WILDCARD_OPTIONS.length;
        const nextToken = WILDCARD_OPTIONS[nextIndex];
        if (!proposedTokens.includes(nextToken)) {
          proposedTokens.push(nextToken);
          break;
        }
      }
    }

    // Asegurar que siempre hay exactamente 5 opciones
    while (proposedTokens.length < 5) {
      proposedTokens.push('USDC'); // Fallback
    }

    // Calcular fecha de fin de votación (último día del mes a las 23:59:59)
    const votingEndDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Crear propuesta en base de datos
    const { data: newProposal, error: insertError } = await supabase
      .from('monthly_token_proposals')
      .insert({
        month: targetMonth,
        year: targetYear,
        proposed_tokens: proposedTokens.slice(0, 5), // Máximo 5
        status: 'active',
        voting_end_date: votingEndDate.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting proposal:', insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    // Log para debugging
    console.log(`✅ Generated proposal for ${targetMonth}/${targetYear}:`, proposedTokens);

    return NextResponse.json({
      success: true,
      message: `Proposals for ${targetMonth}/${targetYear} generated successfully`,
      proposal: {
        ...newProposal,
        cycle_position: cyclePosition,
      },
    });

  } catch (error) {
    console.error('Error generating proposals:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tokens/proposals/generate
 *
 * Preview de tokens que se generarían para un mes específico
 * (No crea la propuesta, solo muestra preview)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const targetMonth = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const targetYear = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    // Calcular posición en el ciclo
    const cyclePosition = (targetMonth - 1) % 12;

    // Generar preview
    const proposedTokens: string[] = ['BTC'];

    const tier3Index = cyclePosition % TIER_3_DEFI.length;
    proposedTokens.push(TIER_3_DEFI[tier3Index]);

    const tier4Index = cyclePosition % TIER_4_MEME.length;
    proposedTokens.push(TIER_4_MEME[tier4Index]);

    const additionalIndex = cyclePosition % ADDITIONAL_OPTIONS.length;
    const additional = ADDITIONAL_OPTIONS[additionalIndex];
    if (!proposedTokens.includes(additional)) {
      proposedTokens.push(additional);
    }

    const wildcardIndex = cyclePosition % WILDCARD_OPTIONS.length;
    const wildcard = WILDCARD_OPTIONS[wildcardIndex];
    if (!proposedTokens.includes(wildcard)) {
      proposedTokens.push(wildcard);
    }

    while (proposedTokens.length < 5) {
      proposedTokens.push('USDC');
    }

    return NextResponse.json({
      success: true,
      preview: true,
      month: targetMonth,
      year: targetYear,
      cycle_position: cyclePosition,
      proposed_tokens: proposedTokens.slice(0, 5),
      breakdown: {
        btc_always: proposedTokens[0],
        defi_tier: proposedTokens[1],
        meme_tier: proposedTokens[2],
        additional: proposedTokens[3],
        wildcard: proposedTokens[4],
      },
    });

  } catch (error) {
    console.error('Error generating preview:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
