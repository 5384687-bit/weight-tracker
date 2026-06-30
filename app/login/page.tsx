'use client';

import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { pushToCloud, pullFromCloud } from '../lib/sync';
import { LogIn, UserPlus, Crown, Loader2, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-orbs" dir="rtl"
      style={{ background: 'linear-gradient(135deg, #1e1b4b, #0f172a, #0a0a1a)' }}>

      <div className="rotating-ring" style={{ width: '500px', height: '500px', top: '-50px', right: '-100px' }} />
      <div className="rotating-ring-reverse" style={{ width: '700px', height: '700px', bottom: '-150px', left: '-150px' }} />

      <div className="glass-card-static w-full max-w-md p-8 relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.2), rgba(139, 92, 246, 0.2))',
              border: '1px solid rgba(212, 168, 67, 0.3)',
            }}>
            <Crown size={32} className="text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold gold-text">מעקב משקל</h1>
          <p className="mt-1 flex items-center justify-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Sparkles size={14} className="text-purple-400" />
            <span>הדרך לגרסה הטובה שלך</span>
            <Sparkles size={14} className="text-purple-400" />
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>אימייל</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="rounded-xl px-4 py-3 w-full"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="לפחות 6 תווים"
              required
              minLength={6}
              className="rounded-xl px-4 py-3 w-full"
              dir="ltr"
            />
          </div>

          {error && (
            <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
              {error}
            </div>
          )}

          {syncMessage && (
            <div className="rounded-xl p-3 text-sm flex items-center gap-2" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>
              <Loader2 className="animate-spin" size={16} />
              {syncMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              color: 'white',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
            }}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : isRegister ? (
              <><UserPlus size={20} /> הרשמה</>
            ) : (
              <><LogIn size={20} /> כניסה</>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-sm font-medium transition-colors"
            style={{ color: '#d4a843' }}
          >
            {isRegister ? 'כבר יש לך חשבון? היכנס' : 'אין לך חשבון? הירשם'}
          </button>
        </div>

        <p className="text-xs text-center mt-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
          הנתונים שלך מסונכרנים בענן ונגישים מכל מכשיר
        </p>
      </div>
    </div>
  );
}
