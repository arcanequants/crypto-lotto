'use client';

import { useState, useEffect } from 'react';

interface DrawCountdownProps {
  drawTime: bigint;
  executed: boolean;
  salesClosed: boolean;
}

export function DrawCountdown({ drawTime, executed, salesClosed }: DrawCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // If draw is already executed, no countdown needed
    if (executed) {
      setTimeRemaining('');
      return;
    }

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const drawTimeSeconds = Number(drawTime);

      // Draw time hasn't been set yet
      if (drawTimeSeconds === 0) {
        setTimeRemaining('Not scheduled');
        return;
      }

      const diff = drawTimeSeconds - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining('Draw in progress...');
        return;
      }

      // Calculate time components
      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      // Format countdown string
      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    // Initial update
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [drawTime, executed]);

  // If draw is executed, show nothing (winning number will be shown instead)
  if (executed) {
    return null;
  }

  // If draw time not set
  if (Number(drawTime) === 0) {
    return (
      <span style={{ opacity: 0.7, fontSize: '11px' }}>
        ⏳ Waiting for draw schedule...
      </span>
    );
  }

  // Show countdown or "in progress"
  return (
    <span style={{
      opacity: 0.9,
      fontSize: '11px',
      fontWeight: isExpired ? 600 : 400,
      color: isExpired ? '#ffd700' : 'inherit'
    }}>
      {isExpired ? '🎲 ' : '⏰ '}{timeRemaining}
    </span>
  );
}
