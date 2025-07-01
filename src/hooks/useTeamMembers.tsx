
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TeamMember } from '@/types/leads';
import { getTeamMembers, createTeamMember } from '@/services/teamService';

export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTeamMembers = useCallback(async () => {
    try {
      const members = await getTeamMembers();
      setTeamMembers(members);
      
      console.log('Fetched team members:', members.length);
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
  }, [toast]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const addTeamMember = async (memberData: {
    name: string;
    email: string;
    role: 'sales_manager' | 'sales_associate';
    phone?: string;
    manager_id?: string;
  }) => {
    try {
      await createTeamMember(memberData);
      
      toast({
        title: "Success",
        description: "Team member added successfully",
      });
      
      // Refresh team members
      await fetchTeamMembers();
      return true;
    } catch (error: any) {
      console.error('Error creating team member:', error);
      toast({
        title: "Error",
        description: `Failed to add team member: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    teamMembers,
    loading,
    addTeamMember,
    refetch: fetchTeamMembers,
  };
};
