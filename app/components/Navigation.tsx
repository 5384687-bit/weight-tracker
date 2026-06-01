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
} from 'lucide-react';
import ProfileSwitcher from './ProfileSwitcher';

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
  { href: '/exercises-library', label: 'ספריית תרגילים', icon: BookOpen },
  { href: '/profiles', label: 'פרופילים', icon: Users },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 right-4 z-50 bg-blue-600 text-white p-2 rounded-lg shadow-lg"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <nav
        className={`fixed top-0 right-0 h-full bg-gradient-to-b from-blue-900 to-blue-800 text-white w-64 p-6 z-40 transition-transform duration-300 overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        } md:translate-x-0`}
      >
        <div className="mb-4 text-center">
          <Scale className="mx-auto mb-2" size={36} />
          <h1 className="text-lg font-bold">מעקב משקל</h1>
        </div>

        <div className="mb-4">
          <ProfileSwitcher />
        </div>

        <ul className="space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                    isActive
                      ? 'bg-white/20 text-white font-semibold'
                      : 'text-blue-100 hover:bg-white/10'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
