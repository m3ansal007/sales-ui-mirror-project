import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  hire_date?: string;
  created_at: string;
  updated_at: string;
  temp_password?: string;
}

export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTeamMembers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, [user]);

  const addTeamMember = async (memberData: Omit<TeamMember, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert([{
          ...memberData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setTeamMembers(prev => [data, ...prev]);
      toast.success('Team member added successfully');
      return data;
    } catch (err) {
      console.error('Error adding team member:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add team member';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateTeamMember = async (id: string, updates: Partial<TeamMember>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setTeamMembers(prev => 
        prev.map(member => member.id === id ? data : member)
      );
      toast.success('Team member updated successfully');
      return data;
    } catch (err) {
      console.error('Error updating team member:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update team member';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteTeamMember = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // First, check if there are any leads assigned to this team member
      const { data: assignedLeads, error: leadsError } = await supabase
        .from('leads')
        .select('id, name')
        .eq('assigned_team_member_id', id)
        .eq('user_id', user.id);

      if (leadsError) throw leadsError;

      if (assignedLeads && assignedLeads.length > 0) {
        // If there are assigned leads, we need to unassign them first
        const leadNames = assignedLeads.map(lead => lead.name).join(', ');
        
        // Ask user for confirmation or automatically unassign
        const shouldProceed = confirm(
          `This team member has ${assignedLeads.length} lead(s) assigned: ${leadNames}. ` +
          'These leads will be unassigned. Do you want to continue?'
        );

        if (!shouldProceed) {
          return;
        }

        // Unassign all leads from this team member
        const { error: unassignError } = await supabase
          .from('leads')
          .update({ assigned_team_member_id: null })
          .eq('assigned_team_member_id', id)
          .eq('user_id', user.id);

        if (unassignError) throw unassignError;
      }

      // Now delete the team member
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTeamMembers(prev => prev.filter(member => member.id !== id));
      toast.success('Team member deleted successfully');
    } catch (err) {
      console.error('Error deleting team member:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete team member';
      toast.error(errorMessage);
      throw err;
    }
  };

  const syncTeamMember = async (memberId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Get the team member details
      const { data: teamMember, error: fetchError } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', memberId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;
      if (!teamMember) throw new Error('Team member not found');

      // Check if user already exists in auth.users
      const { data: existingUser, error: userCheckError } = await supabase.auth.admin.listUsers();
      
      if (userCheckError) {
        console.error('Error checking existing users:', userCheckError);
        // Continue with sync attempt even if we can't check existing users
      }

      const userExists = existingUser?.users?.some(u => u.email === teamMember.email);

      if (userExists) {
        toast.info('User account already exists for this team member');
        return;
      }

      // Create user account
      const tempPassword = teamMember.temp_password || `temp${Math.random().toString(36).slice(-8)}`;
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: teamMember.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: teamMember.name,
          role: teamMember.role
        }
      });

      if (createError) throw createError;

      // Update team member with temp password if it wasn't set
      if (!teamMember.temp_password) {
        await updateTeamMember(memberId, { temp_password: tempPassword });
      }

      toast.success(`User account created successfully. Temporary password: ${tempPassword}`);
      
    } catch (err) {
      console.error('Error syncing team member:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync team member';
      toast.error(errorMessage);
      throw err;
    }
  };

  return {
    teamMembers,
    loading,
    error,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    syncTeamMember,
    refetch: fetchTeamMembers
  };
};