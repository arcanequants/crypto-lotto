// Skeleton loading components for smooth UX
import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', width, height, style }) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.5s infinite',
        borderRadius: '8px',
        ...style,
      }}
    />
  );
};

// Skeleton for ticket cards
export const TicketCardSkeleton: React.FC = () => {
  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '30px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '20px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Skeleton width="120px" height="24px" />
        <Skeleton width="80px" height="28px" />
      </div>

      {/* Numbers */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={`main-${i}`} width="50px" height="50px" />
        ))}
        <div style={{ width: '20px' }} />
        <Skeleton width="50px" height="50px" />
      </div>

      {/* Prize info */}
      <Skeleton width="60%" height="20px" style={{ marginBottom: '10px' }} />
      <Skeleton width="40%" height="20px" />
    </div>
  );
};

// Skeleton for prize cards
export const PrizeCardSkeleton: React.FC = () => {
  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '30px',
        border: '1px solid rgba(255, 215, 0, 0.2)',
      }}
    >
      {/* Tier */}
      <Skeleton width="100px" height="20px" style={{ marginBottom: '15px' }} />

      {/* Amount */}
      <Skeleton width="150px" height="40px" style={{ marginBottom: '20px' }} />

      {/* Details */}
      <Skeleton width="80%" height="18px" style={{ marginBottom: '10px' }} />
      <Skeleton width="60%" height="18px" style={{ marginBottom: '20px' }} />

      {/* Button */}
      <Skeleton width="100%" height="50px" />
    </div>
  );
};

// Skeleton for winning numbers display
export const WinningNumbersSkeleton: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      {/* Title */}
      <Skeleton width="200px" height="30px" style={{ margin: '0 auto 30px' }} />

      {/* Numbers */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '30px' }}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={`win-main-${i}`} width="70px" height="70px" />
        ))}
        <div style={{ width: '30px' }} />
        <Skeleton width="70px" height="70px" />
      </div>

      {/* Details */}
      <Skeleton width="250px" height="20px" style={{ margin: '0 auto 10px' }} />
      <Skeleton width="200px" height="20px" style={{ margin: '0 auto' }} />
    </div>
  );
};
