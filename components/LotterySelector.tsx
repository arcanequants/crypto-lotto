'use client';

import { useEffect, useState } from 'react';
import { LotteryInfo } from '@/lib/contracts/factory';

interface LotterySelectorProps {
  onSelect: (lottery: LotteryInfo) => void;
  selectedLotteryId?: string;
}

export function LotterySelector({ onSelect, selectedLotteryId }: LotterySelectorProps) {
  const [lotteries, setLotteries] = useState<LotteryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLotteries() {
      try {
        setLoading(true);
        const response = await fetch('/api/lotteries/active');
        const data = await response.json();

        if (data.success) {
          setLotteries(data.lotteries);

          // Auto-select first lottery if none selected
          if (data.lotteries.length > 0 && !selectedLotteryId) {
            onSelect(data.lotteries[0]);
          }
        } else {
          setError(data.error || 'Failed to load lotteries');
        }
      } catch (err: any) {
        console.error('Error loading lotteries:', err);
        setError(err.message || 'Failed to load lotteries');
      } finally {
        setLoading(false);
      }
    }

    loadLotteries();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 rounded-lg bg-gray-800 animate-pulse"
          >
            <div className="h-6 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-700 rounded mb-4"></div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-700 rounded w-20"></div>
              <div className="h-4 bg-gray-700 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg bg-red-900/20 border border-red-500 mb-8">
        <p className="text-red-500">Error loading lotteries: {error}</p>
      </div>
    );
  }

  if (lotteries.length === 0) {
    return (
      <div className="p-6 rounded-lg bg-yellow-900/20 border border-yellow-500 mb-8">
        <p className="text-yellow-500">No active lotteries available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-white">Choose Your Lottery</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {lotteries.map((lottery) => (
          <div
            key={lottery.lotteryId}
            onClick={() => onSelect(lottery)}
            className={`
              p-6 rounded-lg cursor-pointer transition-all duration-200
              ${selectedLotteryId === lottery.lotteryId
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-xl scale-105'
                : 'bg-gray-800 hover:bg-gray-700 text-white hover:scale-102'
              }
            `}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-bold">{lottery.name}</h3>
              {selectedLotteryId === lottery.lotteryId && (
                <div className="bg-black/20 px-2 py-1 rounded text-xs font-bold">
                  SELECTED
                </div>
              )}
            </div>

            <p className={`text-sm mb-4 ${selectedLotteryId === lottery.lotteryId ? 'text-black/80' : 'text-gray-400'}`}>
              {lottery.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className={selectedLotteryId === lottery.lotteryId ? 'text-black/70 font-semibold' : 'text-gray-500'}>
                  Ticket Price
                </p>
                <p className="font-bold">
                  ${lottery.ticketPrice}
                </p>
              </div>

              <div>
                <p className={selectedLotteryId === lottery.lotteryId ? 'text-black/70 font-semibold' : 'text-gray-500'}>
                  Tickets Sold
                </p>
                <p className="font-bold">
                  {lottery.totalTickets}
                </p>
              </div>
            </div>

            {lottery.totalVolume && parseFloat(lottery.totalVolume) > 0 && (
              <div className="mt-3 pt-3 border-t border-current/20">
                <p className={selectedLotteryId === lottery.lotteryId ? 'text-black/70 text-xs' : 'text-gray-500 text-xs'}>
                  Total Volume
                </p>
                <p className="font-bold">
                  ${parseFloat(lottery.totalVolume).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="mt-6 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-gray-400 text-sm">Active Lotteries</p>
            <p className="text-2xl font-bold text-white">{lotteries.length}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Tickets</p>
            <p className="text-2xl font-bold text-white">
              {lotteries.reduce((sum, l) => sum + parseInt(l.totalTickets || '0'), 0)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Volume</p>
            <p className="text-2xl font-bold text-white">
              ${lotteries.reduce((sum, l) => sum + parseFloat(l.totalVolume || '0'), 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
