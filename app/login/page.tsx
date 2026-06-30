'use client';

import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { pushToCloud, pullFromCloud } from '../lib/sync';
import { LogIn, UserPlus, Scale, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isRegister) {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error);
        setLoading(false);
        return;
      }
      setSyncMessage('מעלה נתונים...');
      await pushToCloud();
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
        setLoading(false);
        return;
      }
      setSyncMessage('מעלה נתונים מקומיים...');
      await pushToCloud();
      setSyncMessage('מוריד נתונים מהענן...');
      await pullFromCloud();
    }

    setLoading(false);
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl"
      style={{ background: 'var(--bg-primary)' }}>

      <div className="card-static w-full max-w-sm p-7 enter">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
            style={{ background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.15)' }}>
            <Scale size={24} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-xl font-semibold text-gradient">מעקב משקל</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>התחבר לסנכרון בין מכשירים</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>אימייל</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com" required className="px-3.5 py-2.5 w-full text-sm" dir="ltr" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>סיסמה</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="לפחות 6 תווים" required minLength={6} className="px-3.5 py-2.5 w-full text-sm" dir="ltr" />
          </div>

          {error && (
            <div className="rounded-lg p-2.5 text-xs" style={{ background: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.15)', color: '#f87171' }}>
              {error}
            </div>
          )}

          {syncMessage && (
            <div className="rounded-lg p-2.5 text-xs flex items-center gap-2" style={{ background: 'rgba(167, 139, 250, 0.08)', border: '1px solid rgba(167, 139, 250, 0.15)', color: 'var(--accent)' }}>
              <Loader2 className="animate-spin" size={14} />
              {syncMessage}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 btn-primary disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={18} /> :
              isRegister ? <><UserPlus size={18} /> הרשמה</> : <><LogIn size={18} /> כניסה</>}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-xs font-medium" style={{ color: 'var(--accent-warm)' }}>
            {isRegister ? 'כבר יש לך חשבון? היכנס' : 'אין לך חשבון? הירשם'}
          </button>
        </div>
      </div>
    </div>
  );
}
