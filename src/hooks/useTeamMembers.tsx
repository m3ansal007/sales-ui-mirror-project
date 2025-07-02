
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  hire_date?: string;
  created_at: string;
  updated_at: string;
}

export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [memberPerformance, setMemberPerformance] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTeamMembers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeamMembers(data || []);
      
      // Fetch performance data for each team member
      const performanceData: Record<string, any> = {};
      for (const member of data || []) {
        // Get leads assigned to this team member
        const { data: leadsData } = await supabase
          .from('leads')
          .select('*')
          .eq('assigned_team_member_id', member.id);

        performanceData[member.id] = {
          leadsAssigned: leadsData?.length || 0,
          leadsConverted: leadsData?.filter(lead => lead.status === 'Converted').length || 0,
          tasksCompleted: 0, // Placeholder for tasks
          tasksTotal: 0 // Placeholder for tasks
        };
      }
      setMemberPerformance(performanceData);
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

  // Set up real-time subscription for leads to update performance metrics
  useEffect(() => {
    if (!user) return;

    fetchTeamMembers();

    // Subscribe to real-time changes on leads to update performance
    const leadsChannel = supabase
      .channel('team-performance-leads')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('Lead change detected for team performance:', payload);
          // Refetch team members and performance data when leads change
          setTimeout(() => {
            fetchTeamMembers();
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
    };
  }, [user]);

  const deleteTeamMember = async (memberId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      
      setTeamMembers(prev => prev.filter(member => member.id !== memberId));
      toast({
        title: "Success",
        description: "Team member deleted successfully",
      });
      return true;
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast({
        title: "Error",
        description: "Failed to delete team member",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    teamMembers,
    memberPerformance,
    loading,
    refetch: fetchTeamMembers,
    deleteTeamMember,
  };
};
