'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseAbi } from 'viem';

/**
 * ADMIN PAGE: EXECUTE DRAWS (Blockhash 2-Step Process)
 *
 * Nueva funcionalidad para el sistema blockhash con commit-reveal:
 *
 * PASO 1: Close Draw (Commit Phase)
 * - Cierra ventas del draw actual
 * - Commit a bloques futuros (no existen todavía)
 * - revealBlock = block.number + 25 (~5 minutos)
 *
 * PASO 2: Execute Draw (Reveal Phase)
 * - Esperar ~5 minutos (25 bloques)
 * - Obtener 5 blockhashes consecutivos
 * - Generar winning number (1-100)
 *
 * URL: /admin/execute-draws
 */

const LOTTERY_ADDRESS = process.env.NEXT_PUBLIC_LOTTERY_DUAL_CRYPTO as `0x${string}`;

const LOTTERY_ABI = parseAbi([
  'function currentHourlyDrawId() view returns (uint256)',
  'function currentDailyDrawId() view returns (uint256)',
  'function getHourlyDraw(uint256) view returns (uint256 drawId, uint256 drawTime, uint8 winningNumber, uint256 totalTickets, uint256 totalPrize, bool executed, uint256 commitBlock, uint256 revealBlock, bool salesClosed)',
  'function getDailyDraw(uint256) view returns (uint256 drawId, uint256 drawTime, uint8 winningNumber, uint256 totalTickets, uint256 totalPrize, bool executed, uint256 commitBlock, uint256 revealBlock, bool salesClosed)',
  'function closeHourlyDraw()',
  'function closeDailyDraw()',
  'function executeHourlyDraw()',
  'function executeDailyDraw()',
]);

