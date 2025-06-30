
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  hire_date?: string;
  status: string;
  user_id: string;
}

export interface CreateTeamMemberData {
  name: string;
  email: string;
  role: string;
  phone?: string;
  hire_date?: string;
  temp_password?: string;
}

export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTeamMembers = async () => {
    console.log('🔄 Fetching team members and performance data...');
    
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('status', 'Active')
        .order('name');

      if (error) throw error;
      
      console.log('📊 Found team members:', data);
      setTeamMembers(data || []);
      console.log('🎉 Team performance data loaded successfully!');
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Error",
        description: "Failed to fetch team members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTeamMember = async (memberData: CreateTeamMemberData) => {
    try {
      // First check if a user with this email already exists
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', memberData.email)
        .single();

      let userId = null;
      if (!userError && existingUser) {
        userId = existingUser.id;
        console.log('Found existing user for email:', memberData.email, 'User ID:', userId);
      }

      const { data, error } = await supabase
        .from('team_members')
        .insert({
          ...memberData,
          user_id: userId || '00000000-0000-0000-0000-000000000000', // Temporary ID if no user found
        })
        .select()
        .single();

      if (error) throw error;

      await fetchTeamMembers();
      
      toast({
        title: "Success",
        description: "Team member added successfully",
      });
      
      return true;
    } catch (error: any) {
      console.error('Error creating team member:', error);
      toast({
        title: "Error",
        description: `Failed to create team member: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateTeamMember = async (id: string, updates: Partial<TeamMember>) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchTeamMembers();
      
      toast({
        title: "Success",
        description: "Team member updated successfully",
      });
      
      return true;
    } catch (error: any) {
      console.error('Error updating team member:', error);
      toast({
        title: "Error",
        description: `Failed to update team member: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteTeamMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'Inactive' })
        .eq('id', id);

      if (error) throw error;

      await fetchTeamMembers();
      
      toast({
        title: "Success",
        description: "Team member deactivated successfully",
      });
      
      return true;
    } catch (error: any) {
      console.error('Error deactivating team member:', error);
      toast({
        title: "Error",
        description: `Failed to deactivate team member: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const refetch = fetchTeamMembers;

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  return {
    teamMembers,
    loading,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
    refetch,
  };
};
