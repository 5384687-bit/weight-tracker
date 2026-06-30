'use client';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Soft ambient glow - top right */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        top: '-15%',
        right: '-10%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(120, 80, 200, 0.08) 0%, transparent 70%)',
        animation: 'ambient-drift 30s ease-in-out infinite',
      }} />

      {/* Soft ambient glow - bottom left */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        bottom: '-10%',
        left: '-8%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(180, 140, 60, 0.06) 0%, transparent 70%)',
        animation: 'ambient-drift 35s ease-in-out infinite reverse',
      }} />

      {/* Elegant spinning arc - top right */}
      <svg viewBox="0 0 200 200" style={{
        position: 'absolute',
        width: '420px',
        height: '420px',
        top: '-60px',
        right: '-60px',
        animation: 'spin-smooth 45s linear infinite',
        opacity: 0.5,
      }}>
        <defs>
          <linearGradient id="arc1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#d4a843" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="90" fill="none" stroke="url(#arc1)" strokeWidth="0.5"
          strokeDasharray="120 450" strokeLinecap="round" />
      </svg>

      {/* Second arc - opposite direction */}
      <svg viewBox="0 0 200 200" style={{
        position: 'absolute',
        width: '360px',
        height: '360px',
        top: '-30px',
        right: '-30px',
        animation: 'spin-smooth 55s linear infinite reverse',
        opacity: 0.35,
      }}>
        <defs>
          <linearGradient id="arc2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d4a843" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="85" fill="none" stroke="url(#arc2)" strokeWidth="0.5"
          strokeDasharray="80 450" strokeLinecap="round" />
      </svg>

      {/* Orbiting dot on top-right arc */}
      <div style={{
        position: 'absolute',
        width: '420px',
        height: '420px',
        top: '-60px',
        right: '-60px',
        animation: 'spin-smooth 45s linear infinite',
      }}>
        <div style={{
          position: 'absolute',
          width: '4px',
          height: '4px',
          background: '#d4a843',
          borderRadius: '50%',
          top: '12px',
          left: '50%',
          boxShadow: '0 0 12px 3px rgba(212, 168, 67, 0.4)',
        }} />
      </div>

      {/* Bottom left spinning arc */}
      <svg viewBox="0 0 200 200" style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        bottom: '-120px',
        left: '-120px',
        animation: 'spin-smooth 50s linear infinite',
        opacity: 0.4,
      }}>
        <defs>
          <linearGradient id="arc3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="92" fill="none" stroke="url(#arc3)" strokeWidth="0.5"
          strokeDasharray="100 470" strokeLinecap="round" />
      </svg>

      {/* Orbiting dot on bottom-left arc */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        bottom: '-120px',
        left: '-120px',
        animation: 'spin-smooth 50s linear infinite',
      }}>
        <div style={{
          position: 'absolute',
          width: '3px',
          height: '3px',
          background: '#2dd4bf',
          borderRadius: '50%',
          top: '6px',
          left: '50%',
          boxShadow: '0 0 10px 2px rgba(45, 212, 191, 0.35)',
        }} />
      </div>

      {/* Very subtle grain overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.015,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px',
      }} />
    </div>
  );
}
