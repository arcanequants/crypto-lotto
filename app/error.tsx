'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'var(--darker)'
    }}>
      <div className="grid-bg"></div>

      <div style={{
        position: 'relative',
        zIndex: 1,
        background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.9), rgba(5, 8, 17, 0.95))',
        border: '2px solid rgba(255, 50, 50, 0.3)',
        borderRadius: '30px',
        padding: '60px 40px',
        maxWidth: '600px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(255, 50, 50, 0.2)'
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>⚠️</div>

        <h2 style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '32px',
          color: '#ff5252',
          marginBottom: '15px',
          letterSpacing: '2px'
        }}>
          OOPS! SOMETHING WENT WRONG
        </h2>

        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '16px',
          color: 'var(--light)',
          opacity: 0.8,
          marginBottom: '30px',
          lineHeight: '1.6'
        }}>
          We encountered an unexpected error. Don't worry, your data is safe.
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div style={{
            background: 'rgba(255, 50, 50, 0.1)',
            border: '1px solid rgba(255, 50, 50, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px',
            textAlign: 'left'
          }}>
            <div style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '12px',
              color: '#ff5252',
              marginBottom: '10px',
              letterSpacing: '1px'
            }}>
              ERROR DETAILS:
            </div>
            <code style={{
              fontFamily: 'monospace',
              fontSize: '14px',
              color: 'var(--light)',
              display: 'block',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {error.message}
            </code>
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{
              padding: '15px 30px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: "'Orbitron', sans-serif",
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 240, 255, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            🔄 TRY AGAIN
          </button>

          <Link href="/">
            <button
              style={{
                padding: '15px 30px',
                background: 'rgba(0, 240, 255, 0.1)',
                border: '2px solid rgba(0, 240, 255, 0.3)',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 700,
                fontFamily: "'Orbitron', sans-serif",
                color: 'var(--primary)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.2)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
              }}
            >
              🏠 GO HOME
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
