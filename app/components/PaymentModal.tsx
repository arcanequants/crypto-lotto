'use client';

import { useState, useEffect } from 'react';
import { useContract, type Ticket, type PaymentToken } from '@/lib/hooks/useContract';
import { useFundWallet } from '@/lib/hooks/useFundWallet';
import { NeonProgressModal } from './NeonProgressModal';

interface PaymentModalProps {
  tickets: Ticket[];
  onSuccess: () => void;
  onCancel: () => void;
  onError: (error: string) => void;
}

type ProgressStage = 'signing' | 'approving' | 'mining' | 'confirming' | 'complete';

export function PaymentModal({ tickets, onSuccess, onCancel, onError }: PaymentModalProps) {
  const {
    loading: contractLoading,
    error: contractError,
    checkTokenBalance,
    checkTokenAllowance,
    approveToken,
    buyTicket,
    buyTicketsBulk,
    calculateTotalCost,
    TICKET_PRICE,
    walletAddress
  } = useContract();

  const {
    loading: fundingLoading,
    fundWithCard,
    isFundingAvailable
  } = useFundWallet();

  const [step, setStep] = useState<'select' | 'approve' | 'buying' | 'funding'>('select');
  const [selectedToken, setSelectedToken] = useState<PaymentToken>('USDC');
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [hasAllowance, setHasAllowance] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progressStage, setProgressStage] = useState<ProgressStage>('signing');
  const [txHash, setTxHash] = useState<string | undefined>();

  const totalCost = calculateTotalCost(tickets.length);
  const ticketCount = tickets.length;

  // Check balance and allowance on mount and when token changes
  useEffect(() => {
    loadBalanceAndAllowance();
  }, [selectedToken]);

  const loadBalanceAndAllowance = async () => {
    try {
      const balance = await checkTokenBalance(selectedToken);
      setTokenBalance(balance);

      const allowance = await checkTokenAllowance(selectedToken, totalCost);
      setHasAllowance(allowance);
    } catch (err) {
      console.error('Error loading balance/allowance:', err);
      // Set default values if check fails (wallet not connected or contract not deployed)
      setTokenBalance('0');
      setHasAllowance(false);
    }
  };

  const handlePayWithToken = async () => {
    try {
      // Check if user has enough balance
      if (parseFloat(tokenBalance) < parseFloat(totalCost)) {
        // Instead of error, show helpful message and close modal
        onCancel();
        onError(`Insufficient ${selectedToken} balance. Please deposit funds first.`);
        return;
      }

      setShowProgress(true);

      // Check if approval is needed
      if (!hasAllowance) {
        setProgressStage('signing');
        setStep('approve');

        // Small delay to show signing stage
        await new Promise(resolve => setTimeout(resolve, 500));

        setProgressStage('approving');
        // Approve INFINITE amount so user only approves ONCE
        const approvalHash = await approveToken(selectedToken);
        setTxHash(approvalHash);
        setHasAllowance(true);

        console.log('✅ Approval complete! All future purchases will be instant.');

        // Small delay before next stage
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Buy tickets
      setProgressStage('signing');
      setStep('buying');
      setTxHash(undefined);

      // Small delay to show signing stage
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProgressStage('mining');

      // ULTRA SIMPLE: buyTicketsBulk doesn't exist, use buyTicket for single tickets
      let purchaseHash: string;
      if (tickets.length === 1) {
        await buyTicket(tickets[0], selectedToken);
        purchaseHash = ''; // buyTicket doesn't return hash
      } else {
        purchaseHash = await buyTicketsBulk(tickets, selectedToken);
      }

      setTxHash(purchaseHash || undefined);

      // Show confirming stage briefly
      setProgressStage('confirming');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Register tickets in localStorage for display in my-tickets page
      // ULTRA SIMPLE for testing - for production use blockchain events + database
      try {
        console.log('💾 Saving tickets to localStorage...');
        console.log('   Wallet address:', walletAddress);
        console.log('   Tickets to save:', tickets);

        const existingTickets = JSON.parse(localStorage.getItem('blockchain_tickets') || '[]');
        console.log('   Existing tickets in localStorage:', existingTickets);

        const newTickets = tickets.map((ticket, index) => ({
          id: Date.now() + index,
          ticketNumber: ticket.numbers[0], // ULTRA SIMPLE: only 1 number
          numbers: ticket.numbers,
          powerNumber: ticket.powerNumber,
          walletAddress: walletAddress || '',  // Smart wallet address
          drawId: 2, // Current draw (hardcoded for testing)
          token: selectedToken,
          cost: TICKET_PRICE,
          purchasedAt: new Date().toISOString(),
          txHash: purchaseHash || undefined
        }));

        const allTickets = [...existingTickets, ...newTickets];
        localStorage.setItem('blockchain_tickets', JSON.stringify(allTickets));
        console.log('✅ Tickets saved to localStorage successfully!');
        console.log('   New tickets:', newTickets);
        console.log('   Total tickets now:', allTickets.length);

        // Verify it was saved
        const verification = localStorage.getItem('blockchain_tickets');
        console.log('✅ Verification - localStorage now contains:', JSON.parse(verification || '[]').length, 'tickets');
      } catch (err) {
        console.error('⚠️ Failed to save tickets to localStorage:', err);
        // Don't fail the transaction if localStorage fails
      }

      // Complete!
      setProgressStage('complete');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Success!
      setShowProgress(false);
      onSuccess();
    } catch (err: any) {
      setShowProgress(false);
      onError(err.message || 'Failed to purchase tickets');
      setStep('select');
      setTxHash(undefined);
    }
  };

  const handleBuyToken = async () => {
    try {
      setStep('funding');
      await fundWithCard(totalCost, selectedToken.toLowerCase() as 'usdc' | 'usdt');

      // After funding completes, reload balance
      await loadBalanceAndAllowance();
      setStep('select');
    } catch (err: any) {
      onError(err.message || `Failed to buy ${selectedToken}`);
      setStep('select');
    }
  };

  const loading = contractLoading || fundingLoading;

  // Show progress modal during transactions
  if (showProgress) {
    return (
      <NeonProgressModal
        ticketCount={ticketCount}
        totalCost={totalCost}
        selectedToken={selectedToken}
        txHash={txHash}
        stage={progressStage}
        onClose={progressStage === 'complete' ? () => {
          setShowProgress(false);
          onSuccess();
        } : undefined}
      />
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
        borderRadius: '30px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        border: '2px solid rgba(0, 240, 255, 0.3)',
        boxShadow: '0 20px 60px rgba(0, 240, 255, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <h2 style={{
            fontSize: '28px',
            background: 'linear-gradient(135deg, #00f0ff, #0080ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '10px'
          }}>
            💳 Purchase {ticketCount} Ticket{ticketCount > 1 ? 's' : ''}
          </h2>
          <div style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: selectedToken === 'USDC' ? '#00f0ff' : '#26a17b',
            fontFamily: 'Orbitron, monospace'
          }}>
            ${totalCost}
          </div>
        </div>

        {/* Token Selector */}
        <div style={{
          marginBottom: '20px',
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={() => setSelectedToken('USDC')}
            style={{
              flex: 1,
              padding: '15px',
              background: selectedToken === 'USDC'
                ? 'linear-gradient(135deg, #00f0ff, #0080ff)'
                : 'rgba(255, 255, 255, 0.1)',
              border: selectedToken === 'USDC'
                ? '2px solid #00f0ff'
                : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            💎 USDC
          </button>
          <button
            onClick={() => setSelectedToken('USDT')}
            style={{
              flex: 1,
              padding: '15px',
              background: selectedToken === 'USDT'
                ? 'linear-gradient(135deg, #26a17b, #1c9c6e)'
                : 'rgba(255, 255, 255, 0.1)',
              border: selectedToken === 'USDT'
                ? '2px solid #26a17b'
                : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            💚 USDT
          </button>
        </div>

        {/* Balance Info */}
        <div style={{
          background: 'rgba(0, 240, 255, 0.1)',
          borderRadius: '15px',
          padding: '15px',
          marginBottom: '20px',
          border: '1px solid rgba(0, 240, 255, 0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ opacity: 0.8 }}>Your {selectedToken} Balance:</span>
            <span style={{ fontWeight: 'bold', color: parseFloat(tokenBalance) >= parseFloat(totalCost) ? '#00ff88' : '#ff6b6b' }}>
              ${parseFloat(tokenBalance).toFixed(2)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ opacity: 0.8 }}>Total Cost:</span>
            <span style={{ fontWeight: 'bold' }}>${totalCost}</span>
          </div>
        </div>

        {/* Payment Options */}
        {step === 'select' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Pay with Selected Token */}
            <button
              onClick={handlePayWithToken}
              disabled={loading || parseFloat(tokenBalance) < parseFloat(totalCost)}
              style={{
                padding: '20px',
                background: parseFloat(tokenBalance) >= parseFloat(totalCost)
                  ? (selectedToken === 'USDC'
                    ? 'linear-gradient(135deg, #00f0ff, #0080ff)'
                    : 'linear-gradient(135deg, #26a17b, #1c9c6e)')
                  : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '15px',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: parseFloat(tokenBalance) >= parseFloat(totalCost) && !loading ? 'pointer' : 'not-allowed',
                opacity: parseFloat(tokenBalance) >= parseFloat(totalCost) && !loading ? 1 : 0.5,
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <div style={{ fontSize: '24px' }}>{selectedToken === 'USDC' ? '💎' : '💚'}</div>
              <div>Pay with {selectedToken}</div>
              {!hasAllowance && parseFloat(tokenBalance) >= parseFloat(totalCost) && (
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  (Requires approval first)
                </div>
              )}
            </button>

            {/* No Funds Message - Show deposit button */}
            {parseFloat(tokenBalance) < parseFloat(totalCost) && (
              <div style={{
                background: 'rgba(255, 215, 0, 0.1)',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '15px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', marginBottom: '10px' }}>💡</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                  Insufficient {selectedToken} Balance
                </div>
                <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '15px' }}>
                  You have ${parseFloat(tokenBalance).toFixed(2)} but need ${totalCost}
                </div>
                <button
                  onClick={() => {
                    onCancel();
                    // Trigger deposit modal after a small delay
                    setTimeout(() => {
                      const depositBtn = document.querySelector('.neon-deposit-btn') as HTMLButtonElement;
                      depositBtn?.click();
                    }, 300);
                  }}
                  style={{
                    padding: '15px 30px',
                    background: 'linear-gradient(135deg, #ffd700, #ffa500)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#000',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: 'Orbitron, monospace'
                  }}
                >
                  💰 DEPOSIT {selectedToken}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading State for Funding */}
        {step === 'funding' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏦</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
              Opening Payment Provider...
            </div>
            <div style={{ opacity: 0.7, fontSize: '14px' }}>
              Complete your purchase in the new window
            </div>
          </div>
        )}

        {/* Cancel Button */}
        {step === 'select' && (
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              marginTop: '20px',
              width: '100%',
              padding: '15px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            Cancel
          </button>
        )}

        {/* Error Display */}
        {contractError && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '12px',
            color: '#ff6b6b',
            fontSize: '14px'
          }}>
            ⚠️ {contractError}
          </div>
        )}
      </div>
    </div>
  );
}
