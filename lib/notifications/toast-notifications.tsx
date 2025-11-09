/**
 * Toast Notifications
 *
 * Styled toast notifications using react-hot-toast
 * Matches CryptoLotto design system
 */

import toast, { Toast } from 'react-hot-toast';

// Custom toast styles matching CryptoLotto theme
const toastStyles = {
  success: {
    style: {
      background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(0, 240, 255, 0.05))',
      border: '2px solid rgba(0, 240, 255, 0.4)',
      borderRadius: '12px',
      padding: '16px 20px',
      color: '#ffffff',
      fontFamily: "'Inter', sans-serif",
      boxShadow: '0 10px 30px rgba(0, 240, 255, 0.3)',
      backdropFilter: 'blur(10px)',
    },
    iconTheme: {
      primary: '#00f0ff',
      secondary: '#050811',
    },
  },
  error: {
    style: {
      background: 'linear-gradient(135deg, rgba(255, 100, 100, 0.15), rgba(255, 100, 100, 0.05))',
      border: '2px solid rgba(255, 100, 100, 0.4)',
      borderRadius: '12px',
      padding: '16px 20px',
      color: '#ffffff',
      fontFamily: "'Inter', sans-serif",
      boxShadow: '0 10px 30px rgba(255, 100, 100, 0.3)',
      backdropFilter: 'blur(10px)',
    },
    iconTheme: {
      primary: '#ff6464',
      secondary: '#050811',
    },
  },
  loading: {
    style: {
      background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05))',
      border: '2px solid rgba(255, 215, 0, 0.4)',
      borderRadius: '12px',
      padding: '16px 20px',
      color: '#ffffff',
      fontFamily: "'Inter', sans-serif",
      boxShadow: '0 10px 30px rgba(255, 215, 0, 0.3)',
      backdropFilter: 'blur(10px)',
    },
    iconTheme: {
      primary: '#ffd700',
      secondary: '#050811',
    },
  },
};

/**
 * Show deposit confirmed toast
 */
export function showDepositConfirmedToast(ticketCount: number, amount: string) {
  const message = ticketCount === 1
    ? `Deposit confirmed! +${amount} USDC ✅`
    : `${ticketCount} tickets purchased! +${amount} USDC ✅`;

  toast.success(message, toastStyles.success);
}

/**
 * Show draw result toast
 */
export function showDrawResultToast(drawId: number, won: boolean, prizeCount?: number) {
  if (won) {
    const message = prizeCount && prizeCount > 1
      ? `You won ${prizeCount} prizes in Draw #${drawId}! 🎊`
      : `You won a prize in Draw #${drawId}! 🎊`;

    toast.success(message, toastStyles.success);
  } else {
    toast(`Draw #${drawId} complete. Better luck next time! 🎲`, {
      icon: '🎲',
      style: toastStyles.loading.style,
    });
  }
}

/**
 * Show prize claimed toast
 */
export function showPrizeClaimedToast(amount: string) {
  toast.success(`Prize claimed! +${amount} 🎁`, toastStyles.success);
}

/**
 * Show transaction pending toast
 */
export function showTransactionPendingToast(message: string = 'Transaction pending...') {
  return toast.loading(message, toastStyles.loading);
}

/**
 * Show transaction success toast
 */
export function showTransactionSuccessToast(toastId: string, message: string = 'Transaction confirmed!') {
  toast.success(message, {
    id: toastId,
    ...toastStyles.success,
  });
}

/**
 * Show transaction error toast
 */
export function showTransactionErrorToast(toastId: string, message: string = 'Transaction failed') {
  toast.error(message, {
    id: toastId,
    ...toastStyles.error,
  });
}

/**
 * Show error toast
 */
export function showErrorToast(message: string) {
  toast.error(message, toastStyles.error);
}

/**
 * Show success toast
 */
export function showSuccessToast(message: string) {
  toast.success(message, toastStyles.success);
}

/**
 * Show info toast
 */
export function showInfoToast(message: string, icon?: string) {
  toast(message, {
    icon: icon || 'ℹ️',
    style: {
      background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.15), rgba(157, 78, 221, 0.05))',
      border: '2px solid rgba(157, 78, 221, 0.4)',
      borderRadius: '12px',
      padding: '16px 20px',
      color: '#ffffff',
      fontFamily: "'Inter', sans-serif",
      boxShadow: '0 10px 30px rgba(157, 78, 221, 0.3)',
      backdropFilter: 'blur(10px)',
    },
  });
}

/**
 * Dismiss a specific toast
 */
export function dismissToast(toastId: string) {
  toast.dismiss(toastId);
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts() {
  toast.dismiss();
}

/**
 * Custom toast with full control
 */
export function showCustomToast(
  message: string,
  options?: {
    icon?: string;
    duration?: number;
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    style?: React.CSSProperties;
  }
) {
  toast(message, {
    icon: options?.icon,
    duration: options?.duration,
    position: options?.position || 'bottom-right',
    style: options?.style || toastStyles.loading.style,
  });
}
