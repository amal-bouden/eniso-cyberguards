'use client';

import MatrixBackground from './MatrixBackground';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MatrixBackground />
      {/* All page content sits above z-index layers */}
      <div className="relative" style={{ zIndex: 2 }}>
        {children}
      </div>
    </>
  );
}
