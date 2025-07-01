
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { TeamMember } from '@/types/leads';

export const getCurrentUserTeamMember = async (user: User): Promise<TeamMember | null> => {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return data as TeamMember;
};

export const getTeamMembers = async (): Promise<TeamMember[]> => {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('status', 'active')
    .order('name');

  if (error) throw error;
  return (data || []) as TeamMember[];
};

export const createTeamMember = async (memberData: {
  name: string;
  email: string;
  role: 'sales_manager' | 'sales_associate';
  phone?: string;
  manager_id?: string;
}): Promise<TeamMember> => {
  // First create the auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: memberData.email,
    password: 'TempPassword123!', // In real app, generate or send reset link
    email_confirm: true,
    user_metadata: {
      full_name: memberData.name,
      role: memberData.role
    }
  });

  if (authError) throw authError;

  // The team member will be created automatically by the trigger
  // But we need to update it with additional info
  const { data, error } = await supabase
    .from('team_members')
    .update({
      name: memberData.name,
      phone: memberData.phone,
      manager_id: memberData.manager_id
    })
    .eq('user_id', authData.user.id)
    .select()
    .single();

  if (error) throw error;
  return data as TeamMember;
};
