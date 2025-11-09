'use client';

interface CryptoRowProps {
  symbol: string;
  name: string;
  amount: number;
  usdValue: number;
  percentage: number;
  icon: string;
  color: string;
}

/**
 * CryptoRow Component
 *
 * Muestra un asset crypto individual del prize pool
 * Diseño cyberpunk que coincide con el resto de la página
 */
export function CryptoRow({
  symbol,
  name,
  amount,
  usdValue,
  percentage,
  icon,
  color,
}: CryptoRowProps) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}10, rgba(0, 0, 0, 0.3))`,
      border: `2px solid ${color}50`,
      borderRadius: '20px',
      padding: '20px',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = 'translateX(5px)';
        e.currentTarget.style.boxShadow = `0 10px 30px ${color}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${color}50`;
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Icon & Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '36px' }}>{icon}</span>
          <div>
            <div style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '20px',
              fontWeight: 700,
              color: color,
              letterSpacing: '1px'
            }}>
              {symbol}
            </div>
            <div style={{
              fontSize: '12px',
              opacity: 0.6,
              fontFamily: "'Inter', sans-serif"
            }}>
              {name}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '18px',
            fontWeight: 700,
            color: '#ffffff'
          }}>
            {amount.toFixed(4)} {symbol}
          </div>
          <div style={{
            fontSize: '16px',
            color: '#ffd700',
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 600
          }}>
            ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Percentage Bar */}
      <div style={{
        position: 'relative',
        height: '8px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '10px',
        overflow: 'hidden',
        marginBottom: '8px'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: `${percentage}%`,
          background: `linear-gradient(90deg, ${color}, ${color}80)`,
          borderRadius: '10px',
          transition: 'width 1s ease-out',
          boxShadow: `0 0 10px ${color}`
        }} />
      </div>

      <div style={{
        textAlign: 'right',
        fontSize: '12px',
        opacity: 0.6,
        fontFamily: "'Orbitron', sans-serif"
      }}>
        {percentage}% of prize pool
      </div>
    </div>
  );
}
