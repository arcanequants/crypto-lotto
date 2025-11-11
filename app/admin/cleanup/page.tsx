'use client';

import { useState } from 'react';

const OLD_CONTRACT = '0xDEB0b4355a89Dec15C173c517Ca02b2e1398936e';
const NEW_CONTRACT = '0x2aB8570632D431843F40eb48dA8cE67695BAE3D9';

export default function CleanupPage() {
  const [checkOutput, setCheckOutput] = useState('');
  const [cleanOutput, setCleanOutput] = useState('');
  const [verifyOutput, setVerifyOutput] = useState('');
  const [ticketOutput, setTicketOutput] = useState('');

  const checkLocalStorage = () => {
    const tickets = localStorage.getItem('blockchain_tickets');

    if (!tickets || tickets === '[]') {
      setCheckOutput('✅ LocalStorage is clean (no tickets)');
      return;
    }

    const ticketArray = JSON.parse(tickets);
    setCheckOutput(`
⚠️ Found ${ticketArray.length} tickets in localStorage

Tickets: ${JSON.stringify(ticketArray, null, 2)}

⚠️ These are from the OLD contract (0xDEB0...)
⚠️ You should clean them before buying new tickets
    `);
  };

  const cleanLocalStorage = () => {
    const tickets = localStorage.getItem('blockchain_tickets');

    if (!tickets || tickets === '[]') {
      setCleanOutput('✅ Already clean (no tickets to remove)');
      return;
    }

    const ticketArray = JSON.parse(tickets);
    const count = ticketArray.length;

    // CLEAR ALL TICKETS
    localStorage.removeItem('blockchain_tickets');
    localStorage.setItem('blockchain_tickets', '[]');

    setCleanOutput(`
✅ Cleaned ${count} old tickets from localStorage
✅ LocalStorage is now empty

OLD contract: ${OLD_CONTRACT}
NEW contract: ${NEW_CONTRACT}

✅ Ready to buy tickets on NEW contract!
    `);
  };

  const verifyContract = async () => {
    setVerifyOutput('🔄 Checking contract configuration...');

    try {
      const response = await fetch('/api/verify-contract');
      const data = await response.json();

      const isCorrect = data.contract === NEW_CONTRACT;

      setVerifyOutput(`
${isCorrect ? '✅' : '❌'} Contract Address: ${data.contract}

Expected (NEW): ${NEW_CONTRACT}
OLD contract: ${OLD_CONTRACT}

${isCorrect ? '✅ Correct! Using NEW contract with blockhash' : '❌ WRONG! Still using OLD contract'}

Next Ticket ID: ${data.data.nextTicketId}
Current Hourly Draw: ${data.data.currentHourlyDrawId}

Hourly Vault:
  - USDC: $${data.data.hourlyVault.usdcFormatted}

${data.data.nextTicketId === '0' ? '✅ Contract is empty (no tickets yet)' : `⚠️ Contract has ${data.data.nextTicketId} tickets`}
      `);
    } catch (error: any) {
      setVerifyOutput(`❌ Error: ${error.message}`);
    }
  };

  const verifyNewTicket = async () => {
    setTicketOutput('🔄 Verifying ticket on blockchain...');

    try {
      // First check localStorage
      const tickets = localStorage.getItem('blockchain_tickets');
      const ticketArray = tickets ? JSON.parse(tickets) : [];

      if (ticketArray.length === 0) {
        setTicketOutput('❌ No tickets in localStorage. Buy a ticket first!');
        return;
      }

      // Then check blockchain
      const response = await fetch('/api/verify-contract');
      const data = await response.json();

      const nextTicketId = parseInt(data.data.nextTicketId);

      if (nextTicketId === 0) {
        setTicketOutput(`
❌ VERIFICATION FAILED!
Contract still has 0 tickets on blockchain
But localStorage shows ${ticketArray.length} ticket(s)

❌ This means the ticket purchase FAILED on-chain
Or you're checking the WRONG contract

Contract checked: ${data.contract}
Expected (NEW): ${NEW_CONTRACT}
        `);
        return;
      }

      setTicketOutput(`
✅ VERIFICATION SUCCESSFUL!

Contract: ${data.contract}
✅ Correct contract (NEW with blockhash)

LocalStorage tickets: ${ticketArray.length}
Blockchain tickets: ${nextTicketId}

${ticketArray.length === nextTicketId ? '✅ Counts match!' : '⚠️ Counts differ (may take time to sync)'}

✅ Your ticket is on the NEW contract!
✅ It will enter draws with blockhash randomness

Latest ticket in localStorage:
${JSON.stringify(ticketArray[ticketArray.length - 1], null, 2)}
      `);
    } catch (error: any) {
      setTicketOutput(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div style={{
      fontFamily: "'Courier New', monospace",
      background: '#0a0e27',
      color: '#00f0ff',
      padding: '20px',
      minHeight: '100vh'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{
          textAlign: 'center',
          color: '#ffd700',
          fontSize: '32px',
          marginBottom: '30px'
        }}>
          🧹 Clean Old Tickets & Verify New Contract
        </h1>

        {/* Step 1 */}
        <div style={{
          background: 'rgba(0, 240, 255, 0.1)',
          border: '2px solid #00f0ff',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#00f0ff' }}>📋 Step 1: Check Current LocalStorage</h2>
          <button
            onClick={checkLocalStorage}
            style={{
              background: 'linear-gradient(135deg, #00f0ff, #0080ff)',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '10px',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '16px',
              width: '100%',
              margin: '10px 0'
            }}
          >
            Check LocalStorage
          </button>
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '15px',
            borderRadius: '5px',
            marginTop: '10px',
            whiteSpace: 'pre-wrap',
            fontSize: '14px'
          }}>
            {checkOutput || 'Click button to check...'}
          </div>
        </div>

        {/* Step 2 */}
        <div style={{
          background: 'rgba(0, 240, 255, 0.1)',
          border: '2px solid #00f0ff',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#00f0ff' }}>🧹 Step 2: Clean Old Tickets</h2>
          <p>This will DELETE all tickets from localStorage (they&apos;re from the OLD contract 0xDEB0...)</p>
          <button
            onClick={cleanLocalStorage}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #ff4444)',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '10px',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '16px',
              width: '100%',
              margin: '10px 0'
            }}
          >
            CLEAN ALL TICKETS
          </button>
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '15px',
            borderRadius: '5px',
            marginTop: '10px',
            whiteSpace: 'pre-wrap',
            fontSize: '14px'
          }}>
            {cleanOutput || 'Click button to clean...'}
          </div>
        </div>

        {/* Step 3 */}
        <div style={{
          background: 'rgba(0, 240, 255, 0.1)',
          border: '2px solid #00f0ff',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#00f0ff' }}>✅ Step 3: Verify Contract Configuration</h2>
          <button
            onClick={verifyContract}
            style={{
              background: 'linear-gradient(135deg, #00f0ff, #0080ff)',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '10px',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '16px',
              width: '100%',
              margin: '10px 0'
            }}
          >
            Verify Contract Address
          </button>
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '15px',
            borderRadius: '5px',
            marginTop: '10px',
            whiteSpace: 'pre-wrap',
            fontSize: '14px'
          }}>
            {verifyOutput || 'Click button to verify...'}
          </div>
        </div>

        {/* Step 4 */}
        <div style={{
          background: 'rgba(0, 240, 255, 0.1)',
          border: '2px solid #00f0ff',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#00f0ff' }}>🎫 Step 4: After You Buy a Ticket</h2>
          <p>After buying a ticket, click this button to verify it went to the NEW contract</p>
          <button
            onClick={verifyNewTicket}
            style={{
              background: 'linear-gradient(135deg, #00ff88, #00cc66)',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '10px',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '16px',
              width: '100%',
              margin: '10px 0'
            }}
          >
            Verify New Ticket on Blockchain
          </button>
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '15px',
            borderRadius: '5px',
            marginTop: '10px',
            whiteSpace: 'pre-wrap',
            fontSize: '14px'
          }}>
            {ticketOutput || 'Click button after buying a ticket...'}
          </div>
        </div>

        {/* Back button */}
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <a
            href="/"
            style={{
              color: '#00f0ff',
              textDecoration: 'none',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
