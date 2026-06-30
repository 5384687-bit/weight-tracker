'use client';

import { useAuth } from '../lib/auth-context';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e1b4b, #0f172a, #0a0a1a)' }}>
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-purple-400 mb-3" size={48} />
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>טוען...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
