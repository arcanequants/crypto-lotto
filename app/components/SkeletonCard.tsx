export function SkeletonCard() {
  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '20px',
        padding: '20px',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    >
      <div
        style={{
          height: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          marginBottom: '15px',
          width: '60%',
        }}
      />
      <div
        style={{
          height: '40px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          marginBottom: '10px',
        }}
      />
      <div
        style={{
          height: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          width: '40%',
        }}
      />
    </div>
  );
}

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
