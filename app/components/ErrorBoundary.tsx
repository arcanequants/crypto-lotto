'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: 'rgba(255, 0, 0, 0.1)',
          borderRadius: '20px',
          margin: '20px',
          border: '1px solid rgba(255, 107, 107, 0.3)'
        }}>
          <h2 style={{
            color: '#ff6b6b',
            marginBottom: '20px',
            fontFamily: 'Orbitron, sans-serif'
          }}>
            ⚠️ Something went wrong
          </h2>
          <p style={{
            opacity: 0.8,
            marginBottom: '20px',
            color: '#fff'
          }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #00f0ff 0%, #00a8cc 100%)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              cursor: 'pointer',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 600
            }}
          >
            🔄 Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
