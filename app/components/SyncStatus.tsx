'use client';

import { useState, useEffect, useCallback } from 'react';
import { Cloud, CloudOff, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { pushToCloud, pullFromCloud } from '../lib/sync';

export default function SyncStatus() {
  const { user, signOut } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const handleSync = useCallback(async () => {
    if (!user || syncing) return;
    setSyncing(true);
    try {
      await pullFromCloud();
      await pushToCloud();
      setLastSync(new Date().toLocaleTimeString('he-IL'));
    } catch (err) {
      console.error('Sync error:', err);
    }
    setSyncing(false);
  }, [user, syncing]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(handleSync, 30000);
    return () => clearInterval(interval);
  }, [user, handleSync]);

  useEffect(() => {
    if (!user) return;
    const handler = () => {
      if (document.visibilityState === 'visible') handleSync();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [user, handleSync]);

  if (!user) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs shadow-lg transition-all duration-300"
        style={syncing ? {
          background: 'rgba(139, 92, 246, 0.15)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          color: '#a78bfa',
          backdropFilter: 'blur(10px)',
        } : lastSync ? {
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          color: '#34d399',
          backdropFilter: 'blur(10px)',
        } : {
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)',
        }}
        title={lastSync ? `סנכרון אחרון: ${lastSync}` : 'סנכרן לענן'}
      >
        {syncing ? (
          <RefreshCw size={12} className="animate-spin" />
        ) : lastSync ? (
          <Cloud size={12} />
        ) : (
          <CloudOff size={12} />
        )}
        {syncing ? 'מסנכרן...' : lastSync ? `מסונכרן ${lastSync}` : 'סנכרן'}
      </button>
      <button
        onClick={signOut}
        className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs shadow-lg transition-all duration-300"
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#f87171',
          backdropFilter: 'blur(10px)',
        }}
        title="התנתק"
      >
        <LogOut size={12} />
      </button>
    </div>
  );
}
