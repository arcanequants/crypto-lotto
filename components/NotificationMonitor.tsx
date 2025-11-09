'use client';

import { useTicketPurchaseMonitor } from '@/hooks/useTicketPurchaseMonitor';
import { usePrivy } from '@privy-io/react-auth';

/**
 * Notification Monitor Component
 *
 * Background component that monitors for ticket purchases
 * and triggers notifications automatically
 *
 * Add this to your app layout or main page to enable notifications
 */
export function NotificationMonitor() {
  const { authenticated } = usePrivy();
  const { isMonitoring, lastPurchase, pendingTickets } = useTicketPurchaseMonitor();

  // Only render in development to show monitoring status
  if (process.env.NODE_ENV === 'development' && authenticated) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        background: 'rgba(0, 240, 255, 0.1)',
        border: '1px solid rgba(0, 240, 255, 0.3)',
        borderRadius: '8px',
        padding: '10px 15px',
        fontSize: '12px',
        color: '#00f0ff',
        zIndex: 9998,
        fontFamily: 'monospace',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>
          📡 Notification Monitor
        </div>
        <div>
          Status: {isMonitoring ? '🟢 Active' : '🔴 Inactive'}
        </div>
        {pendingTickets > 0 && (
          <div>
            Pending: {pendingTickets} ticket{pendingTickets > 1 ? 's' : ''}
          </div>
        )}
        {lastPurchase && (
          <div style={{ marginTop: '5px', fontSize: '10px', opacity: 0.7 }}>
            Last: {lastPurchase.totalTickets} ticket{lastPurchase.totalTickets > 1 ? 's' : ''} (${lastPurchase.amount})
          </div>
        )}
      </div>
    );
  }

  // In production, render nothing (just runs in background)
  return null;
}
