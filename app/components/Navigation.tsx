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
  Crown,
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
        className="md:hidden fixed top-4 right-4 z-50 p-2.5 rounded-xl shadow-lg transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
          boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
        }}
      >
        {mobileOpen ? <X size={22} className="text-white" /> : <Menu size={22} className="text-white" />}
      </button>

      <nav
        className={`fixed top-0 right-0 h-full nav-premium w-64 z-40 transition-transform duration-300 overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        } md:translate-x-0`}
      >
        <div className="p-6">
          <div className="mb-6 text-center relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 relative"
              style={{
                background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.2), rgba(139, 92, 246, 0.2))',
                border: '1px solid rgba(212, 168, 67, 0.3)',
              }}
            >
              <Crown size={28} className="text-yellow-400" />
              <div className="absolute inset-0 rounded-2xl" style={{
                border: '1px solid transparent',
                borderImage: 'linear-gradient(135deg, rgba(212, 168, 67, 0.5), rgba(139, 92, 246, 0.5)) 1',
              }} />
            </div>
            <h1 className="text-lg font-bold gold-text">מעקב משקל</h1>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Premium Edition</p>
          </div>

          <div className="mb-5">
            <ProfileSwitcher />
          </div>

          <ul className="space-y-1">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href} className="animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm relative group"
                    style={isActive ? {
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(212, 168, 67, 0.1))',
                      border: '1px solid rgba(139, 92, 246, 0.25)',
                      color: '#e8e6f0',
                      fontWeight: 600,
                    } : {
                      color: 'rgba(255, 255, 255, 0.5)',
                      border: '1px solid transparent',
                    }}
                  >
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full"
                        style={{ background: 'linear-gradient(180deg, #d4a843, #8b5cf6)' }} />
                    )}
                    <Icon size={17} style={isActive ? { color: '#d4a843' } : {}} className="group-hover:text-purple-400 transition-colors" />
                    <span className="group-hover:text-white transition-colors">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {user ? (
              <div>
                <p className="text-xs truncate mb-2 px-3" style={{ color: 'rgba(255,255,255,0.3)' }}>{user.email}</p>
                <button
                  onClick={signOut}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm w-full group"
                  style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid transparent' }}
                >
                  <LogOut size={17} className="group-hover:text-red-400 transition-colors" />
                  <span className="group-hover:text-white transition-colors">התנתק</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm group"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(212, 168, 67, 0.1))',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  color: '#d4a843',
                }}
              >
                <LogIn size={17} />
                <span>התחבר לסנכרון</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
