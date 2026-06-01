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

  // Auto-sync every 30 seconds when user is active
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(handleSync, 30000);
    return () => clearInterval(interval);
  }, [user, handleSync]);

  // Sync on page visibility change (when user comes back to tab)
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
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs shadow-lg transition-all ${
          syncing
            ? 'bg-blue-100 text-blue-700'
            : lastSync
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
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
        className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs bg-red-50 text-red-600 hover:bg-red-100 shadow-lg transition-all"
        title="התנתק"
      >
        <LogOut size={12} />
      </button>
    </div>
  );
}
