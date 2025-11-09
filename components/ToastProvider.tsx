'use client';

import { Toaster } from 'react-hot-toast';

/**
 * Toast Provider Component
 *
 * Wraps the app with react-hot-toast Toaster
 * Configured with CryptoLotto theme
 */
export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(0, 240, 255, 0.05))',
          border: '2px solid rgba(0, 240, 255, 0.4)',
          borderRadius: '12px',
          padding: '16px 20px',
          color: '#ffffff',
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: '0 10px 30px rgba(0, 240, 255, 0.3)',
          backdropFilter: 'blur(10px)',
        },
        // Success toast options
        success: {
          duration: 5000,
          iconTheme: {
            primary: '#00f0ff',
            secondary: '#050811',
          },
        },
        // Error toast options
        error: {
          duration: 6000,
          iconTheme: {
            primary: '#ff6464',
            secondary: '#050811',
          },
          style: {
            background: 'linear-gradient(135deg, rgba(255, 100, 100, 0.15), rgba(255, 100, 100, 0.05))',
            border: '2px solid rgba(255, 100, 100, 0.4)',
            boxShadow: '0 10px 30px rgba(255, 100, 100, 0.3)',
          },
        },
        // Loading toast options
        loading: {
          iconTheme: {
            primary: '#ffd700',
            secondary: '#050811',
          },
          style: {
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05))',
            border: '2px solid rgba(255, 215, 0, 0.4)',
            boxShadow: '0 10px 30px rgba(255, 215, 0, 0.3)',
          },
        },
      }}
    />
  );
}
