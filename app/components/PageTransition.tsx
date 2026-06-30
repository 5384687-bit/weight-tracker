'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [phase, setPhase] = useState<'visible' | 'exit' | 'enter'>('visible');
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPath.current) {
      prevPath.current = pathname;
      setPhase('exit');
      const t1 = setTimeout(() => {
        setDisplayChildren(children);
        setPhase('enter');
        const t2 = setTimeout(() => setPhase('visible'), 50);
        return () => clearTimeout(t2);
      }, 350);
      return () => clearTimeout(t1);
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  const style: React.CSSProperties =
    phase === 'exit'
      ? { opacity: 0, transform: 'translateY(24px) scale(0.98)', filter: 'blur(4px)', transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }
      : phase === 'enter'
      ? { opacity: 0, transform: 'translateY(-16px) scale(0.98)', filter: 'blur(4px)', transition: 'none' }
      : { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0)', transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)' };

  return <div style={style}>{displayChildren}</div>;
}
