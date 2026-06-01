'use client';

import { useEffect, useState, useRef } from 'react';
import { Users, Plus, Trash2, Edit2, Save, X, UserCircle, Camera, Image as ImageIcon } from 'lucide-react';
import { getProfiles, saveProfile, deleteProfile, getActiveProfileId, setActiveProfileId, generateId } from '../lib/storage';
import { UserProfile, ActivityLevel } from '../lib/types';
import { activityLabels } from '../lib/tdee';
import { toHebrewDate } from '../lib/hebrew-date';

const avatars = ['👨', '👩', '🧑', '👦', '👧', '🧔', '👱‍♀️', '👱', '🧑‍🦱', '👩‍🦰', '🏃', '🏋️', '🧘', '💪'];

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [height, setHeight] = useState('');
  const [startWeight, setStartWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetDate, setTargetDate] = useState('');
  const [avatar, setAvatar] = useState('👨');
  const [avatarMode, setAvatarMode] = useState<'emoji' | 'photo'>('emoji');
  const [photoUrl, setPhotoUrl] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfiles(getProfiles());
    setActiveId(getActiveProfileId());
  }, []);

  const resetForm = () => {
    setName(''); setGender('male'); setHeight(''); setStartWeight('');
    setTargetWeight(''); setStartDate(new Date().toISOString().split('T')[0]);
    setTargetDate(''); setAvatar('👨'); setAvatarMode('emoji'); setPhotoUrl('');
    setBirthDate(''); setActivityLevel('moderate');
  };

  const loadProfile = (p: UserProfile) => {
    setName(p.name); setGender(p.gender); setHeight(String(p.height || ''));
    setStartWeight(String(p.startWeight || '')); setTargetWeight(String(p.targetWeight || ''));
    setStartDate(p.startDate || new Date().toISOString().split('T')[0]);
    setTargetDate(p.targetDate || '');
    setBirthDate(p.birthDate || '');
    setActivityLevel(p.activityLevel || 'moderate');
    if (p.avatar.startsWith('data:') || p.avatar.startsWith('blob:')) {
      setAvatarMode('photo');
      setPhotoUrl(p.avatar);
      setAvatar('👨');
    } else {
      setAvatarMode('emoji');
      setAvatar(p.avatar);
      setPhotoUrl('');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 150;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        setPhotoUrl(canvas.toDataURL('image/jpeg', 0.7));
        setAvatarMode('photo');
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const getAvatarValue = () => avatarMode === 'photo' && photoUrl ? photoUrl : avatar;

  const handleSave = (id?: string) => {
    if (!name) return;
    const profile: UserProfile = {
      id: id || generateId(),
      name, gender,
      height: height ? parseFloat(height) : 0,
      startWeight: startWeight ? parseFloat(startWeight) : 0,
      targetWeight: targetWeight ? parseFloat(targetWeight) : 0,
      startDate: startDate || new Date().toISOString().split('T')[0],
      targetDate: targetDate || '',
      avatar: getAvatarValue(),
      birthDate: birthDate || undefined,
      activityLevel: activityLevel || undefined,
    };
    saveProfile(profile);
    if (!activeId) {
      setActiveProfileId(profile.id);
      setActiveId(profile.id);
    }
    setProfiles(getProfiles());
    setEditing(null);
    setShowNew(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteProfile(id);
    setProfiles(getProfiles());
    if (activeId === id) setActiveId(null);
  };

  const handleSetActive = (id: string) => {
    setActiveProfileId(id);
    setActiveId(id);
    window.location.reload();
  };

  const renderAvatar = (avatarStr: string, size: string = 'text-4xl') => {
    if (avatarStr.startsWith('data:')) {
      return <img src={avatarStr} alt="" className="w-12 h-12 rounded-full object-cover" />;
    }
    return <span className={size}>{avatarStr}</span>;
  };

  const renderForm = (saveId?: string) => (
    <div className="space-y-4">
      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handlePhotoUpload} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">תמונת פרופיל</label>
        <div className="flex gap-3 mb-3">
          <button onClick={() => setAvatarMode('emoji')}
            className={`px-4 py-2 rounded-lg text-sm ${avatarMode === 'emoji' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            😀 אמוג'י
          </button>
          <button onClick={() => fileInputRef.current?.click()}
            className={`px-4 py-2 rounded-lg text-sm flex items-center gap-1 ${avatarMode === 'photo' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            <Camera size={16} /> העלה תמונה
          </button>
        </div>

        {avatarMode === 'photo' && photoUrl ? (
          <div className="flex items-center gap-3">
            <img src={photoUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
            <button onClick={() => fileInputRef.current?.click()} className="text-sm text-blue-600 hover:underline">החלף תמונה</button>
            <button onClick={() => { setAvatarMode('emoji'); setPhotoUrl(''); }} className="text-sm text-red-500 hover:underline">הסר</button>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {avatars.map(a => (
              <button key={a} onClick={() => { setAvatar(a); setAvatarMode('emoji'); }}
                className={`text-2xl p-2 rounded-lg transition-colors ${avatar === a && avatarMode === 'emoji' ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'}`}>
                {a}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם <span className="text-red-500">*</span></label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="השם שלך" className="border rounded-lg px-3 py-2 w-full text-gray-800" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">מין</label>
          <div className="flex gap-2">
            <button onClick={() => setGender('male')} className={`flex-1 py-2 rounded-lg text-sm transition-colors ${gender === 'male' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>👨 זכר</button>
            <button onClick={() => setGender('female')} className={`flex-1 py-2 rounded-lg text-sm transition-colors ${gender === 'female' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-700'}`}>👩 נקבה</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">גובה (ס"מ)</label>
          <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="175" className="border rounded-lg px-3 py-2 w-full text-gray-800" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">משקל התחלתי (ק"ג)</label>
          <input type="number" step="0.1" value={startWeight} onChange={e => setStartWeight(e.target.value)} placeholder="90" className="border rounded-lg px-3 py-2 w-full text-gray-800" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">משקל יעד (ק"ג)</label>
          <input type="number" step="0.1" value={targetWeight} onChange={e => setTargetWeight(e.target.value)} placeholder="75" className="border rounded-lg px-3 py-2 w-full text-gray-800" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">תאריך לידה</label>
          <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="border rounded-lg px-3 py-2 w-full text-gray-800" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">תאריך התחלה</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded-lg px-3 py-2 w-full text-gray-800" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">תאריך יעד</label>
          <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="border rounded-lg px-3 py-2 w-full text-gray-800" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">רמת פעילות גופנית</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(activityLabels) as ActivityLevel[]).map(level => (
            <button key={level} onClick={() => setActivityLevel(level)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${activityLevel === level ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {activityLabels[level]}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400">* רק שם הוא שדה חובה. שאר השדות אופציונליים ואפשר למלא אותם מאוחר יותר.</p>

      <div className="flex gap-2">
        <button onClick={() => handleSave(saveId)} disabled={!name}
          className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          <Save size={18} /> שמור
        </button>
        <button onClick={() => { setEditing(null); setShowNew(false); resetForm(); }}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2">
          <X size={18} /> ביטול
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Users className="text-teal-500" /> פרופילים
        </h1>
        {!showNew && !editing && (
          <button onClick={() => { setShowNew(true); resetForm(); }} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2">
            <Plus size={18} /> פרופיל חדש
          </button>
        )}
      </div>

      {showNew && (
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-bold text-lg mb-4">פרופיל חדש</h2>
          {renderForm()}
        </div>
      )}

      {profiles.length === 0 && !showNew && (
        <div className="bg-white rounded-xl shadow-sm p-12 border text-center">
          <UserCircle size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-gray-600 mb-2">אין פרופילים עדיין</p>
          <p className="text-gray-400 mb-4">צור את הפרופיל הראשון שלך כדי להתחיל</p>
          <button onClick={() => { setShowNew(true); resetForm(); }} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700">
            <Plus size={18} className="inline ml-1" /> צור פרופיל
          </button>
        </div>
      )}

      <div className="space-y-4">
        {profiles.map(p => (
          <div key={p.id} className={`bg-white rounded-xl shadow-sm p-6 border ${p.id === activeId ? 'ring-2 ring-blue-500' : ''}`}>
            {editing === p.id ? (
              <>
                <h2 className="font-bold text-lg mb-4">עריכת פרופיל</h2>
                {renderForm(p.id)}
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {renderAvatar(p.avatar)}
                  <div>
                    <h3 className="font-bold text-lg">{p.name}</h3>
                    <p className="text-sm text-gray-500">
                      {p.gender === 'male' ? 'זכר' : 'נקבה'}
                      {p.height ? ` | ${p.height} ס"מ` : ''}
                      {p.startWeight && p.targetWeight ? ` | ${p.startWeight}→${p.targetWeight} ק"ג` : ''}
                    </p>
                    {p.targetDate && (
                      <p className="text-sm text-gray-400">יעד: {new Date(p.targetDate).toLocaleDateString('he-IL')} <span className="text-purple-400">({toHebrewDate(p.targetDate)})</span></p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.id !== activeId && (
                    <button onClick={() => handleSetActive(p.id)} className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm hover:bg-blue-200">הפעל</button>
                  )}
                  {p.id === activeId && (
                    <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm">פעיל ✓</span>
                  )}
                  <button onClick={() => { setEditing(p.id); loadProfile(p); }} className="text-gray-400 hover:text-gray-600 p-1.5"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600 p-1.5"><Trash2 size={18} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
