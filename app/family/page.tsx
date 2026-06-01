'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Copy, Check, LogOut, RefreshCw, Crown, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import {
  getMyFamily,
  getFamilyMembers,
  createFamily,
  joinFamily,
  leaveFamily,
  regenerateInviteCode,
  getFamilyWeightData,
  getFamilyMemberProfiles,
  Family,
  FamilyMember,
} from '../lib/family';

interface MemberWithData extends FamilyMember {
  profiles?: { id: string; name: string; targetWeight: number; startWeight: number }[];
  latestWeight?: number;
  weightTrend?: 'up' | 'down' | 'same';
}

export default function FamilyPage() {
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<MemberWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [familyName, setFamilyName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadFamily = useCallback(async () => {
    setLoading(true);
    const fam = await getMyFamily();
    setFamily(fam);

    if (fam) {
      const mems = await getFamilyMembers(fam.id);
      // Load data for each member
      const memsWithData: MemberWithData[] = await Promise.all(
        mems.map(async (m) => {
          const profiles = await getFamilyMemberProfiles(m.userId);
          const weightData = await getFamilyWeightData(m.userId);
          const latestWeight = weightData.length > 0 ? weightData[0].weight : undefined;
          let weightTrend: 'up' | 'down' | 'same' | undefined;
          if (weightData.length >= 2) {
            const diff = weightData[0].weight - weightData[1].weight;
            weightTrend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'same';
          }
          return { ...m, profiles, latestWeight, weightTrend };
        })
      );
      setMembers(memsWithData);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadFamily();
  }, [loadFamily]);

  const handleCreate = async () => {
    if (!familyName.trim() || !displayName.trim()) {
      setError('יש למלא שם משפחה ושם תצוגה');
      return;
    }
    setActionLoading(true);
    setError('');
    const { error: err } = await createFamily(familyName.trim(), displayName.trim());
    if (err) {
      setError(err);
    } else {
      setSuccess('המשפחה נוצרה בהצלחה!');
      await loadFamily();
    }
    setActionLoading(false);
  };

  const handleJoin = async () => {
    if (!inviteCode.trim() || !displayName.trim()) {
      setError('יש למלא קוד הזמנה ושם תצוגה');
      return;
    }
    setActionLoading(true);
    setError('');
    const { error: err } = await joinFamily(inviteCode.trim(), displayName.trim());
    if (err) {
      setError(err);
    } else {
      setSuccess('הצטרפת למשפחה בהצלחה!');
      await loadFamily();
    }
    setActionLoading(false);
  };

  const handleLeave = async () => {
    if (!confirm(family?.ownerId === user?.id
      ? 'בתור מנהל/ת, עזיבה תמחק את המשפחה לכולם. להמשיך?'
      : 'לעזוב את המשפחה?'
    )) return;
    setActionLoading(true);
    const { error: err } = await leaveFamily();
    if (err) {
      setError(err);
    } else {
      setFamily(null);
      setMembers([]);
      setSuccess('עזבת את המשפחה');
    }
    setActionLoading(false);
  };

  const handleRegenCode = async () => {
    setActionLoading(true);
    const { code, error: err } = await regenerateInviteCode();
    if (err) {
      setError(err);
    } else if (code && family) {
      setFamily({ ...family, inviteCode: code });
      setSuccess('קוד ההזמנה חודש');
    }
    setActionLoading(false);
  };

  const copyCode = async () => {
    if (family?.inviteCode) {
      await navigator.clipboard.writeText(family.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Not in a family - show create/join
  if (!family) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <Users className="mx-auto mb-3 text-blue-600" size={48} />
          <h1 className="text-2xl font-bold text-gray-800">שיתוף משפחתי</h1>
          <p className="text-gray-500 mt-2">צרו משפחה או הצטרפו למשפחה קיימת כדי לעקוב יחד</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>
        )}

        {/* Tab buttons */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => { setTab('create'); setError(''); }}
            className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors ${
              tab === 'create' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            יצירת משפחה
          </button>
          <button
            onClick={() => { setTab('join'); setError(''); }}
            className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors ${
              tab === 'join' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            הצטרפות למשפחה
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">השם שלך (שם תצוגה)</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="למשל: אמא, אבא, דני..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {tab === 'create' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם המשפחה</label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="למשל: משפחת כהן"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={actionLoading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <Users size={18} />
                    צור משפחה
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">קוד הזמנה</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="הכנס את הקוד שקיבלת"
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono tracking-widest text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  dir="ltr"
                />
              </div>
              <button
                onClick={handleJoin}
                disabled={actionLoading}
                className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <UserPlus size={18} />
                    הצטרף למשפחה
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // In a family - show dashboard
  const isOwner = family.ownerId === user?.id;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Family header */}
      <div className="bg-gradient-to-l from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{family.name}</h1>
            <p className="text-blue-100 text-sm mt-1">{members.length} חברים</p>
          </div>
          <Users size={40} className="text-blue-200" />
        </div>

        {/* Invite code section */}
        <div className="mt-4 bg-white/10 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-100">קוד הזמנה:</span>
            <div className="flex items-center gap-2">
              <code className="bg-white/20 px-3 py-1 rounded font-mono text-lg tracking-widest" dir="ltr">
                {family.inviteCode}
              </code>
              <button
                onClick={copyCode}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
                title="העתק קוד"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
              {isOwner && (
                <button
                  onClick={handleRegenCode}
                  className="p-1.5 hover:bg-white/20 rounded transition-colors"
                  title="חדש קוד"
                  disabled={actionLoading}
                >
                  <RefreshCw size={18} className={actionLoading ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-blue-200 mt-1">שתפו את הקוד עם בני המשפחה כדי שיוכלו להצטרף</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>
      )}

      {/* Family members */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-gray-800">חברי המשפחה</h2>
        {members.map((member) => (
          <div
            key={member.id}
            className={`bg-white rounded-xl shadow-sm border p-4 ${
              member.userId === user?.id ? 'ring-2 ring-blue-200' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {member.displayName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{member.displayName}</span>
                    {member.role === 'owner' && (
                      <Crown size={14} className="text-yellow-500" />
                    )}
                    {member.userId === user?.id && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">אני</span>
                    )}
                  </div>
                  {member.profiles && member.profiles.length > 0 && (
                    <p className="text-xs text-gray-400">
                      {member.profiles.map(p => p.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Weight info */}
              {member.latestWeight && (
                <div className="text-left flex items-center gap-2">
                  <div>
                    <div className="text-lg font-bold text-gray-800">
                      {member.latestWeight.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-400">ק&quot;ג</div>
                  </div>
                  {member.weightTrend === 'down' && <TrendingDown size={20} className="text-green-500" />}
                  {member.weightTrend === 'up' && <TrendingUp size={20} className="text-red-500" />}
                  {member.weightTrend === 'same' && <Minus size={20} className="text-gray-400" />}
                </div>
              )}
            </div>

            {/* Progress bars for profiles */}
            {member.profiles && member.profiles.map(profile => {
              const progress = profile.startWeight > profile.targetWeight
                ? Math.min(100, Math.max(0,
                    ((profile.startWeight - (member.latestWeight || profile.startWeight)) /
                    (profile.startWeight - profile.targetWeight)) * 100
                  ))
                : 0;
              return (
                <div key={profile.id} className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>יעד: {profile.targetWeight} ק&quot;ג</span>
                    <span>{progress.toFixed(0)}% התקדמות</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-green-400 to-green-600 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Leave button */}
      <button
        onClick={handleLeave}
        disabled={actionLoading}
        className="w-full py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut size={16} />
        {isOwner ? 'מחק משפחה' : 'עזוב משפחה'}
      </button>
    </div>
  );
}
