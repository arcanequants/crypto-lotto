/**
 * Test script for DUAL LOTTERY ticket purchase
 *
 * Run: node test-purchase.js
 */

const purchaseTicket = async () => {
  const url = 'http://localhost:3001/api/tickets/purchase';

  const payload = {
    tickets: [
      {
        numbers: [5, 12, 23, 45, 67],
        powerNumber: 8
      }
    ],
    walletAddress: '0x1234567890123456789012345678901234567890'
  };

  console.log('🎫 Testing DUAL LOTTERY ticket purchase...\n');
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));
  console.log('\n🚀 Sending request to:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ SUCCESS!\n');
      console.log('📊 Response:', JSON.stringify(data, null, 2));
      console.log('\n🎰 Summary:');
      console.log(`   - Tickets purchased: ${data.ticketCount}`);
      console.log(`   - Total cost: $${data.totalCost}`);
      console.log(`   - Daily Draw ID: ${data.dailyDrawId}`);
      console.log(`   - Weekly Draw ID: ${data.weeklyDrawId}`);
      console.log(`   - Daily Pool: $${data.dailyPrizePool?.toFixed(4) || '0'}`);
      console.log(`   - Weekly Pool: $${data.weeklyPrizePool?.toFixed(4) || '0'}`);
      console.log(`   - Token: ${data.tokenSymbol}`);

      if (data.distribution) {
        console.log('\n💰 Distribution:');
        console.log(`   - Platform Fee (25%): $${data.distribution.platform_fee?.toFixed(4) || '0'}`);
        console.log(`   - Daily Pool (20%): $${data.distribution.daily_pool?.toFixed(4) || '0'}`);
        console.log(`   - Weekly Pool (80%): $${data.distribution.weekly_pool?.toFixed(4) || '0'}`);
      }

      console.log(`\n✨ ${data.message}`);
    } else {
      console.log('\n❌ ERROR!\n');
      console.log('📊 Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('\n💥 Request failed:', error.message);
  }
};

purchaseTicket();
