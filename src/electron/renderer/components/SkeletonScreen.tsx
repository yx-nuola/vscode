import React from 'react';

interface SkeletonCardProps {
  width?: string;
  height?: string;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ width = '100%', height = '200px' }) => (
  <div
    className="skeleton-card"
    style={{
      width,
      height,
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: '8px'
    }}
  />
);

export const SkeletonScreen: React.FC = () => (
  <div className="skeleton-screen">
    <style>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      .skeleton-screen {
        padding: 16px;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(2, 1fr);
        gap: 16px;
        height: 100%;
      }
    `}</style>
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
  </div>
);

export default SkeletonScreen;
