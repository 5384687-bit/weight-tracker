import { supabase } from './supabase';

export interface Family {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  displayName: string;
  role: 'owner' | 'member';
  joinedAt: string;
  email?: string;
}

// Get current user's family
export async function getMyFamily(): Promise<Family | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) return null;

  const { data: family } = await supabase
    .from('families')
    .select('*')
    .eq('id', membership.family_id)
    .single();

  if (!family) return null;

  return {
    id: family.id,
    name: family.name,
    inviteCode: family.invite_code,
    ownerId: family.owner_id,
    createdAt: family.created_at,
  };
}

// Get family members
export async function getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  const { data } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', familyId)
    .order('joined_at');

  if (!data) return [];

  return data.map(row => ({
    id: row.id,
    familyId: row.family_id,
    userId: row.user_id,
    displayName: row.display_name,
    role: row.role,
    joinedAt: row.joined_at,
  }));
}

// Create a new family
export async function createFamily(name: string, displayName: string): Promise<{ family: Family | null; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { family: null, error: 'לא מחובר' };

  // Check if already in a family
  const existing = await getMyFamily();
  if (existing) return { family: null, error: 'כבר שייך/ת למשפחה. יש לעזוב את המשפחה הנוכחית קודם.' };

  // Create family
  const { data: family, error: famError } = await supabase
    .from('families')
    .insert({ name, owner_id: user.id })
    .select()
    .single();

  if (famError || !family) return { family: null, error: famError?.message || 'שגיאה ביצירת משפחה' };

  // Add self as owner member
  const { error: memError } = await supabase
    .from('family_members')
    .insert({
      family_id: family.id,
      user_id: user.id,
      display_name: displayName,
      role: 'owner',
    });

  if (memError) return { family: null, error: memError.message };

  return {
    family: {
      id: family.id,
      name: family.name,
      inviteCode: family.invite_code,
      ownerId: family.owner_id,
      createdAt: family.created_at,
    },
    error: null,
  };
}

// Join a family by invite code
export async function joinFamily(inviteCode: string, displayName: string): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'לא מחובר' };

  // Check if already in a family
  const existing = await getMyFamily();
  if (existing) return { error: 'כבר שייך/ת למשפחה. יש לעזוב את המשפחה הנוכחית קודם.' };

  // Find family by invite code
  const { data: family } = await supabase
    .from('families')
    .select('id')
    .eq('invite_code', inviteCode.trim().toLowerCase())
    .single();

  if (!family) return { error: 'קוד הזמנה לא תקין' };

  // Join
  const { error } = await supabase
    .from('family_members')
    .insert({
      family_id: family.id,
      user_id: user.id,
      display_name: displayName,
      role: 'member',
    });

  if (error) {
    if (error.code === '23505') return { error: 'כבר חבר/ה במשפחה הזו' };
    return { error: error.message };
  }

  return { error: null };
}

// Leave family
export async function leaveFamily(): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'לא מחובר' };

  const family = await getMyFamily();
  if (!family) return { error: 'לא שייך/ת למשפחה' };

  // If owner, delete the whole family
  if (family.ownerId === user.id) {
    await supabase.from('family_members').delete().eq('family_id', family.id);
    await supabase.from('families').delete().eq('id', family.id);
  } else {
    await supabase.from('family_members').delete().eq('user_id', user.id).eq('family_id', family.id);
  }

  return { error: null };
}

// Update display name
export async function updateDisplayName(newName: string): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'לא מחובר' };

  const { error } = await supabase
    .from('family_members')
    .update({ display_name: newName })
    .eq('user_id', user.id);

  return { error: error?.message || null };
}

// Regenerate invite code (owner only)
export async function regenerateInviteCode(): Promise<{ code: string | null; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { code: null, error: 'לא מחובר' };

  const family = await getMyFamily();
  if (!family || family.ownerId !== user.id) return { code: null, error: 'רק מנהל המשפחה יכול לחדש קוד' };

  const newCode = Math.random().toString(36).substring(2, 10);
  const { error } = await supabase
    .from('families')
    .update({ invite_code: newCode })
    .eq('id', family.id);

  if (error) return { code: null, error: error.message };
  return { code: newCode, error: null };
}

// Get family member data (weight entries for dashboard)
export async function getFamilyWeightData(userId: string, profileId?: string) {
  let query = supabase
    .from('weight_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(30);

  if (profileId) query = query.eq('profile_id', profileId);
  const { data } = await query;
  return data?.map(r => ({
    date: r.date,
    weight: Number(r.weight),
  })) || [];
}

// Get family member profiles
export async function getFamilyMemberProfiles(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId);

  return data?.map(r => ({
    id: r.id,
    name: r.name,
    targetWeight: Number(r.target_weight),
    startWeight: Number(r.start_weight),
  })) || [];
}
