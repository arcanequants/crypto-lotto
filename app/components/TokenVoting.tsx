'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoteBreakdown {
  count: number;
  percentage: number;
}

interface TokenProposal {
  id: number;
  month: number;
  year: number;
  proposed_tokens: string[];
  status: string;
  total_votes: number;
  voting_end_date: string;
  days_remaining: number;
  votes_breakdown: Record<string, VoteBreakdown>;
  user_voted: boolean;
  user_vote: string | null;
}

interface VoteSummary {
  total_tickets: number;
  votes_used: number;
  votes_available: number;
  voted_token: string | null;
  has_voted: boolean;
}

interface TokenVotingProps {
  walletAddress?: string;
}

// Token metadata con íconos y descripciones
const TOKEN_METADATA: Record<string, { name: string; description: string; emoji: string }> = {
  BTC: { name: 'Bitcoin', description: 'Digital gold - Most secure crypto', emoji: '₿' },
  JUP: { name: 'Jupiter', description: 'Best DEX aggregator on Solana', emoji: '🪐' },
  RAY: { name: 'Raydium', description: 'Top volume AMM', emoji: '⚡' },
  JTO: { name: 'Jito', description: 'Liquid staking + MEV', emoji: '🚀' },
  PYTH: { name: 'Pyth Network', description: 'Price oracle leader', emoji: '🔮' },
  ORCA: { name: 'Orca', description: 'Best UX DEX on Solana', emoji: '🐋' },
  BONK: { name: 'Bonk', description: "Solana's #1 meme coin", emoji: '🐶' },
  WIF: { name: 'dogwifhat', description: 'Top meme coin', emoji: '🎩' },
  POPCAT: { name: 'Popcat', description: 'Viral cat meme', emoji: '🐱' },
  DOGE: { name: 'Dogecoin', description: 'Original meme', emoji: '🐕' },
  USDC: { name: 'USD Coin', description: 'Stable USD 1:1 backed', emoji: '💵' },
  USDT: { name: 'Tether', description: 'Most used stable', emoji: '💰' },
};

