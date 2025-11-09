import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * MoonPay Onramp API
 * Creates a signed URL for users to buy USDC/USDT with fiat
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, email, redirectUrl, amount, asset = 'usdc' } = body;

    // Validate required fields
    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // MoonPay API keys (from environment variables)
    const MOONPAY_PUBLIC_KEY = process.env.MOONPAY_PUBLIC_KEY;
    const MOONPAY_SECRET_KEY = process.env.MOONPAY_SECRET_KEY;

    if (!MOONPAY_PUBLIC_KEY || !MOONPAY_SECRET_KEY) {
      console.error('MoonPay API keys not configured');
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    // Determine currency code based on asset
    // MoonPay uses different codes for different networks
    let currencyCode = 'usdc_base'; // USDC on BASE
    if (asset.toLowerCase() === 'usdt') {
      currencyCode = 'usdt_base'; // USDT on BASE
    }

    // Create MoonPay URL with parameters
    const moonpayUrl = new URL('https://buy.moonpay.com');

    // Required parameters
    moonpayUrl.searchParams.set('apiKey', MOONPAY_PUBLIC_KEY);
    moonpayUrl.searchParams.set('walletAddress', address);
    moonpayUrl.searchParams.set('currencyCode', currencyCode);

    // Optional parameters
    if (email) {
      moonpayUrl.searchParams.set('email', email);
    }
    if (redirectUrl) {
      moonpayUrl.searchParams.set('redirectURL', redirectUrl);
    }
    if (amount) {
      moonpayUrl.searchParams.set('baseCurrencyAmount', amount.toString());
    }

    // Additional UX improvements
    moonpayUrl.searchParams.set('colorCode', '#00f0ff'); // Match our theme
    moonpayUrl.searchParams.set('showWalletAddressForm', 'false'); // We already have the address

    // Generate signature for URL authorization
    const urlSignature = crypto
      .createHmac('sha256', MOONPAY_SECRET_KEY)
      .update(moonpayUrl.search)
      .digest('base64');

    moonpayUrl.searchParams.set('signature', urlSignature);

    // Return the signed URL
    return NextResponse.json({
      url: moonpayUrl.toString(),
      provider: 'moonpay',
      currency: currencyCode,
    });

  } catch (error) {
    console.error('Error creating onramp URL:', error);
    return NextResponse.json(
      { error: 'Failed to create payment URL' },
      { status: 500 }
    );
  }
}
