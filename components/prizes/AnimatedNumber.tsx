'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * AnimatedNumber Component
 *
 * Muestra un número con animación suave cuando cambia de valor
 * Ideal para prize pools que se actualizan en tiempo real
 *
 * Features:
 * - Transición suave con spring animation
 * - Formato con comas (1,234.56)
 * - Indicador de cambio (+/- percentage)
 * - Glow effect en números grandes
 *
 * @example
 * <AnimatedNumber value={284523.45} decimals={2} prefix="$" />
 */
export function AnimatedNumber({
  value,
  decimals = 2,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedNumberProps) {
  const [prevValue, setPrevValue] = useState(value);
  const spring = useSpring(value, { damping: 30, stiffness: 200 });
  const display = useTransform(spring, (current) =>
    current.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  );

  useEffect(() => {
    spring.set(value);
    setPrevValue(value);
  }, [value, spring]);

  const delta = value - prevValue;
  const deltaPercent = prevValue !== 0 ? (delta / prevValue) * 100 : 0;

  return (
    <div className={`relative ${className}`}>
      <motion.span
        className="font-mono text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
        initial={{ scale: 1 }}
        animate={{ scale: delta !== 0 ? [1, 1.05, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        {prefix}
        <motion.span>{display}</motion.span>
        {suffix}
      </motion.span>

      {delta !== 0 && Math.abs(deltaPercent) > 0.01 && (
        <motion.div
          className={`absolute -top-6 right-0 text-sm font-medium ${
            delta > 0 ? 'text-green-400' : 'text-red-400'
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {delta > 0 ? '↑' : '↓'} {Math.abs(deltaPercent).toFixed(2)}%
        </motion.div>
      )}
    </div>
  );
}
