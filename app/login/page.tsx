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
      // After registration, push local data to cloud
      setSyncMessage('מעלה נתונים...');
      await pushToCloud();
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
        setLoading(false);
        return;
      }
      // First push any existing local data to cloud, then pull
      setSyncMessage('מעלה נתונים מקומיים...');
      await pushToCloud();
      setSyncMessage('מוריד נתונים מהענן...');
      await pullFromCloud();
    }

    setLoading(false);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Scale className="mx-auto text-green-600 mb-3" size={48} />
          <h1 className="text-3xl font-bold text-gray-800">מעקב משקל</h1>
          <p className="text-gray-500 mt-1">הדרך לגרסה הטובה שלך</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="border rounded-lg px-4 py-3 w-full text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="לפחות 6 תווים"
              required
              minLength={6}
              className="border rounded-lg px-4 py-3 w-full text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              dir="ltr"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {syncMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              {syncMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            {isRegister ? 'כבר יש לך חשבון? היכנס' : 'אין לך חשבון? הירשם'}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          הנתונים שלך מסונכרנים בענן ונגישים מכל מכשיר
        </p>
      </div>
    </div>
  );
}
