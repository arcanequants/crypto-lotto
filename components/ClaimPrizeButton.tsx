'use client';

import { useState } from 'react';
import { useContract } from '@/lib/hooks/useContract';

interface ClaimPrizeButtonProps {
  ticketId: number;
  prizeType: 'hourly' | 'daily';
  btcAmount: string;
  ethAmount: string;
  bnbAmount: string;
  totalUsdValue: string;
}

export default function ClaimPrizeButton({
  ticketId,
  prizeType,
  btcAmount,
  ethAmount,
  bnbAmount,
  totalUsdValue
}: ClaimPrizeButtonProps) {
  const { claimHourlyPrize, claimDailyPrize, loading } = useContract();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<'crypto' | 'usdc' | null>(null);

  const handleClaim = async (convertToUSDC: boolean) => {
    setError(null);
    setTxHash(null);
    setShowModal(false);

    try {
      let hash: string;

      if (prizeType === 'hourly') {
        hash = await claimHourlyPrize(ticketId, convertToUSDC);
      } else {
        hash = await claimDailyPrize(ticketId, convertToUSDC);
      }

      setTxHash(hash);
      setSelectedOption(convertToUSDC ? 'usdc' : 'crypto');
    } catch (err: any) {
      setError(err.message || 'Failed to claim prize');
      console.error('Claim error:', err);
    }
  };

  if (txHash) {
    return (
      <div className="bg-green-950/30 border border-green-500/30 rounded-lg p-6 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-green-400 mb-2">
          ¡Premio Reclamado!
        </h3>
        {selectedOption === 'usdc' ? (
          <p className="text-green-300/80 mb-4">
            Recibiste 100% USDC (~${totalUsdValue})
          </p>
        ) : (
          <p className="text-green-300/80 mb-4">
            Recibiste {btcAmount} BTC + {ethAmount} ETH + {bnbAmount} BNB
          </p>
        )}
        <p className="text-sm text-green-400/60 mb-4">
          Valor total: ~${totalUsdValue}
        </p>
        <a
          href={`https://basescan.org/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-400 hover:text-green-300 underline text-sm"
        >
          Ver en Basescan →
        </a>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-yellow-950/30 to-orange-950/30 border border-yellow-500/30 rounded-lg p-6">
      {/* Prize Details */}
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🏆</div>
        <h3 className="text-2xl font-bold text-yellow-400 mb-2">
          ¡Ganaste el Premio {prizeType === 'hourly' ? 'Por Hora' : 'Diario'}!
        </h3>
        <p className="text-yellow-300/80 mb-4">
          Ticket #{ticketId}
        </p>

        {/* Crypto Breakdown */}
        <div className="bg-black/30 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-orange-400 font-bold">70% BTC</div>
              <div className="text-white mt-1">{btcAmount}</div>
            </div>
            <div>
              <div className="text-blue-400 font-bold">20% ETH</div>
              <div className="text-white mt-1">{ethAmount}</div>
            </div>
            <div>
              <div className="text-yellow-400 font-bold">10% BNB</div>
              <div className="text-white mt-1">{bnbAmount}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-xs text-gray-400">Valor Total Estimado</div>
            <div className="text-2xl font-bold text-green-400">
              ${totalUsdValue}
            </div>
          </div>
        </div>
      </div>

      {/* Gas-Free Badge */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4 text-center">
        <div className="flex items-center justify-center gap-2 text-green-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-bold">GAS GRATIS</span>
        </div>
        <p className="text-xs text-green-400/60 mt-1">
          Nosotros pagamos el gas - Tú recibes el 100%
        </p>
      </div>

      {/* Claim Button */}
      <button
        onClick={() => setShowModal(true)}
        disabled={loading}
        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-yellow-500/50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Procesando...</span>
          </div>
        ) : (
          <>Reclamar Premio 🎁</>
        )}
      </button>

      {/* Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-yellow-500/30 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4 text-center">
              ¿Cómo quieres recibir tu premio?
            </h3>
            <p className="text-gray-300 text-sm mb-6 text-center">
              Elige la opción que prefieras - ¡ambas son sin gas!
            </p>

            {/* Option 1: Crypto */}
            <button
              onClick={() => handleClaim(false)}
              className="w-full bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-lg mb-4 transition-all"
            >
              <div className="text-left">
                <div className="text-lg mb-1">🪙 Diversificado (Recomendado)</div>
                <div className="text-sm opacity-80">70% BTC + 20% ETH + 10% BNB</div>
              </div>
            </button>

            {/* Option 2: USDC */}
            <button
              onClick={() => handleClaim(true)}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-bold py-4 px-6 rounded-lg mb-4 transition-all"
            >
              <div className="text-left">
                <div className="text-lg mb-1">💵 Stablecoin (Más Simple)</div>
                <div className="text-sm opacity-80">100% USDC - Sin volatilidad</div>
              </div>
            </button>

            {/* Cancel */}
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-all"
            >
              Cancelar
            </button>

            {/* Info */}
            <div className="mt-4 text-xs text-gray-400 text-center">
              <p>💚 Ambas opciones: GAS GRATIS</p>
              <p className="mt-1">Nosotros pagamos el gas - Tú recibes el 100%</p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-950/30 border border-red-500/30 rounded-lg p-3 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 text-xs text-gray-400 text-center space-y-1">
        <p>Las 3 criptomonedas se transferirán directamente a tu wallet</p>
        <p>Sin tarifas de gas - Sin comisiones extra</p>
      </div>
    </div>
  );
}
