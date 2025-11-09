// Simple analytics utility for tracking user events
// Can be replaced with PostHog, Mixpanel, or Google Analytics

type AnalyticsEvent =
  | 'page_view'
  | 'ticket_purchase'
  | 'ticket_add_to_cart'
  | 'prize_claim'
  | 'wallet_connect'
  | 'quick_pick';

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

class Analytics {
  private enabled: boolean;

  constructor() {
    // Only enable in production
    this.enabled = process.env.NODE_ENV === 'production';
  }

  /**
   * Track a custom event
   */
  track(event: AnalyticsEvent, properties?: EventProperties) {
    if (!this.enabled) {
      console.log('[Analytics - DEV]', event, properties);
      return;
    }

    // TODO: Replace with real analytics service (PostHog, Mixpanel, GA)
    // Example: posthog.capture(event, properties);

    // For now, just log to console in production
    console.log('[Analytics]', event, properties);
  }

  /**
   * Track page view
   */
  pageView(page: string) {
    this.track('page_view', { page });
  }

  /**
   * Track ticket purchase
   */
  ticketPurchase(count: number, totalPrice: number) {
    this.track('ticket_purchase', {
      ticket_count: count,
      total_price: totalPrice,
    });
  }

  /**
   * Track adding ticket to cart
   */
  addToCart(mainNumbers: number[], powerNumber: number) {
    this.track('ticket_add_to_cart', {
      main_numbers: mainNumbers.join(','),
      power_number: powerNumber,
    });
  }

  /**
   * Track prize claim
   */
  prizeClaim(amount: number, tier?: string) {
    this.track('prize_claim', {
      amount,
      tier,
    });
  }

  /**
   * Track wallet connection
   */
  walletConnect(method: 'email' | 'wallet' | 'google') {
    this.track('wallet_connect', { method });
  }

  /**
   * Track quick pick usage
   */
  quickPick() {
    this.track('quick_pick');
  }
}

// Export singleton instance
export const analytics = new Analytics();
