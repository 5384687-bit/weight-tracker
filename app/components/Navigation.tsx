'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Scale,
  UtensilsCrossed,
  Dumbbell,
  BarChart3,
  Home,
  BookOpen,
  Menu,
  X,
  Droplets,
  Users,
  CalendarDays,
  Ruler,
  Trophy,
  Heart,
  LogIn,
  LogOut,
} from 'lucide-react';
import ProfileSwitcher from './ProfileSwitcher';
import { useAuth } from '../lib/auth-context';

const navItems = [
  { href: '/', label: 'דשבורד', icon: Home },
  { href: '/daily', label: 'יומן יומי', icon: CalendarDays },
  { href: '/weight', label: 'משקל', icon: Scale },
  { href: '/food', label: 'תזונה', icon: UtensilsCrossed },
  { href: '/exercise', label: 'כושר', icon: Dumbbell },
  { href: '/water', label: 'מים', icon: Droplets },
  { href: '/measurements', label: 'היקפים', icon: Ruler },
  { href: '/stats', label: 'סטטיסטיקות', icon: BarChart3 },
  { href: '/competition', label: 'תחרות', icon: Trophy },
  { href: '/family', label: 'משפחה', icon: Heart },
  { href: '/exercises-library', label: 'ספריית תרגילים', icon: BookOpen },
  { href: '/profiles', label: 'פרופילים', icon: Users },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2.5 rounded-xl btn-primary"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <nav
        className={`fixed top-0 right-0 h-full nav-sidebar w-64 z-40 transition-transform duration-300 overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        } md:translate-x-0`}
      >
        <div className="p-5">
          <div className="mb-5 px-2">
            <div className="flex items-center gap-2.5 mb-0.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.15), rgba(201, 168, 76, 0.1))', border: '1px solid rgba(167, 139, 250, 0.15)' }}>
                <Scale size={16} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gradient">מעקב משקל</h1>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <ProfileSwitcher />
          </div>

          <div className="space-y-0.5">
            {navItems.map(item => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                >
                  <Icon size={16} style={isActive ? { color: 'var(--accent)' } : {}} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            {user ? (
              <>
                <p className="text-xs truncate mb-2 px-2" style={{ color: 'var(--text-tertiary)' }}>{user.email}</p>
                <button onClick={signOut} className="nav-item w-full hover:!text-red-400">
                  <LogOut size={16} />
                  <span>התנתק</span>
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="nav-item nav-item-active" style={{ borderColor: 'rgba(201, 168, 76, 0.15)', background: 'rgba(201, 168, 76, 0.06)' }}>
                <LogIn size={16} style={{ color: 'var(--accent-warm)' }} />
                <span style={{ color: 'var(--accent-warm)' }}>התחבר לסנכרון</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={() => setMobileOpen(false)}
          style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }} />
      )}
    </>
  );
}
