'use client';

import { useEffect, useState } from 'react';

interface NeonProgressModalProps {
  ticketCount: number;
  totalCost: string;
  selectedToken: string;
  txHash?: string;
  stage: 'signing' | 'approving' | 'mining' | 'confirming' | 'complete';
  onClose?: () => void;
}

// Calculate estimated time based on ticket quantity
function calculateEstimatedTime(ticketCount: number): { min: number; max: number } {
  if (ticketCount <= 10) return { min: 15, max: 25 };
  if (ticketCount <= 100) return { min: 25, max: 35 };
  if (ticketCount <= 1000) return { min: 40, max: 60 };
  if (ticketCount <= 5000) return { min: 60, max: 90 };
  return { min: 90, max: 120 };
}

export function NeonProgressModal({
  ticketCount,
  totalCost,
  selectedToken,
  txHash,
  stage,
  onClose
}: NeonProgressModalProps) {
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [currentHash, setCurrentHash] = useState('');

  const estimatedTime = calculateEstimatedTime(ticketCount);
  const totalEstimatedSeconds = estimatedTime.max;

  // Update progress based on stage
  useEffect(() => {
    switch (stage) {
      case 'signing':
        setProgress(10);
        break;
      case 'approving':
        setProgress(25);
        break;
      case 'mining':
        setProgress(40);
        break;
      case 'confirming':
        setProgress(70);
        break;
      case 'complete':
        setProgress(100);
        break;
    }
  }, [stage]);

  // Simulate elapsed time
  useEffect(() => {
    if (stage === 'complete') return;

    const interval = setInterval(() => {
      setElapsed(prev => {
        if (prev >= totalEstimatedSeconds) return prev;
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, totalEstimatedSeconds]);

  // Generate simulated hash display
  useEffect(() => {
    if (txHash) {
      setCurrentHash(txHash);
    } else {
      const interval = setInterval(() => {
        const hash = '0x' + Math.random().toString(16).substr(2, 50);
        setCurrentHash(hash);
      }, 500);

      return () => clearInterval(interval);
    }
  }, [txHash]);

  const remaining = Math.max(0, totalEstimatedSeconds - elapsed);
  const circumference = 326.73;
  const offset = circumference - (progress / 100) * circumference;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      {/* Neon grid background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(rgba(255, 0, 255, 0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        animation: 'gridMove 20s linear infinite',
        pointerEvents: 'none'
      }} />

      {/* Neon particles */}
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            position: 'fixed',
            width: '4px',
            height: '4px',
            background: '#0ff',
            borderRadius: '50%',
            boxShadow: '0 0 10px #0ff, 0 0 20px #0ff',
            animation: `particleFloat ${8 + i * 2}s ease-in-out infinite`,
            left: `${20 + i * 30}%`,
            animationDelay: `${i * 2}s`,
            pointerEvents: 'none'
          }}
        />
      ))}

      <div style={{
        maxWidth: '450px',
        width: '100%',
        background: 'linear-gradient(135deg, rgba(0, 10, 20, 0.95), rgba(10, 0, 20, 0.95))',
        borderRadius: '20px',
        padding: '25px',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderImage: 'linear-gradient(135deg, #0ff, #f0f, #0ff) 1',
        boxShadow: '0 0 40px rgba(0, 255, 255, 0.4), 0 0 60px rgba(255, 0, 255, 0.3), inset 0 0 40px rgba(0, 255, 255, 0.1)',
        position: 'relative',
        animation: 'modalNeon 0.5s ease-out'
      }}>
        {/* Pulsing corners */}
        {['tl', 'tr', 'bl', 'br'].map(corner => (
          <div
            key={corner}
            style={{
              position: 'absolute',
              width: '30px',
              height: '30px',
              border: '3px solid #0ff',
              animation: 'cornerPulse 2s ease-in-out infinite',
              ...(corner === 'tl' && { top: '-2px', left: '-2px', borderRight: 'none', borderBottom: 'none' }),
              ...(corner === 'tr' && { top: '-2px', right: '-2px', borderLeft: 'none', borderBottom: 'none' }),
              ...(corner === 'bl' && { bottom: '-2px', left: '-2px', borderRight: 'none', borderTop: 'none' }),
              ...(corner === 'br' && { bottom: '-2px', right: '-2px', borderLeft: 'none', borderTop: 'none' })
            }}
          />
        ))}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{
            fontSize: '48px',
            display: 'inline-block',
            animation: 'neonFlicker 3s ease-in-out infinite',
            filter: 'drop-shadow(0 0 20px #0ff) drop-shadow(0 0 40px #f0f)'
          }}>
            ⚡
          </div>
          <h1 style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: '22px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '3px',
            marginTop: '8px',
            background: 'linear-gradient(90deg, #0ff, #f0f, #0ff)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'neonShift 3s linear infinite'
          }}>
            Neon Processing
          </h1>
          <div style={{
            fontSize: '11px',
            color: '#0ff',
            fontWeight: 700,
            letterSpacing: '2px',
            marginTop: '4px'
          }}>
            {stage === 'signing' && 'AWAITING SIGNATURE'}
            {stage === 'approving' && 'APPROVING TOKENS'}
            {stage === 'mining' && 'MINING TRANSACTION'}
            {stage === 'confirming' && 'CONFIRMING ON CHAIN'}
            {stage === 'complete' && 'COMPLETE!'}
          </div>
        </div>

        {/* Info cards */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Tickets', value: ticketCount.toLocaleString() },
            { label: 'Value', value: `$${totalCost}` },
            { label: 'Network', value: 'BASE' }
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                flex: 1,
                background: 'rgba(0, 255, 255, 0.05)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '10px',
                padding: '10px',
                textAlign: 'center',
                boxShadow: 'inset 0 0 20px rgba(0, 255, 255, 0.1)'
              }}
            >
              <div style={{
                fontSize: '9px',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '4px'
              }}>
                {label}
              </div>
              <div style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: '20px',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #0ff, #f0f)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Progress ring */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          position: 'relative',
          height: '120px'
        }}>
          <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#0ff', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#f0f', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#0ff', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="rgba(0, 255, 255, 0.1)"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="url(#neonGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                transition: 'stroke-dashoffset 0.3s ease',
                filter: 'drop-shadow(0 0 8px #0ff)',
                animation: 'ringGlow 2s ease-in-out infinite'
              }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            textAlign: 'center'
          }}>
            <div style={{
              fontFamily: 'Orbitron, monospace',
              fontSize: '32px',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #0ff, #f0f)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {progress}%
            </div>
            <div style={{
              fontSize: '10px',
              color: 'rgba(255, 255, 255, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Complete
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {[
            { emoji: '✓', text: 'Sign', completed: ['approving', 'mining', 'confirming', 'complete'].includes(stage) },
            { emoji: '◉', text: 'Mine', completed: ['confirming', 'complete'].includes(stage), active: ['mining', 'confirming'].includes(stage) },
            { emoji: '○', text: 'Done', completed: stage === 'complete', active: false }
          ].map(({ emoji, text, completed, active }) => (
            <div
              key={text}
              style={{
                flex: 1,
                background: completed ? 'rgba(0, 255, 136, 0.15)' : active ? 'rgba(0, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.5)',
                border: completed ? '1px solid #0f8' : active ? '1px solid #0ff' : '1px solid rgba(0, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '8px 6px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                ...(active && { animation: 'statusPulse 1.5s ease-in-out infinite' })
              }}
            >
              <div style={{ fontSize: '18px', marginBottom: '2px' }}>{emoji}</div>
              <div style={{
                fontSize: '9px',
                color: active ? '#0ff' : 'rgba(255, 255, 255, 0.6)',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}>
                {text}
              </div>
            </div>
          ))}
        </div>

        {/* Time panel */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.15), rgba(255, 0, 255, 0.15))',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderImage: 'linear-gradient(135deg, #0ff, #f0f) 1',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-around'
        }}>
          {[
            { label: 'Elapsed', value: formatTime(elapsed) },
            { label: 'Remaining', value: formatTime(remaining) }
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '9px',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '4px',
                textTransform: 'uppercase'
              }}>
                {label}
              </div>
              <div style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: '24px',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #0ff, #f0f)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'timeFlicker 2s ease-in-out infinite'
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Transaction hash display */}
        {txHash && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '8px',
            padding: '8px',
            marginBottom: '16px',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#0ff',
            wordBreak: 'break-all',
            textAlign: 'center'
          }}>
            TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
          </div>
        )}

        {/* Close button (only when complete) */}
        {stage === 'complete' && onClose && (
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.2))',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderImage: 'linear-gradient(135deg, #0ff, #f0f, #0ff) 1',
              borderRadius: '10px',
              color: '#fff',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 900,
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.4), 0 0 30px rgba(255, 0, 255, 0.3)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            🎉 SUCCESS! CLOSE
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes gridMove {
          0% { transform: perspective(500px) rotateX(60deg) translateZ(0); }
          100% { transform: perspective(500px) rotateX(60deg) translateZ(200px); }
        }

        @keyframes particleFloat {
          0%, 100% { transform: translateY(100vh) translateX(0); opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { transform: translateY(-20vh) translateX(50px); }
        }

        @keyframes modalNeon {
          0% { opacity: 0; transform: scale(0.9); filter: blur(10px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }

        @keyframes cornerPulse {
          0%, 100% { box-shadow: 0 0 5px #0ff, inset 0 0 5px #0ff; }
          50% { box-shadow: 0 0 20px #0ff, 0 0 30px #f0f, inset 0 0 10px #0ff; }
        }

        @keyframes neonFlicker {
          0%, 100% { opacity: 1; }
          10%, 30%, 50%, 70%, 90% { opacity: 0.95; }
          20%, 40%, 60%, 80% { opacity: 0.85; }
        }

        @keyframes neonShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        @keyframes ringGlow {
          0%, 100% { filter: drop-shadow(0 0 8px #0ff); }
          50% { filter: drop-shadow(0 0 15px #0ff) drop-shadow(0 0 20px #f0f); }
        }

        @keyframes statusPulse {
          0%, 100% { box-shadow: 0 0 10px rgba(0, 255, 255, 0.5); }
          50% { box-shadow: 0 0 20px rgba(0, 255, 255, 1), 0 0 30px rgba(255, 0, 255, 0.5); }
        }

        @keyframes timeFlicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
