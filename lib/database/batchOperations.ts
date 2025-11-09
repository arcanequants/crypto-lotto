import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logging/logger';

/**
 * Batch operations helper to optimize database queries
 * Prevents N+1 query problems by batching updates/inserts
 */

/**
 * Batch update tickets with winners and prizes
 * Instead of updating tickets one by one, update all in a single query
 *
 * @param supabase - Supabase client
 * @param updates - Array of ticket updates
 * @returns Updated tickets
 */
export async function batchUpdateTickets(
  supabase: SupabaseClient,
  updates: Array<{
    id: number;
    daily_processed?: boolean;
    daily_winner?: boolean;
    daily_tier?: string | null;
    daily_prize_amount?: number;
    weekly_processed?: boolean;
    weekly_winner?: boolean;
    weekly_tier?: string | null;
    weekly_prize_amount?: number;
    claim_status?: string;
  }>
): Promise<{ success: boolean; error?: string }> {
  if (updates.length === 0) {
    return { success: true };
  }

  try {
    const startTime = Date.now();

    // Use upsert to update all tickets in one query
    const { error } = await supabase.from('tickets').upsert(updates);

    const duration = Date.now() - startTime;

    if (error) {
      logger.error('Batch ticket update failed', {
        count: updates.length,
        duration,
        error: error.message,
      });
      return { success: false, error: error.message };
    }

    logger.performance('Batch ticket update completed', {
      count: updates.length,
      duration,
      avgPerTicket: Math.floor(duration / updates.length),
    });

    return { success: true };
  } catch (error) {
    logger.error('Batch ticket update exception', {
      count: updates.length,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch insert tickets
 * More efficient than inserting one by one
 *
 * @param supabase - Supabase client
 * @param tickets - Array of tickets to insert
 * @returns Inserted tickets
 */
export async function batchInsertTickets(
  supabase: SupabaseClient,
  tickets: Array<{
    ticket_id: string;
    wallet_address: string;
    numbers: number[];
    power_number: number;
    assigned_daily_draw_id: number;
    assigned_weekly_draw_id: number;
    purchase_time: string;
  }>
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  if (tickets.length === 0) {
    return { success: true, data: [] };
  }

  try {
    const startTime = Date.now();

    const { data, error } = await supabase.from('tickets').insert(tickets).select();

    const duration = Date.now() - startTime;

    if (error) {
      logger.error('Batch ticket insert failed', {
        count: tickets.length,
        duration,
        error: error.message,
      });
      return { success: false, error: error.message };
    }

    logger.performance('Batch ticket insert completed', {
      count: tickets.length,
      duration,
      avgPerTicket: Math.floor(duration / tickets.length),
    });

    return { success: true, data };
  } catch (error) {
    logger.error('Batch ticket insert exception', {
      count: tickets.length,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch fetch tickets for a draw
 * More efficient than fetching individually
 *
 * @param supabase - Supabase client
 * @param drawId - Draw ID
 * @param drawType - 'daily' or 'weekly'
 * @returns Array of tickets
 */
export async function batchFetchTicketsForDraw(
  supabase: SupabaseClient,
  drawId: number,
  drawType: 'daily' | 'weekly'
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const startTime = Date.now();

    const column =
      drawType === 'daily' ? 'assigned_daily_draw_id' : 'assigned_weekly_draw_id';

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq(column, drawId);

    const duration = Date.now() - startTime;

    if (error) {
      logger.error('Batch fetch tickets failed', {
        drawId,
        drawType,
        duration,
        error: error.message,
      });
      return { success: false, error: error.message };
    }

    logger.performance('Batch fetch tickets completed', {
      drawId,
      drawType,
      count: data?.length || 0,
      duration,
    });

    return { success: true, data: data || [] };
  } catch (error) {
    logger.error('Batch fetch tickets exception', {
      drawId,
      drawType,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch delete tickets (for rollback scenarios)
 *
 * @param supabase - Supabase client
 * @param ticketIds - Array of ticket IDs to delete
 * @returns Success status
 */
export async function batchDeleteTickets(
  supabase: SupabaseClient,
  ticketIds: string[]
): Promise<{ success: boolean; error?: string }> {
  if (ticketIds.length === 0) {
    return { success: true };
  }

  try {
    const startTime = Date.now();

    const { error } = await supabase.from('tickets').delete().in('ticket_id', ticketIds);

    const duration = Date.now() - startTime;

    if (error) {
      logger.error('Batch ticket delete failed', {
        count: ticketIds.length,
        duration,
        error: error.message,
      });
      return { success: false, error: error.message };
    }

    logger.warn('Batch ticket delete completed', {
      count: ticketIds.length,
      duration,
    });

    return { success: true };
  } catch (error) {
    logger.error('Batch ticket delete exception', {
      count: ticketIds.length,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process tickets in batches to avoid memory issues
 * Useful when processing millions of tickets
 *
 * @param supabase - Supabase client
 * @param drawId - Draw ID
 * @param drawType - 'daily' or 'weekly'
 * @param batchSize - Number of tickets to process per batch
 * @param processor - Function to process each batch
 * @returns Total processed count
 */
export async function processTicketsInBatches(
  supabase: SupabaseClient,
  drawId: number,
  drawType: 'daily' | 'weekly',
  batchSize: number,
  processor: (tickets: any[]) => Promise<void>
): Promise<{ success: boolean; processed: number; error?: string }> {
  try {
    const startTime = Date.now();
    let totalProcessed = 0;
    let offset = 0;

    const column =
      drawType === 'daily' ? 'assigned_daily_draw_id' : 'assigned_weekly_draw_id';

    while (true) {
      // Fetch batch
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('*')
        .eq(column, drawId)
        .range(offset, offset + batchSize - 1);

      if (error) {
        logger.error('Batch processing fetch failed', {
          drawId,
          drawType,
          offset,
          batchSize,
          error: error.message,
        });
        return { success: false, processed: totalProcessed, error: error.message };
      }

      if (!tickets || tickets.length === 0) {
        // No more tickets to process
        break;
      }

      // Process batch
      await processor(tickets);
      totalProcessed += tickets.length;

      logger.info('Batch processed', {
        drawId,
        drawType,
        batchNumber: Math.floor(offset / batchSize) + 1,
        ticketsInBatch: tickets.length,
        totalProcessed,
      });

      // If we got fewer tickets than batch size, we're done
      if (tickets.length < batchSize) {
        break;
      }

      offset += batchSize;
    }

    const duration = Date.now() - startTime;

    logger.performance('Batch processing completed', {
      drawId,
      drawType,
      totalProcessed,
      duration,
      avgPerTicket: totalProcessed > 0 ? Math.floor(duration / totalProcessed) : 0,
    });

    return { success: true, processed: totalProcessed };
  } catch (error) {
    logger.error('Batch processing exception', {
      drawId,
      drawType,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      processed: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Example usage:
 *
 * // Before (N+1 problem):
 * for (const ticket of tickets) {
 *   await supabase.from('tickets').update({...}).eq('id', ticket.id);
 * }
 *
 * // After (batch operation):
 * const updates = tickets.map(ticket => ({
 *   id: ticket.id,
 *   daily_processed: true,
 *   daily_winner: tier !== null,
 *   daily_tier: tier,
 *   daily_prize_amount: tier ? prizeAmounts[tier] : 0,
 * }));
 * await batchUpdateTickets(supabase, updates);
 */
