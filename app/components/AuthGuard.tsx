'use client';

import { useAuth } from '../lib/auth-context';
import { usePathname } from 'next/navigation';
import LoginPage from '../login/page';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-green-600 mb-3" size={48} />
          <p className="text-gray-500">טוען...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show login page (except for login route itself)
  if (!user && pathname !== '/login') {
    return <LoginPage />;
  }

  return <>{children}</>;
}