export default function ExecuteDrawsPage() {
  const { address, isConnected } = useAccount();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Read current draw IDs
  const { data: hourlyDrawId } = useReadContract({
    address: LOTTERY_ADDRESS,
    abi: LOTTERY_ABI,
    functionName: 'currentHourlyDrawId',
  });

  const { data: dailyDrawId } = useReadContract({
    address: LOTTERY_ADDRESS,
    abi: LOTTERY_ABI,
    functionName: 'currentDailyDrawId',
  });

  // Read hourly draw status
  const { data: hourlyDraw, refetch: refetchHourly } = useReadContract({
    address: LOTTERY_ADDRESS,
    abi: LOTTERY_ABI,
    functionName: 'getHourlyDraw',
    args: hourlyDrawId ? [hourlyDrawId] : undefined,
  });

  // Read daily draw status
  const { data: dailyDraw, refetch: refetchDaily } = useReadContract({
    address: LOTTERY_ADDRESS,
    abi: LOTTERY_ABI,
    functionName: 'getDailyDraw',
    args: dailyDrawId ? [dailyDrawId] : undefined,
  });

  // Close Hourly Draw
  const { data: closeHourlyHash, writeContract: closeHourly, isPending: closingHourly } = useWriteContract();
  const { isSuccess: closeHourlySuccess } = useWaitForTransactionReceipt({
    hash: closeHourlyHash,
  });

  // Close Daily Draw
  const { data: closeDailyHash, writeContract: closeDaily, isPending: closingDaily } = useWriteContract();
  const { isSuccess: closeDailySuccess } = useWaitForTransactionReceipt({
    hash: closeDailyHash,
  });

  // Execute Hourly Draw
  const { data: executeHourlyHash, writeContract: executeHourly, isPending: executingHourly } = useWriteContract();
  const { isSuccess: executeHourlySuccess } = useWaitForTransactionReceipt({
    hash: executeHourlyHash,
  });

  // Execute Daily Draw
  const { data: executeDailyHash, writeContract: executeDaily, isPending: executingDaily } = useWriteContract();
  const { isSuccess: executeDailySuccess } = useWaitForTransactionReceipt({
    hash: executeDailyHash,
  });

  // Refetch when transactions succeed
  useEffect(() => {
    if (closeHourlySuccess || executingHourlySuccess) {
      refetchHourly();
      setMessage('✅ Hourly draw transaction successful!');
    }
  }, [closeHourlySuccess, executeHourlySuccess, refetchHourly]);

  useEffect(() => {
    if (closeDailySuccess || executeDailySuccess) {
      refetchDaily();
      setMessage('✅ Daily draw transaction successful!');
    }
  }, [closeDailySuccess, executeDailySuccess, refetchDaily]);

  // Helper: Check if can execute (waited enough blocks)
  const canExecuteHourly = hourlyDraw && hourlyDraw[7] > 0n && hourlyDraw[8]; // revealBlock > 0 && salesClosed
  const canExecuteDaily = dailyDraw && dailyDraw[7] > 0n && dailyDraw[8];

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">🎲 Execute Draws (Admin)</h1>
          <div className="bg-yellow-900/30 rounded-lg p-6">
            <p className="text-yellow-200">⚠️ Please connect your wallet first</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🎲 Execute Draws (Blockhash)</h1>
          <p className="text-gray-400">
            2-step process: Close draw → Wait ~5 min → Execute draw
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded ${message.includes('✅') ? 'bg-green-900/50' : message.includes('⚠️') ? 'bg-yellow-900/50' : 'bg-red-900/50'}`}>
            {message}
          </div>
        )}

        {/* Hourly Draw */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">⏰ Hourly Draw</h2>

          {hourlyDraw && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-400 text-sm">Draw ID:</p>
                  <p className="font-mono text-lg">{hourlyDraw[0].toString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Tickets:</p>
                  <p className="font-mono text-lg">{hourlyDraw[3].toString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Sales Closed:</p>
                  <p className="font-mono text-lg">{hourlyDraw[8] ? '✅ Yes' : '❌ No'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Executed:</p>
                  <p className="font-mono text-lg">{hourlyDraw[5] ? '✅ Yes' : '❌ No'}</p>
                </div>
                {hourlyDraw[6] > 0n && (
                  <>
                    <div>
                      <p className="text-gray-400 text-sm">Commit Block:</p>
                      <p className="font-mono text-lg">{hourlyDraw[6].toString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Reveal Block:</p>
                      <p className="font-mono text-lg">{hourlyDraw[7].toString()}</p>
                    </div>
                  </>
                )}
                {hourlyDraw[5] && (
                  <div className="col-span-2">
                    <p className="text-gray-400 text-sm">Winning Number:</p>
                    <p className="font-mono text-2xl text-cyan-400">{hourlyDraw[2]}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                {/* STEP 1: Close Draw */}
                {!hourlyDraw[8] && !hourlyDraw[5] && (
                  <button
                    onClick={() => {
                      setMessage('');
                      closeHourly({
                        address: LOTTERY_ADDRESS,
                        abi: LOTTERY_ABI,
                        functionName: 'closeHourlyDraw',
                      });
                    }}
                    disabled={closingHourly || hourlyDraw[3] === 0n}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {closingHourly ? 'Closing...' : 'STEP 1: Close Draw'}
                  </button>
                )}

                {/* STEP 2: Execute Draw */}
                {hourlyDraw[8] && !hourlyDraw[5] && (
                  <button
                    onClick={() => {
                      setMessage('');
                      executeHourly({
                        address: LOTTERY_ADDRESS,
                        abi: LOTTERY_ABI,
                        functionName: 'executeHourlyDraw',
                      });
                    }}
                    disabled={executingHourly}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {executingHourly ? 'Executing...' : 'STEP 2: Execute Draw'}
                  </button>
                )}

                {/* Already executed */}
                {hourlyDraw[5] && (
                  <div className="flex-1 bg-green-900/50 px-6 py-3 rounded-lg text-center">
                    <p className="font-bold text-green-400">✅ Draw Completed</p>
                    <p className="text-sm text-gray-400">Winning Number: {hourlyDraw[2]}</p>
                  </div>
                )}
              </div>

              {/* Instructions */}
              {hourlyDraw[8] && !hourlyDraw[5] && (
                <div className="bg-blue-900/30 rounded-lg p-4 mt-4">
                  <p className="text-sm text-blue-200">
                    ⏳ <strong>Wait ~5 minutes</strong> (25 blocks) after closing before executing.
                    <br />
                    Reveal block: {hourlyDraw[7].toString()} | Need to wait until block: {(hourlyDraw[7] + 5n).toString()}
                  </p>
                </div>
              )}

              {hourlyDraw[3] === 0n && !hourlyDraw[5] && (
                <div className="bg-yellow-900/30 rounded-lg p-4 mt-4">
                  <p className="text-sm text-yellow-200">
                    ⚠️ No tickets sold yet. Draw will be skipped when closed.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Daily Draw */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">📅 Daily Draw</h2>

          {dailyDraw && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-400 text-sm">Draw ID:</p>
                  <p className="font-mono text-lg">{dailyDraw[0].toString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Tickets:</p>
                  <p className="font-mono text-lg">{dailyDraw[3].toString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Sales Closed:</p>
                  <p className="font-mono text-lg">{dailyDraw[8] ? '✅ Yes' : '❌ No'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Executed:</p>
                  <p className="font-mono text-lg">{dailyDraw[5] ? '✅ Yes' : '❌ No'}</p>
                </div>
                {dailyDraw[6] > 0n && (
                  <>
                    <div>
                      <p className="text-gray-400 text-sm">Commit Block:</p>
                      <p className="font-mono text-lg">{dailyDraw[6].toString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Reveal Block:</p>
                      <p className="font-mono text-lg">{dailyDraw[7].toString()}</p>
                    </div>
                  </>
                )}
                {dailyDraw[5] && (
                  <div className="col-span-2">
                    <p className="text-gray-400 text-sm">Winning Number:</p>
                    <p className="font-mono text-2xl text-cyan-400">{dailyDraw[2]}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                {/* STEP 1: Close Draw */}
                {!dailyDraw[8] && !dailyDraw[5] && (
                  <button
                    onClick={() => {
                      setMessage('');
                      closeDaily({
                        address: LOTTERY_ADDRESS,
                        abi: LOTTERY_ABI,
                        functionName: 'closeDailyDraw',
                      });
                    }}
                    disabled={closingDaily || dailyDraw[3] === 0n}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {closingDaily ? 'Closing...' : 'STEP 1: Close Draw'}
                  </button>
                )}

                {/* STEP 2: Execute Draw */}
                {dailyDraw[8] && !dailyDraw[5] && (
                  <button
                    onClick={() => {
                      setMessage('');
                      executeDaily({
                        address: LOTTERY_ADDRESS,
                        abi: LOTTERY_ABI,
                        functionName: 'executeDailyDraw',
                      });
                    }}
                    disabled={executingDaily}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {executingDaily ? 'Executing...' : 'STEP 2: Execute Draw'}
                  </button>
                )}

                {/* Already executed */}
                {dailyDraw[5] && (
                  <div className="flex-1 bg-green-900/50 px-6 py-3 rounded-lg text-center">
                    <p className="font-bold text-green-400">✅ Draw Completed</p>
                    <p className="text-sm text-gray-400">Winning Number: {dailyDraw[2]}</p>
                  </div>
                )}
              </div>

              {/* Instructions */}
              {dailyDraw[8] && !dailyDraw[5] && (
                <div className="bg-blue-900/30 rounded-lg p-4 mt-4">
                  <p className="text-sm text-blue-200">
                    ⏳ <strong>Wait ~5 minutes</strong> (25 blocks) after closing before executing.
                    <br />
                    Reveal block: {dailyDraw[7].toString()} | Need to wait until block: {(dailyDraw[7] + 5n).toString()}
                  </p>
                </div>
              )}

              {dailyDraw[3] === 0n && !dailyDraw[5] && (
                <div className="bg-yellow-900/30 rounded-lg p-4 mt-4">
                  <p className="text-sm text-yellow-200">
                    ⚠️ No tickets sold yet. Draw will be skipped when closed.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Security Info */}
        <div className="bg-purple-900/30 rounded-lg p-6">
          <h3 className="font-bold mb-3">🔐 Blockhash Security</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
            <li><strong>Commit-Reveal Pattern:</strong> Blocks don't exist when closing sales</li>
            <li><strong>5 Consecutive Blocks:</strong> Uses 5 blockhashes (not 1) for randomness</li>
            <li><strong>SmartBillions Protection:</strong> Must execute within 250 blocks</li>
            <li><strong>Hash Verification:</strong> All hashes must be != 0x00</li>
            <li><strong>Wait Period:</strong> 5 blocks after reveal (prevent reorgs)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
