'use client';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Large spinning gradient ring */}
      <div className="spin-360" style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        top: '-80px',
        right: '-80px',
        borderRadius: '50%',
        border: '2px solid transparent',
        borderTopColor: 'rgba(139, 92, 246, 0.4)',
        borderRightColor: 'rgba(212, 168, 67, 0.2)',
      }} />

      {/* Second ring - reverse direction */}
      <div className="spin-reverse" style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        top: '-30px',
        right: '-30px',
        borderRadius: '50%',
        border: '1px dashed rgba(212, 168, 67, 0.3)',
      }} />

      {/* Bottom left spinning ring */}
      <div className="spin-360-slow" style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        bottom: '-150px',
        left: '-150px',
        borderRadius: '50%',
        border: '2px solid transparent',
        borderBottomColor: 'rgba(45, 212, 191, 0.3)',
        borderLeftColor: 'rgba(139, 92, 246, 0.15)',
      }} />

      <div className="spin-reverse-slow" style={{
        position: 'absolute',
        width: '450px',
        height: '450px',
        bottom: '-75px',
        left: '-75px',
        borderRadius: '50%',
        border: '1px dashed rgba(45, 212, 191, 0.2)',
      }} />

      {/* Center decorative spinning element */}
      <div className="spin-360" style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        top: '50%',
        left: '50%',
        marginTop: '-150px',
        marginLeft: '-150px',
        borderRadius: '50%',
        border: '1px solid transparent',
        borderTopColor: 'rgba(212, 168, 67, 0.15)',
        borderBottomColor: 'rgba(139, 92, 246, 0.15)',
      }} />

      {/* Orbiting dots on the large ring */}
      <div className="spin-360" style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        top: '-80px',
        right: '-80px',
      }}>
        <div style={{
          position: 'absolute',
          width: '8px',
          height: '8px',
          background: 'radial-gradient(circle, #d4a843, transparent)',
          borderRadius: '50%',
          top: '0',
          left: '50%',
          marginLeft: '-4px',
          boxShadow: '0 0 15px rgba(212, 168, 67, 0.6)',
        }} />
        <div style={{
          position: 'absolute',
          width: '6px',
          height: '6px',
          background: 'radial-gradient(circle, #8b5cf6, transparent)',
          borderRadius: '50%',
          bottom: '0',
          left: '50%',
          marginLeft: '-3px',
          boxShadow: '0 0 12px rgba(139, 92, 246, 0.6)',
        }} />
      </div>

      {/* Orbiting dots on the bottom ring */}
      <div className="spin-360-slow" style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        bottom: '-150px',
        left: '-150px',
      }}>
        <div style={{
          position: 'absolute',
          width: '6px',
          height: '6px',
          background: 'radial-gradient(circle, #2dd4bf, transparent)',
          borderRadius: '50%',
          top: '0',
          left: '50%',
          marginLeft: '-3px',
          boxShadow: '0 0 12px rgba(45, 212, 191, 0.6)',
        }} />
        <div style={{
          position: 'absolute',
          width: '8px',
          height: '8px',
          background: 'radial-gradient(circle, #8b5cf6, transparent)',
          borderRadius: '50%',
          left: '0',
          top: '50%',
          marginTop: '-4px',
          boxShadow: '0 0 15px rgba(139, 92, 246, 0.5)',
        }} />
      </div>

      {/* Floating glowing orbs */}
      <div className="float-orb" style={{
        position: 'absolute',
        width: '200px',
        height: '200px',
        top: '20%',
        right: '15%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12), transparent 70%)',
        filter: 'blur(40px)',
      }} />
      <div className="float-orb-reverse" style={{
        position: 'absolute',
        width: '250px',
        height: '250px',
        bottom: '20%',
        left: '10%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212, 168, 67, 0.08), transparent 70%)',
        filter: 'blur(40px)',
      }} />

      {/* Small spinning diamond shapes */}
      <div className="spin-360" style={{
        position: 'absolute',
        width: '20px',
        height: '20px',
        top: '30%',
        right: '25%',
        background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.3), rgba(139, 92, 246, 0.3))',
        transform: 'rotate(45deg)',
        borderRadius: '3px',
        boxShadow: '0 0 20px rgba(212, 168, 67, 0.2)',
      }} />
      <div className="spin-reverse" style={{
        position: 'absolute',
        width: '14px',
        height: '14px',
        top: '60%',
        left: '30%',
        background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.25), rgba(139, 92, 246, 0.25))',
        transform: 'rotate(45deg)',
        borderRadius: '2px',
        boxShadow: '0 0 15px rgba(45, 212, 191, 0.2)',
      }} />
      <div className="spin-360-slow" style={{
        position: 'absolute',
        width: '16px',
        height: '16px',
        bottom: '35%',
        right: '35%',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(212, 168, 67, 0.15))',
        transform: 'rotate(45deg)',
        borderRadius: '2px',
        boxShadow: '0 0 18px rgba(139, 92, 246, 0.2)',
      }} />
    </div>
  );
}
