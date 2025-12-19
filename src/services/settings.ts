import { supabase } from '../lib/supabase';

export interface UserProfile {
  name: string;
  phone_number: string;
  clothing_size: string;
  shoe_size: string;
  dressing_name: string;
  persona_id: string;
  writing_style: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  age: number;
  persona_id: string;
  custom_persona_id: string | null;
  writing_style: string | null;
  is_default: boolean;
  top_size: string | null;
  bottom_size: string | null;
  shoe_size: string | null;
}

export interface NotificationPreferences {
  user_id: string;
  enable_planner_notifications: boolean;
  notification_days_before: number;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getFamilyMembers(userId: string): Promise<FamilyMember[]> {
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .upsert({ id: userId, ...profile, updated_at: new Date().toISOString() });

  if (error) throw error;
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<Omit<NotificationPreferences, 'user_id'>>
): Promise<void> {
  const { error } = await supabase
    .from('notification_preferences')
    .upsert({ user_id: userId, ...preferences });

  if (error) throw error;
}

export async function createFamilyMember(
  userId: string,
  member: Omit<FamilyMember, 'id'>
): Promise<FamilyMember> {
  const { data, error } = await supabase
    .from('family_members')
    .insert({ user_id: userId, ...member })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFamilyMember(
  memberId: string,
  member: Partial<Omit<FamilyMember, 'id'>>
): Promise<void> {
  const { error } = await supabase
    .from('family_members')
    .update(member)
    .eq('id', memberId);

  if (error) throw error;
}

export async function deleteFamilyMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('family_members')
    .delete()
    .eq('id', memberId);

  if (error) throw error;
}
