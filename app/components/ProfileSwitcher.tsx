'use client';

import { useEffect, useState } from 'react';
import { getProfiles, getActiveProfileId, setActiveProfileId } from '../lib/storage';
import { UserProfile } from '../lib/types';
import { ChevronDown, UserCircle } from 'lucide-react';

export default function ProfileSwitcher({ onChange }: { onChange?: () => void }) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setProfiles(getProfiles());
    setActiveId(getActiveProfileId());
  }, []);

  const active = profiles.find(p => p.id === activeId);

  const handleSelect = (id: string) => {
    setActiveProfileId(id);
    setActiveId(id);
    setOpen(false);
    onChange?.();
    window.location.reload();
  };

  if (profiles.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors w-full"
      >
        {active?.avatar?.startsWith('data:') ? (
          <img src={active.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <span className="text-lg">{active?.avatar || '👤'}</span>
        )}
        <span className="text-sm truncate flex-1 text-right">{active?.name || 'בחר פרופיל'}</span>
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 w-full bg-white rounded-lg shadow-lg z-20 overflow-hidden">
            {profiles.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className={`flex items-center gap-2 w-full px-3 py-2 text-right text-sm hover:bg-blue-50 transition-colors ${
                  p.id === activeId ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-gray-700'
                }`}
              >
                {p.avatar?.startsWith('data:') ? (
                  <img src={p.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <span>{p.avatar}</span>
                )}
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
