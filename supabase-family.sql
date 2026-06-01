-- Family Sharing Schema
-- Run this in Supabase SQL Editor

-- Families table
CREATE TABLE families (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family members (links users to families)
CREATE TABLE family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- Enable RLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Family policies: members can view their family
CREATE POLICY "Members can view own family"
  ON families FOR SELECT
  USING (id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view family by invite code"
  ON families FOR SELECT
  USING (true);

CREATE POLICY "Owner can update family"
  ON families FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create families"
  ON families FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can delete family"
  ON families FOR DELETE
  USING (owner_id = auth.uid());

-- Family members policies
CREATE POLICY "Members can view family members"
  ON family_members FOR SELECT
  USING (family_id IN (SELECT family_id FROM family_members AS fm WHERE fm.user_id = auth.uid()));

CREATE POLICY "Users can join family"
  ON family_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave family"
  ON family_members FOR DELETE
  USING (user_id = auth.uid() OR family_id IN (SELECT id FROM families WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update own membership"
  ON family_members FOR UPDATE
  USING (user_id = auth.uid());

-- Update existing RLS policies to allow family members to READ each other's data
-- We need to add SELECT policies for family members

-- Profiles: family members can view
CREATE POLICY "Family members can view profiles"
  ON profiles FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT fm2.user_id FROM family_members fm1
      JOIN family_members fm2 ON fm1.family_id = fm2.family_id
      WHERE fm1.user_id = auth.uid() AND fm2.user_id != auth.uid()
    )
  );

-- Weight: family members can view
CREATE POLICY "Family members can view weight"
  ON weight_entries FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT fm2.user_id FROM family_members fm1
      JOIN family_members fm2 ON fm1.family_id = fm2.family_id
      WHERE fm1.user_id = auth.uid() AND fm2.user_id != auth.uid()
    )
  );

-- Food: family members can view
CREATE POLICY "Family members can view food"
  ON food_entries FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT fm2.user_id FROM family_members fm1
      JOIN family_members fm2 ON fm1.family_id = fm2.family_id
      WHERE fm1.user_id = auth.uid() AND fm2.user_id != auth.uid()
    )
  );

-- Exercise: family members can view
CREATE POLICY "Family members can view exercise"
  ON exercise_entries FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT fm2.user_id FROM family_members fm1
      JOIN family_members fm2 ON fm1.family_id = fm2.family_id
      WHERE fm1.user_id = auth.uid() AND fm2.user_id != auth.uid()
    )
  );

-- Water: family members can view
CREATE POLICY "Family members can view water"
  ON water_entries FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT fm2.user_id FROM family_members fm1
      JOIN family_members fm2 ON fm1.family_id = fm2.family_id
      WHERE fm1.user_id = auth.uid() AND fm2.user_id != auth.uid()
    )
  );

-- Measurements: family members can view
CREATE POLICY "Family members can view measurements"
  ON measurement_entries FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT fm2.user_id FROM family_members fm1
      JOIN family_members fm2 ON fm1.family_id = fm2.family_id
      WHERE fm1.user_id = auth.uid() AND fm2.user_id != auth.uid()
    )
  );

-- Index for performance
CREATE INDEX idx_family_members_user ON family_members(user_id);
CREATE INDEX idx_family_members_family ON family_members(family_id);
CREATE INDEX idx_families_invite ON families(invite_code);