export default function TokenVoting({ walletAddress }: TokenVotingProps) {
  const [proposal, setProposal] = useState<TokenProposal | null>(null);
  const [voteSummary, setVoteSummary] = useState<VoteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  // Fetch propuesta actual y votos disponibles
  useEffect(() => {
    fetchCurrentProposal();
    if (walletAddress) {
      fetchVoteSummary();
    }
  }, [walletAddress]);

  const fetchCurrentProposal = async () => {
    try {
      setLoading(true);
      const url = walletAddress
        ? `/api/tokens/proposals/current?wallet_address=${walletAddress}`
        : '/api/tokens/proposals/current';

      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setProposal(data.proposal);
        if (data.proposal.user_vote) {
          setSelectedToken(data.proposal.user_vote);
        }
      } else {
        setError(data.error || 'No active voting found');
      }
    } catch (err) {
      setError('Failed to load voting data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVoteSummary = async () => {
    if (!walletAddress) return;

    try {
      const res = await fetch(`/api/tokens/vote?wallet_address=${walletAddress}`);
      const data = await res.json();

      if (data.success) {
        setVoteSummary({
          total_tickets: data.total_tickets,
          votes_used: data.votes_used,
          votes_available: data.votes_available,
          voted_token: data.voted_token,
          has_voted: data.has_voted,
        });
      }
    } catch (err) {
      console.error('Error fetching vote summary:', err);
    }
  };

  const handleVote = async (tokenSymbol: string) => {
    if (!walletAddress) {
      setError('Please connect your wallet to vote');
      return;
    }

    if (proposal?.user_voted) {
      setError(`You already voted for ${proposal.user_vote}`);
      return;
    }

    try {
      setVoting(true);
      setError(null);

      const res = await fetch('/api/tokens/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          token_symbol: tokenSymbol,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSelectedToken(tokenSymbol);
        // Refetch para actualizar contadores y votos disponibles
        await fetchCurrentProposal();
        await fetchVoteSummary();
      } else {
        setError(data.message || data.error || 'Failed to register vote');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/2"></div>
          <div className="h-64 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (error && !proposal) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6">
          <p className="text-red-200">{error}</p>
          <p className="text-sm text-red-300 mt-2">
            Voting will open at the start of the month. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  if (!proposal) return null;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const sortedTokens = [...proposal.proposed_tokens].sort((a, b) => {
    const voteA = proposal.votes_breakdown[a]?.count || 0;
    const voteB = proposal.votes_breakdown[b]?.count || 0;
    return voteB - voteA; // Descendente
  });

  return (
    <div className="voting-container p-6 space-y-8">
      {/* Header with Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="voting-header"
      >
        <h1>🗳️ Vote for Token of the Month</h1>
        <div className="header-stats">
          <div className="stat-pill">{monthNames[proposal.month - 1]} {proposal.year}</div>
          <div className="stat-pill">Total Votes: <strong style={{ color: '#ffd700' }}>{proposal.total_votes}</strong></div>
          <div className="stat-pill">Days Left: <strong style={{ color: '#ffd700' }}>{proposal.days_remaining}</strong></div>
        </div>
      </motion.div>

      {/* Available Votes Banner - Always show for demo/mockup purposes */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="votes-banner"
      >
        <h2>🎫 You have {voteSummary?.votes_available || 15} vote{(voteSummary?.votes_available || 15) !== 1 ? 's' : ''} available</h2>
        <p>Each ticket = 1 vote • Cast all votes at once</p>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-500/20 border border-red-500/50 rounded-lg p-4"
          >
            <p className="text-red-200 text-center">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Already Voted Message */}
      {voteSummary && voteSummary.has_voted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-500/20 border border-green-500/50 rounded-lg p-6 text-center"
        >
          <p className="text-green-200 text-lg">
            ✅ You voted with <span className="font-bold text-green-100">{voteSummary.votes_used} vote{voteSummary.votes_used !== 1 ? 's' : ''}</span> for{' '}
            <span className="font-bold text-green-100">{voteSummary.voted_token}</span>
          </p>
          <p className="text-sm text-green-300 mt-2">
            {voteSummary.votes_available > 0
              ? `You still have ${voteSummary.votes_available} vote${voteSummary.votes_available !== 1 ? 's' : ''} available! Vote again below.`
              : 'Thank you for participating! Check back at the end of the month for results.'
            }
          </p>
        </motion.div>
      )}

      {/* Voting Cards */}
      <div className="tokens-grid">
        {sortedTokens.map((token, index) => {
          const metadata = TOKEN_METADATA[token] || { name: token, description: '', emoji: '🪙' };
          const voteData = proposal.votes_breakdown[token] || { count: 0, percentage: 0 };
          const isUserVote = proposal.user_vote === token;
          const isLeading = index === 0 && voteData.count > 0;

          return (
            <motion.div
              key={token}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`token-card ${isLeading ? 'leading' : ''}`}
            >
              {/* Badge */}
              {(isLeading || token === 'BTC') && (
                <div className="token-badge">
                  {token === 'BTC' ? 'ALWAYS' : '🔥 LEADING'}
                </div>
              )}

              <div className="card-content">
                {/* Token Header */}
                <div className="token-header">
                  <span className="token-emoji">{metadata.emoji}</span>
                  <div className="token-info">
                    <h3>{metadata.name}</h3>
                    <div className="ticker">{token}</div>
                  </div>
                </div>

                {/* Description */}
                <div className="token-description">{metadata.description}</div>

                {/* Progress Container */}
                <div className="progress-container">
                  <div className="vote-stats">
                    <div className="vote-count">{voteData.count} vote{voteData.count !== 1 ? 's' : ''}</div>
                    <div className="vote-percentage">{voteData.percentage.toFixed(1)}%</div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${voteData.percentage}%` }}></div>
                  </div>
                </div>

                {/* Vote Button */}
                {(!voteSummary || !voteSummary.has_voted || voteSummary.votes_available > 0) && (
                  <button
                    onClick={() => handleVote(token)}
                    disabled={voting || !walletAddress || (voteSummary?.votes_available === 0)}
                    className="vote-btn"
                    style={{
                      opacity: voting || (voteSummary?.votes_available === 0) ? 0.5 : 1
                    }}
                  >
                    {voting
                      ? 'Voting...'
                      : !walletAddress
                      ? 'Connect Wallet'
                      : voteSummary && voteSummary.votes_available > 0
                      ? `Vote with ${voteSummary.votes_available} vote${voteSummary.votes_available !== 1 ? 's' : ''}`
                      : 'Vote'
                    }
                  </button>
                )}

                {isUserVote && (
                  <div style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '15px',
                    background: 'rgba(34, 197, 94, 0.2)',
                    border: '1px solid rgba(34, 197, 94, 0.5)',
                    color: 'rgb(134, 239, 172)',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontFamily: 'Orbitron, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    ✓ Your Vote
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
